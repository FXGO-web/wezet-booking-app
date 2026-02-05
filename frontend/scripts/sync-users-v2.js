
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// --- Configuration ---
const XML_FILE_PATH = '/Users/mroffbeat/CODING - WORKSPACES/WEZET-PLATFORM/Users/learn.wezet.xyz WEZET Academy WordPress Export Feb 5 2026.xml';
const CSV_FILE_PATH = '/Users/mroffbeat/CODING - WORKSPACES/WEZET-PLATFORM/Users/Shopl.wezet.xyz-user-export-1-6984b706145a0.csv';

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true. Set DRY_RUN=false to execute.
const DEFAULT_PASSWORD = "TempPassword2026!"; // Users will reset this anyway.

// --- Env Vars ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// We need the service role key if we want to bypass RLS securely or do admin things, 
// but based on import-users.js, we might use the Edge Function with Anon Key.
// However, to send password resets reliably without logging them in, the JS client with Anon key works 
// IF we use `resetPasswordForEmail`.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase credentials (URL or ANON_KEY) in .env.local');
    process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log Mode
console.log(`\n=== User Sync V2 ===`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (No changes will be made)' : 'LIVE EXECUTION'}`);
console.log(`Target: ${supabaseUrl}`);

// --- Helper Functions ---

function parseXMLUsers(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`XML File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const users = [];

    // Simple Regex Parsing for <wp:author> blocks
    // <wp:author><wp:author_id>...</wp:author_id><wp:author_login>...</wp:author_login><wp:author_email>...</wp:author_email>...
    const authorRegex = /<wp:author>(.*?)<\/wp:author>/gs;
    let match;

    while ((match = authorRegex.exec(content)) !== null) {
        const block = match[1];

        const getTag = (tag) => {
            const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\/${tag}>|<${tag}>(.*?)<\/${tag}>`);
            const m = block.match(regex);
            return m ? (m[1] || m[2]) : '';
        };

        const email = getTag('wp:author_email');
        if (email) {
            users.push({
                email: email.toLowerCase().trim(),
                first_name: getTag('wp:author_first_name'),
                last_name: getTag('wp:author_last_name'),
                display_name: getTag('wp:author_display_name'),
                source: 'XML (Learn)'
            });
        }
    }
    return users;
}

function parseCSVUsers(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`CSV File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');

    // Handle potential BOM or weird headers if needed, but csv-parse is usually good.
    // Based on previous analysis: user_email, first_name, last_name, display_name

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
    });

    return records.map(r => ({
        email: (r.user_email || r.user_login || '').toLowerCase().trim(), // Fallback to login if email missing? Usually email is key.
        first_name: r.first_name || r.billing_first_name || '',
        last_name: r.last_name || r.billing_last_name || '',
        display_name: r.display_name || '',
        source: 'CSV (Shop)'
    })).filter(u => u.email && u.email.includes('@')); // Basic validation
}

// Reuse logic from import-users.js to call Edge Function 
// (Or just use standard auth.signup if Edge Function is complicated to invoke directly without the specific projectId hardcoded there)
// `import-users.js` logic was: POST https://{project}.supabase.co/functions/v1/make-server-e0d9c111/auth/signup
// We can extract projectId from URL.

const PROJECT_ID = supabaseUrl.split('.')[0].split('//')[1];
const EDGE_FUNCTION_NAME = "make-server-e0d9c111"; // Hardcoded in existing script
const API_BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/${EDGE_FUNCTION_NAME}`;

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || JSON.stringify(data) || 'API request failed');
    return data;
}

async function main() {
    // 1. Gather Users
    console.log('\n--- 1. Parsing Files ---');
    const xmlUsers = parseXMLUsers(XML_FILE_PATH);
    const csvUsers = parseCSVUsers(CSV_FILE_PATH);

    console.log(`Found ${xmlUsers.length} users in XML.`);
    console.log(`Found ${csvUsers.length} users in CSV.`);

    // 2. Converge
    const userMap = new Map();

    [...xmlUsers, ...csvUsers].forEach(u => {
        if (!userMap.has(u.email)) {
            userMap.set(u.email, u);
        } else {
            // Merge logic: prefer non-empty names
            const existing = userMap.get(u.email);
            if (!existing.first_name && u.first_name) existing.first_name = u.first_name;
            if (!existing.last_name && u.last_name) existing.last_name = u.last_name;
            existing.source += ` & ${u.source}`;
        }
    });

    const uniqueUsers = Array.from(userMap.values());
    console.log(`Total Unique Users to Process: ${uniqueUsers.length}`);

    // 3. Fetch Existing (Optional optimization, lets us skip API calls)
    console.log('\n--- 2. Checking Existing Users ---');
    let existingEmails = new Set();
    try {
        const res = await apiRequest('/team-members');
        if (res.teamMembers) {
            res.teamMembers.forEach(m => existingEmails.add(m.email.toLowerCase()));
            console.log(`Fetched ${existingEmails.size} existing users from 'team-members' endpoint.`);
        }
    } catch (e) {
        console.warn("Could not fetch existing team members (Edge Function might be down or key invalid). Will rely on Signup errors.");
    }

    // 4. Execute
    console.log('\n--- 3. Syncing Users ---');

    let stats = {
        total: uniqueUsers.length,
        skipped_exists: 0,
        created: 0,
        reset_sent: 0,
        errors: 0
    };

    for (const user of uniqueUsers) {
        // Pre-check
        if (existingEmails.has(user.email)) {
            console.log(`[SKIP] ${user.email} (Already exists in team-members)`);
            stats.skipped_exists++;
            continue;
        }

        // Prepare name
        let fullName = user.display_name;
        if (user.first_name || user.last_name) {
            fullName = `${user.first_name} ${user.last_name}`.trim();
        }
        if (!fullName) fullName = user.email.split('@')[0];

        if (DRY_RUN) {
            console.log(`[DRY RUN] Would Create: ${user.email} | Name: ${fullName} | Source: ${user.source}`);
            console.log(`[DRY RUN] Would Send Password Reset to: ${user.email}`);
            stats.created++;
            stats.reset_sent++;
            continue; // Next user
        }

        // REAL EXECUTION
        try {
            process.stdout.write(`Processing ${user.email}... `);

            // Step A: Create User
            let created = false;
            try {
                // Using the Edge Function as in import-users.js
                await apiRequest('/auth/signup', 'POST', {
                    email: user.email,
                    password: DEFAULT_PASSWORD,
                    name: fullName,
                    role: 'Client' // Default role
                });
                process.stdout.write('Created. ');
                created = true;
                stats.created++;
            } catch (err) {
                if (err.message && (err.message.includes('already registered') || err.message.includes('User already registered'))) {
                    process.stdout.write('Already Registered. ');
                    stats.skipped_exists++;
                } else {
                    console.error(`\n[ERROR] Creation failed for ${user.email}:`, err.message);
                    stats.errors++;
                    continue; // Skip reset if creation failed (and not because they exist)
                }
            }

            // Step B: Send Password Reset
            // Only send if we just created them OR if we want to force reset for everyone (Task says "add missing... and send password reset") 
            // Usually, for migration, you send resets to the new ones.
            // If they already existed, do we spam them? Probably safer to only send to NEWly created users 
            // unless instructed "send to ALL imported users".
            // The prompt says: "add... those missing AND send... password reset to those added".
            // So: Only send if strictly "Added/Created".

            if (created) {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
                    redirectTo: 'https://booking.wezet.xyz/reset-password' // Adjust if URL is different
                });

                if (resetError) {
                    console.error(`\n[ERROR] Reset Email failed for ${user.email}:`, resetError.message);
                    stats.errors++;
                } else {
                    process.stdout.write('Reset Email Sent.');
                    stats.reset_sent++;
                }
            }
            console.log(''); // Newline

        } catch (e) {
            console.error(`\n[FATAL] Unexpected error for ${user.email}:`, e);
            stats.errors++;
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n=== Summary ===');
    console.log(stats);
}

main().catch(err => console.error(err));

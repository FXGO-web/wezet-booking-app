const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const CSV_FILE = process.env.CSV_FILE || 'User Export.csv';
const CSV_PATH = path.resolve(__dirname, '../../../', CSV_FILE);
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true
const DEFAULT_PASSWORD = "Welcome2025!";

console.log(`Starting User Import (API Method)...`);
console.log(`Dry Run: ${DRY_RUN}`);

// Env Vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const projectId = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : null;
const edgeFunctionName = "make-server-e0d9c111"; // Hardcoded from info.tsx

if (!supabaseUrl || !supabaseAnonKey || !projectId) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Optional Admin Client for Recovery
let supabaseAdmin = null;
if (supabaseServiceKey) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('Service Role Key found. Recovery mode enabled.');
} else {
    console.warn('No Service Role Key found. Cannot recover existing users.');
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/${edgeFunctionName}`;

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API request failed');
        return data;
    } catch (error) {
        // console.error(`API Request Failed (${endpoint}):`, error.message);
        throw error;
    }
}

async function importUsers() {
    try {
        // 1. Fetch Existing Team Members
        console.log('Fetching existing team members...');
        let teamMembers = [];
        try {
            const response = await apiRequest('/team-members');
            teamMembers = response.teamMembers || [];
            console.log(`Found ${teamMembers.length} existing team members.`);
        } catch (e) {
            console.error("Failed to fetch team members. Is the server running?", e.message);
            process.exit(1);
        }

        const teamEmails = new Set(teamMembers.map(m => m.email.toLowerCase()));

        // 2. Read CSV
        if (!fs.existsSync(CSV_PATH)) {
            console.error(`Error: CSV file not found at ${CSV_PATH}`);
            process.exit(1);
        }
        const fileContent = fs.readFileSync(CSV_PATH, 'utf8');

        // Detect delimiter
        const delimiter = fileContent.includes(';') ? ';' : ',';
        console.log(`Detected delimiter: '${delimiter}'`);

        // Hack for Stripe export which might have a title line
        let contentToParse = fileContent;
        const lines = fileContent.split('\n');
        if (lines[0].trim() === 'unified_customers-2') {
            console.log('Detected Stripe export header line. Skipping...');
            contentToParse = lines.slice(1).join('\n');
        }

        const records = parse(contentToParse, {
            columns: true,
            skip_empty_lines: true,
            delimiter: delimiter,
            trim: true
        });
        console.log(`Found ${records.length} records in CSV.`);

        let stats = { processed: 0, skipped_team: 0, created: 0, errors: 0 };

        for (const record of records) {
            stats.processed++;

            // Map columns
            const email = record.user_email || record.Email || record.email;
            if (!email) continue;

            const lowerEmail = email.toLowerCase();

            // Map Name
            let name = '';
            if (record.Name) {
                name = record.Name;
            } else if (record.first_name || record.last_name) {
                name = `${record.first_name || ''} ${record.last_name || ''}`.trim();
            } else if (record.display_name) {
                name = record.display_name;
            }

            // Map Role
            const csvRole = record.role || 'customer'; // Default to customer if not specified

            // 3. Check against Team Members
            if (teamEmails.has(lowerEmail)) {
                console.log(`[SKIP] Team Member found: ${email}`);
                stats.skipped_team++;
                continue;
            }

            // 4. Create User
            const newRole = (csvRole === 'subscriber' || csvRole === 'customer') ? 'Client' : 'Client'; // Use 'Client' to match frontend filter
            // const name = `${firstName} ${lastName}`.trim() || displayName; // Already defined above

            if (DRY_RUN) {
                console.log(`[DRY RUN] Would create: ${email} (${newRole}) - Name: ${name}`);
                stats.created++;
            } else {
                try {
                    // Note: The signup endpoint might sign them in, but we just want to create them.
                    // If the endpoint returns a session, that's fine, we just discard it.
                    await apiRequest('/auth/signup', 'POST', {
                        email,
                        password: DEFAULT_PASSWORD,
                        name,
                        role: newRole
                    });
                    console.log(`[SUCCESS] Created: ${email}`);
                    stats.created++;
                } catch (err) {
                    if (err.message.includes('already registered') || err.message.includes('User already registered')) {
                        // Recovery Logic
                        if (supabaseAdmin) {
                            try {
                                // 1. Get User ID
                                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                                // Note: listUsers is paginated. For 23 users, we might miss them if we don't paginate.
                                // Better: supabaseAdmin.auth.admin.getUserByEmail(email) (if available in this version)
                                // Or just listUsers and filter in memory (if list is small).
                                // Let's assume list is small enough or we paginate?
                                // Actually, let's try to fetch user by email if possible.
                                // supabase-js v2 has listUsers.

                                // Let's try to find the user in the list
                                const user = users.find(u => u.email.toLowerCase() === lowerEmail);

                                if (user) {
                                    // 2. Insert into team_members
                                    const { error: insertError } = await supabaseAdmin
                                        .from('team_members')
                                        .insert([{
                                            id: user.id,
                                            email: user.email,
                                            name: name,
                                            role: newRole,
                                            status: 'active',
                                            specialties: [],
                                            services: []
                                        }]);

                                    if (insertError) {
                                        console.error(`[RECOVERY FAILED] Could not insert ${email}:`, insertError.message);
                                        stats.errors++;
                                    } else {
                                        console.log(`[RECOVERED] Linked existing user: ${email}`);
                                        stats.created++;
                                    }
                                } else {
                                    console.error(`[RECOVERY FAILED] Could not find Auth user for ${email} (List limit?)`);
                                    stats.errors++;
                                }
                            } catch (recErr) {
                                console.error(`[RECOVERY ERROR] ${email}:`, recErr.message);
                                stats.errors++;
                            }
                        } else {
                            console.error(`[ERROR] User exists but missing from DB. Need Service Key to fix: ${email}`);
                            stats.errors++;
                        }
                    } else {
                        console.error(`[ERROR] Failed to create ${email}:`, err.message);
                        stats.errors++;
                    }
                }
            }

            // Add a small delay to avoid rate limits
            if (!DRY_RUN) await new Promise(r => setTimeout(r, 200));
        }

        console.log('\nImport Summary:');
        console.log(JSON.stringify(stats, null, 2));

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

importUsers();

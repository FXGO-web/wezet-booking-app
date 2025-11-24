
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const KV_TABLE = 'kv_store_e0d9c111';

// --- Paths ---
const DATA_DIR = path.resolve(__dirname, '../../../extracted_data');
const FILES = {
    USERS: path.join(DATA_DIR, 'User Export.csv'),
    PRODUCTS: path.join(DATA_DIR, 'Product Export Nov 24 2025.csv'),
    BOOKINGS: path.join(DATA_DIR, 'MEC Bookings.csv')
};

// --- Helpers ---
function parseCSV(content: string, delimiter: string = ','): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Decode headers (e.g. &amp; -> &)
    const headers = parseLine(lines[0], delimiter).map(h => h.replace(/&amp;/g, '&').trim());
    console.log('Parsed Headers:', headers);

    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], delimiter);
        if (values.length < headers.length) continue; // Skip malformed

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        result.push(row);
    }
    return result;
}

function parseLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

async function kvSet(key: string, value: any) {
    const { error } = await supabase.from(KV_TABLE).upsert({ key, value });
    if (error) throw new Error(`KV Set Error for ${key}: ${error.message}`);
}

async function kvDeletePrefix(prefix: string) {
    const { error } = await supabase.from(KV_TABLE).delete().like('key', `${prefix}%`);
    if (error) throw new Error(`KV Delete Error for ${prefix}: ${error.message}`);
}

// --- Migration Logic ---

async function cleanDatabase() {
    console.log('🧹 Cleaning KV Store...');
    const prefixes = ['booking:', 'service:', 'team-member:', 'location:', 'content:'];
    for (const prefix of prefixes) {
        await kvDeletePrefix(prefix);
        console.log(`Cleared ${prefix}*`);
    }
}

async function importUsers() {
    console.log('👥 Importing Users...');
    if (!fs.existsSync(FILES.USERS)) return;

    const content = fs.readFileSync(FILES.USERS, 'utf-8');
    const users = parseCSV(content);

    let count = 0;
    for (const user of users) {
        const email = user['user_email'];
        const role = user['role'];
        const name = `${user['first_name']} ${user['last_name']}`.trim() || user['display_name'];

        let appRole = 'Client';
        if (role.includes('administrator')) appRole = 'Admin';
        else if (role.includes('editor') || role.includes('author')) appRole = 'Teacher';

        // Create Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        // Create Team Member in KV if role is appropriate
        if (appRole !== 'Client') {
            const id = randomUUID();
            const teamMember = {
                id,
                name,
                email,
                role: appRole,
                status: 'active',
                bio: user['description'] || '',
                specialties: [], // Can't easily map from CSV without more logic
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await kvSet(`team-member:${id}`, teamMember);
        }
        count++;
    }
    console.log(`Imported ${count} users.`);
}

async function importServices() {
    console.log('🛍️ Importing Services...');
    if (!fs.existsSync(FILES.PRODUCTS)) return;

    const content = fs.readFileSync(FILES.PRODUCTS, 'utf-8');
    const products = parseCSV(content);

    let count = 0;
    for (const product of products) {
        const name = product['Name'];
        const price = parseFloat(product['Regular price']) || 0;
        const description = product['Description'] || product['Short description'];
        const category = product['Categories'];

        if (!name) continue;

        const id = randomUUID();
        const service = {
            id,
            name,
            description: description?.replace(/<[^>]*>/g, '') || '',
            basePrice: price,
            currency: 'DKK',
            category: category?.split(',')[0] || 'General',
            duration: 60,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await kvSet(`service:${id}`, service);
        count++;
    }
    console.log(`Imported ${count} services.`);
}

async function importBookingsAndLocations() {
    console.log('📅 Importing Bookings & Locations...');
    if (!fs.existsSync(FILES.BOOKINGS)) return;

    const content = fs.readFileSync(FILES.BOOKINGS, 'utf-8');
    // Detect delimiter: check first line for tab
    const firstLine = content.split('\n')[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    console.log(`Detected delimiter: '${delimiter === '\t' ? 'TAB' : 'COMMA'}'`);

    const bookings = parseCSV(content, delimiter);

    // 1. Locations
    const locations = new Set<string>();
    bookings.forEach(b => {
        if (b['Location']) locations.add(b['Location']);
    });

    for (const locName of locations) {
        const id = randomUUID();
        const location = {
            id,
            name: locName,
            type: 'in-person',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await kvSet(`location:${id}`, location);
    }

    // 2. Bookings
    let count = 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Need to fetch services to link by name
    const { data: serviceRows } = await supabase.from(KV_TABLE).select('value').like('key', 'service:%');
    const services = serviceRows?.map(r => r.value) || [];

    for (const booking of bookings) {
        // Header is now "Start Date & Time" (decoded)
        const startDateStr = booking['Start Date & Time'];
        if (!startDateStr) {
            // console.log('Skipped: No Start Date');
            continue;
        }

        const startDate = new Date(startDateStr);
        if (startDate < yesterday) {
            // console.log(`Skipped: Old Date ${startDateStr}`);
            continue;
        }

        const eventName = booking['Event'];
        const userEmail = booking['Email'];
        // Some rows might have Email in a different column if TSV shifted, but let's assume correct.
        // In TSV, "Email" is a column.
        // Wait, in Step 33 output: ... Gateway Name    Email   "Ticket Variation" ...
        // But in Step 208 output: ... "Pay by WooCommerce"    "Madeleine Kolle"       mkolle@gmail.com ...
        // It seems "Email" is NOT the column name for email address?
        // Step 208: "Madeleine Kolle" (Name?) then "mkolle@gmail.com" (Email?)
        // Header: ... Gateway Name    Email   "Ticket Variation" ...
        // Wait, Step 33 header: ... Gateway Name    Email   "Ticket Variation" ...
        // Step 208 row: ... "Pay by WooCommerce"    "Madeleine Kolle"       mkolle@gmail.com ...
        // This implies "Email" header maps to "Madeleine Kolle". That's weird.
        // Maybe there are two Email columns?
        // Step 33: ... "Checkin DateTime"      Email   Name    Attachments ...
        // Ah! There is another "Email" column later!
        // I should check all keys in `booking` object.

        // For now, I will try to find an email-like string in the row if `userEmail` doesn't look like an email.
        // Or check the LAST "Email" column.
        // My parser uses the FIRST occurrence of a header key if duplicates exist?
        // `row[header] = ...` overwrites! So it uses the LAST one.
        // So `booking['Email']` should be the last "Email" column.

        const userName = booking['Name'] || booking['Email']; // Fallback

        // Find Service ID (Fuzzy Match)
        // Try exact match first, then includes
        let service = services.find((s: any) => s.name === eventName);
        if (!service) {
            service = services.find((s: any) => s.name.includes(eventName) || eventName.includes(s.name));
        }

        if (service) {
            const id = randomUUID();
            const bookingObj = {
                id,
                serviceId: service.id,
                serviceName: service.name,
                clientEmail: userEmail,
                clientName: userName,
                date: startDate.toISOString(),
                time: startDate.toTimeString().substring(0, 5),
                status: 'confirmed',
                price: parseFloat(booking['Total Price']) || 0,
                currency: 'DKK',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await kvSet(`booking:${id}`, bookingObj);
            count++;
        } else {
            console.log(`Skipped Booking: Service '${eventName}' not found.`);
        }
    }
    console.log(`Imported ${count} bookings.`);
}

async function main() {
    try {
        await cleanDatabase();
        await importUsers();
        await importServices();
        await importBookingsAndLocations();
        console.log('✅ Migration Complete');
    } catch (e) {
        console.error('Migration Failed:', e);
        process.exit(1);
    }
}

main();

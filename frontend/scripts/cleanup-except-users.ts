
import { createClient } from '@supabase/supabase-js';

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

async function kvDeletePrefix(prefix: string) {
    console.log(`Deleting ${prefix}* ...`);
    const { error } = await supabase.from(KV_TABLE).delete().like('key', `${prefix}%`);
    if (error) console.error(`Error deleting ${prefix}:`, error.message);
    else console.log(`Deleted ${prefix}`);
}

async function main() {
    console.log('🧹 Cleaning Database (Preserving Users)...');

    // Delete everything EXCEPT team-member:
    // We'll delete specific known prefixes
    const prefixesToDelete = [
        'booking:',
        'service:',
        'location:',
        'content:',
        // Add any other prefixes if found, but these are the main ones
    ];

    for (const prefix of prefixesToDelete) {
        await kvDeletePrefix(prefix);
    }

    console.log('✅ Cleanup Complete. Users preserved.');
}

main();

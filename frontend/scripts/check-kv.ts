
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkKV() {
    console.log('Checking KV Store Counts...');
    const prefixes = ['booking:', 'service:', 'team-member:', 'location:', 'content:'];

    for (const prefix of prefixes) {
        const { data, error } = await supabase.from('kv_store_e0d9c111').select('key').like('key', `${prefix}%`);
        if (error) console.error(`Error ${prefix}:`, error.message);
        else console.log(`${prefix} count: ${data.length}`);
    }
}

checkKV();

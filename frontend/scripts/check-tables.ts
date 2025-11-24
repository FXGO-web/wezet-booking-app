
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    // Try to fetch from a known table or use a system query if possible (but pg_catalog access might be restricted)
    // We'll try to just select from 'services' and see the error details or success

    console.log('Checking "services" table...');
    const { data, error } = await supabase.from('services').select('*').limit(1);
    if (error) console.error('Error accessing services:', error);
    else console.log('Services table accessible. Row count:', data.length);

    console.log('Checking "team_members" table...');
    const { data: team, error: teamError } = await supabase.from('team_members').select('*').limit(1);
    if (teamError) console.error('Error accessing team_members:', teamError);
    else console.log('Team Members table accessible. Row count:', team.length);
}

listTables();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('session_templates')
        .select('id, name')
        .ilike('name', '%Fall 2026%');

    if (error) {
        console.error('Error fetching programs:', error);
    } else {
        console.log('Programs found:');
        console.log(JSON.stringify(data, null, 2));
    }
}

main();

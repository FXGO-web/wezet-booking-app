
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aadzzhdouuxkvelxyoyf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function listAllPolicies() {
    console.log("--- Comprehensive RLS Audit ---");

    // We can use the rpc to check for policies if we have one, 
    // but since we don't, we'll try to query the information_schema or pg_catalog via raw SQL if possible.
    // In Supabase, we can't do raw SQL via SDK easily unless we use an RPC.

    // Let's create an RPC to list policies if it doesn't exist.
    // For now, I'll just check if any hidden policies are affecting our query.

    const { data, error } = await supabase.from('profiles').select('email, role').limit(5);
    if (error) {
        console.log("Error selecting profiles:", error);
    } else {
        console.log("Profiles selected successfully:", data.length);
    }
}

listAllPolicies();

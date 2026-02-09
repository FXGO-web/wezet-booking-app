
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aadzzhdouuxkvelxyoyf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkAndFix() {
    console.log("--- Checking Roles Case Sensitivity ---");

    const { data, error } = await supabase
        .from('profiles')
        .select('email, role');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const mixedCase = data.filter(u => u.role !== u.role.toLowerCase());

    if (mixedCase.length > 0) {
        console.log(`Found ${mixedCase.length} roles with mixed case. Fixing...`);
        for (const u of mixedCase) {
            console.log(`- Fixing ${u.email}: ${u.role} -> ${u.role.toLowerCase()}`);
            await supabase.from('profiles').update({ role: u.role.toLowerCase() }).eq('email', u.email);
        }
        console.log("Done fixing.");
    } else {
        console.log("All roles are already lowercase.");
    }
}

checkAndFix();

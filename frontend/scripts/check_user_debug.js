
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from frontend/.env.local
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Fallback or override
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aadzzhdouuxkvelxyoyf.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role

if (!SUPABASE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in ../frontend/.env.local or env. Please set it.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EMAIL = "charlotte@muenster.dk";

async function checkUser() {
    console.log(`Checking status for: ${EMAIL}`);
    console.log(`URL: ${SUPABASE_URL}`);

    // 1. Check Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const user = users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());

    if (user) {
        console.log(`\n[AUTH] Found User!`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Confirmed at: ${user.confirmed_at}`);
        console.log(`- Last Sign In: ${user.last_sign_in_at}`);
        console.log(`- Created: ${user.created_at}`);
        console.log(`- App Metadata:`, user.app_metadata);
        console.log(`- User Metadata:`, user.user_metadata);

        // 2. Check Profiles
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        console.log(`\n[PUBLIC.PROFILES]`, profile ? "Found" : "MISSING");
        if (profile) console.log(profile);

        // 3. Check Team Members
        const { data: member } = await supabase.from('team_members').select('*').eq('email', EMAIL).single();
        console.log(`\n[PUBLIC.TEAM_MEMBERS]`, member ? "Found" : "MISSING");
        if (member) console.log(member);

    } else {
        console.log(`\n[AUTH] User NOT found in Supabase Auth.`);

        // Check if they exist in tables anyway (orphaned?)
        const { data: member } = await supabase.from('team_members').select('*').eq('email', EMAIL).single();
        if (member) {
            console.log(`\n[WARNING] Found in team_members but NOT in Auth! This is an orphaned record.`);
            console.log(member);
        } else {
            console.log(`\n[PUBLIC.TEAM_MEMBERS] Not found in team members either.`);
        }
    }
}

checkUser();

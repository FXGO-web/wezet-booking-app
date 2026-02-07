
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from frontend/.env.local
// __dirname is frontend/scripts
// .env.local is in frontend/.env.local --> ../.env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aadzzhdouuxkvelxyoyf.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_ANON_KEY. Please set it.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EMAIL = "charlotte@muenster.dk";

async function sendReset() {
    console.log(`Sending reset password email to: ${EMAIL}`);

    // Attempt Password Reset
    const { data, error } = await supabase.auth.resetPasswordForEmail(EMAIL, {
        redirectTo: 'https://booking.wezet.xyz/reset-password'
    });

    if (error) {
        console.error(`[ERROR] Reset failed:`, error.message);
    } else {
        console.log(`[SUCCESS] Password reset email sent!`);
        console.log(`User exists in Auth.`);
    }
}

sendReset();

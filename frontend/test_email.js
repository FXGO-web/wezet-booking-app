
const { createClient } = require("@supabase/supabase-js");

// Hardcoded for testing script from reading .env.local earlier
const SUPABASE_URL = "https://aadzzhdouuxkvelxyoyf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTczNjksImV4cCI6MjA3OTI5MzM2OX0.O5sQG5s74WSlsTTkGwLmHjTSKiAtXKJBD3Fv8yN8Gxs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testEmail() {
    console.log("Fetching settings...");
    const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("resend_api_key")
        .single();

    if (error || !settings) {
        console.error("Error fetching settings:", error);
        return;
    }

    const RESEND_API_KEY = settings.resend_api_key;
    if (!RESEND_API_KEY) {
        console.error("No RESEND_API_KEY found in DB.");
        return;
    }

    console.log("Found RESEND_API_KEY:", RESEND_API_KEY.slice(0, 5) + "...");

    // Native fetch might not be in older Node, but usually is in Node 18+.
    // If not, we might need 'node-fetch' or similar.
    // But let's assume Node 18+.
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Wezet <confirmations@wezet.xyz>",
                to: ["javigaoses@gmail.com"],
                subject: "DEBUG TEST: Email Configuration Check",
                html: "<p>If you received this email, the Resend API Key is correct and the domain 'wezet.xyz' is verified.</p>",
            }),
        });

        const data = await response.json();
        console.log("Resend Response Status:", response.status);
        console.log("Resend Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch error (maybe Node version too old?):", e);
    }
}

testEmail();


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") || ""; // Need service role to read settings if RLS is strict

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase credentials in env.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testEmail() {
    console.log("Fetching settings...");
    const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("resend_api_key, email_template_confirmation")
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

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: "Wezet <confirmations@wezet.xyz>",
            to: ["javigaoses@gmail.com"], // Test email
            subject: "Test Email from Wezet Debugger",
            html: "<p>If you see this, the Resend Key and Domain are working!</p>",
        }),
    });

    const data = await res.json();
    console.log("Resend API Response:", JSON.stringify(data, null, 2));
}

testEmail();

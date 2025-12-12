
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getWelcomeTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log("Webhook Payload:", JSON.stringify(payload));

        // Support both direct invocation and DB Webhook payload
        // DB Webhook payload structure: { type: 'INSERT', table: 'users', record: { ... }, schema: 'auth', ... }

        let userEmail = "";
        let userName = "Member";

        if (payload.record && payload.record.email) {
            // DB Webhook
            userEmail = payload.record.email;
            // Parse metadata if available
            if (payload.record.raw_user_meta_data) {
                // It might be a string or object depending on how Postgres sends it
                const meta = typeof payload.record.raw_user_meta_data === 'string'
                    ? JSON.parse(payload.record.raw_user_meta_data)
                    : payload.record.raw_user_meta_data;
                userName = meta.full_name || meta.name || "Member";
            }
        } else if (payload.email) {
            // Direct invocation
            userEmail = payload.email;
            userName = payload.name || "Member";
        }

        if (!userEmail) {
            return new Response("No email found in payload", { status: 200 }); // Return 200 to satisfy webhook
        }

        // 1. Setup Supabase Client (For settings)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Get API Keys
        let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) {
            const { data: settings } = await supabase.from("platform_settings").select("resend_api_key").single();
            if (settings?.resend_api_key) RESEND_API_KEY = settings.resend_api_key;
        }

        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY missing");
            return new Response("Configuration Error", { status: 500 });
        }

        // 3. Send Email
        const htmlContent = getWelcomeTemplate(userName);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "Wezet <welcome@wezet.xyz>",
                to: [userEmail],
                subject: "Welcome to Wezet!",
                html: htmlContent
            })
        });

        const data = await res.json();
        console.log("Welcome Email Result:", data);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error processing signup:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

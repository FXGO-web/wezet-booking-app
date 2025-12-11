import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to } = await req.json();
        // Ensure to is a string and trim whitespace
        const cleanTo = typeof to === 'string' ? to.trim() : "";
        const targetEmail = cleanTo || "confirmation-test@wezet.xyz";

        // Initialize Supabase Client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch settings
        const { data: settings, error: settingsError } = await supabase
            .from("platform_settings")
            .select("resend_api_key")
            .single();

        if (settingsError || !settings?.resend_api_key) {
            throw new Error("Resend API Key not found in platform settings.");
        }

        const RESEND_API_KEY = settings.resend_api_key;

        // Send Test Email
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "Wezet Test <confirmations@wezet.xyz>",
                to: [targetEmail],
                subject: "Test Email from Wezet Admin",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #333;">Test Successful</h2>
                        <p>This email confirms that your Resend API Key is correctly configured and the domain <strong>wezet.xyz</strong> is verified.</p>
                        <p style="margin-top: 20px; color: #666; font-size: 12px;">Sent via Wezet Admin Dashboard</p>
                    </div>
                `
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(`Resend API Error: ${JSON.stringify(data)}`);
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

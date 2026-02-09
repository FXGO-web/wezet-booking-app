
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log("Sync Payload:", JSON.stringify(payload));

        // Support DB Webhook payload (INSERT on profiles)
        const record = payload.record || payload; // specific record or direct payload

        // We only care about the user data
        const user = {
            email: record.email,
            full_name: record.full_name,
            role: record.role,
            id: record.id
        };

        if (!user.email) {
            return new Response("No email found", { status: 200 });
        }

        // Target WordPress Sites
        const targets = [
            "https://learn.wezet.xyz/wp-json/wezet/v1/user",
            "https://shop.learn.xyz/wp-json/wezet/v1/user"
        ];

        const secret = Deno.env.get("WEZET_SYNC_SECRET") || "wezet_sync_secret_fallback";

        const results = await Promise.all(targets.map(async (url) => {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Wezet-Sync-Secret": secret
                    },
                    body: JSON.stringify(user)
                });
                const text = await res.text();
                return { url, status: res.status, response: text };
            } catch (err) {
                return { url, error: err.message };
            }
        }));

        console.log("Sync Results:", JSON.stringify(results));

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Always return 200 to Supabase Webhooks to prevent retries on partial failures
        });

    } catch (error) {
        console.error("Error syncing to WP:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWelcomeTemplate, getPasswordResetTemplate, getBookingConfirmationTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    type: 'welcome' | 'password_recovery' | 'booking_confirmation';
    to: string;
    payload?: any; // Data for the template
}

Deno.serve(async (req) => {
    console.log("[Send-Email] Incoming request...");
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { type, to, payload } = await req.json() as EmailRequest;

        if (!to || !type) {
            throw new Error("Missing 'to' or 'type' in request body");
        }

        // 1. Setup Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Get API Keys (Try Env, then DB)
        let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

        if (!RESEND_API_KEY) {
            const { data: settings } = await supabase
                .from("platform_settings")
                .select("resend_api_key")
                .single();
            if (settings?.resend_api_key) {
                RESEND_API_KEY = settings.resend_api_key;
            }
        }

        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not configured.");
        }

        // 3. Generate Content
        let subject = "";
        let htmlContent = "";

        switch (type) {
            case 'welcome':
                subject = "Welcome to Wezet!";
                htmlContent = getWelcomeTemplate(payload?.name || "Member");
                break;

            case 'password_recovery':
                // Generate Recovery Link
                // Note: For this to work, the function needs Service Role Key.
                // And we assume the request to this function is authorized or public (limited).

                let linkData, linkError;

                // Try to generate link first
                ({ data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                    type: 'recovery',
                    email: to,
                    options: {
                        redirectTo: payload?.redirectTo || "https://booking.wezet.xyz/update-password"
                    }
                }));

                // Lazy Sync: If user not found, create them and retry
                if (linkError && linkError.message && (linkError.message.includes("User not found") || linkError.status === 422)) {
                    console.log(`[Send-Email] User ${to} not found. Attempting Lazy Sync creation...`);

                    const { error: createError } = await supabase.auth.admin.createUser({
                        email: to,
                        email_confirm: true, // Auto-confirm since we are sending a magic link/recovery immediately
                        user_metadata: {
                            source: 'lazy_sync_password_reset'
                        }
                    });

                    if (createError) {
                        console.error("[Send-Email] Lazy Sync failed:", createError);
                        throw createError;
                    }

                    // Retry generating link
                    ({ data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                        type: 'recovery',
                        email: to,
                        options: {
                            redirectTo: payload?.redirectTo || "https://booking.wezet.xyz/update-password"
                        }
                    }));
                }

                if (linkError) throw linkError;

                const actionLink = linkData.properties?.action_link;
                if (!actionLink) throw new Error("Failed to generate recovery link");

                subject = "Reset your Wezet password";
                htmlContent = getPasswordResetTemplate(actionLink);
                break;

            case 'booking_confirmation':
                subject = `Booking Confirmed: ${payload.sessionName}`;
                htmlContent = getBookingConfirmationTemplate(payload);
                break;

            default:
                throw new Error(`Unknown email type: ${type}`);
        }

        // 4. Send Email using Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "Wezet <confirmations@wezet.xyz>",
                to: [to],
                subject: subject,
                html: htmlContent
            })
        });

        const data = await res.json();

        if (!res.ok) {
            // Log detailed error from Resend
            console.error("Resend API Error:", data);
            throw new Error(`Resend API Error: ${JSON.stringify(data)}`);
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Explicitly successful
        });

    } catch (error: any) {
        console.error("Error in send-email function:", error);
        // RETURN 200 OK WITH ERROR so frontend can parse it
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

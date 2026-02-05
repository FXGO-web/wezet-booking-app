import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getBookingConfirmationTemplate } from "../_shared/email-templates.ts";

// Initialize Supabase Client for fetching settings if needed
// WARNING: Ensure 'STRIPE_SECRET_KEY' is set in your Supabase project secrets.
let STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
let STRIPE_WEBHOOK_SIGNING_SECRET = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")?.trim();

// Initialize Supabase Client to fetch settings if needed
// createClient is already imported at the top

// Fetch from DB if keys are missing
if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SIGNING_SECRET) {
    console.log("Stripe keys missing in env, attempting to fetch from database...");
    const supabaseSettings = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    try {
        const { data } = await supabaseSettings.from("platform_settings").select("stripe_secret_key, stripe_webhook_secret").single();
        if (data) {
            if (!STRIPE_SECRET_KEY && data.stripe_secret_key) STRIPE_SECRET_KEY = data.stripe_secret_key;
            if (!STRIPE_WEBHOOK_SIGNING_SECRET && data.stripe_webhook_secret) STRIPE_WEBHOOK_SIGNING_SECRET = data.stripe_webhook_secret;
            console.log("Stripe keys fetched from database.");
        }
    } catch (e) {
        console.error("Failed to fetch settings from DB:", e);
    }
}

const stripe = new Stripe(STRIPE_SECRET_KEY?.trim() || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    let event;

    // Helper to try verification with a secret
    const verifyWithSecret = async (secret: string) => {
        return await stripe.webhooks.constructEventAsync(
            body,
            signature,
            secret,
            undefined,
            cryptoProvider
        );
    };

    try {
        // 1. Try Environment Variable First
        let secret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")?.trim();

        if (secret) {
            try {
                event = await verifyWithSecret(secret);
            } catch (envErr) {
                console.warn(`Env Var secret verification failed: ${envErr.message}. Trying DB...`);
                // Verification with Env Var failed, will try DB below
                secret = null;
            }
        }

        // 2. Try DB if Env Var missing or failed
        if (!secret || !event) {
            const supabaseSettings = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );
            const { data } = await supabaseSettings.from("platform_settings").select("stripe_webhook_secret").single();

            if (data?.stripe_webhook_secret) {
                console.log("Attempting verification with DB secret...");
                event = await verifyWithSecret(data.stripe_webhook_secret);
            } else {
                throw new Error("No Stripe Webhook Secret found in Env or DB");
            }
        }

    } catch (err: any) {
        console.error(`Webhook signature verification failed completely: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
        let session = event.data.object;

        // Retrieve full session to ensure we have metadata (handles "Thin" payloads)
        try {
            if (session.id) {
                session = await stripe.checkout.sessions.retrieve(session.id);
            }
        } catch (e) {
            console.error("Error retrieving full session from Stripe:", e);
            // Continue with payload session if retrieval fails, though it might lack metadata
        }

        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
            console.log(`Payment successful for booking ${bookingId}`);
            const { error } = await supabase
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", bookingId);

            if (error) {
                console.error("Error updating booking:", error);
                // We return 500 here to let Stripe retry later
                return new Response("Error updating booking", { status: 500 });
            }

            // Fetch full booking details for the email
            const { data: bookingData, error: bookingError } = await supabase
                .from("bookings")
                .select(`
                    id,
                    price,
                    currency,
                    sessions (
                        start_time,
                        end_time,
                        session_templates ( name ),
                        locations ( name, address, google_maps_url ),
                        profiles ( full_name )
                    )
                `)
                .eq("id", bookingId)
                .single();

            if (bookingError) {
                console.error("Error fetching booking details for email:", bookingError);
            }

            // Send Confirmation Email via Resend
            let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
            let emailTemplate = null;
            let notifyEmail = null;

            // Fallback: Try to get RESEND_API_KEY and Template from DB if not in Env
            if (!RESEND_API_KEY) {
                console.log("RESEND_API_KEY missing in env, attempting to fetch from database...");
                try {
                    const { data: settings } = await supabase
                        .from("platform_settings")
                        .select("resend_api_key, email_template_confirmation, notify_email") // Fetch template and notify_email
                        .single();
                    if (settings?.resend_api_key) {
                        RESEND_API_KEY = settings.resend_api_key;
                        emailTemplate = settings.email_template_confirmation; // Store template
                        notifyEmail = settings.notify_email;
                        console.log("RESEND_API_KEY fetched from database.");
                    } else {
                        console.error("RESEND_API_KEY not found in database settings either.");
                    }
                } catch (err) {
                    console.error("Error fetching settings for RESEND_API_KEY:", err);
                }
            } else {
                // Even if we have API KEY, let's try to get the template if the user wants custom ones
                try {
                    const { data: settings } = await supabase
                        .from("platform_settings")
                        .select("email_template_confirmation, notify_email")
                        .single();
                    if (settings) {
                        if (settings.email_template_confirmation) {
                            emailTemplate = settings.email_template_confirmation;
                        }
                        if (settings.notify_email) {
                            notifyEmail = settings.notify_email;
                        }
                    }
                } catch (err) {
                    console.log("Could not fetch custom template, using default.");
                }
            }

            if (RESEND_API_KEY && bookingData) {
                try {
                    const sessionData = bookingData.sessions;
                    const sessionName = sessionData?.session_templates?.name || "Session";
                    const instructorName = sessionData?.profiles?.full_name || "Wezet Instructor";
                    const locationName = sessionData?.locations?.name || "Online";
                    const locationAddress = sessionData?.locations?.address || "";
                    const dateObj = new Date(sessionData?.start_time);
                    const dateStr = dateObj.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
                    const clientName = session.customer_details?.name || "Client";

                    const customerEmail = session.customer_details?.email || session.customer_email;

                    if (customerEmail) {
                        let htmlContent = "";

                        // Replace placeholders in custom template
                        if (emailTemplate) {
                            htmlContent = emailTemplate
                                .replace(/{{client_name}}/g, clientName)
                                .replace(/{{session_name}}/g, sessionName)
                                .replace(/{{date}}/g, dateStr)
                                .replace(/{{time}}/g, timeStr)
                                .replace(/{{instructor}}/g, instructorName)
                                .replace(/{{location}}/g, locationName)
                                .replace(/{{address}}/g, locationAddress)
                                .replace(/{{price}}/g, `${bookingData.price} ${bookingData.currency}`)
                                .replace(/{{booking_id}}/g, bookingData.id);
                        } else {
                            // Use Shared Template
                            htmlContent = getBookingConfirmationTemplate({
                                clientName,
                                sessionName,
                                date: dateStr,
                                time: timeStr,
                                instructorName,
                                locationName,
                                address: locationAddress,
                                price: `${bookingData.price} ${bookingData.currency}`,
                                bookingId: bookingData.id
                            });
                        }

                        const res = await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${RESEND_API_KEY}`
                            },
                            body: JSON.stringify({
                                from: "Wezet <confirmations@wezet.xyz>",
                                to: [customerEmail],
                                bcc: notifyEmail ? [notifyEmail] : undefined,
                                subject: `Booking Confirmed: ${sessionName}`,
                                html: htmlContent
                            })
                        });
                        const emailData = await res.json();
                        console.log("Email sent result:", emailData);
                    } else {
                        console.log("No customer email found in session, skipping email.");
                    }
                } catch (emailError) {
                    console.error("Error sending email:", emailError);
                    // Do NOT throw error here, as main booking was confirmed.
                }
            } else {
                console.log("RESEND_API_KEY not set or booking data lookup failed, skipping email.");
            }

        } else {
            console.log("No booking_id found in session metadata");
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});

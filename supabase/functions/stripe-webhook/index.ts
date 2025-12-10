import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

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

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            STRIPE_WEBHOOK_SIGNING_SECRET || "",
            undefined,
            cryptoProvider
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
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
            const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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

                    const customerEmail = session.customer_details?.email || session.customer_email;
                    if (customerEmail) {
                        const res = await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${RESEND_API_KEY}`
                            },
                            body: JSON.stringify({
                                from: "Wezet <confirmations@wezet.xyz>",
                                to: [customerEmail],
                                subject: `Booking Confirmed: ${sessionName}`,
                                html: `
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <style>
                                            body { font-family: sans-serif; line-height: 1.6; color: #333; }
                                            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                                            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                                            .header h1 { color: #000; margin: 0; }
                                            .details { margin: 20px 0; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                                            .detail-row { margin-bottom: 10px; }
                                            .label { font-weight: bold; color: #666; }
                                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
                                            .button { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="container">
                                            <div class="header">
                                                <h1>WEZET</h1>
                                                <p>Booking Confirmed</p>
                                            </div>
                                            <p>Hi there,</p>
                                            <p>We are excited to confirm your booking for <strong>${sessionName}</strong>.</p>
                                            
                                            <div class="details">
                                                <div class="detail-row"><span class="label">Date:</span> ${dateStr}</div>
                                                <div class="detail-row"><span class="label">Time:</span> ${timeStr}</div>
                                                <div class="detail-row"><span class="label">Instructor:</span> ${instructorName}</div>
                                                <div class="detail-row"><span class="label">Location:</span> ${locationName}</div>
                                                ${locationAddress ? `<div class="detail-row"><span class="label">Address:</span> ${locationAddress}</div>` : ''}
                                                <div class="detail-row"><span class="label">Price:</span> ${bookingData.price} ${bookingData.currency}</div>
                                            </div>

                                            <p>Please arrive 10 minutes before the session starts.</p>
                                            
                                            <div class="footer">
                                                <p>Booking ID: ${bookingData.id}</p>
                                                <p>&copy; ${new Date().getFullYear()} Wezet. All rights reserved.</p>
                                            </div>
                                        </div>
                                    </body>
                                    </html>
                                `
                            })
                        });
                        const emailData = await res.json();
                        console.log("Email sent result:", emailData);
                    } else {
                        console.log("No customer email found in session, skipping email.");
                    }
                } catch (emailError) {
                    console.error("Error sending email:", emailError);
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

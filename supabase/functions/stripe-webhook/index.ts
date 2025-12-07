import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

// Initialize Supabase Client for fetching settings if needed
// WARNING: Ensure 'STRIPE_SECRET_KEY' is set in your Supabase project secrets.
let STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
let STRIPE_WEBHOOK_SIGNING_SECRET = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

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

const stripe = new Stripe(STRIPE_SECRET_KEY || "", {
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
        } else {
            console.log("No booking_id found in session metadata");
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});

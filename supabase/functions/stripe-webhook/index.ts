import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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
            Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || "",
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
        const session = event.data.object;
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

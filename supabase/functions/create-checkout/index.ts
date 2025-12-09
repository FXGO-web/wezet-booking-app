import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WARNING: Ensure 'STRIPE_SECRET_KEY' is set in your Supabase project secrets.
// WARNING: Ensure 'STRIPE_SECRET_KEY' is set in your Supabase project secrets.
let STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')?.trim();

// Initialize Supabase Client to fetch settings if needed

if (!STRIPE_SECRET_KEY) {
    console.log("STRIPE_SECRET_KEY not found in env, attempting to fetch from database...");
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        const { data, error } = await supabase.from("platform_settings").select("stripe_secret_key").single();
        if (data && data.stripe_secret_key) {
            STRIPE_SECRET_KEY = data.stripe_secret_key;
            console.log("STRIPE_SECRET_KEY fetched from database.");
        } else {
            console.error("Failed to fetch STRIPE_SECRET_KEY from database:", error);
        }
    } catch (err) {
        console.error("Error connecting to Supabase for settings:", err);
    }
}

if (!STRIPE_SECRET_KEY) {
    // We can't throw here immediately because we are outside the serve handler in global scope, 
    // but for Edge Functions it's better to fail fast or handle inside the request.
    // However, top-level await is supported.
    console.error("Missing STRIPE_SECRET_KEY environment variable and database fallback failed.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY?.trim() || "", {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { price, currency, description, booking_id, return_url, customer_email } = await req.json()

        console.log(`Creating checkout session for booking ${booking_id}: ${price} ${currency}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency || 'eur',
                        product_data: {
                            name: description || 'Wezet Booking',
                        },
                        unit_amount: Math.round(Number(price) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${return_url}${return_url.includes('?') ? '&' : '?'}success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${return_url}${return_url.includes('?') ? '&' : '?'}canceled=true`,
            customer_email: customer_email,
            metadata: {
                booking_id: booking_id,
            },
        })

        return new Response(
            JSON.stringify({ url: session.url, id: session.id }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return new Response(
            JSON.stringify({
                error: error.message,
                type: (error as any).type,
                code: (error as any).code,
                param: (error as any).param
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 so client can parse the error body easily
            },
        )
    }
})

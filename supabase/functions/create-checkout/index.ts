import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WARNING: Ensure 'STRIPE_SECRET_KEY' is set in your Supabase project secrets.
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
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
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})

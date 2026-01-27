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
        const { price, currency, description, booking_id, bundle_purchase_id, return_url, customer_email } = await req.json()

        console.log(`Creating checkout session. Booking: ${booking_id}, BundlePurchase: ${bundle_purchase_id}`);

        let finalPrice = price;
        let finalCurrency = currency || 'eur';
        let finalDescription = description || 'Wezet Booking';

        // If bundle_purchase_id is present, validate price against DB
        if (bundle_purchase_id) {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            // 1. Get the purchase record to find the bundle_id
            const { data: purchase, error: purchaseError } = await supabase
                .from('bundle_purchases')
                .select('bundle_id')
                .eq('id', bundle_purchase_id)
                .single();

            if (purchaseError || !purchase) {
                console.error("Error fetching bundle purchase:", purchaseError);
                throw new Error("Invalid bundle purchase ID");
            }

            if (purchase.bundle_id) {
                // 2. Get the bundle details
                const { data: bundle, error: bundleError } = await supabase
                    .from('bundles')
                    .select('price, currency, name')
                    .eq('id', purchase.bundle_id)
                    .single();

                if (bundleError || !bundle) {
                    console.error("Error fetching bundle:", bundleError);
                    throw new Error("Bundle not found");
                }

                // Override client-provided values with DB values
                finalPrice = bundle.price;
                finalCurrency = bundle.currency;
                finalDescription = `Bundle: ${bundle.name}`;
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: finalCurrency,
                        product_data: {
                            name: finalDescription,
                        },
                        unit_amount: Math.round(Number(finalPrice) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${return_url}${return_url.includes('?') ? '&' : '?'}view=booking-success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${return_url}${return_url.includes('?') ? '&' : '?'}canceled=true`,
            customer_email: customer_email,
            metadata: {
                booking_id: booking_id,
                bundle_purchase_id: bundle_purchase_id,
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

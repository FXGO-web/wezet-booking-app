
import { createClient } from "npm:@supabase/supabase-js@2";
import dotenv from "npm:dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://fxgodxbrvggbgvjxybmn.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to bypass RLS if needed, but user token is better if simulating user.

if (!SUPABASE_URL || (!SUPABASE_KEY && !SERVICE_KEY)) {
    console.error("Missing Supabase keys in environment");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY);

async function checkBookings() {
    const email = "javigaoses@gmail.com";
    console.log(`Checking bookings for ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("Error listing users (need service role?):", userError);
        // Fallback: search profile by email
    }

    const user = users?.find(u => u.email === email);
    let userId = user?.id;

    if (!userId) {
        console.log("User not found in auth. checking profiles...");
        const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('email', email).single();
        userId = profile?.id;
    }

    if (!userId) {
        console.error("User not found!");
        return;
    }

    console.log(`User ID: ${userId}`);

    // 2. Get Bookings
    const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
        id,
        status,
        created_at,
        price,
        currency,
        session:session_id (
            start_time,
            end_time,
            session_template_id
        )
    `)
        .eq("customer_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching bookings:", error);
        return;
    }

    console.log(`Found ${bookings.length} bookings.`);
    bookings.forEach(b => {
        console.log(`- [${b.status}] ${b.created_at} | Price: ${b.price} ${b.currency} | ID: ${b.id}`);
        if (b.session) {
            console.log(`  Session: ${b.session.start_time}`);
        }
    });

    // 3. Check Platform Settings for Resend Key existence (masked)
    const { data: settings } = await supabase.from("platform_settings").select("*").single();
    if (settings) {
        console.log("Platform Settings found:");
        console.log(`- resend_api_key present: ${!!settings.resend_api_key}`);
        console.log(`- stripe_secret_key present: ${!!settings.stripe_secret_key}`);
        console.log(`- stripe_webhook_secret present: ${!!settings.stripe_webhook_secret}`);
    } else {
        console.log("No platform settings found.");
    }
}

checkBookings();

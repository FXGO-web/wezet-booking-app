import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from frontend/.env.local
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateBookings() {
    console.log("Starting migration of free bookings...");

    // We need to use service role key if we want to bypass RLS, but let's try with anon key first
    // as the user might not have service role key in .env.local
    // Actually, for admin tasks, we might need the service role.

    const { data, error, count } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .match({ status: 'pending' })
        .or('price.eq.0,price.is.null')
        .select();

    if (error) {
        console.error("Migration failed:", error);

        if (error.code === '42501') {
            console.error("Permission denied. This script requires a Service Role Key to bypass RLS.");
        }
    } else {
        console.log(`Successfully migrated ${data?.length || 0} bookings.`);
        console.log("Sample of migrated bookings:", data?.slice(0, 3));
    }
}

migrateBookings();


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase credentials in env.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testSendEmailFunction() {
    console.log("Invoking send-email function...");

    const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
            type: "booking_confirmation",
            to: "javigaoses@gmail.com",
            payload: {
                clientName: "Test Client",
                sessionName: "Test Session",
                date: "Monday, January 1, 2024",
                time: "10:00 AM",
                instructorName: "Test Instructor",
                locationName: "Test Studio",
                address: "123 Test St",
                price: "100 EUR",
                bookingId: "test-booking-123"
            }
        }
    });

    if (error) {
        console.error("Function Invocation Error:", error);
    } else {
        console.log("Function Response:", JSON.stringify(data, null, 2));
    }
}

testSendEmailFunction();

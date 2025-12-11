import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const reqData = await req.json();
        console.log("get_month_calendar called with:", reqData);
        const { year, month } = reqData;

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // 1) Get templates
        const { data: templates, error: templatesError } = await supabase
            .from("session_templates")
            .select("*");
        if (templatesError) throw templatesError;

        // 2) Get availability rules
        const { data: weekly, error: weeklyError } = await supabase
            .from("availability_rules")
            .select("*");
        if (weeklyError) throw weeklyError;

        // 3) Get specific date slots
        const { data: specific, error: specificError } = await supabase
            .from("availability_exceptions") // Corrected table name from availability_specific_slots
            .select("*");
        if (specificError) throw specificError;

        // 4) Get blocked dates
        const { data: blocked, error: blockedError } = await supabase
            .from("availability_blocked_dates")
            .select("*");
        if (blockedError) throw blockedError;

        // 5) Get team members (profiles)
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .in("role", ["instructor", "admin", "team_member"]); // Include relevant roles
        if (profilesError) throw profilesError;

        const teamMembers = profiles?.map((p: any) => ({
            id: p.id,
            name: p.full_name || "Unknown",
            avatarUrl: p.avatar_url
        })) || [];

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        let results: any[] = [];

        for (
            let day = new Date(firstDay);
            day <= lastDay;
            day.setDate(day.getDate() + 1)
        ) {
            const d = new Date(day);
            const dateStr = d.toISOString().split("T")[0];
            const weekday = d.getDay(); // 0=Sun, 1=Mon, ...

            // 1. Get all raw weekly slots for this day
            const weeklyForDay = weekly?.filter((w: any) => w.weekday === weekday) || [];

            // 2. Get all raw exceptions for this day
            // Normalize s.date just in case it's ISO
            const specificForDay = specific?.filter((s: any) => (s.date && s.date.substring(0, 10) === dateStr)) || [];

            // 3. Get all blocked dates for this day
            const blockedForDay = blocked?.filter((b: any) => (b.date && b.date.substring(0, 10) === dateStr)) || [];

            // 4. Identify all instructors involved today (from weekly rules or exceptions)
            // Use Set to deduplicate
            const instructorsOnDay = new Set([
                ...weeklyForDay.map((w: any) => w.instructor_id),
                ...specificForDay.map((s: any) => s.instructor_id)
            ]);

            // 5. Process slots per instructor
            for (const instId of instructorsOnDay) {
                // Is this instructor blocked for the whole day?
                const isDayBlocked = blockedForDay.some((b: any) => b.instructor_id === instId);
                if (isDayBlocked) continue;

                // My Weekly Slots
                const myWeekly = weeklyForDay.filter((w: any) => w.instructor_id === instId);

                // My Exceptions
                const myExceptions = specificForDay.filter((s: any) => s.instructor_id === instId);
                const toBlock = myExceptions.filter((e: any) => !e.is_available);
                const toAdd = myExceptions.filter((e: any) => e.is_available);

                // Start with Weekly slots
                let mySlots = myWeekly.map((w: any) => ({
                    date: dateStr,
                    start: w.start_time,
                    end: w.end_time,
                    template_id: w.session_template_id,
                    instructor_id: w.instructor_id,
                    location_id: w.location_id,
                    source: 'rule', // It's a weekly rule
                    rule_id: w.id
                }));

                // Apply Blocks - Filter out slots that match blocked times
                if (toBlock.length > 0) {
                    console.log(`[${dateStr}] Instructor ${instId} has blocking exceptions:`, toBlock);
                    mySlots = mySlots.filter((slot: any) => {
                        const slotStart = slot.start.substring(0, 5); // HH:MM
                        const isBlocked = toBlock.some((b: any) => {
                            const blockStart = b.start_time ? b.start_time.substring(0, 5) : "";
                            return blockStart === slotStart;
                        });
                        if (isBlocked) {
                            console.log(`  -> Blocking slot at ${slotStart} due to exception`);
                        }
                        return !isBlocked;
                    });
                }

                // Add Extra Slots (Exceptions that are additions)
                let extraSlots = toAdd.map((s: any) => ({
                    date: dateStr,
                    start: s.start_time,
                    end: s.end_time,
                    template_id: s.session_template_id,
                    instructor_id: s.instructor_id,
                    location_id: s.location_id,
                    source: 'exception', // It's a manual exception
                    exception_id: s.id
                }));

                // Apply Blocks to EXTRA slots too
                if (toBlock.length > 0) {
                    extraSlots = extraSlots.filter((slot: any) => {
                        const slotStart = slot.start.substring(0, 5);
                        const isBlocked = toBlock.some((b: any) => {
                            const blockStart = b.start_time ? b.start_time.substring(0, 5) : "";
                            return blockStart === slotStart;
                        });
                        return !isBlocked;
                    });
                }

                // Combine
                results.push(...mySlots, ...extraSlots);
            }
        }

        return new Response(JSON.stringify({ slots: results, teamMembers }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
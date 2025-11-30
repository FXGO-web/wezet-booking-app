import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { year, month } = await req.json();

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
            .select("id, first_name, last_name, avatar_url, role")
            .in("role", ["instructor", "admin", "team_member"]); // Include relevant roles
        if (profilesError) throw profilesError;

        const teamMembers = profiles?.map((p: any) => ({
            id: p.id,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
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

            // Blocked?
            const isBlocked = blocked?.some((b: any) => b.date === dateStr);
            if (isBlocked) continue;

            // Weekly slots
            // Note: JS getDay() returns 0 for Sunday, but your DB might use 0 or 7.
            // Assuming standard 0-6.
            const weeklySlots =
                weekly
                    ?.filter((w: any) => w.weekday === weekday)
                    .map((w: any) => ({
                        date: dateStr,
                        start: w.start_time,
                        end: w.end_time,
                        template_id: w.session_template_id, // Corrected column name
                        instructor_id: w.instructor_id, // Corrected column name
                        location_id: w.location_id,
                    })) || [];

            // Specific slots override?
            // Usually specific slots ADD to availability or REPLACE it.
            // If 'is_available' is false, it acts as a block.
            // If 'is_available' is true, it adds a slot.
            const specificForDay = specific?.filter((s: any) => s.date === dateStr) || [];

            // If there are specific rules for this day, do they replace the weekly ones?
            // Or do they just add/subtract?
            // Logic: If specific rule says is_available=false, it blocks.
            // If is_available=true, it's a slot.
            // A common pattern: if specific rules exist for a day, IGNORE weekly rules?
            // OR: specific rules are just extra slots / blocks.
            // Let's assume:
            // 1. If any specific rule has is_available=false (and no times), it blocks the whole day?
            //    Or maybe it just blocks that specific slot?
            //    Let's look at the schema implication. 'availability_exceptions' usually implies "Use this INSTEAD of weekly".
            //    Let's go with: If exceptions exist for this date, use ONLY exceptions.

            let daySlots: any[] = [];

            if (specificForDay.length > 0) {
                // Use specific slots only
                const activeSpecific = specificForDay.filter((s: any) => s.is_available);
                daySlots = activeSpecific.map((s: any) => ({
                    date: dateStr,
                    start: s.start_time,
                    end: s.end_time,
                    template_id: s.session_template_id,
                    instructor_id: s.instructor_id,
                    location_id: s.location_id,
                }));
            } else {
                // Use weekly slots
                daySlots = weeklySlots;
            }

            results.push(...daySlots);
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
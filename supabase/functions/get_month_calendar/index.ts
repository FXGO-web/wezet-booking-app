// supabase/functions/get_month_calendar/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    const { year, month } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Get templates
    const { data: templates } = await supabase.from("session_templates").select("*");

    // 2) Get availability rules
    const { data: weekly } = await supabase
        .from("availability_rules")
        .select("*");

    // 3) Get specific date slots
    const { data: specific } = await supabase
        .from("availability_specific_slots")
        .select("*");

    // 4) Get blocked dates
    const { data: blocked } = await supabase
        .from("availability_blocked_dates")
        .select("*");

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
        const weekday = d.getDay();

        // Blocked?
        const isBlocked = blocked?.some((b) => b.date === dateStr);
        if (isBlocked) continue;

        // Weekly slots
        const weeklySlots = weekly
            ?.filter((w) => w.weekday === weekday)
            .map((w) => ({
                date: dateStr,
                start: w.start_time,
                end: w.end_time,
                template_id: w.template_id,
                team_member_id: w.team_member_id,
            }));

        // Specific slots override
        const specificSlots = specific
            ?.filter((s) => s.date === dateStr)
            .map((s) => ({
                date: dateStr,
                start: s.start_time,
                end: s.end_time,
                template_id: s.template_id,
                team_member_id: s.team_member_id,
            }));

        results.push(...weeklySlots, ...specificSlots);
    }

    return new Response(JSON.stringify({ slots: results }), { status: 200 });
});
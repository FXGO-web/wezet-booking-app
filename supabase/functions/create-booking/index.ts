import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      template_id,
      start_time,
      customer_id,
      status = "pending",
      price = 0,
      currency = "EUR",
      notes = null,
    } = await req.json();

    if (!template_id || !start_time) {
      throw new Error("Missing required fields: template_id, start_time");
    }

    const { data: template, error: templateError } = await supabase
      .from("session_templates")
      .select("id, duration_minutes, instructor_id, location_id, category_id, capacity")
      .eq("id", template_id)
      .single();

    if (templateError || !template) {
      throw new Error("Session template not found");
    }

    const startDate = new Date(start_time);
    const durationMinutes = Number(template.duration_minutes || 60);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);

    const { data: existingSession, error: sessionLookupError } = await supabase
      .from("sessions")
      .select("id")
      .eq("session_template_id", template_id)
      .eq("start_time", startDate.toISOString())
      .maybeSingle();

    if (sessionLookupError) {
      throw sessionLookupError;
    }

    let sessionId = existingSession?.id as string | undefined;

    if (!sessionId) {
      const { data: createdSession, error: createSessionError } = await supabase
        .from("sessions")
        .insert({
          session_template_id: template_id,
          instructor_id: template.instructor_id ?? null,
          location_id: template.location_id ?? null,
          category_id: template.category_id ?? null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          capacity: template.capacity ?? null,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (createSessionError || !createdSession) {
        throw createSessionError || new Error("Failed to create session");
      }

      sessionId = createdSession.id;
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        session_id: sessionId,
        customer_id: customer_id ?? null,
        status,
        price,
        currency,
        notes,
      })
      .select("*")
      .single();

    if (bookingError || !booking) {
      throw bookingError || new Error("Failed to create booking");
    }

    return new Response(
      JSON.stringify(booking),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error creating booking from template:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});

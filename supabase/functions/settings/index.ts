// supabase/functions/settings/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  try {
    // Preflight CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Obtener Authorization: Bearer <token>
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Missing Bearer token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente con service_role
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Validar usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Solo permitir admins
    if (user.user_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // GET SETTINGS
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // UPDATE SETTINGS
    if (req.method === "POST") {
      const body = await req.json();

      const { data, error } = await supabase
        .from("platform_settings")
        .update(body)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
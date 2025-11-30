import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS
// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  // 1. Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // 2. Leer Authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization" }),
      { status: 401, headers: corsHeaders },
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // 3. Validar JWT del usuario usando SERVICE ROLE KEY
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { data: user, error: authError } = await authClient.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid JWT" }),
      { status: 403, headers: corsHeaders },
    );
  }

  // 3.1 Check Role (Must be admin or instructor to update settings)
  // Note: In a real app, you might want to restrict this to 'admin' only.
  // Checking user_metadata first, then falling back to profiles table if needed.
  // For now, we'll check the 'role' in user_metadata if it exists, or query the profile.

  // Optimization: We can query the profile directly since we need to check the role from the DB source of truth.
  const dbForRole = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile } = await dbForRole
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "client";

  // Allow GET for everyone (or maybe restrict too?), but POST only for admins
  if (req.method === "POST" && userRole !== "admin") {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Admin access required" }),
      { status: 403, headers: corsHeaders },
    );
  }

  // 4. Cliente DB con SERVICE ROLE KEY
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET
  if (req.method === "GET") {
    const { data, error } = await db
      .from("platform_settings")
      .select("*")
      .single();

    return new Response(JSON.stringify(data ?? { error }), {
      status: error ? 400 : 200,
      headers: corsHeaders,
    });
  }

  // POST
  if (req.method === "POST") {
    const body = await req.json();

    const { data, error } = await db
      .from("platform_settings")
      .update(body)
      .eq("id", 1)
      .select()
      .single();

    return new Response(JSON.stringify(data ?? { error }), {
      status: error ? 400 : 200,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: corsHeaders },
  );
});
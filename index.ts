import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({
      error: "Missing Authorization"
    }), {
      status: 401,
      headers: corsHeaders
    });
  }
  const token = authHeader.replace("Bearer ", "");
  // 1. Cliente sin service role: solo para validar el JWT del usuario
  const authClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({
      error: "Invalid JWT"
    }), {
      status: 403,
      headers: corsHeaders
    });
  }
  // 2. Cliente con service role: para DB
  const db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  if (req.method === "GET") {
    const { data, error } = await db.from("platform_settings").select("*").single();
    return new Response(JSON.stringify(data ?? {}), {
      status: error ? 400 : 200,
      headers: corsHeaders
    });
  }
  if (req.method === "POST") {
    const body = await req.json();
    const { data, error } = await db.from("platform_settings").update(body).eq("id", 1).select().single();
    return new Response(JSON.stringify(data ?? {}), {
      status: error ? 400 : 200,
      headers: corsHeaders
    });
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
});

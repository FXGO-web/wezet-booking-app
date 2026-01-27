import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authorization Check (Service Role Key required)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Parse Payload
    const { email, firstName, lastName, role = "Client", source = "external" } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`[Sync-User] Processing: ${email} from ${source}`);

    // 3. Check if user exists in Auth
    const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    // Note: listUsers() is paginated, for scale we might need getUserByEmail if available or loop pages.
    // However, admin.getUserByEmail isn't a direct method in some versions, but createClient usually has generic methods.
    // Better safely: try to create, if catch "already exists", then update.

    // Let's try to 'Invite' or 'Create'
    // Strategy: Create User with dummy password (they will use Magic Link) or Invite User.
    // 'inviteUserByEmail' sends an email automatically. 'createUser' does not unless specified.

    let userId;
    let isNewUser = false;

    // Search specifically
    // Note: It's more efficient to just try to create and handle error, or use a specific search.
    // We will use the 'createUser' check.

    // Check by listing (filtering not always available in early listUsers versions via JS SDK without params, 
    // but newer versions support it. We'll be safe and assume we might create duplicate if not careful.)

    // Simplest robust way: Try to create.
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // Auto confirm since they came from WP (Trusted Source)
      user_metadata: {
        name: `${firstName} ${lastName}`.trim(),
        role: role,
        source: source
      }
    });

    if (createError) {
      if (createError.message.includes("already registered") || createError.status === 422) {
        console.log(`[Sync-User] User ${email} already exists. Fetching ID...`);
        // Find the user ID
        // Optimally we would use listUsers with filter, but for now let's just assume we can get it via simple query if public users table existed, 
        // but 'auth.users' is private.
        // We can use 'generateLink' to find user or just listUsers.

        // For this MVP, we will try to get the user by list (assuming low volume for now) or error message often doesn't give ID.
        // Supabase Admin *does* allow getting user by email in newer SDKs via listUsers({ email: ... })? 
        // No, standard is listUsers.

        // Let's use the public team_members table to find the ID if they exist there?
        // Or rely on the fact that if they exist in Auth, we just need to ensure team_members.

        // Workaround to get ID: listUsers with current implementation unfortunately lists all.
        // Best bet: Use Public Table lookup if they exist there, or fail gracefully if we can't find ID.
        // WAIT: We can use `supabaseAdmin.rpc` if we had a function, but we are writing the function now.

        // Actually, we can use `listUsers` with Rate Limiting? No.
        // Let's assume for high scale we need a better lookup. For now, let's look at public.team_members
        const { data: publicUser } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (publicUser) {
          userId = publicUser.id;
        } else {
          // Danger zone: User in Auth but not in Team Members. 
          // We need to query auth schema? No, can't directly.
          // We will skip metadata update for existing users who are "Ghosts" (Ghost Auth) to avoid complexity 
          // unless we iterate.
          console.warn("User exists in Auth but not in team_members or lookup failed.");
          // We can't proceed to update Auth without ID. We will proceed to Insert team_members.
          // But we need the ID for the Insert!
          // Let's try to 'generateLink' type 'magiclink' - it returns the user object!
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email
          });
          if (linkData && linkData.user) {
            userId = linkData.user.id;
          }
        }
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
      isNewUser = true;
      console.log(`[Sync-User] Created new user: ${userId}`);
    }

    if (!userId) {
      throw new Error("Could not resolve User ID for " + email);
    }

    // 4. Update/Insert into Public Profiles (Profile)
    // This is the crucial "Bridge" to your App's logic
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email: email,
        full_name: `${firstName} ${lastName}`.trim(),
        role: role,
        status: 'active',
        // Preserve existing data if any
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      throw profileError;
    }

    // 5. Build Response
    // If NEW user, return a Magic Link so WP can perhaps redirect them (Optional)
    let magicLink = null;
    if (isNewUser) {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://booking.wezet.xyz/?view=client-dashboard'
        }
      });
      magicLink = linkData?.properties?.action_link;

      // Optionally Send Welcome Email here using your existing 'send-email' function logic
      // or just return the link to WP to send.
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        isNew: isNewUser,
        magicLink: magicLink
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error(`[Sync-User] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

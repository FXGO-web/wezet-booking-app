import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No Authorization header provided" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // 1. Check if the caller is an admin
        const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !caller) {
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid token", details: userError?.message }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Initialize Admin Client (Service Role)
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceRoleKey) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment");
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            serviceRoleKey
        );

        // Robust Admin Check
        const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_app_admin');
        if (adminCheckError) {
            return new Response(JSON.stringify({ error: "Admin check RPC failed", details: adminCheckError.message }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            });
        }

        if (!isAdmin) {
            console.error(`User ${caller.email} (${caller.id}) is not an admin.`);
            return new Response(JSON.stringify({ error: "Unauthorized: You do not have permission to manage team members." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        const { email, password, fullName, role, phone, bio, specialties, status, avatarUrl } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        console.log(`[PROCESS] Creating/Syncing user: ${email} with role: ${role}`);

        // 3. Create or Get the user
        let targetUser;
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || "TempPass123!",
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role || "instructor",
            },
        });

        if (createError) {
            // Check if user already exists
            if (createError.message.includes("already has been registered") || createError.status === 422) {
                console.log(`[INFO] User ${email} already exists in Auth. Looking up profile.`);
                const { data: existingProfile, error: profileError } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("email", email)
                    .maybeSingle();

                if (profileError) {
                    throw new Error(`Error looking up existing profile: ${profileError.message}`);
                }

                if (!existingProfile) {
                    // This happens if Auth user exists but trigger failed or profile was deleted
                    // We can try to list users from Auth directly or handle it
                    console.log(`[WARN] Auth user exists but no profile found for ${email}. Attempting to recover by getting Auth ID.`);
                    // We don't have an easy way to get ID from email in auth.admin without listing (which is slow)
                    // But we can try to "create" again without throwing, or just use the error data if it returns ID
                    throw new Error(`User ${email} exists in Auth but has no profile. Please contact support to sync.`);
                }
                targetUser = { id: existingProfile.id };
            } else {
                console.error("Supabase Auth Create Error:", createError);
                throw createError;
            }
        } else {
            targetUser = newUser.user;
        }

        // 4. Update the profile with extra details
        if (targetUser) {
            console.log(`[UPDATE] Syncing profile for user ${targetUser.id} (${email})`);
            const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({
                    full_name: fullName,
                    role: role || "instructor",
                    phone: phone || null,
                    bio: bio || null,
                    specialties: specialties || [],
                    status: status || "active",
                    avatar_url: avatarUrl || null
                })
                .eq("id", targetUser.id);

            if (updateError) {
                console.error("Error updating profile:", updateError);
                // Return 200 anyway since the user/auth is established/exists
            }
        }

        return new Response(JSON.stringify({ user: targetUser, message: "User synced successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Create/Sync User Error:", error);
        return new Response(JSON.stringify({
            error: error.message || "Unknown error occurred",
            details: error.toString(),
            success: false
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 to allow frontend to read the body easily
        });
    }
});

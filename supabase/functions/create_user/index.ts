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
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // 1. Check if the caller is an admin
        const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !caller) throw new Error("Unauthorized: Invalid token");

        // Initialize Admin Client (Service Role)
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            serviceRoleKey ?? ""
        );

        // Robust Admin Check
        const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('is_app_admin');
        if (adminCheckError || !isAdmin) {
            console.error("Admin check failed or user not admin:", adminCheckError);
            throw new Error("Unauthorized: Professional access required.");
        }

        const { email, password, fullName, role, phone, bio, specialties, status, avatarUrl } = await req.json();

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
            if (createError.message.includes("already has been registered") || createError.status === 422) {
                console.log(`[INFO] User ${email} already exists. Attempting to update existing profile.`);
                // Get existing user ID
                const { data: existingUsers, error: listError } = await supabaseAdmin.from("profiles").select("id").eq("email", email).single();
                if (listError || !existingUsers) {
                    console.error("Could not find existing user profile for email:", email);
                    throw new Error(`User exists in Auth but no profile found: ${email}`);
                }
                targetUser = { id: existingUsers.id };
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
                // We keep going as the primary goal (auth user) is done or exists
            }
        }

        return new Response(JSON.stringify({ user: targetUser, message: "User synced successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Create/Sync User Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

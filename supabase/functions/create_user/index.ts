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
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized: Invalid token");

        // 2. Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw new Error("Failed to fetch admin profile");
        }

        if (profile?.role !== "admin") {
            console.error(`User ${user.id} role is ${profile?.role}, expected admin`);
            throw new Error("Forbidden: Only admins can create users");
        }

        const { email, password, fullName, role, phone, bio, specialties, status, avatarUrl } = await req.json();

        if (!email) throw new Error("Email is required");

        // 3. Create the user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || "TempPass123!", // Default temp password if none provided
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role || "instructor",
            },
        });

        if (createError) throw createError;

        // 4. Update the profile with extra details
        // The trigger 'on_auth_user_created' usually creates the profile row, 
        // but we want to update it immediately with bio, phone, etc.
        if (newUser.user) {
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
                .eq("id", newUser.user.id);

            if (updateError) {
                console.error("Error updating profile:", updateError);
                // Don't throw here, the user is created, just return the user
            }
        }

        console.error(`[INFO] Returning successful response for new user ${newUser.user?.id}.`);
        return new Response(JSON.stringify(newUser), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Create User Error:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

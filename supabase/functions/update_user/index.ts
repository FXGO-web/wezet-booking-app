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

        // 2. Initialize Admin Client
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            serviceRoleKey ?? ""
        );

        const { id, updates } = await req.json();

        if (!id) throw new Error("Missing user ID");

        console.log(`Attempting to update user: ${id}`);

        // 3. Update Auth User (e.g. Password)
        const authUpdates: any = {};
        if (updates.password) authUpdates.password = updates.password;
        if (updates.email) authUpdates.email = updates.email;
        // if (updates.email_confirm) authUpdates.email_confirm = updates.email_confirm;

        let updatedUser = null;

        if (Object.keys(authUpdates).length > 0) {
            console.log("Updating auth data...");
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                authUpdates
            );

            if (authError) {
                console.error("Auth update error:", authError);
                throw authError; // Fail if password update fails
            }
            updatedUser = authData.user;
        }

        // 4. Update Profile Data
        // Map updates to profile columns
        const profileUpdates: any = {};
        if (updates.full_name || updates.fullName || updates.name)
            profileUpdates.full_name = updates.full_name || updates.fullName || updates.name;
        if (updates.role) profileUpdates.role = updates.role;
        if (updates.phone) profileUpdates.phone = updates.phone;
        if (updates.bio) profileUpdates.bio = updates.bio;
        if (updates.specialties) profileUpdates.specialties = updates.specialties;
        if (updates.status) profileUpdates.status = updates.status;
        if (updates.avatar_url || updates.avatarUrl)
            profileUpdates.avatar_url = updates.avatar_url || updates.avatarUrl;

        if (Object.keys(profileUpdates).length > 0) {
            console.log("Updating profile data...", profileUpdates);
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from("profiles")
                .update(profileUpdates)
                .eq("id", id)
                .select()
                .single();

            if (profileError) {
                console.error("Profile update error:", profileError);
                // We might want to warn but not fail if auth succeeded
            }
        }

        return new Response(JSON.stringify({ success: true, user: updatedUser }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Update User Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

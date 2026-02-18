-- Migration to make is_app_admin case-insensitive for role checks
-- This prevents RLS failures if roles are capitalized (e.g., 'Admin' instead of 'admin')

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    -- Hardcoded UUID for Hanna
    auth.uid() = 'd9a4458e-ad5b-48e3-b8d0-a827a048cf68'::uuid OR
    -- Fallback to email from JWT (case-insensitive)
    (auth.jwt() ->> 'email') ILIKE 'hanna@wezet.xyz' OR
    (auth.jwt() ->> 'email') ILIKE 'pakosub@gmail.com' OR
    -- Fallback to role check (case-insensitive)
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND LOWER(role) = 'admin'
    );
$$;

-- Ensure execution permissions
GRANT EXECUTE ON FUNCTION public.is_app_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin TO service_role;

-- Force schema refresh notification
NOTIFY pgrst, 'reload schema';

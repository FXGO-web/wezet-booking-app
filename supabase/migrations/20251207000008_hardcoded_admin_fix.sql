-- EMERGENCY FIX: Hardcode Hanna's UUID
-- ID from logs: d9a4458e-ad5b-48e3-b8d0-a827a048cf68

-- 1. Create a super simple admin check that needs NO table access
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    -- Hardcoded UUID for Hanna
    auth.uid() = 'd9a4458e-ad5b-48e3-b8d0-a827a048cf68'::uuid OR
    -- Fallback to email from JWT
    (auth.jwt() ->> 'email') ILIKE 'hanna@wezet.xyz' OR
    (auth.jwt() ->> 'email') ILIKE 'pakosub@gmail.com' OR
    -- Fallback to role check (if it works)
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. Force PublicProfiles role update just in case
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'd9a4458e-ad5b-48e3-b8d0-a827a048cf68';

-- 3. Re-Create Policies with this new function
DROP POLICY IF EXISTS "Admins can manage all availability_exceptions" ON public.availability_exceptions;
CREATE POLICY "Admins can manage all availability_exceptions"
ON public.availability_exceptions
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

DROP POLICY IF EXISTS "Admins can manage all availability_rules" ON public.availability_rules;
CREATE POLICY "Admins can manage all availability_rules"
ON public.availability_rules
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

DROP POLICY IF EXISTS "Admins can manage all session_templates" ON public.session_templates;
CREATE POLICY "Admins can manage all session_templates"
ON public.session_templates
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

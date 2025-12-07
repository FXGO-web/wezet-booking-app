-- EMERGENCY FIX: Explicitly allow known admins by email in RLS policies
-- This bypasses any issues with the 'role' column or is_admin() function logic.

-- 1. Create helper to check email (more robust than role for now)
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.jwt() ->> 'email' ILIKE 'pakosub@gmail.com' OR
    auth.jwt() ->> 'email' ILIKE 'hanna@wezet.xyz' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 2. Update Availability Exceptions Policy
DROP POLICY IF EXISTS "Admins can manage all availability_exceptions" ON public.availability_exceptions;

CREATE POLICY "Admins can manage all availability_exceptions"
ON public.availability_exceptions
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

-- 3. Update Availability Rules Policy
DROP POLICY IF EXISTS "Admins can manage all availability_rules" ON public.availability_rules;

CREATE POLICY "Admins can manage all availability_rules"
ON public.availability_rules
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

-- 4. Update Session Templates Policy (Just to be safe)
DROP POLICY IF EXISTS "Admins can manage all session_templates" ON public.session_templates;

CREATE POLICY "Admins can manage all session_templates"
ON public.session_templates
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

-- 5. Force update Hanna's role again (ignoring case)
UPDATE public.profiles
SET role = 'admin'
WHERE email ILIKE 'hanna@wezet.xyz';

-- 1. Robust is_app_admin function
-- Accesses auth.users directly to be authoritative.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_role text;
BEGIN
  -- Get email from auth.users (requires security definer)
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check whitelist
  IF v_email ILIKE 'pakosub@gmail.com' OR v_email ILIKE 'hanna@wezet.xyz' THEN
    RETURN true;
  END IF;

  -- Check DB role
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_app_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin TO service_role;

-- 2. Force refresh schema cache (Supabase internal/trick)
NOTIFY pgrst, 'reload schema';

-- 3. Just to be absolutely sure, re-run policy drops/creates for avail tables
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

-- 4. Session Templates too
DROP POLICY IF EXISTS "Admins can manage all session_templates" ON public.session_templates;
CREATE POLICY "Admins can manage all session_templates"
ON public.session_templates
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

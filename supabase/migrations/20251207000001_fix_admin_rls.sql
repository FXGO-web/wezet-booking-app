-- 1. Ensure the user is an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'pakosub@gmail.com';

-- 2. Update RLS for session_templates
DROP POLICY IF EXISTS "Admins can manage all session_templates" ON public.session_templates;

CREATE POLICY "Admins can manage all session_templates"
ON public.session_templates
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 3. Update RLS for sessions
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.sessions;

CREATE POLICY "Admins can manage all sessions"
ON public.sessions
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 4. Update RLS for availability_rules
DROP POLICY IF EXISTS "Admins can manage all availability_rules" ON public.availability_rules;

CREATE POLICY "Admins can manage all availability_rules"
ON public.availability_rules
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 5. Update RLS for availability_exceptions
DROP POLICY IF EXISTS "Admins can manage all availability_exceptions" ON public.availability_exceptions;

CREATE POLICY "Admins can manage all availability_exceptions"
ON public.availability_exceptions
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

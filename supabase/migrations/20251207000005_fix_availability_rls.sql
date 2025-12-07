-- 1. Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Fix Data: Ensure hanna@wezet.xyz is an admin (or at least instructor)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'hanna@wezet.xyz';

-- 3. Fix Availability Exceptions RLS
-- Drop potentially conflicting policies first
DROP POLICY IF EXISTS "Admins can manage all availability_exceptions" ON public.availability_exceptions;
DROP POLICY IF EXISTS "availability_exceptions_manage_own" ON public.availability_exceptions;

-- Re-create Admin policy using the new function
CREATE POLICY "Admins can manage all availability_exceptions"
ON public.availability_exceptions
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- Re-create Instructor policy (manage own)
CREATE POLICY "Instructors can manage own availability_exceptions"
ON public.availability_exceptions
FOR ALL
TO authenticated
USING ( auth.uid() = instructor_id )
WITH CHECK ( auth.uid() = instructor_id );

-- 4. Fix Availability Rules RLS (Just in case)
DROP POLICY IF EXISTS "Admins can manage all availability_rules" ON public.availability_rules;
DROP POLICY IF EXISTS "availability_rules_manage_own" ON public.availability_rules;

CREATE POLICY "Admins can manage all availability_rules"
ON public.availability_rules
FOR ALL
TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

CREATE POLICY "Instructors can manage own availability_rules"
ON public.availability_rules
FOR ALL
TO authenticated
USING ( auth.uid() = instructor_id )
WITH CHECK ( auth.uid() = instructor_id );

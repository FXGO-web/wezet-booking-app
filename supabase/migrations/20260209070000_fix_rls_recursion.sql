-- Create a function to check if a user is an admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (LOWER(role) = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies (All of them to be safe)
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Re-create robust policies for profiles
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (is_admin());

-- 4. Fix session_templates visibility using the new function
DROP POLICY IF EXISTS "Anyone can view active services" ON public.session_templates;
DROP POLICY IF EXISTS "Admins can manage services" ON public.session_templates;

CREATE POLICY "Anyone can view active services"
ON public.session_templates
FOR SELECT
TO authenticated, anon
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage services"
ON public.session_templates
FOR ALL
TO authenticated
USING (is_admin());

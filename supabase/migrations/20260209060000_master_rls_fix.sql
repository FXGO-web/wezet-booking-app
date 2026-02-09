-- 1. Normalize all roles again to be absolutely sure
UPDATE public.profiles SET role = LOWER(role) WHERE role IS NOT NULL;

-- 2. Drop EVERYTHING on profiles to start fresh
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Any authenticated user can view profiles" ON public.profiles;
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
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin'
  )
);

-- 4. Fix session_templates visibility for Admins
DROP POLICY IF EXISTS "Anyone can view active services" ON public.session_templates;
DROP POLICY IF EXISTS "Admins can manage services" ON public.session_templates;

CREATE POLICY "Anyone can view active services"
ON public.session_templates
FOR SELECT
TO authenticated, anon
USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin'
));

CREATE POLICY "Admins can manage services"
ON public.session_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND LOWER(role) = 'admin'
  )
);

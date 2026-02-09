-- Update is_admin to use JWT metadata for zero-recursion and high performance
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
  -- Checks role in JWT metadata. This is populated by Supabase Auth.
  -- Sync-user Edge Function ensures this metadata is set.
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql STABLE;

-- 1. Normalize all roles again
UPDATE public.profiles SET role = LOWER(role) WHERE role IS NOT NULL;

-- 2. Drop all policies on profiles to start fresh
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Any authenticated user can view profiles" ON public.profiles;

-- 3. Re-create robust policies for profiles
-- READ: Anyone authenticated can see the directory
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Users can edit themselves
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ADMIN: Full access via JWT check (super fast, no recursion)
CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (is_admin());

-- 4. Fix session_templates visibility
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

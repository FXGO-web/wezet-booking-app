
-- 1. Create the high-performance is_admin function (JWT-based)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
  -- NO TABLE QUERIES HERE. Pure JWT metadata check.
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin';
$$ LANGUAGE sql STABLE;

-- 2. NUCLEAR DROP: Delete every policy we've ever named on all tables
-- Table: profiles
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Any authenticated user can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Table: session_templates
DROP POLICY IF EXISTS "Anyone can view active services" ON public.session_templates;
DROP POLICY IF EXISTS "Admins can manage services" ON public.session_templates;
DROP POLICY IF EXISTS "Public templates are viewable" ON public.session_templates;

-- Table: bookings (Just in case)
DROP POLICY IF EXISTS "Admins can see all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can see own bookings" ON public.bookings;

-- 3. RE-BUILD CLEAN (Zero Recursion)

-- PROFILES
CREATE POLICY "RLS_PROFILES_SELECT_v3" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "RLS_PROFILES_UPDATE_v3" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "RLS_PROFILES_ALL_ADMIN_v3" ON public.profiles FOR ALL TO authenticated USING (is_admin());

-- SESSION TEMPLATES
CREATE POLICY "RLS_SESSIONS_SELECT_v3" ON public.session_templates FOR SELECT TO authenticated, anon USING (is_active = true OR is_admin());
CREATE POLICY "RLS_SESSIONS_ALL_ADMIN_v3" ON public.session_templates FOR ALL TO authenticated USING (is_admin());

-- BOOKINGS
CREATE POLICY "RLS_BOOKINGS_SELECT_v3" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id OR is_admin());
CREATE POLICY "RLS_BOOKINGS_ALL_ADMIN_v3" ON public.bookings FOR ALL TO authenticated USING (is_admin());

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

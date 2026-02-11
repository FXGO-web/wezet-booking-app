-- Redefine is_admin to be robust: Fast whitelist check + JWT role check.
-- This avoids recursion because it doesn't query public.profiles.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
  SELECT 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin' OR
    (auth.jwt() ->> 'email') = 'hanna@wezet.xyz' OR
    (auth.jwt() ->> 'email') = 'fx@fxcreativestudio.com' OR
    (auth.jwt() ->> 'email') = 'pakosub@gmail.com';
$$ LANGUAGE sql STABLE;

-- Ensure cache is refreshed
NOTIFY pgrst, 'reload schema';

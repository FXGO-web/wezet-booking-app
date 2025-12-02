-- Drop potentially problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow all authenticated users to view all profiles (Simplest fix to unblock)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure your user is definitely an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'contact@mroffbeat.com';

-- Repairs the specific user 'copake3059@dnsclick.com' if missing from profiles
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  'client', 
  'active'
FROM auth.users
WHERE email = 'copake3059@dnsclick.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'client',
  status = 'active';

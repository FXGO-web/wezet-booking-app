-- Create function to check if user exists (for better UI feedback)
CREATE OR REPLACE FUNCTION public.check_user_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE email = email_to_check
  ) OR EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
END;
$$;

-- Grant access to everyone (including unauthenticated users)
GRANT EXECUTE ON FUNCTION public.check_user_exists(text) TO anon, authenticated;

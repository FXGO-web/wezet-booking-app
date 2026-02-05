-- Add fx@fxcreativestudio.com to the admin whitelist
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_role text;
BEGIN
  -- Get email from auth.users (requires security definer)
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check whitelist
  IF v_email ILIKE 'pakosub@gmail.com' 
     OR v_email ILIKE 'hanna@wezet.xyz' 
     OR v_email ILIKE 'fx@fxcreativestudio.com' THEN
    RETURN true;
  END IF;

  -- Check DB role
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

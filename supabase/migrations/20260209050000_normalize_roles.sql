-- Normalize all roles to lowercase
UPDATE public.profiles
SET role = LOWER(role);

-- Add a constraint or trigger in the future if needed, 
-- but for now, just a clean sweep.

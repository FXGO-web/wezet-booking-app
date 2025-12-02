-- Try to update Hanna to admin directly
UPDATE public.profiles
SET role = 'admin'
WHERE full_name ILIKE '%hanna%' OR email ILIKE '%hanna%';

-- Try to update Sazseline to teacher
UPDATE public.profiles
SET role = 'teacher'
WHERE full_name ILIKE '%sazseline%' OR email ILIKE '%sazseline%';

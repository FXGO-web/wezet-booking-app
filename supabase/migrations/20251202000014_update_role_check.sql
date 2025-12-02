-- Update role check constraint to allow more roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'Admin',
  'instructor', 'Instructor',
  'client', 'Client',
  'teacher', 'Teacher',
  'facilitator', 'Facilitator',
  'team member', 'Team Member',
  'subscriber', 'Subscriber',
  'founder & ceo wezet'
));

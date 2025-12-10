-- Ensure essential categories exist and apply to sessions
INSERT INTO public.categories (name, slug, applies_to)
VALUES 
  ('Breathwork', 'breathwork', 'all'),
  ('Bodywork', 'bodywork', 'all'),
  ('Coaching', 'coaching', 'all'),
  ('Classes', 'classes', 'session') -- Assuming user saw this, ensuring it stays if needed, or maybe it was a misnamed one
ON CONFLICT (slug) DO UPDATE
SET applies_to = 'all';

-- Also ensure Retreats and Education exist for programs
INSERT INTO public.categories (name, slug, applies_to)
VALUES
  ('Retreats', 'retreats', 'all'),
  ('Education', 'education', 'all')
ON CONFLICT (slug) DO UPDATE
SET applies_to = 'all';

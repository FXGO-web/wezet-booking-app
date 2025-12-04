-- Seed categories
INSERT INTO public.categories (name, slug, applies_to, description)
VALUES
  ('Retreats', 'retreats', 'program', 'Multi-day retreats'),
  ('Education', 'education', 'program', 'Educational courses and trainings'),
  ('Classes', 'classes', 'session', 'Group classes'),
  ('Coaching', 'coaching', 'session', 'One-on-one coaching sessions'),
  ('Products', 'products', 'product', 'Digital or physical products')
ON CONFLICT (slug) DO NOTHING;

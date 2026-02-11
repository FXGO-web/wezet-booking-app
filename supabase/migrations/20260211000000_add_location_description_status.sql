-- Add description and status columns to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Re-apply RLS policies just in case or ensure we notifying PostgREST
NOTIFY pgrst, 'reload schema';

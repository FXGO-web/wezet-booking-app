-- Add type column to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS type text DEFAULT 'in-person';

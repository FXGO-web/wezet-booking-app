-- Add capacity column to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS capacity int;

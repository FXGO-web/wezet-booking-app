-- Add start_date and end_date to session_templates for programs/retreats
ALTER TABLE public.session_templates
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date;

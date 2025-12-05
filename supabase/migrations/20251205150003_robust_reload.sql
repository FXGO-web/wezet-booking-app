-- Ensure column exists (idempotent)
ALTER TABLE public.session_templates 
ADD COLUMN IF NOT EXISTS fixed_prices jsonb DEFAULT '{"EUR": 0, "DKK": 0}'::jsonb;

-- Force schema cache reload with both known payloads
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Touch the table to force a schema change event that PostgREST definitely sees
COMMENT ON TABLE public.session_templates IS 'Session Templates (Schema Reloaded)';

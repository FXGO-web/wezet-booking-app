-- improved force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Add a comment to the column to trigger a DDL event
COMMENT ON COLUMN public.session_templates.fixed_prices IS 'Stores fixed prices for EUR and DKK';

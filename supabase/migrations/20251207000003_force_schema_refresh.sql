-- 1. Explicitly notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- 2. Execute a DDL statement to force a cache invalidation
-- Changing a comment is a safe DDL operation that triggers a schema refresh
COMMENT ON TABLE public.session_templates IS 'Session templates for classes and services (Refreshed)';

-- 3. Safety check: Ensure the column actually exists
ALTER TABLE public.session_templates 
ADD COLUMN IF NOT EXISTS fixed_prices jsonb DEFAULT '{"EUR": 0, "DKK": 0}'::jsonb;

-- 4. Grant update permission on the column specifically (usually covered by table grant, but to be sure)
GRANT UPDATE (fixed_prices) ON public.session_templates TO authenticated;

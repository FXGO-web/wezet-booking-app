-- Create a view to easily see all RLS policies
CREATE OR REPLACE VIEW public.rls_audit_view AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public';

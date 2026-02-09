-- Create a diagnostic function to list all policies
CREATE OR REPLACE FUNCTION public.diagnostic_list_policies()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'tablename', tablename,
        'policyname', policyname,
        'roles', roles,
        'cmd', cmd,
        'qual', qual,
        'with_check', with_check
    )) INTO result
    FROM pg_policies
    WHERE schemaname = 'public';
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

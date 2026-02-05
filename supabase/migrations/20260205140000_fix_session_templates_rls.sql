-- Fix RLS for session_templates to ensure admins can insert/update/delete
-- Re-applying the policy just in case it was lost or configured incorrectly.

-- Explicitly ensure the table has RLS enabled (idempotent)
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;

-- Drop existning policy to avoid conflicts or duplicates
DROP POLICY IF EXISTS "Admins can manage all session_templates" ON public.session_templates;

-- Create the comprehensive policy for admins
CREATE POLICY "Admins can manage all session_templates"
ON public.session_templates
FOR ALL
TO authenticated
USING ( public.is_app_admin() )
WITH CHECK ( public.is_app_admin() );

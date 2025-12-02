-- 1. Drop the restrictive service-role only policy
DROP POLICY IF EXISTS platform_settings_write_service_role ON public.platform_settings;

-- 2. Create a new policy allowing Admins to update settings directly
CREATE POLICY platform_settings_update_admin
ON public.platform_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Ensure Read is still public (it should be, but reinforcing)
DROP POLICY IF EXISTS platform_settings_read_all ON public.platform_settings;
CREATE POLICY platform_settings_read_all
ON public.platform_settings
FOR SELECT
USING (true);

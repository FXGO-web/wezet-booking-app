-- Allow admins to insert into bundle_purchases (assign bundles to users)
CREATE POLICY "Admins can assign bundles (insert)" ON public.bundle_purchases
    FOR INSERT
    WITH CHECK (public.is_admin());

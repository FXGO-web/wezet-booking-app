-- Migration to clean up test bookings for javigaoses@gmail.com
-- This will remove all bookings associated with this email to reset the client dashboard view.

DELETE FROM public.bookings
USING public.profiles
WHERE public.bookings.customer_id = public.profiles.id
AND public.profiles.email = 'javigaoses@gmail.com';

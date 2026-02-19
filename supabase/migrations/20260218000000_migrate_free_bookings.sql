-- Migrate all existing free sessions (price 0 or null) that are currently 'pending' to 'confirmed'
UPDATE public.bookings
SET status = 'confirmed'
WHERE (price = 0 OR price IS NULL) 
  AND status = 'pending';

-- Also check for bookings that used a bundle code but are still pending
-- This is harder to check directly in SQL without looking at notes, 
-- but we can safely target 0€ bookings as they should all be confirmed.

-- Verify the changes
SELECT id, customer_id, price, status, created_at
FROM public.bookings
WHERE status = 'confirmed'
ORDER BY created_at DESC
LIMIT 10;

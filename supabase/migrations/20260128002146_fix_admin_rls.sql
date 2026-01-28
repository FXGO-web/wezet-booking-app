-- 1. Enable Admins to VIEW ALL BOOKINGS
-- This policy allows any user with role 'admin' (or 'Admin') to see all rows in 'bookings' table.
create policy "Admins can view all bookings"
on bookings for select
to authenticated
using (
  auth.uid() in (
    select id from profiles where role ilike 'admin'
  )
);

-- 2. Enable Admins to VIEW ALL SESSIONS
-- Bookings depend on Sessions, so Admins need to see them too.
create policy "Admins can view all sessions"
on sessions for select
to authenticated
using (
  auth.uid() in (
    select id from profiles where role ilike 'admin'
  )
);

-- 3. Enable Admins to VIEW ALL PRODUCTS (Digital Content)
create policy "Admins can view all products"
on products for select
to authenticated
using (
  auth.uid() in (
    select id from profiles where role ilike 'admin'
  )
);

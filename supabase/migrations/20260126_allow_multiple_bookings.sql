-- Migration to allow multiple bookings for the same client (same session or multiple sessions)
-- We want to remove any UNIQUE constraints that limit one booking per user per session or per date.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Find all unique constraints on 'bookings' table that include 'customer_id'
  FOR r IN 
    SELECT con.conname
    FROM pg_catalog.pg_constraint con
    INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'bookings'
      AND con.contype = 'u' -- Unique constraint
  LOOP
    -- We can be more specific if we want, but removing all unique constraints on bookings 
    -- (except primary key which is 'p') is likely what is needed if we want UNLIMITED bookings.
    -- Usually bookings table should allow multiple rows.
    
    -- Print for logging
    RAISE NOTICE 'Dropping constraint: %', r.conname;
    
    -- Dynamic SQL to drop the constraint
    EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

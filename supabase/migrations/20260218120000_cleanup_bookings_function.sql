-- Create a function to delete abandoned pending bookings
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_bookings()
RETURNS void AS $$
BEGIN
    DELETE FROM public.bookings
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '30 minutes';
    
    -- Optional: Log the cleanup if you have a logs table, 
    -- but for most cases, simple deletion is enough.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In a real Supabase environment, you would typically use pg_cron 
-- or a scheduled Edge Function call. 
-- Since I don't have direct access to enable pg_cron, 
-- I will provide the SQL to the user to run in their Dashboard,
-- or implement a "check-and-cleanup" logic in the get_month_calendar function 
-- to ensure the DB stays clean whenever availability is requested.

-- Let's also add a trigger-like approach if we want it even more automated, 
-- but a daily/hourly cleanup is usually better.

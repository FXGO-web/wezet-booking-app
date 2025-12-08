-- Re-create the function to ensure it exists and cache is refreshed
DROP FUNCTION IF EXISTS public.create_booking_from_template;

CREATE OR REPLACE FUNCTION public.create_booking_from_template(
  p_template_id UUID,
  p_start_time TIMESTAMPTZ,
  p_customer_id UUID,
  p_status TEXT DEFAULT 'confirmed',
  p_price NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT 'EUR',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Best practice for security definers
AS $$
DECLARE
  v_session_id UUID;
  v_template RECORD;
  v_end_time TIMESTAMPTZ;
  v_booking_id UUID;
  v_booking_data JSONB;
BEGIN
  -- 1. Get template details
  SELECT * INTO v_template FROM public.session_templates WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session template not found';
  END IF;

  -- 2. Calculate end time
  v_end_time := p_start_time + (v_template.duration_minutes || ' minutes')::INTERVAL;

  -- 3. Find or Create Session
  SELECT id INTO v_session_id
  FROM public.sessions
  WHERE session_template_id = p_template_id
    AND start_time = p_start_time;

  IF v_session_id IS NULL THEN
    INSERT INTO public.sessions (
      session_template_id,
      instructor_id,
      location_id,
      category_id,
      start_time,
      end_time,
      capacity,
      status
    ) VALUES (
      p_template_id,
      v_template.instructor_id,
      v_template.location_id,
      v_template.category_id,
      p_start_time,
      v_end_time,
      v_template.capacity,
      'scheduled'
    ) RETURNING id INTO v_session_id;
  END IF;

  -- 4. Create Booking
  INSERT INTO public.bookings (
    session_id,
    customer_id,
    status,
    price,
    currency,
    notes
  ) VALUES (
    v_session_id,
    p_customer_id,
    p_status,
    p_price,
    p_currency,
    p_notes
  ) RETURNING id INTO v_booking_id;

  -- 5. Return Booking Data
  SELECT to_jsonb(b) INTO v_booking_data FROM public.bookings b WHERE id = v_booking_id;
  
  RETURN v_booking_data;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.create_booking_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_from_template TO admin;
GRANT EXECUTE ON FUNCTION public.create_booking_from_template TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_from_template TO anon; -- fallback

-- Notify schema reload again
NOTIFY pgrst, 'reload schema';

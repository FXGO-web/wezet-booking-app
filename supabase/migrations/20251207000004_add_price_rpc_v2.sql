-- Create a NEW v2 function to ensure no cache collisions
CREATE OR REPLACE FUNCTION public.update_session_prices_v2(p_id uuid, p_fixed_prices jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.session_templates
  SET fixed_prices = p_fixed_prices
  WHERE id = p_id;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.update_session_prices_v2(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_prices_v2(uuid, jsonb) TO service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

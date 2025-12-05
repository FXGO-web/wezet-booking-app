-- RPC function to update fixed_prices, bypassing table schema cache issues
create or replace function update_fixed_prices(p_id uuid, p_fixed_prices jsonb)
returns void
language plpgsql
as $$
begin
  update public.session_templates
  set fixed_prices = p_fixed_prices
  where id = p_id;
end;
$$;

NOTIFY pgrst, 'reload schema';

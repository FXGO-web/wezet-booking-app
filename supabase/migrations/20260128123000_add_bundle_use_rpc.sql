-- RPC function to deduct a credit from a bundle purchase
-- Returns JSON with success/error

create or replace function use_bundle_credit(p_purchase_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_remaining int;
  v_updated boolean;
begin
  -- Check if purchase exists and has credits
  select remaining_credits into v_remaining
  from bundle_purchases
  where id = p_purchase_id;

  if v_remaining is null then
    return json_build_object('success', false, 'message', 'Bundle purchase not found');
  end if;

  if v_remaining <= 0 then
    return json_build_object('success', false, 'message', 'No credits remaining');
  end if;

  -- Deduct credit
  update bundle_purchases
  set remaining_credits = remaining_credits - 1,
      updated_at = now()
  where id = p_purchase_id
  and remaining_credits > 0;

  if found then
    return json_build_object('success', true, 'remaining', v_remaining - 1);
  else
    return json_build_object('success', false, 'message', 'Failed to deduct credit');
  end if;
end;
$$;

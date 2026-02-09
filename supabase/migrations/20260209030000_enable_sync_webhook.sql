-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net with schema extensions;

-- Create Trigger Function to call Edge Function
create or replace function public.trigger_sync_user()
returns trigger
language plpgsql
security definer
as $$
declare
  -- PROJECT CONFIGURATION (Extracted from existing setup)
  -- Project Ref: aadzzhdouuxkvelxyoyf
  url text := 'https://aadzzhdouuxkvelxyoyf.supabase.co/functions/v1/sync-to-wordpress';
  -- Service Key for internal authorization (passed to Edge Function)
  -- Note: In a real production env, this should be in a vault, but we follow existing patterns here.
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI';
  payload jsonb;
begin
  -- Construct Payload
  payload := jsonb_build_object(
    'record', row_to_json(new)
  );

  -- Perform Async HTTP POST request via pg_net
  perform
    net.http_post(
      url := url,
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      )
    );

  return new;
end;
$$;

-- Create Trigger on Profiles Table
drop trigger if exists on_profile_sync on public.profiles;
create trigger on_profile_sync
  after insert or update
  on public.profiles
  for each row
  execute procedure public.trigger_sync_user();

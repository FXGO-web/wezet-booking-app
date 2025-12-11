
alter table public.platform_settings
add column if not exists resend_api_key text;

-- Security note: This key is readable by anyone who can read settingsAPI.get (currently public/anon in api.ts)
-- We rely on this for the Prototype phase.

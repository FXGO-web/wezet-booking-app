-- Force schema cache reload to recognize fixed_prices column
alter table public.session_templates add column if not exists _cache_buster int;
alter table public.session_templates drop column if exists _cache_buster;

-- Also try the notify method just in case
NOTIFY pgrst, 'reload config';

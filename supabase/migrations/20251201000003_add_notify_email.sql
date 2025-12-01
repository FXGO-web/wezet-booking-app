-- Add notify_email column to platform_settings
alter table public.platform_settings 
add column if not exists notify_email text default 'admin@wezet.com';

-- Ensure the singleton row exists (just in case)
insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

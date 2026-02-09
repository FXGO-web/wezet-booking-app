-- Add created_at column to profiles if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at') then
        alter table public.profiles add column created_at timestamptz default now();
    end if;
end $$;

-- Ensure it's not null for existing records (already handled by default now(), but good to be safe)
update public.profiles set created_at = now() where created_at is null;

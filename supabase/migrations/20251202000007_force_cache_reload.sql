-- Force schema cache reload by altering the table
alter table public.profiles add column if not exists _cache_buster int;
alter table public.profiles drop column if exists _cache_buster;

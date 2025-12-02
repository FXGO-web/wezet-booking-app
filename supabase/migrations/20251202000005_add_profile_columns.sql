alter table public.profiles 
add column if not exists phone text,
add column if not exists specialties text[],
add column if not exists status text default 'active';

-- Update is_admin to be case-insensitive just in case
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and lower(role) = 'admin'
  );
$$;

-- Allow admins to insert locations
create policy "Admins can insert locations"
on public.locations
for insert
to authenticated
with check (
  public.is_admin()
);

-- Allow admins to update locations
create policy "Admins can update locations"
on public.locations
for update
to authenticated
using (
  public.is_admin()
);

-- Allow admins to delete locations
create policy "Admins can delete locations"
on public.locations
for delete
to authenticated
using (
  public.is_admin()
);

-- Allow admins to insert categories
create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (
  public.is_admin()
);

-- Allow admins to update categories
create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (
  public.is_admin()
);

-- Allow admins to delete categories
create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (
  public.is_admin()
);

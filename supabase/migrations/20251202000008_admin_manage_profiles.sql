-- Create is_admin function for RLS policies
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- Allow admins to insert into profiles table
create policy "Admins can insert any profile"
on public.profiles
for insert
to authenticated
with check (
  public.is_admin()
);

-- Ensure admins can also update any profile
create policy "Admins can update any profile"
on public.profiles
for update
to authenticated
using (
  public.is_admin()
);

-- Ensure admins can delete any profile
create policy "Admins can delete any profile"
on public.profiles
for delete
to authenticated
using (
  public.is_admin()
);

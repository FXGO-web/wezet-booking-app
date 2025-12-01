-- Fix RLS for session_templates
drop policy if exists session_templates_manage_own on public.session_templates;

create policy "Admins can manage all session_templates"
  on public.session_templates
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Instructors can manage own session_templates"
  on public.session_templates
  for all
  using ( auth.uid() = instructor_id )
  with check ( auth.uid() = instructor_id );

-- Fix RLS for sessions (was missing write policies)
create policy "Admins can manage all sessions"
  on public.sessions
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Instructors can manage own sessions"
  on public.sessions
  for all
  using ( auth.uid() = instructor_id )
  with check ( auth.uid() = instructor_id );

-- Fix RLS for availability_rules
drop policy if exists availability_rules_manage_own on public.availability_rules;

create policy "Admins can manage all availability_rules"
  on public.availability_rules
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Instructors can manage own availability_rules"
  on public.availability_rules
  for all
  using ( auth.uid() = instructor_id )
  with check ( auth.uid() = instructor_id );

-- Fix RLS for availability_exceptions
drop policy if exists availability_exceptions_manage_own on public.availability_exceptions;

create policy "Admins can manage all availability_exceptions"
  on public.availability_exceptions
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Instructors can manage own availability_exceptions"
  on public.availability_exceptions
  for all
  using ( auth.uid() = instructor_id )
  with check ( auth.uid() = instructor_id );

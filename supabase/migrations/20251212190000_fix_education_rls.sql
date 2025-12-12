-- Migration: Fix Education RLS
-- Description: Allow public visibility of modules (syllabus) so the dashboard isn't empty for non-enrolled users.

-- 1. Drop the old restrictive policy for modules
drop policy if exists "Enrolled users can view modules" on public.education_modules;

-- 2. Create new permissive policy for modules
-- This allows anyone to seeing the list of modules (titles, descriptions)
create policy "Everyone can view modules" 
on public.education_modules for select 
using (true);

-- 3. (Optional) Ensure lesson visibility remains strict
-- We verify that the previous lesson policy handles the restriction, which it does.
-- "Enrolled users can view lessons" checks for active enrollment.

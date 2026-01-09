-- Migration: Update Education Schema for Resources and Quizzes
-- Description: Adds resources to modules, presentations to lessons, and implements a quiz system.

-- 1. Update education_modules
alter table public.education_modules 
add column if not exists resources jsonb[] default '{}',
add column if not exists request_email text default 'info@wezet.xyz';

-- 2. Update education_lessons
alter table public.education_lessons
add column if not exists presentation_url text,
add column if not exists quiz_id uuid; -- Will reference education_quizzes

-- 3. Create education_quizzes table
create table if not exists public.education_quizzes (
    id uuid default gen_random_uuid() primary key,
    lesson_id uuid references public.education_lessons(id) on delete cascade not null,
    title text,
    questions jsonb not null default '[]'::jsonb, -- Array of { question: string, options: string[], correctAnswerIndex: number }
    passing_score integer default 80, -- percentage
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(lesson_id)
);

-- 4. Create education_quiz_submissions table
create table if not exists public.education_quiz_submissions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    quiz_id uuid references public.education_quizzes(id) on delete cascade not null,
    score integer not null, -- percentage achieved
    is_passed boolean not null,
    answers jsonb, -- array of user choices
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, quiz_id)
);

-- 5. Add Foreign Key to education_lessons (after table creation)
alter table public.education_lessons
drop constraint if exists fk_education_lessons_quiz;

alter table public.education_lessons
add constraint fk_education_lessons_quiz
foreign key (quiz_id) references public.education_quizzes(id) on delete set null;

-- 6. Storage Setup
insert into storage.buckets (id, name, public, file_size_limit)
values ('education', 'education', true, 52428800) -- 50MB limit
on conflict (id) do update set file_size_limit = 52428800;

-- Storage Policies for 'education' bucket
drop policy if exists "Public Access Education" on storage.objects;
create policy "Public Access Education"
  on storage.objects for select
  using ( bucket_id = 'education' );

drop policy if exists "Admins can upload education" on storage.objects;
create policy "Admins can upload education"
  on storage.objects for insert
  to authenticated
  with check ( 
    bucket_id = 'education' 
    and (
      (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or 
      (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
    )
  );

drop policy if exists "Admins can update education" on storage.objects;
create policy "Admins can update education"
  on storage.objects for update
  to authenticated
  using ( 
    bucket_id = 'education' 
    and (
      (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or 
      (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
    )
  );

drop policy if exists "Admins can delete education" on storage.objects;
create policy "Admins can delete education"
  on storage.objects for delete
  to authenticated
  using ( 
    bucket_id = 'education' 
    and (
      (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or 
      (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
    )
  );

-- 7. RLS for new tables
alter table public.education_quizzes enable row level security;
alter table public.education_quiz_submissions enable row level security;

-- Quizzes: Everyone enrolled in the course can view
drop policy if exists "Enrolled users can view quizzes" on public.education_quizzes;
create policy "Enrolled users can view quizzes" 
on public.education_quizzes for select 
using (
    exists (
        select 1 from public.education_lessons l
        join public.education_modules m on m.id = l.module_id
        join public.education_enrollments e on e.course_id = m.course_id
        where l.id = education_quizzes.lesson_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    )
    or
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or 
    (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);

-- Submissions: Users can see/manage their own submissions
drop policy if exists "Users manage own submissions" on public.education_quiz_submissions;
create policy "Users manage own submissions" 
on public.education_quiz_submissions for all 
using (auth.uid() = user_id);

-- Admins: Full access to quizzes
drop policy if exists "Admins full access quizzes" on public.education_quizzes;
create policy "Admins full access quizzes" 
on public.education_quizzes for all 
using (
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or 
    (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);

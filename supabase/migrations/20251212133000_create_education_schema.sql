-- Migration: Create Education Schema
-- Description: Adds tables for the Breathwork Education E-Learning module
-- Author: Antigravity

-- 1. COURSES TABLE
create table if not exists public.education_courses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    description text,
    thumbnail_url text,
    price_eur decimal(10,2),
    price_dkk decimal(10,2),
    is_published boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MODULES TABLE (The 6 Modules)
create table if not exists public.education_modules (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.education_courses(id) on delete cascade not null,
    title text not null, -- e.g. "Module 1 — Foundations"
    description text,
    order_index integer not null, -- 1, 2, 3...
    theme_color text default '#E87C55', -- UI color for the module
    image_url text, -- The vertical artistic card image
    is_locked_by_default boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. LESSONS TABLE (The Curriculum)
create table if not exists public.education_lessons (
    id uuid default gen_random_uuid() primary key,
    module_id uuid references public.education_modules(id) on delete cascade not null,
    title text not null, -- e.g. "1.2 What Breathwork Is"
    description text,
    video_url text, -- Can be Vimeo ID, Youtube ID, or Direct MP4 Link (WordPress)
    video_provider text default 'custom', -- 'vimeo', 'youtube', 'custom' (direct link)
    duration_minutes integer,
    content_markdown text, -- rich text content below video
    order_index integer not null,
    resources jsonb[], -- Array of { title, url, type } for PDFs etc
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ENROLLMENTS (Access Control)
create table if not exists public.education_enrollments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    course_id uuid references public.education_courses(id) on delete cascade not null,
    status text default 'active', -- 'active', 'completed', 'expired'
    enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, course_id)
);

-- 5. PROGRESS (Tracking)
create table if not exists public.education_progress (
    user_id uuid references auth.users(id) on delete cascade not null,
    lesson_id uuid references public.education_lessons(id) on delete cascade not null,
    is_completed boolean default false,
    completed_at timestamp with time zone,
    last_watched_position_seconds integer default 0,
    primary key (user_id, lesson_id)
);

-- ROW LEVEL SECURITY (RLS) policies

-- Enable RLS on all tables
alter table public.education_courses enable row level security;
alter table public.education_modules enable row level security;
alter table public.education_lessons enable row level security;
alter table public.education_enrollments enable row level security;
alter table public.education_progress enable row level security;

-- POLICIES

-- Courses: Everyone can view published courses (for the "Store" view)
create policy "Public courses are viewable by everyone" 
on public.education_courses for select 
using (is_published = true);

-- Enrollments: Users can see their own enrollments
create policy "Users can view own enrollments" 
on public.education_enrollments for select 
using (auth.uid() = user_id);

-- Modules/Lessons: Viewable if user is enrolled in the parent course OR is admin
create policy "Enrolled users can view modules" 
on public.education_modules for select 
using (
    exists (
        select 1 from public.education_enrollments e
        where e.course_id = education_modules.course_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    ) 
    or 
    (select (auth.jwt() ->> 'role') = 'service_role') -- admin/service check equivalent
    or
    (auth.jwt() ->> 'email' ilike '%admin%') -- Simple admin check for now
    or
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com')
    or
    (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);

create policy "Enrolled users can view lessons" 
on public.education_lessons for select 
using (
    exists (
        select 1 from public.education_modules m
        join public.education_enrollments e on e.course_id = m.course_id
        where m.id = education_lessons.module_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    )
    or
    (auth.jwt() ->> 'email' ilike '%admin%')
    or
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com')
    or
    (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);

-- Progress: Users can insert/update their own progress
create policy "Users manage their own progress" 
on public.education_progress for all 
using (auth.uid() = user_id);

-- Admin Access Override (Simplified for development)
-- In production, rely on strict Row Level Security or Service Role
create policy "Admins have full access courses" on public.education_courses for all using (
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);
create policy "Admins have full access modules" on public.education_modules for all using (
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);
create policy "Admins have full access lessons" on public.education_lessons for all using (
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);
create policy "Admins have full access enrollments" on public.education_enrollments for all using (
    (auth.jwt() ->> 'email' = 'contact@mroffbeat.com') or (auth.jwt() ->> 'email' = 'hanna@wezet.xyz')
);

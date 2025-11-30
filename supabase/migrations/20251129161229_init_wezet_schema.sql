--------------------------------------------------------------------------------
-- WEZET CORE SCHEMA - SESSIONS / BOOKINGS / SETTINGS
--------------------------------------------------------------------------------

-- Extensions are already there, no need to recreate them.
-- We'll focus only on application tables.

--------------------------------------------------------------------------------
-- 1. SHARED ENTITIES
--------------------------------------------------------------------------------

-- PROFILES: linked to auth.users (one profile per user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text check (role in ('admin','instructor','client')) default 'client',
  bio text,
  created_at timestamptz default now()
);

-- LOCATIONS: physical/virtual places where sessions/programs happen
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  country text,
  timezone text default 'Europe/Madrid',
  created_at timestamptz default now()
);

-- CATEGORIES: topics (Breathwork, Yoga, Coaching, etc.)
-- applies_to: 'session' | 'program' | 'product' | 'all'
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  applies_to text check (applies_to in ('session','program','product','all')) default 'all',
  description text,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 2. SESSION TEMPLATES & AVAILABILITY
--------------------------------------------------------------------------------

-- SESSION TEMPLATES: reusable definitions for sessions in the calendar
-- session_type = format: 'class_group', 'class_private', 'coaching_1to1', etc.
create table if not exists public.session_templates (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  name text not null,
  description text,
  session_type text check (session_type in (
    'class_group',
    'class_private',
    'coaching_1to1',
    'other'
  )) default 'class_group',
  duration_minutes int not null,
  price numeric(10,2),
  currency text default 'EUR',
  capacity int,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- AVAILABILITY RULES: weekly recurring availability (Mon-Sun)
-- weekday: 0=Sunday, 1=Monday, ... 6=Saturday
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.profiles(id) on delete cascade,
  session_template_id uuid references public.session_templates(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz default now()
);

-- AVAILABILITY EXCEPTIONS: specific dates overrides
-- Can be explicit extra slots or overrides of weekly patterns
create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.profiles(id) on delete cascade,
  session_template_id uuid references public.session_templates(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  location_id uuid references public.locations(id) on delete set null,
  is_available boolean default true, -- if false, acts as a “block” for that range
  created_at timestamptz default now()
);

-- BLOCKED DATES: full-day blocks for instructor
create table if not exists public.availability_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 3. SESSION INSTANCES & BOOKINGS
--------------------------------------------------------------------------------

-- SESSIONS: concrete instances in the calendar (generated from templates)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  session_template_id uuid references public.session_templates(id) on delete cascade,
  instructor_id uuid references public.profiles(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int,
  booked_count int default 0,
  status text check (status in ('scheduled','cancelled','completed')) default 'scheduled',
  created_at timestamptz default now()
);

-- BOOKINGS: user reservations for specific sessions
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  status text check (status in ('pending','confirmed','cancelled','no_show')) default 'confirmed',
  price numeric(10,2),
  currency text default 'EUR',
  notes text,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 4. PLATFORM SETTINGS & NOTIFICATIONS
--------------------------------------------------------------------------------

-- PLATFORM SETTINGS: singleton row (id = 1)
create table if not exists public.platform_settings (
  id int primary key default 1,
  platform_name text default 'WEZET',
  support_email text default 'support@wezet.com',
  timezone text default 'Europe/Madrid',
  default_currency text default 'EUR',
  tax_rate numeric(5,2) default 0,

  min_booking_advance_hours int default 24,
  max_booking_advance_days int default 60,
  cancellation_window_hours int default 48,
  require_approval boolean default false,

  stripe_public_key text,
  stripe_secret_key text,
  stripe_test_mode boolean default true,

  email_template_confirmation text default 'Hi {{client_name}}, your booking is confirmed.',
  email_template_reminder text default 'Reminder: You have a session tomorrow.',
  email_template_cancellation text default 'Your booking has been cancelled.',

  notify_new_bookings boolean default true,
  notify_cancellations boolean default true,
  notify_daily_summary boolean default false
);

-- Ensure singleton row exists
insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

-- NOTIFICATIONS: generic notification center
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text, -- e.g. 'booking_created', 'booking_cancelled', 'system'
  title text not null,
  message text not null,
  created_at timestamptz default now(),
  read boolean default false
);

--------------------------------------------------------------------------------
-- 5. INDEXES
--------------------------------------------------------------------------------

create index if not exists idx_session_templates_instructor
  on public.session_templates (instructor_id);

create index if not exists idx_sessions_start_time
  on public.sessions (start_time);

create index if not exists idx_bookings_customer
  on public.bookings (customer_id);

create index if not exists idx_availability_rules_instructor_weekday
  on public.availability_rules (instructor_id, weekday);

create index if not exists idx_availability_exceptions_instructor_date
  on public.availability_exceptions (instructor_id, date);

create index if not exists idx_blocked_dates_instructor_date
  on public.availability_blocked_dates (instructor_id, date);

--------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (OPEN FOR NOW, CAN BE TIGHTENED LATER)
--------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.session_templates enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.availability_blocked_dates enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;

-- PROFILES: everyone authenticated can select; user can update own profile
create policy profiles_select_all
  on public.profiles
  for select
  using (true);

create policy profiles_update_self
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- SESSION TEMPLATES: open read, instructor can manage own, admin via service_role
create policy session_templates_select_all
  on public.session_templates
  for select
  using (true);

create policy session_templates_manage_own
  on public.session_templates
  for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

-- SESSIONS: open read, instructors see theirs, bookings created via app
create policy sessions_select_all
  on public.sessions
  for select
  using (true);

-- BOOKINGS: clients see their own, instructors see their session bookings
create policy bookings_select_own
  on public.bookings
  for select
  using (
    auth.uid() = customer_id
    or auth.uid() in (
      select instructor_id from public.sessions s where s.id = bookings.session_id
    )
  );

-- Allow inserts from authenticated users (frontend) for now
create policy bookings_insert_any_authenticated
  on public.bookings
  for insert
  with check (auth.role() = 'authenticated');

-- AVAILABILITY: instructors manage their own rules
create policy availability_rules_manage_own
  on public.availability_rules
  for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

create policy availability_exceptions_manage_own
  on public.availability_exceptions
  for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

create policy availability_blocked_manage_own
  on public.availability_blocked_dates
  for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

-- PLATFORM SETTINGS: everyone can read, only service_role (edge functions) can update
create policy platform_settings_read_all
  on public.platform_settings
  for select
  using (true);

create policy platform_settings_write_service_role
  on public.platform_settings
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- NOTIFICATIONS: user reads own notifications only
create policy notifications_read_own
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy notifications_insert_any_authenticated
  on public.notifications
  for insert
  with check (auth.role() = 'authenticated');

-- LOCATIONS & CATEGORIES: open read
create policy locations_select_all
  on public.locations
  for select
  using (true);

create policy categories_select_all
  on public.categories
  for select
  using (true);

-- Add fixed_prices column to session_templates (Sessions & Programs)
alter table public.session_templates 
add column if not exists fixed_prices jsonb default '{"EUR": 0, "DKK": 0}'::jsonb;

-- Migrate existing prices to fixed_prices
update public.session_templates
set fixed_prices = 
  case 
    when currency = 'EUR' then 
      jsonb_build_object('EUR', price, 'DKK', round((price * 7.46)::numeric, 2))
    when currency = 'DKK' then 
      jsonb_build_object('DKK', price, 'EUR', round((price / 7.46)::numeric, 2))
    else 
      jsonb_build_object('EUR', price, 'DKK', round((price * 7.46)::numeric, 2)) -- Default to EUR treatment if currency unknown
  end
where fixed_prices = '{"EUR": 0, "DKK": 0}'::jsonb;

-- Create products table for Products & On Demand
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text check (type in ('video_course', 'digital_product')) default 'video_course',
  fixed_prices jsonb default '{"EUR": 0, "DKK": 0}'::jsonb,
  item_count int default 1,
  status text check (status in ('active', 'draft', 'archived')) default 'active',
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for products
alter table public.products enable row level security;

-- Policies for products
create policy "Products are viewable by everyone" 
  on public.products for select 
  using (true);

create policy "Admins can insert products" 
  on public.products for insert 
  with check (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update products" 
  on public.products for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

create policy "Admins can delete products" 
  on public.products for delete 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

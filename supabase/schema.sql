-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES (extiende auth.users)
-- =====================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null check (name in ('Matheus', 'Kauan')),
  email text not null,
  avatar_color text not null default '#7C3AED',
  onesignal_player_id text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- =====================
-- OFFERS
-- =====================
create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  niche text,
  status text not null default 'draft'
    check (status in ('draft', 'development', 'active', 'paused', 'ended')),
  lp_url text,
  checkout_url text,
  pixel_id text,
  weekly_budget numeric(10,2),
  notes text,
  color text default '#7C3AED',
  emoji text default '🎯',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.offers enable row level security;
create policy "offers viewable by authenticated"
  on public.offers for all to authenticated using (true);

-- =====================
-- RECURRING TEMPLATES
-- =====================
create table public.recurring_templates (
  id uuid default uuid_generate_v4() primary key,
  offer_id uuid references public.offers(id) on delete cascade,
  title text not null,
  description text,
  day_of_week integer not null check (day_of_week between 0 and 6),
  assignee_name text not null check (assignee_name in ('Matheus', 'Kauan')),
  category text not null default 'other'
    check (category in ('offer_conception','lp_design','ad_copy','creative','media_buy','other')),
  default_checklist jsonb default '[]',
  due_time text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.recurring_templates enable row level security;
create policy "templates viewable by authenticated"
  on public.recurring_templates for all to authenticated using (true);

-- =====================
-- TASKS
-- =====================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  link_url text,
  week_key text not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  assignee_name text not null check (assignee_name in ('Matheus', 'Kauan')),
  created_by uuid references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  offer_id uuid references public.offers(id) on delete set null,
  category text not null default 'other'
    check (category in ('offer_conception','lp_design','ad_copy','creative','media_buy','other')),
  checklist jsonb default '[]',
  links jsonb default '[]',
  "references" jsonb default '[]',
  due_date date,
  due_time text,
  is_delayed boolean default false,
  original_week_key text,
  original_day_of_week integer,
  from_template_id uuid references public.recurring_templates(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "tasks viewable by authenticated"
  on public.tasks for all to authenticated using (true);

-- =====================
-- WEEKS
-- =====================
create table public.weeks (
  week_key text primary key,
  start_date date not null,
  end_date date not null,
  generated_at timestamptz,
  created_at timestamptz default now()
);

alter table public.weeks enable row level security;
create policy "weeks viewable by authenticated"
  on public.weeks for all to authenticated using (true);

-- =====================
-- TRIGGERS: updated_at automático
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at();

create trigger offers_updated_at before update on public.offers
  for each row execute function update_updated_at();

-- =====================
-- TRIGGER: auto-insert profile ao criar usuário
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Matheus'),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_color', '#7C3AED')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- REALTIME
-- =====================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.offers;

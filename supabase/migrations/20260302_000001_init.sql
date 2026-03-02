-- JobAI initial schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  target_role text,
  target_salary_usd integer,
  markets text[] default '{}',
  linkedin_url text,
  profile_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text not null,
  title text not null,
  company text,
  location text,
  remote boolean default false,
  salary_min_usd integer,
  salary_max_usd integer,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(source, source_url)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.events enable row level security;

create policy if not exists "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
create policy if not exists "profiles_upsert_own" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "applications_select_own" on public.applications
for select using (auth.uid() = user_id);
create policy if not exists "applications_write_own" on public.applications
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "events_select_own" on public.events
for select using (auth.uid() = user_id);
create policy if not exists "events_write_own" on public.events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- jobs are readable by authenticated users
alter table public.jobs enable row level security;
create policy if not exists "jobs_read_auth" on public.jobs
for select using (auth.role() = 'authenticated');

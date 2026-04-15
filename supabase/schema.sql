-- =============================================================
-- DebtGuard Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- TABLES
-- =============================================================

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Financial profiles table
create table public.financial_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  income numeric not null default 0,
  expenses numeric not null default 0,
  savings numeric not null default 0,
  total_debt numeric not null default 0,
  interest_rate numeric not null default 0,
  minimum_payment numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Simulation history table
create table public.simulations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null,
  description text,
  scenario_config jsonb not null,
  financial_profile jsonb not null,
  baseline_path jsonb not null,
  scenario_path jsonb not null,
  summary jsonb not null,
  decision_score numeric not null default 0,
  verdict text not null,
  narrative text,
  created_at timestamptz default now()
);

-- Chat history table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id text not null check (length(session_id) between 1 and 64),
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) <= 4000),
  context_snapshot jsonb,
  created_at timestamptz default now()
);

-- AI analysis cache table
create table public.ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  simulation_id uuid references public.simulations(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('risk', 'simulation')),
  prompt_hash text not null check (length(prompt_hash) between 1 and 64),
  result text not null,
  created_at timestamptz default now()
);

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_financial_profiles_user_id on public.financial_profiles(user_id);
create index idx_simulations_user_id on public.simulations(user_id);
create index idx_simulations_created_at on public.simulations(created_at desc);
create index idx_chat_messages_user_session on public.chat_messages(user_id, session_id);
create index idx_ai_analyses_user_hash on public.ai_analyses(user_id, prompt_hash);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.simulations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_analyses enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Financial profiles policies (explicit per-operation with WITH CHECK for writes)
create policy "financial_profiles: select own"
  on public.financial_profiles for select
  using (auth.uid() = user_id);

create policy "financial_profiles: insert own"
  on public.financial_profiles for insert
  with check (auth.uid() = user_id);

create policy "financial_profiles: update own"
  on public.financial_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "financial_profiles: delete own"
  on public.financial_profiles for delete
  using (auth.uid() = user_id);

-- Simulations policies
create policy "simulations: select own"
  on public.simulations for select
  using (auth.uid() = user_id);

create policy "simulations: insert own"
  on public.simulations for insert
  with check (auth.uid() = user_id);

create policy "simulations: update own"
  on public.simulations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "simulations: delete own"
  on public.simulations for delete
  using (auth.uid() = user_id);

-- Chat messages policies (no update — messages are immutable)
create policy "chat_messages: select own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "chat_messages: insert own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "chat_messages: delete own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- AI analyses policies (no update — cached results are immutable)
create policy "ai_analyses: select own"
  on public.ai_analyses for select
  using (auth.uid() = user_id);

create policy "ai_analyses: insert own"
  on public.ai_analyses for insert
  with check (auth.uid() = user_id);

create policy "ai_analyses: delete own"
  on public.ai_analyses for delete
  using (auth.uid() = user_id);

-- =============================================================
-- TRIGGER: Auto-create profile on signup
-- =============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================
-- FUNCTION: Update updated_at timestamp
-- =============================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_financial_profiles_updated_at
  before update on public.financial_profiles
  for each row execute procedure public.update_updated_at_column();

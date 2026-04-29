-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- profiles: one row per user, auto-created on sign-up
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  is_admin boolean not null default false,
  atq_score integer not null default 0,
  streak integer not null default 0,
  last_played_at timestamptz,
  created_at timestamptz not null default now()
);

-- puzzle_completions: one row per puzzle solved
create table if not exists public.puzzle_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  puzzle_id text not null,
  completed_at timestamptz not null default now(),
  elapsed_ms integer not null,
  hints_used integer not null default 0,
  atq_delta integer not null,
  tier integer not null,
  unique (user_id, puzzle_id)  -- one completion per puzzle per user
);

-- community_puzzles: puzzles built by users in the Sandbox
create table if not exists public.community_puzzles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  data jsonb not null,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.puzzle_completions enable row level security;
alter table public.community_puzzles enable row level security;

-- ── Admin helper (security definer avoids recursive RLS) ─────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;

-- ── community_puzzles RLS ─────────────────────────────────────────────────────
create policy "Anyone can view published puzzles"
  on public.community_puzzles for select using (published = true OR auth.uid() = author_id OR is_admin());

create policy "Authors can insert their puzzles"
  on public.community_puzzles for insert with check (auth.uid() = author_id OR is_admin());

create policy "Authors can update their puzzles"
  on public.community_puzzles for update using (auth.uid() = author_id OR is_admin());

create policy "Authors can delete their puzzles"
  on public.community_puzzles for delete using (auth.uid() = author_id OR is_admin());

-- ── profiles RLS ──────────────────────────────────────────────────────────────
-- All profiles readable (leaderboard); admins can update any profile
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update using (is_admin());

-- ── puzzle_completions RLS ────────────────────────────────────────────────────
create policy "Users can view own completions"
  on public.puzzle_completions for select using (auth.uid() = user_id);

create policy "Admins can view all completions"
  on public.puzzle_completions for select using (is_admin());

create policy "Users can insert own completions"
  on public.puzzle_completions for insert with check (auth.uid() = user_id);

create policy "Users can update own completions"
  on public.puzzle_completions for update using (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Atomic ATQ increment ──────────────────────────────────────────────────────
create or replace function public.increment_atq(user_id uuid, delta integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set atq_score = atq_score + delta,
      last_played_at = now()
  where id = user_id;
end;
$$;

-- ── Migration: add new columns to existing tables ─────────────────────────────
-- Run these if upgrading from an earlier schema version:
-- alter table public.profiles add column if not exists email text;
-- alter table public.profiles add column if not exists is_admin boolean not null default false;
-- alter table public.community_puzzles add column if not exists featured boolean not null default false;

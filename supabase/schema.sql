-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- profiles: one row per user, auto-created on sign-up
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.puzzle_completions enable row level security;

-- profiles: users can read all profiles (leaderboard), write only their own
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- puzzle_completions: users can read/write only their own
create policy "Users can view own completions"
  on public.puzzle_completions for select using (auth.uid() = user_id);

create policy "Users can insert own completions"
  on public.puzzle_completions for insert with check (auth.uid() = user_id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to increment ATQ score atomically
create or replace function public.increment_atq(user_id uuid, delta integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set atq_score = atq_score + delta,
      last_played_at = now()
  where id = user_id;
end;
$$;

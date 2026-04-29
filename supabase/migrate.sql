-- BreachLogic — Full migration script
-- Safe to run on a fresh DB or an existing one.
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- ── 1. Tables ─────────────────────────────────────────────────────────────────

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

create table if not exists public.puzzle_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  puzzle_id text not null,
  completed_at timestamptz not null default now(),
  elapsed_ms integer not null,
  hints_used integer not null default 0,
  atq_delta integer not null,
  tier integer not null,
  unique (user_id, puzzle_id)
);

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

-- ── 2. Add new columns to existing tables (safe if columns already exist) ─────

alter table public.profiles
  add column if not exists email text,
  add column if not exists is_admin boolean not null default false;

alter table public.community_puzzles
  add column if not exists featured boolean not null default false;

-- ── 3. Enable RLS ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.puzzle_completions enable row level security;
alter table public.community_puzzles enable row level security;

-- ── 4. Admin helper function ──────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;

-- ── 5. Drop old policies (so we can recreate them cleanly) ────────────────────

drop policy if exists "Anyone can view published puzzles"      on public.community_puzzles;
drop policy if exists "Authors can insert their puzzles"       on public.community_puzzles;
drop policy if exists "Authors can update their puzzles"       on public.community_puzzles;
drop policy if exists "Authors can delete their puzzles"       on public.community_puzzles;
drop policy if exists "Public profiles are viewable"           on public.profiles;
drop policy if exists "Users can update own profile"           on public.profiles;
drop policy if exists "Admins can update any profile"          on public.profiles;
drop policy if exists "Users can view own completions"         on public.puzzle_completions;
drop policy if exists "Admins can view all completions"        on public.puzzle_completions;
drop policy if exists "Users can insert own completions"       on public.puzzle_completions;
drop policy if exists "Users can update own completions"       on public.puzzle_completions;

-- ── 6. community_puzzles RLS ──────────────────────────────────────────────────

create policy "Anyone can view published puzzles"
  on public.community_puzzles for select
  using (published = true OR auth.uid() = author_id OR is_admin());

create policy "Authors can insert their puzzles"
  on public.community_puzzles for insert
  with check (auth.uid() = author_id OR is_admin());

create policy "Authors can update their puzzles"
  on public.community_puzzles for update
  using (auth.uid() = author_id OR is_admin());

create policy "Authors can delete their puzzles"
  on public.community_puzzles for delete
  using (auth.uid() = author_id OR is_admin());

-- ── 7. profiles RLS ───────────────────────────────────────────────────────────

create policy "Public profiles are viewable"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (is_admin());

-- ── 8. puzzle_completions RLS ─────────────────────────────────────────────────

create policy "Users can view own completions"
  on public.puzzle_completions for select
  using (auth.uid() = user_id);

create policy "Admins can view all completions"
  on public.puzzle_completions for select
  using (is_admin());

create policy "Users can insert own completions"
  on public.puzzle_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own completions"
  on public.puzzle_completions for update
  using (auth.uid() = user_id);

-- ── 9. Auth trigger: auto-create profile on sign-up ──────────────────────────

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

-- ── 10. Atomic ATQ increment ──────────────────────────────────────────────────

create or replace function public.increment_atq(user_id uuid, delta integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set atq_score = atq_score + delta,
      last_played_at = now()
  where id = user_id;
end;
$$;

-- ── 11. Make yourself admin ───────────────────────────────────────────────────
-- Replace the email below with your own, then uncomment and run:
-- update public.profiles set is_admin = true where email = 'your@email.com';

-- ── 12. community_puzzles: status column ──────────────────────────────────────
-- status: 'draft' | 'pending_review' | 'published' | 'rejected'

alter table public.community_puzzles
  add column if not exists status text not null default 'draft';

-- Back-fill existing rows so published=true rows get status='published'
update public.community_puzzles
  set status = 'published'
  where published = true and status = 'draft';

-- ── 13. Notifications table ───────────────────────────────────────────────────

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,          -- 'puzzle_approved' | 'puzzle_rejected'
  message text not null,
  puzzle_id text,              -- community_puzzles.id (UUID)
  puzzle_title text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications"   on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Admins can insert notifications"    on public.notifications;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Notifications are created by admin API routes using the service role key,
-- which bypasses RLS — no insert policy needed for regular users.

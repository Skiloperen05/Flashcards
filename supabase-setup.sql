-- ============================================================
-- StudieHub – Supabase database setup
-- Run this in the Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Table: user_custom_data
-- Stores each user's custom subjects and decks (JSON blob)
create table if not exists user_custom_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{"subjects":[],"decks":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_custom_data enable row level security;

drop policy if exists "Users manage own custom data" on user_custom_data;
create policy "Users manage own custom data"
  on user_custom_data
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Table: user_stats
-- Stores each user's study session statistics (JSON blob)
create table if not exists user_stats (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  stats      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_stats enable row level security;

drop policy if exists "Users manage own stats" on user_stats;
create policy "Users manage own stats"
  on user_stats
  for all
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Optional hardening for projects that also use the profile trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;

  if to_regclass('public.profiles') is not null then
    drop policy if exists "Alle kan lese profiler" on public.profiles;
    drop policy if exists "Bruker kan lese sin profil" on public.profiles;
    create policy "Bruker kan lese sin profil"
      on public.profiles
      for select
      to authenticated
      using ((select auth.uid()) = id);

    drop policy if exists "Bruker kan oppdatere sin profil" on public.profiles;
    create policy "Bruker kan oppdatere sin profil"
      on public.profiles
      for update
      to authenticated
      using  ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end $$;

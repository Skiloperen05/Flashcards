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

create policy "Users manage own custom data"
  on user_custom_data
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Table: user_stats
-- Stores each user's study session statistics (JSON blob)
create table if not exists user_stats (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  stats      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_stats enable row level security;

create policy "Users manage own stats"
  on user_stats
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

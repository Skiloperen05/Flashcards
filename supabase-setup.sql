-- ============================================================
-- Haugnes Flashcards – Supabase database setup
-- Run this in the Supabase SQL editor:
-- Dashboard → SQL Editor → New query → paste → Run
-- Re-running is safe (uses if-exists / on-conflict patterns).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Per-user storage (custom subjects, stats)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2. Profiles + admin flag
-- ------------------------------------------------------------
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
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
    ) then
      alter table public.profiles add column is_admin boolean not null default false;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_friend'
    ) then
      alter table public.profiles add column is_friend boolean not null default false;
    end if;

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

-- Promote primary admin (safe re-run – no-op if email not yet registered)
do $$
begin
  if to_regclass('public.profiles') is not null then
    update public.profiles set is_admin = true where lower(email) = 'birkhaugnes@gmail.com';
    update public.profiles set is_friend = true
      where lower(email) in ('alekmoe@gmail.com', 'filipwold@gmail.com', 'sondreskaland99@gmail.com');
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Subject entitlements (paywall – per-subject ownership)
-- ------------------------------------------------------------
create table if not exists public.subject_entitlements (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  subject_code text not null,
  source       text not null default 'free',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  amount_paid integer,
  currency text,
  granted_at   timestamptz not null default now(),
  unique (user_id, subject_code)
);

alter table public.subject_entitlements
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists amount_paid integer,
  add column if not exists currency text;

alter table public.subject_entitlements enable row level security;

drop policy if exists "Users read own entitlements" on public.subject_entitlements;
create policy "Users read own entitlements"
  on public.subject_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- First free subject: users may insert one free entitlement themselves.
-- Paid entitlements are inserted by trusted server code, e.g. the Stripe webhook
-- using the Supabase service-role key.
-- NOTE: the "no existing entitlements" check must live in a security definer
-- function. Querying subject_entitlements directly inside its own policy makes
-- Postgres abort every insert with "infinite recursion detected in policy".
create or replace function public.has_any_entitlement()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.subject_entitlements
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.has_any_entitlement() from public, anon;
grant execute on function public.has_any_entitlement() to authenticated;

drop policy if exists "Users claim free entitlement" on public.subject_entitlements;
create policy "Users claim free entitlement"
  on public.subject_entitlements
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and source = 'free'
    and not public.has_any_entitlement()
  );

drop policy if exists "Users release own entitlement" on public.subject_entitlements;
create policy "Users release own entitlement"
  on public.subject_entitlements
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.has_subject_entitlement(target_code text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.subject_entitlements
    where user_id = (select auth.uid())
      and upper(subject_code) = upper(target_code)
  )
  or exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and (is_admin = true or is_friend = true)
  );
$$;

revoke execute on function public.has_subject_entitlement(text) from public, anon;
grant execute on function public.has_subject_entitlement(text) to authenticated;

-- ------------------------------------------------------------
-- 4. A-besvarelser (premium content metadata)
--    Rows are only readable for users with entitlement on the package's
--    subject. PDF URLs are therefore not exposed in any client bundle.
-- ------------------------------------------------------------
create table if not exists public.answer_packages (
  id           text primary key,
  subject_code text not null,
  term         text not null,
  title        text not null,
  subtitle     text not null,
  description  text not null default '',
  local_status text,
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);

create table if not exists public.answer_resources (
  id           text primary key,
  package_id   text not null references public.answer_packages(id) on delete cascade,
  kind         text not null,
  title        text not null,
  subtitle     text not null default '',
  description  text not null default '',
  icon         text not null default '',
  url          text not null,
  download_url text not null default '',
  order_index  integer not null default 0
);

alter table public.answer_packages enable row level security;
alter table public.answer_resources enable row level security;

drop policy if exists "Read packages if entitled" on public.answer_packages;
create policy "Read packages if entitled"
  on public.answer_packages
  for select
  to authenticated
  using (public.has_subject_entitlement(subject_code));

drop policy if exists "Read resources if entitled" on public.answer_resources;
create policy "Read resources if entitled"
  on public.answer_resources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.answer_packages p
      where p.id = answer_resources.package_id
        and public.has_subject_entitlement(p.subject_code)
    )
  );

drop policy if exists "Admins manage packages" on public.answer_packages;
create policy "Admins manage packages"
  on public.answer_packages
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

drop policy if exists "Admins manage resources" on public.answer_resources;
create policy "Admins manage resources"
  on public.answer_resources
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

-- Seed: existing A-besvarelse-pakker (idempotent)
insert into public.answer_packages (id, subject_code, term, title, subtitle, description, local_status, sort_order)
values
  ('ret14-v25',  'RET14', 'V25', 'Våren 2025', 'RET14 Skatterett',
   'Pakkeplass for eksamen, A-besvarelse og sensorveiledning når dokumentene er publisert.', null, 10),
  ('sol1-v25',   'SOL1',  'V25', 'Våren 2025', 'SOL1 Organisasjonsatferd',
   'A-besvarelse er funnet lokalt i SOL1-mappen. Pakken er klargjort, men PDF-en publiseres ikke offentlig før filen er gjort klar for deling.',
   'A-besvarelse funnet lokalt', 20),
  ('sam2-v25',   'SAM2',  'V25', 'Våren 2025', 'SAM2 Mikroøkonomi',
   'Pakkeplass for eksamen, A-besvarelse og sensorveiledning når dokumentene er publisert.', null, 30),
  ('sam3-v25',   'SAM3',  'V25', 'Våren 2025', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 40),
  ('sam3-v26',   'SAM3',  'V26', 'Våren 2026', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 41),
  ('met2-v25',   'MET2',  'V25', 'Våren 2025', 'MET2 Metode',
   'Pakkeplass for eksamen, A-besvarelse og sensorveiledning når dokumentene er publisert.', null, 50),
  ('mat10-v25',  'MAT10', 'V25', 'Våren 2025', 'MAT10 Matematikk',
   'Pakkeplass for eksamen, A-besvarelse og sensorveiledning når dokumentene er publisert.', null, 60),
  ('sam1a-h25',  'SAM1A', 'H25', 'Høsten 2025', 'SAM1A Mikroøkonomi intro',
   'Pakkeplass basert på lokale læringsmål og kompendium. PDF-er publiseres først når de er klargjort for offentlig bruk.', null, 70),
  ('met1-h25',   'MET1',  'H25', 'Høsten 2025', 'MET1 Matematikk for økonomer',
   'Pakkeplass for rente, NNV, annuitet og metodeoppgaver fra lokale filer.', null, 80),
  ('kom1-h25',   'KOM1',  'H25', 'Høsten 2025', 'KOM1 Kommunikasjon',
   'Pakkeplass for rapporter, presentasjoner og refleksjonstekster som kan bli skrivekort.', null, 90),
  ('ret1a-h25',  'RET1A', 'H25', 'Høsten 2025', 'RET1A Juridiske emner',
   'Pakkeplass for eksamensøving, teorioppgaver og juridisk metode fra første semester.', null, 100),
  ('bed1-h25',   'BED1',  'H25', 'Høsten 2025', 'BED1 Bedriftsøkonomi',
   'Pakkeplass for gamle eksamener, gruppeøvinger og regnetrening fra BED1.', null, 110)
on conflict (id) do nothing;

-- Seed: SAM3 resources with published PDFs
insert into public.answer_resources (id, package_id, kind, title, subtitle, description, icon, url, download_url, order_index)
values
  ('sam3-v25-exam',   'sam3-v25', 'Eksamen', 'SAM3 skoleeksamen V25', 'Original oppgave',
   'Original eksamensoppgave for våren 2025. Start her og gjør et eget forsøk før du ser på løsning.',
   'E',
   'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view',
   'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5',
   1),
  ('sam3-v25-answer', 'sam3-v25', 'A-besvarelse', 'A-besvarelse SAM3 V25', 'Makroøkonomi',
   'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.',
   'A',
   'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view',
   'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5',
   2),
  ('sam3-v25-sensor', 'sam3-v25', 'Sensorveiledning', 'SAM3 sensorveiledning V25', 'Vurderingspunkter',
   'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.',
  'S',
  'https://drive.google.com/file/d/1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy/view',
  'https://drive.google.com/uc?export=download&id=1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy',
   3),
  ('sam3-v26-exam',   'sam3-v26', 'Eksamen', 'SAM3 skoleeksamen V26', 'Original oppgave',
   'Original eksamensoppgave for våren 2026. Start her og gjør et eget forsøk før du ser på løsning.',
   'E',
   '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf',
   '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf',
   1),
  ('sam3-v26-answer', 'sam3-v26', 'A-besvarelse', 'A-besvarelse SAM3 V26', 'Makroøkonomi',
   'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.',
   'A',
   '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf',
   '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf',
   2),
  ('sam3-v26-sensor', 'sam3-v26', 'Sensorveiledning', 'SAM3 sensorveiledning V26', 'Vurderingspunkter',
   'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.',
   'S',
   '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf',
   '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf',
   3)
on conflict (id) do nothing;

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
-- using the Supabase service-role key. Current paid sources are:
--   stripe, stripe_bundle, stripe_friend_pass
drop policy if exists "Users claim free entitlement" on public.subject_entitlements;
create policy "Users claim free entitlement"
  on public.subject_entitlements
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and source = 'free'
    and not exists (
      select 1 from public.subject_entitlements existing
      where existing.user_id = (select auth.uid())
    )
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
-- 3b. Commerce admin: subject prices, bundle prices, discount codes
-- ------------------------------------------------------------
create table if not exists public.subject_prices (
  subject_code text primary key,
  price_nok_ore integer not null check (price_nok_ore >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.commerce_products (
  product_id text primary key,
  label text not null,
  product_kind text not null default 'bundle' check (product_kind in ('bundle', 'pass')),
  subject_codes text[] not null default '{}',
  description text not null default '',
  price_sub text not null default '',
  cta text not null default 'Kjøp pakke',
  accent text not null default '#2f62ff',
  icon text not null default 'P',
  price_nok_ore integer not null check (price_nok_ore >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.commerce_products
  add column if not exists product_kind text not null default 'bundle',
  add column if not exists subject_codes text[] not null default '{}',
  add column if not exists description text not null default '',
  add column if not exists price_sub text not null default '',
  add column if not exists cta text not null default 'Kjøp pakke',
  add column if not exists accent text not null default '#2f62ff',
  add column if not exists icon text not null default 'P',
  add column if not exists sort_order integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'commerce_products_product_kind_check'
      and conrelid = 'public.commerce_products'::regclass
  ) then
    alter table public.commerce_products
      add constraint commerce_products_product_kind_check
      check (product_kind in ('bundle', 'pass'));
  end if;
end $$;

create table if not exists public.discount_codes (
  code text primary key,
  label text not null default '',
  percent_off integer check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_nok_ore integer check (amount_off_nok_ore is null or amount_off_nok_ore > 0),
  active boolean not null default true,
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check (percent_off is not null or amount_off_nok_ore is not null)
);

alter table public.subject_prices enable row level security;
alter table public.commerce_products enable row level security;
alter table public.discount_codes enable row level security;

grant select, insert, update, delete on public.subject_prices to authenticated;
grant select, insert, update, delete on public.commerce_products to authenticated;
grant select, insert, update, delete on public.discount_codes to authenticated;

drop policy if exists "Read subject prices" on public.subject_prices;
create policy "Read subject prices"
  on public.subject_prices
  for select
  to authenticated
  using (true);

drop policy if exists "Admins manage subject prices" on public.subject_prices;
create policy "Admins manage subject prices"
  on public.subject_prices
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

drop policy if exists "Read commerce products" on public.commerce_products;
create policy "Read commerce products"
  on public.commerce_products
  for select
  to authenticated
  using (active = true or exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

drop policy if exists "Admins manage commerce products" on public.commerce_products;
create policy "Admins manage commerce products"
  on public.commerce_products
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

drop policy if exists "Admins manage discount codes" on public.discount_codes;
create policy "Admins manage discount codes"
  on public.discount_codes
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true));

insert into public.subject_prices (subject_code, price_nok_ore)
values
  ('RET14', 4900), ('SOL1', 4900), ('SAM2', 4900), ('SAM3', 4900),
  ('MET2', 4900), ('MAT10', 4900), ('SAM1A', 4900), ('MET1', 4900),
  ('KOM1', 4900), ('RET1A', 4900), ('BED1', 4900)
on conflict (subject_code) do nothing;

insert into public.commerce_products (product_id, label, product_kind, subject_codes, description, price_sub, cta, accent, icon, price_nok_ore, active, sort_order)
values
  ('semester-1', '1. semesterpakke', 'bundle', array['RET1A','MET1','SAM1A','BED1','KOM1'], 'Alt for første semester samlet i én tilgang. Best når du vil rydde opp hele startpakken med én gang.', '5 fag samlet', 'Kjøp semesterpakke', '#3b82f6', '1', 19900, true, 10),
  ('semester-2', '2. semesterpakke', 'bundle', array['MET2','SAM2','SOL1'], 'Metode, mikro og organisasjonsatferd i samme pakke, med oppgaver, memo og eksamensrettede verktøy.', '3 fag samlet', 'Kjøp semesterpakke', '#20b97a', '2', 14900, true, 20),
  ('valgfag', 'Valgfagspakke', 'bundle', array['RET14','MAT10','SAM3'], 'For deg som vil ha de tyngre fagene samlet: skatterett, matematikk og makroverktøy.', 'valgfag', 'Kjøp valgfagspakke', '#e8bc68', 'V', 17900, true, 30),
  ('vennepass', 'Vennepass', 'pass', array['RET14','SOL1','SAM2','SAM3','MET2','MAT10','SAM1A','MET1','KOM1','RET1A','BED1'], 'Gir tilgang til alle fag som ligger ute nå, og alle nye fag som publiseres senere.', 'all-access', 'Kjøp Vennepass', '#f09828', '★', 35000, true, 40)
on conflict (product_id) do nothing;

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
  url          text not null default '',
  download_url text not null default '',
  storage_bucket text,
  storage_path   text,
  order_index  integer not null default 0
);

-- Storage-backed uploads: resources whose PDF lives in the private
-- `answer-pdfs` bucket keep only bucket + path here, and are served to the
-- client as short-lived signed URLs (see shared/haugnes-answer-library.js).
alter table public.answer_resources
  add column if not exists storage_bucket text,
  add column if not exists storage_path text;

alter table public.answer_resources alter column url set default '';

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

-- ------------------------------------------------------------
-- 4b. Storage bucket for uploaded answer-package PDFs
--     Private bucket. Admins upload; entitled users read via signed URLs.
--     Object path convention: {package_id}/{file}.pdf, so the first path
--     segment maps back to an answer_packages row for the entitlement check.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('answer-pdfs', 'answer-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read answer pdfs if entitled" on storage.objects;
create policy "Read answer pdfs if entitled"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'answer-pdfs'
    and exists (
      select 1 from public.answer_packages p
      where p.id = split_part(storage.objects.name, '/', 1)
        and public.has_subject_entitlement(p.subject_code)
    )
  );

drop policy if exists "Admins manage answer pdfs" on storage.objects;
create policy "Admins manage answer pdfs"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'answer-pdfs'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true)
  )
  with check (
    bucket_id = 'answer-pdfs'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true)
  );

-- Seed: existing A-besvarelse-pakker (idempotent)
insert into public.answer_packages (id, subject_code, term, title, subtitle, description, local_status, sort_order)
values
  ('ret14-v25',  'RET14', 'V25', 'Våren 2025', 'RET14 Skatterett',
   'Pakkeplass for eksamen, A-besvarelse og sensorveiledning når dokumentene er publisert.', null, 10),
  ('sol1-v25',   'SOL1',  'V25', 'Våren 2025', 'SOL1 Organisasjonsatferd',
   'A-besvarelse er funnet lokalt i SOL1-mappen. Pakken er klargjort, men PDF-en publiseres ikke offentlig før filen er gjort klar for deling.',
   'A-besvarelse funnet lokalt', 20),
  ('sam3-v25',   'SAM3',  'V25', 'Våren 2025', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 40),
  ('sam3-v26',   'SAM3',  'V26', 'Våren 2026', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 41),
  ('sam1a-h25',  'SAM1A', 'H25', 'Høsten 2025', 'SAM1A Mikroøkonomi intro',
   'Pakkeplass basert på lokale læringsmål og kompendium. PDF-er publiseres først når de er klargjort for offentlig bruk.', null, 70),
  ('ret1a-h25',  'RET1A', 'H25', 'Høsten 2025', 'RET1A Juridiske emner',
   'Pakkeplass for eksamensøving, teorioppgaver og juridisk metode fra første semester.', null, 100),
  ('bed1-h25',   'BED1',  'H25', 'Høsten 2025', 'BED1 Bedriftsøkonomi',
   'Pakkeplass for gamle eksamener, gruppeøvinger og regnetrening fra BED1.', null, 110)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6. Admin catalog, paid standalone exam packages and analytics
--     (kept in sync with 20260909010000_add_admin_catalog_and_paid_exam_packages.sql)
-- ------------------------------------------------------------
-- Admin-managed course catalog, paid standalone exam packages, and analytics.
-- All client-exposed tables have explicit grants and RLS policies.

create table if not exists public.app_subjects (
  code text primary key check (code = upper(code) and code ~ '^[A-Z0-9-]{2,32}$'),
  name text not null,
  description text not null default '',
  category_id text not null default 'electives',
  accent text not null default '#2f62ff',
  icon text not null default '📚',
  emblem text,
  path text,
  flashcards_path text,
  status text not null default 'active' check (status in ('active', 'exam', 'coming', 'archived')),
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.app_subjects enable row level security;
grant select on public.app_subjects to anon, authenticated;
grant insert, update, delete on public.app_subjects to authenticated;

drop policy if exists "Published app subjects are readable" on public.app_subjects;
create policy "Published app subjects are readable"
  on public.app_subjects for select to anon, authenticated
  using (published or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));

drop policy if exists "Admins manage app subjects" on public.app_subjects;
create policy "Admins manage app subjects"
  on public.app_subjects for all to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));

insert into public.app_subjects (code, name, description, category_id, accent, icon, emblem, path, flashcards_path, status, published, sort_order)
values
  ('RET14', 'Skatterett', 'Skatt, fradrag, aksjer, personinntekt, arv og eksamensanalyse.', 'electives', '#2f62ff', '⚖️', '../assets/emblems/RET14.png', '../ret14/', '../flashcards/?subject=ret14', 'active', true, 20),
  ('SOL1', 'Organisasjonsatferd', 'Begreper, teorier, modeller, caseforståelse og teoriskriving.', 'semester2', '#20b97a', '🧠', '../assets/emblems/SOL1.png', '../sol1/', '../flashcards/?subject=subj_sol1', 'active', true, 30),
  ('SAM2', 'Mikroøkonomi', 'Memoar, oppgaveprioritering, eksamensradar, figurer og modellvalg.', 'semester2', '#f09828', '📈', '../assets/emblems/SAM2.png', '../sam2/', '../sam2/oppgaver-klikkbar/', 'exam', true, 20),
  ('SAM3', 'Makroøkonomi', 'Makromodeller, formler, quiz, eksamensradar og mock-eksamen.', 'semester4', '#ef4444', '🌍', '../assets/emblems/SAM3.png', '../sam3/', '../sam3/flashcards.html', 'active', true, 10),
  ('MET2', 'Metode', 'Metode, statistikk, hypotesetesting, konfidensintervall og regresjon.', 'semester2', '#7c3aed', 'Σ', '../assets/emblems/MET2.png', '../met2/', '../flashcards/?subject=met2', 'active', true, 10),
  ('MAT10', 'Matematikk', 'Analyse, lineær algebra, formler, regneøkter og eksamensdrill.', 'electives', '#0891b2', '∫', '../assets/emblems/MAT10.png', '../mat10/', '../flashcards/?subject=mat10', 'active', true, 10),
  ('SAM1A', 'Mikroøkonomi intro', 'Første semester: læringsmål, markedslikevekt, elastisitet og velferdsanalyse.', 'semester1', '#f09828', '↗', '../assets/emblems/SAM1A.png', '../sam1a/', '../flashcards/?subject=sam1a', 'active', true, 30),
  ('MET1', 'Matematikk for økonomer', 'Første semester: rente, nåverdi, annuitet, rekker og formelvalg.', 'semester1', '#06b6d4', '%', '../assets/emblems/MET1.png', '../met1/', '../flashcards/?subject=met1', 'active', true, 20),
  ('KOM1', 'Kommunikasjon', 'Første semester: rapportstruktur, presentasjon, akademisk språk og refleksjon.', 'semester1', '#e8bc68', '✎', '../assets/emblems/KOM1.png', '../kom1/', '../flashcards/?subject=kom1', 'active', true, 50),
  ('RET1A', 'Juridiske emner', 'Første semester: avtalerett, selskapsrett, pengekrav og juridisk metode.', 'semester1', '#3b82f6', '§', '../assets/emblems/RET1A.png', '../ret1a/', '../flashcards/?subject=ret1a', 'exam', true, 10),
  ('BED1', 'Bedriftsøkonomi', 'Første semester: kalkyler, resultat, investering, budsjettering og eksamenstrening.', 'semester1', '#20b97a', '◆', '../assets/emblems/BED1.png', '../bed1/', '../flashcards/?subject=bed1', 'exam', true, 40)
on conflict (code) do nothing;

alter table public.answer_packages
  add column if not exists price_nok_ore integer not null default 0 check (price_nok_ore >= 0),
  add column if not exists sale_active boolean not null default true,
  add column if not exists published boolean not null default true;

create table if not exists public.answer_package_entitlements (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.answer_packages(id) on delete cascade,
  source text not null default 'stripe_package',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  amount_paid integer,
  currency text,
  granted_at timestamptz not null default now(),
  unique (user_id, package_id)
);

alter table public.answer_package_entitlements enable row level security;
grant select on public.answer_package_entitlements to authenticated;

drop policy if exists "Users read own answer package entitlements" on public.answer_package_entitlements;
create policy "Users read own answer package entitlements"
  on public.answer_package_entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins read answer package entitlements" on public.answer_package_entitlements;
create policy "Admins read answer package entitlements"
  on public.answer_package_entitlements for select to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));

-- Package metadata is intentionally visible so a signed-in student can decide
-- whether to buy it. The files themselves stay behind entitlement checks.
drop policy if exists "Read packages if entitled" on public.answer_packages;
drop policy if exists "Kompass users read all answer packages" on public.answer_packages;
create policy "Authenticated users read published answer package metadata"
  on public.answer_packages for select to authenticated
  using (published or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));

drop policy if exists "Read resources if entitled" on public.answer_resources;
drop policy if exists "Kompass users read all answer resources" on public.answer_resources;
create policy "Read answer resources with subject or package access"
  on public.answer_resources for select to authenticated
  using (
    exists (
      select 1 from public.answer_packages package
      where package.id = answer_resources.package_id
        and (
          public.has_subject_entitlement(package.subject_code)
          or exists (
            select 1 from public.answer_package_entitlements entitlement
            where entitlement.package_id = package.id
              and entitlement.user_id = (select auth.uid())
          )
        )
    )
  );

drop policy if exists "Read answer pdfs if entitled" on storage.objects;
create policy "Read answer pdfs with subject or package access"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'answer-pdfs'
    and exists (
      select 1 from public.answer_packages package
      where package.id = split_part(storage.objects.name, '/', 1)
        and (
          public.has_subject_entitlement(package.subject_code)
          or exists (
            select 1 from public.answer_package_entitlements entitlement
            where entitlement.package_id = package.id
              and entitlement.user_id = (select auth.uid())
          )
        )
    )
  );

create or replace function public.admin_dashboard_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  snapshot jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  with activity as (
    select profile.id, profile.email, profile.created_at, profile.is_admin, profile.is_friend,
      greatest(
        profile.created_at,
        coalesce(stats.updated_at, '-infinity'::timestamptz),
        coalesce(custom_data.updated_at, '-infinity'::timestamptz),
        coalesce(entitlement_activity.last_granted_at, '-infinity'::timestamptz)
      ) as last_activity,
      coalesce(entitlement_activity.subject_count, 0) as subject_count,
      coalesce(package_activity.package_count, 0) as package_count
    from public.profiles profile
    left join public.user_stats stats on stats.user_id = profile.id
    left join public.user_custom_data custom_data on custom_data.user_id = profile.id
    left join lateral (
      select max(granted_at) as last_granted_at, count(*)::integer as subject_count
      from public.subject_entitlements where user_id = profile.id
    ) entitlement_activity on true
    left join lateral (
      select count(*)::integer as package_count
      from public.answer_package_entitlements where user_id = profile.id
    ) package_activity on true
  ), paid_sessions as (
    select distinct stripe_checkout_session_id, amount_paid
    from public.subject_entitlements
    where stripe_checkout_session_id is not null and amount_paid is not null
    union
    select distinct stripe_checkout_session_id, amount_paid
    from public.answer_package_entitlements
    where stripe_checkout_session_id is not null and amount_paid is not null
  )
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'users', (select count(*) from activity),
      'active_last_7_days', (select count(*) from activity where last_activity >= now() - interval '7 days'),
      'subject_entitlements', (select count(*) from public.subject_entitlements),
      'package_entitlements', (select count(*) from public.answer_package_entitlements),
      'published_subjects', (select count(*) from public.app_subjects where published),
      'published_packages', (select count(*) from public.answer_packages where published),
      'paid_revenue_nok_ore', (select coalesce(sum(amount_paid), 0) from paid_sessions)
    ),
    'users', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'email', email, 'created_at', created_at, 'last_activity', last_activity,
        'is_admin', is_admin, 'is_friend', is_friend, 'subject_count', subject_count, 'package_count', package_count
      ) order by last_activity desc)
      from (select * from activity order by last_activity desc limit 100) recent_users
    ), '[]'::jsonb),
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object('code', subject_code, 'owners', owners) order by owners desc, subject_code)
      from (select upper(subject_code) as subject_code, count(*)::integer as owners from public.subject_entitlements group by upper(subject_code)) counts
    ), '[]'::jsonb)
  ) into snapshot;

  return snapshot;
end;
$$;

revoke all on function public.admin_dashboard_snapshot() from public, anon;
grant execute on function public.admin_dashboard_snapshot() to authenticated;

-- Supporting indexes for the admin catalogue and package-entitlement foreign keys.
create index if not exists answer_package_entitlements_package_id_idx
  on public.answer_package_entitlements (package_id);
create index if not exists app_subjects_updated_by_idx
  on public.app_subjects (updated_by);

-- Consolidate the admin/read policies while preserving the same access rules.
-- Keep identical authorization while avoiding duplicate permissive SELECT policies.
drop policy if exists "Admins read answer package entitlements" on public.answer_package_entitlements;
drop policy if exists "Users read own answer package entitlements" on public.answer_package_entitlements;
create policy "Users or admins read answer package entitlements"
  on public.answer_package_entitlements for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage app subjects" on public.app_subjects;
create policy "Admins insert app subjects"
  on public.app_subjects for insert to authenticated
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));
create policy "Admins update app subjects"
  on public.app_subjects for update to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));
create policy "Admins delete app subjects"
  on public.app_subjects for delete to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));

-- ---------------------------------------------------------------------------
-- Kompass shared cloud model
-- ---------------------------------------------------------------------------
-- The canonical, repeatable schema and seed SQL for the new Sites + iOS/iPadOS
-- clients lives in:
--   supabase/migrations/20260725153000_create_kompass_core.sql
--   supabase/migrations/20260725161000_optimize_kompass_rls.sql
--   supabase/migrations/20260725164500_point_core_resources_to_kompass.sql
--   supabase/migrations/20260725193000_create_kompass_course_workspaces.sql
--   supabase/migrations/20260725194500_index_kompass_course_workspace_foreign_keys.sql
--
-- Those migrations add:
--   public.kompass_subjects       shared subject catalog
--   public.kompass_resources      shared links and uploaded resources
--   public.kompass_content_blocks admin-editable interface copy
--   public.kompass_user_state     per-user plan, notes, progress and settings
--   public.kompass_course_folders private student/shared admin folders by subject
--   public.kompass_course_notes   private student/shared admin notes by subject
--   public.kompass_course_files   storage metadata for subject files and foils
--   public.kompass_course_progress per-user lecture completion and course goals
--   storage bucket kompass-resources (private, signed reads)
--
-- Kompass deliberately has no payment or entitlement check. Every authenticated
-- user can read published catalog content. Only profiles.is_admin users can edit
-- shared content or publish shared subject workspaces. Students may create their
-- own private folders, notes and uploads, and clients cannot edit profiles.is_admin.

delete from public.answer_packages
where id in ('sam2-v25', 'met1-h25', 'met2-v25', 'mat10-v25', 'kom1-h25');

-- Seed: local A-besvarelser imported from Desktop/A-besvarelser.
-- These rows intentionally use repo-local URLs so the archive can serve the
-- same packages without requiring a Storage upload first.
insert into public.answer_packages (id, subject_code, term, title, subtitle, description, local_status, sort_order)
values
  ('sam3-v25',  'SAM3',  'V25', 'Våren 2025', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 40),
  ('sam3-v26',  'SAM3',  'V26', 'Våren 2026', 'SAM3 Makroøkonomi',
   'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.', null, 41),
  ('sol1-v25',  'SOL1',  'V25', 'Våren 2025', 'SOL1 Organisasjonsatferd',
   'Eksamen, sensorveiledning og to ulike A-besvarelser til samme eksamen. Les dem som to separate eksempler på sterke svar, ikke som én samlet besvarelse.',
   'To A-besvarelser', 20),
  ('sol1-v26',  'SOL1',  'V26', 'Våren 2026', 'SOL1 Organisasjonsatferd',
   'Eksamenspakke med A-besvarelse og sensorveiledning for våren 2026.', null, 21),
  ('bed1-h25',  'BED1',  'H25', 'Høsten 2025', 'BED1 Bedriftsøkonomi',
   'Eksamenspakke med original eksamen, A-besvarelse og løsningsforslag.', null, 110),
  ('ret1a-h25', 'RET1A', 'H25', 'Høsten 2025', 'RET1A Juridiske emner',
   'Eksamenspakke med A-besvarelse og sensorveiledning.', null, 100)
on conflict (id) do update
  set subject_code = excluded.subject_code,
      term = excluded.term,
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      local_status = excluded.local_status,
      sort_order = excluded.sort_order,
      updated_at = now();

insert into public.answer_resources (id, package_id, kind, title, subtitle, description, icon, url, download_url, order_index)
values
  ('sam3-v25-exam', 'sam3-v25', 'Eksamen', 'SAM3 skoleeksamen V25', 'Original oppgave',
   'Original eksamensoppgave for våren 2025. Start her og gjør et eget forsøk før du ser på løsning.',
   'E', '../sam3/eksamenspakker/v25/sam3-skoleeksamen-v25.pdf', '../sam3/eksamenspakker/v25/sam3-skoleeksamen-v25.pdf', 1),
  ('sam3-v25-answer', 'sam3-v25', 'A-besvarelse', 'A-besvarelse SAM3 V25', 'Makroøkonomi',
   'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.',
   'A', '../sam3/eksamenspakker/v25/sam3-a-besvarelse-v25.pdf', '../sam3/eksamenspakker/v25/sam3-a-besvarelse-v25.pdf', 2),
  ('sam3-v25-sensor', 'sam3-v25', 'Sensorveiledning', 'SAM3 sensorveiledning V25', 'Vurderingspunkter',
   'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.',
   'S', '../sam3/eksamenspakker/v25/sam3-sensorveiledning-v25.pdf', '../sam3/eksamenspakker/v25/sam3-sensorveiledning-v25.pdf', 3),
  ('sam3-v26-exam', 'sam3-v26', 'Eksamen', 'SAM3 skoleeksamen V26', 'Original oppgave',
   'Original eksamensoppgave for våren 2026. Start her og gjør et eget forsøk før du ser på løsning.',
   'E', '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf', '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf', 1),
  ('sam3-v26-answer', 'sam3-v26', 'A-besvarelse', 'A-besvarelse SAM3 V26', 'Makroøkonomi',
   'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.',
   'A', '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf', '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf', 2),
  ('sam3-v26-sensor', 'sam3-v26', 'Sensorveiledning', 'SAM3 sensorveiledning V26', 'Vurderingspunkter',
   'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.',
   'S', '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf', '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf', 3),
  ('sol1-v25-exam', 'sol1-v25', 'Eksamen', 'SOL1 eksamen V25', 'Original oppgave',
   'Original eksamensoppgave i SOL1 våren 2025.',
   'E', '../sol1/eksamenspakker/v25/sol1-eksamen-v25.pdf', '../sol1/eksamenspakker/v25/sol1-eksamen-v25.pdf', 1),
  ('sol1-v25-answer-vetle', 'sol1-v25', 'A-besvarelse', 'A-besvarelse SOL1 V25 · Vetle', 'A-besvarelse 1 av 2',
   'Den ene av to ulike A-besvarelser til samme SOL1-eksamen våren 2025.',
   'A', '../sol1/eksamenspakker/v25/sol1-a-besvarelse-vetle-v25.pdf', '../sol1/eksamenspakker/v25/sol1-a-besvarelse-vetle-v25.pdf', 2),
  ('sol1-v25-answer-aksel', 'sol1-v25', 'A-besvarelse', 'A-besvarelse SOL1 V25 · Aksel', 'A-besvarelse 2 av 2',
   'Den andre av to ulike A-besvarelser til samme SOL1-eksamen våren 2025. Sammenlign struktur, teorivalg og drøftingsnivå med Vetle-besvarelsen.',
   'A', '../sol1/eksamenspakker/v25/sol1-a-besvarelse-aksel-v25.pdf', '../sol1/eksamenspakker/v25/sol1-a-besvarelse-aksel-v25.pdf', 3),
  ('sol1-v25-sensor', 'sol1-v25', 'Sensorveiledning', 'SOL1 sensorveiledning V25', 'Vurderingspunkter',
   'Sensorveiledning til SOL1-eksamen våren 2025.',
   'S', '../sol1/eksamenspakker/v25/sol1-sensorveiledning-v25.pdf', '../sol1/eksamenspakker/v25/sol1-sensorveiledning-v25.pdf', 4),
  ('sol1-v26-answer', 'sol1-v26', 'A-besvarelse', 'A-besvarelse SOL1 V26', 'Word-dokument',
   'A-besvarelse til SOL1-eksamen våren 2026.',
   'A', '../sol1/eksamenspakker/v26/sol1-a-besvarelse-v26.docx', '../sol1/eksamenspakker/v26/sol1-a-besvarelse-v26.docx', 1),
  ('sol1-v26-sensor', 'sol1-v26', 'Sensorveiledning', 'SOL1 sensorveiledning V26', 'Vurderingspunkter',
   'Sensorveiledning til SOL1-eksamen våren 2026.',
   'S', '../sol1/eksamenspakker/v26/sol1-sensorveiledning-v26.pdf', '../sol1/eksamenspakker/v26/sol1-sensorveiledning-v26.pdf', 2),
  ('bed1-h25-exam', 'bed1-h25', 'Eksamen', 'BED1 eksamen H25', 'Original oppgave',
   'Original eksamensoppgave i BED1 høsten 2025.',
   'E', '../bed1/eksamenspakker/h25/bed1-eksamen-h25.pdf', '../bed1/eksamenspakker/h25/bed1-eksamen-h25.pdf', 1),
  ('bed1-h25-answer', 'bed1-h25', 'A-besvarelse', 'A-besvarelse BED1 H25', 'Bedriftsøkonomi',
   'Eksempel på sterk besvarelse til BED1-eksamen høsten 2025.',
   'A', '../bed1/eksamenspakker/h25/bed1-a-besvarelse-h25.pdf', '../bed1/eksamenspakker/h25/bed1-a-besvarelse-h25.pdf', 2),
  ('bed1-h25-solution', 'bed1-h25', 'Løsningsforslag', 'BED1 løsning H25', 'Løsningsforslag',
   'Løsningsforslag til BED1-eksamen høsten 2025.',
   'L', '../bed1/eksamenspakker/h25/bed1-losning-h25.pdf', '../bed1/eksamenspakker/h25/bed1-losning-h25.pdf', 3),
  ('ret1a-h25-answer', 'ret1a-h25', 'A-besvarelse', 'A-besvarelse RET1A H25', 'Juridiske emner',
   'Eksempel på sterk juridisk besvarelse til RET1A høsten 2025.',
   'A', '../ret1a/eksamenspakker/h25/ret1a-a-besvarelse-h25.pdf', '../ret1a/eksamenspakker/h25/ret1a-a-besvarelse-h25.pdf', 1),
  ('ret1a-h25-sensor', 'ret1a-h25', 'Sensorveiledning', 'RET1A sensorveiledning H25', 'Word-dokument',
   'Sensorveiledning til RET1A høsten 2025.',
   'S', '../ret1a/eksamenspakker/h25/ret1a-sensorveiledning-h25.doc', '../ret1a/eksamenspakker/h25/ret1a-sensorveiledning-h25.doc', 2)
on conflict (id) do update
  set package_id = excluded.package_id,
      kind = excluded.kind,
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      icon = excluded.icon,
      url = excluded.url,
      download_url = excluded.download_url,
      storage_bucket = null,
      storage_path = null,
      order_index = excluded.order_index;

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

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

-- Kompass shared cloud model for web, iPhone and iPad.
-- The legacy commerce tables remain untouched, but Kompass itself has no paywall.

create table if not exists public.kompass_subjects (
  code text primary key,
  name text not null,
  category text not null default 'annet',
  description text not null default '',
  icon text not null default 'book.closed',
  accent text not null default '#2563eb',
  legacy_path text,
  status text not null default 'active'
    check (status in ('active', 'coming', 'archived')),
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.kompass_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject_code text references public.kompass_subjects(code) on update cascade on delete set null,
  category text not null default 'annet',
  title text not null,
  description text not null default '',
  badge text not null default '',
  href text,
  storage_bucket text,
  storage_path text,
  content_type text,
  source text not null default 'kompass',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint kompass_resource_destination check (
    href is not null or (storage_bucket is not null and storage_path is not null)
  )
);

create table if not exists public.kompass_content_blocks (
  key text primary key,
  area text not null default 'dashboard',
  eyebrow text not null default '',
  title text not null,
  body text not null default '',
  cta_label text not null default '',
  cta_href text,
  metadata jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.kompass_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schedule_state jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  selected_subjects text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

create index if not exists kompass_subjects_catalog_idx
  on public.kompass_subjects (published, category, sort_order);
create index if not exists kompass_resources_catalog_idx
  on public.kompass_resources (published, subject_code, category, sort_order);
create index if not exists kompass_content_blocks_area_idx
  on public.kompass_content_blocks (published, area, sort_order);

alter table public.kompass_subjects enable row level security;
alter table public.kompass_resources enable row level security;
alter table public.kompass_content_blocks enable row level security;
alter table public.kompass_user_state enable row level security;

drop policy if exists "Authenticated users read published Kompass subjects"
  on public.kompass_subjects;
create policy "Authenticated users read published Kompass subjects"
  on public.kompass_subjects
  for select
  to authenticated
  using (
    published
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass subjects"
  on public.kompass_subjects;
create policy "Admins manage Kompass subjects"
  on public.kompass_subjects
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Authenticated users read published Kompass resources"
  on public.kompass_resources;
create policy "Authenticated users read published Kompass resources"
  on public.kompass_resources
  for select
  to authenticated
  using (
    published
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass resources"
  on public.kompass_resources;
create policy "Admins manage Kompass resources"
  on public.kompass_resources
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Authenticated users read published Kompass content"
  on public.kompass_content_blocks;
create policy "Authenticated users read published Kompass content"
  on public.kompass_content_blocks
  for select
  to authenticated
  using (
    published
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass content"
  on public.kompass_content_blocks;
create policy "Admins manage Kompass content"
  on public.kompass_content_blocks
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Users read own Kompass state"
  on public.kompass_user_state;
create policy "Users read own Kompass state"
  on public.kompass_user_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create own Kompass state"
  on public.kompass_user_state;
create policy "Users create own Kompass state"
  on public.kompass_user_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own Kompass state"
  on public.kompass_user_state;
create policy "Users update own Kompass state"
  on public.kompass_user_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own Kompass state"
  on public.kompass_user_state;
create policy "Users delete own Kompass state"
  on public.kompass_user_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Profiles.is_admin is authorization data and must never be user-editable.
drop policy if exists "Bruker kan oppdatere sin profil" on public.profiles;
revoke update on table public.profiles from authenticated;

grant select on table public.kompass_subjects to authenticated;
grant insert, update, delete on table public.kompass_subjects to authenticated;
grant select on table public.kompass_resources to authenticated;
grant insert, update, delete on table public.kompass_resources to authenticated;
grant select on table public.kompass_content_blocks to authenticated;
grant insert, update, delete on table public.kompass_content_blocks to authenticated;
grant select, insert, update, delete on table public.kompass_user_state to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kompass-resources',
  'kompass-resources',
  false,
  104857600,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users read published Kompass files"
  on storage.objects;
create policy "Authenticated users read published Kompass files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'kompass-resources'
    and exists (
      select 1
      from public.kompass_resources
      where kompass_resources.storage_bucket = storage.objects.bucket_id
        and kompass_resources.storage_path = storage.objects.name
        and kompass_resources.published = true
    )
  );

drop policy if exists "Admins manage Kompass files"
  on storage.objects;
create policy "Admins manage Kompass files"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

insert into public.kompass_subjects
  (code, name, category, description, icon, accent, legacy_path, status, featured, published, sort_order)
values
  ('RET1A', 'Juridiske emner', 'Første semester', 'Avtalerett, selskapsrett, pengekrav og juridisk metode.', 'section', '#3b82f6', 'https://bhflashcards.no/ret1a/', 'active', false, true, 10),
  ('MET1', 'Matematikk for økonomer', 'Første semester', 'Rente, nåverdi, annuitet, rekker og formelvalg.', 'percent', '#06b6d4', 'https://bhflashcards.no/met1/', 'active', false, true, 20),
  ('SAM1A', 'Mikroøkonomi intro', 'Første semester', 'Markedslikevekt, elastisitet og velferdsanalyse.', 'chart.line.uptrend.xyaxis', '#f09828', 'https://bhflashcards.no/sam1a/', 'active', false, true, 30),
  ('BED1', 'Bedriftsøkonomi', 'Første semester', 'Kalkyler, resultat, investering, budsjettering og eksamenstrening.', 'building.columns', '#20b97a', 'https://bhflashcards.no/bed1/', 'active', false, true, 40),
  ('KOM1', 'Kommunikasjon', 'Første semester', 'Rapportstruktur, presentasjon, akademisk språk og refleksjon.', 'text.bubble', '#e8bc68', 'https://bhflashcards.no/kom1/', 'active', false, true, 50),
  ('MET2', 'Metode', 'Andre semester', 'Statistikk, hypotesetesting, konfidensintervall og regresjon.', 'sum', '#7c3aed', 'https://bhflashcards.no/met2/', 'active', false, true, 110),
  ('SAM2', 'Mikroøkonomi', 'Andre semester', 'Memoar, oppgaver, eksamensradar, figurer og modellvalg.', 'chart.xyaxis.line', '#f09828', 'https://bhflashcards.no/sam2/', 'active', true, true, 120),
  ('SOL1', 'Organisasjonsatferd', 'Andre semester', 'Begreper, teorier, modeller, caseforståelse og teoriskriving.', 'brain.head.profile', '#20b97a', 'https://bhflashcards.no/sol1/', 'active', true, true, 130),
  ('SAM3', 'Makroøkonomi', 'Fjerde semester', 'Makromodeller, formler, quiz, eksamensradar og mock-eksamen.', 'globe.europe.africa', '#ef4444', 'https://bhflashcards.no/sam3/', 'active', true, true, 210),
  ('MAT10', 'Matematikk', 'Valgfag', 'Analyse, lineær algebra, formler, regneøkter og eksamensdrill.', 'function', '#0891b2', 'https://bhflashcards.no/mat10/', 'active', false, true, 310),
  ('RET14', 'Skatterett', 'Valgfag', 'Skatt, fradrag, aksjer, personinntekt, arv og eksamensanalyse.', 'scalemass', '#2f62ff', 'https://bhflashcards.no/ret14/', 'active', true, true, 320)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  icon = excluded.icon,
  accent = excluded.accent,
  legacy_path = excluded.legacy_path,
  status = excluded.status,
  featured = excluded.featured,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.kompass_resources
  (slug, subject_code, category, title, description, badge, href, source, featured, published, sort_order)
values
  ('all-flashcards', null, 'flashcards', 'Alle flashcards', 'Samlet fagkatalog med søk, repetisjon og økter.', 'Flashcards', 'https://bhflashcards.no/flashcards/', 'bhflashcards', true, true, 10),
  ('task-bank', null, 'oppgaver', 'Oppgavebank', 'Oppgaver sortert etter fag, tema og prioritet.', 'Oppgaver', 'https://bhflashcards.no/user/oppgavebank.html', 'bhflashcards', true, true, 20),
  ('exam-analysis', null, 'eksamen', 'Eksamensanalyse', 'Mønstre, temaer og prioriteringer fra tidligere eksamener.', 'Eksamen', 'https://bhflashcards.no/user/eksamensanalyse.html', 'bhflashcards', true, true, 30),
  ('answer-library', null, 'eksamen', 'A-besvarelser og eksamenspakker', 'Eksamen, A-besvarelser og sensorveiledninger samlet.', 'Arkiv', 'https://bhflashcards.no/user/a-besvarelser.html', 'bhflashcards', true, true, 40),
  ('memoirs', null, 'memoar', 'Memoarer', 'Korte faglige refleksjoner og råd før du starter.', 'Memoar', 'https://bhflashcards.no/user/memoarer.html', 'bhflashcards', false, true, 50),
  ('notes', null, 'notater', 'Notater', 'Personlige notater som følger brukeren.', 'Notater', 'https://bhflashcards.no/user/notater.html', 'bhflashcards', false, true, 60),
  ('ret14-flashcards', 'RET14', 'flashcards', 'RET14 flashcards', 'Flashcards for skatterett.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=ret14', 'bhflashcards', true, true, 10),
  ('ret14-curriculum', 'RET14', 'kompendium', 'Pensumoversikt', 'Skatteregler, lovhjemler og typiske eksamensfeller.', 'Kompendium', 'https://bhflashcards.no/ret14/pensum/', 'bhflashcards', true, true, 20),
  ('ret14-exam-radar', 'RET14', 'eksamen', 'Eksamensradar', 'Analyse av tidligere RET14-eksamener og temaer som går igjen.', 'Eksamen', 'https://bhflashcards.no/ret14/eksamen/', 'bhflashcards', true, true, 30),
  ('sol1-flashcards', 'SOL1', 'flashcards', 'SOL1 flashcards', 'Begreper, teorier og modeller i kortformat.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=subj_sol1', 'bhflashcards', true, true, 10),
  ('sol1-theory', 'SOL1', 'kompendium', 'Teorier, modeller og begreper', 'Samlet SOL1-side for sentrale teorier og modeller.', 'Kompendium', 'https://bhflashcards.no/sol1/teorier-modeller-begreper-flashcards.html', 'bhflashcards', true, true, 20),
  ('sol1-writing', 'SOL1', 'eksamen', 'Teoriskriving', 'Øv på teoridel og struktur i skriftlige svar.', 'Eksamen', 'https://bhflashcards.no/sol1/teorideler-teoriskriving.html', 'bhflashcards', true, true, 30),
  ('sam2-memoir', 'SAM2', 'memoar', 'SAM2 memoar', 'Forventninger til faget og hvordan du bør jobbe mot eksamen.', 'Memoar', 'https://bhflashcards.no/sam2/memoar/', 'bhflashcards', true, true, 10),
  ('sam2-exam-radar', 'SAM2', 'eksamen', 'Eksamensradar', 'Prioritering av mikrotemaer, oppgavetyper og modellvalg.', 'Eksamen', 'https://bhflashcards.no/sam2/eksamen/', 'bhflashcards', true, true, 20),
  ('sam2-tasks', 'SAM2', 'oppgaver', 'Oppgaver og figurer', 'Oppgaveprioritering og klikkbar oppgavetrening.', 'Oppgaver', 'https://bhflashcards.no/sam2/oppgaver-klikkbar/', 'bhflashcards', true, true, 30),
  ('sam3-flashcards', 'SAM3', 'flashcards', 'SAM3 flashcards', 'Makroøkonomi og modellforståelse i kortformat.', 'Flashcards', 'https://bhflashcards.no/sam3/flashcards.html', 'bhflashcards', true, true, 10),
  ('sam3-formulas', 'SAM3', 'formelark', 'Formelark', 'Formler og makromodeller samlet for rask repetisjon.', 'Formelark', 'https://bhflashcards.no/sam3/formelark.html', 'bhflashcards', true, true, 20),
  ('sam3-models', 'SAM3', 'kompendium', 'Sentrale modeller', 'Solow, Romer, IS-MP, Phillips, AS-AD og åpen økonomi.', 'Modeller', 'https://bhflashcards.no/sam3/sentrale-modeller.html', 'bhflashcards', true, true, 30),
  ('sam3-exam-radar', 'SAM3', 'eksamen', 'Eksamensradar', 'Temaer og modellkoblinger fra tidligere eksamener.', 'Eksamen', 'https://bhflashcards.no/sam3/eksamensradar-v3.html', 'bhflashcards', true, true, 40),
  ('sam3-mock-exam', 'SAM3', 'eksamen', 'Mock-eksamen', 'Gjennomfør en realistisk prøveeksamen.', 'Prøveeksamen', 'https://bhflashcards.no/sam3/mock-eksamen.html', 'bhflashcards', true, true, 50),
  ('sam3-formula-quiz', 'SAM3', 'quiz', 'Formelquiz', 'Tren på riktig formel og modellvalg.', 'Quiz', 'https://bhflashcards.no/sam3/formelquiz.html', 'bhflashcards', false, true, 60),
  ('met2-flashcards', 'MET2', 'flashcards', 'MET2 flashcards', 'Metode, tester og regresjon i kortformat.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=met2', 'bhflashcards', true, true, 10),
  ('mat10-flashcards', 'MAT10', 'flashcards', 'MAT10 flashcards', 'Matematikk og formelvalg i kortformat.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=mat10', 'bhflashcards', true, true, 10),
  ('mat10-tasks', 'MAT10', 'oppgaver', 'Eksamensdrill', 'Oppgaver og metodevalg fra oppgavebanken.', 'Oppgaver', 'https://bhflashcards.no/user/oppgavebank.html?subject=MAT10', 'bhflashcards', true, true, 20),
  ('sam1a-flashcards', 'SAM1A', 'flashcards', 'SAM1A flashcards', 'Marked, elastisitet og velferdsanalyse.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=sam1a', 'bhflashcards', true, true, 10),
  ('met1-flashcards', 'MET1', 'flashcards', 'MET1 flashcards', 'Rente, nåverdi og annuitet i kortformat.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=met1', 'bhflashcards', true, true, 10),
  ('met1-tasks', 'MET1', 'oppgaver', 'Regneoppgaver', 'Oppgaver for finansmatematikk og formelvalg.', 'Oppgaver', 'https://bhflashcards.no/user/oppgavebank.html?subject=MET1', 'bhflashcards', true, true, 20),
  ('kom1-flashcards', 'KOM1', 'flashcards', 'Skrivekort', 'Problemstilling, analyseavsnitt og overganger.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=kom1', 'bhflashcards', true, true, 10),
  ('ret1a-flashcards', 'RET1A', 'flashcards', 'RET1A flashcards', 'Juridisk metode og sentrale rettsområder.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=ret1a', 'bhflashcards', true, true, 10),
  ('ret1a-tasks', 'RET1A', 'oppgaver', 'Eksamensøving', 'Tidligere eksamener og teorioppgaver.', 'Oppgaver', 'https://bhflashcards.no/user/oppgavebank.html?subject=RET1A', 'bhflashcards', true, true, 20),
  ('bed1-flashcards', 'BED1', 'flashcards', 'BED1 flashcards', 'Kalkyler, investering og budsjettering.', 'Flashcards', 'https://bhflashcards.no/flashcards/?subject=bed1', 'bhflashcards', true, true, 10),
  ('bed1-tasks', 'BED1', 'oppgaver', 'Eksamensoppgaver', 'Gamle eksamener og gruppeøvinger.', 'Oppgaver', 'https://bhflashcards.no/user/oppgavebank.html?subject=BED1', 'bhflashcards', true, true, 20)
on conflict (slug) do update set
  subject_code = excluded.subject_code,
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  badge = excluded.badge,
  href = excluded.href,
  source = excluded.source,
  featured = excluded.featured,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.kompass_content_blocks
  (key, area, eyebrow, title, body, cta_label, cta_href, metadata, published, sort_order)
values
  ('dashboard-welcome', 'dashboard', 'Din dag', 'God oversikt gir bedre arbeidsro', 'Se hva som skjer i dag, finn neste økt og gå rett videre til fagressursene du trenger.', 'Se ukeplanen', '#ukeplan', '{"tone":"navy"}'::jsonb, true, 10),
  ('dashboard-resources', 'dashboard', 'Fag og ressurser', 'Alt fra bhflashcards, samlet i Kompass', 'Flashcards, oppgavebank, eksamensanalyse, A-besvarelser, memoarer og notater ligger i samme arbeidsflyt.', 'Åpne fagbiblioteket', '#fag', '{"tone":"blue"}'::jsonb, true, 20),
  ('library-intro', 'library', 'Fagbibliotek', 'Finn riktig ressurs uten å lete', 'Velg et fag eller filtrer på flashcards, oppgaver, eksamen, kompendium og memoar.', '', null, '{"tone":"light"}'::jsonb, true, 10),
  ('study-plan-intro', 'study-plan', 'Studieplan', 'Planlegg semesteret, ikke bare dagen', 'Kombiner undervisning, egenstudie, obligatoriske aktiviteter og eksamensforberedelser i én plan.', '', null, '{"tone":"mint"}'::jsonb, true, 10)
on conflict (key) do update set
  area = excluded.area,
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  metadata = excluded.metadata,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

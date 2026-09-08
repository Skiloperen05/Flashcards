-- ============================================================
-- Subject Studio — admin-editable subject pages
--
-- Introduces the single source of truth used by the Admin-hub
-- ("Fagstudio") and the student-facing subject shell
-- (subject/index.html). Replaces the ad-hoc admin_content /
-- localStorage blobs used by the previous prototype.
--
-- Tables:
--   public.subject_pages         one row per subject_code
--   public.subject_page_blocks   ordered content blocks per section
--   public.subject_files         PDFs / attachments stored in Storage
--
-- Storage bucket:
--   subject-files                private, 50MB, PDF/Office/image/text
--
-- Access model:
--   - Public catalog metadata (name, kicker, icon, accent, visibility)
--     is readable by every authenticated user, so the shop, sidebar
--     and dashboards can list subjects without buying them.
--   - Rich content (blocks + files) is only readable by users who
--     hold a subject entitlement (has_subject_entitlement helper),
--     matching the answer_packages pattern.
--   - Admins (profiles.is_admin=true) can insert/update/delete
--     everything.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Subject pages: one row per subject_code
-- ------------------------------------------------------------
create table if not exists public.subject_pages (
  subject_code       text primary key,
  name               text not null,
  kicker             text not null default '',
  icon               text not null default '📚',
  accent             text not null default '#2563eb',
  category_id        text not null default 'electives',
  status_text        text not null default 'Aktiv',
  progress_percent   integer not null default 0 check (progress_percent between 0 and 100),
  lead               text not null default '',
  next_step          text not null default '',
  memo_intro         text not null default '',
  memo_exam          text not null default '',
  memo_study_advice  text not null default '',
  visibility         jsonb not null default jsonb_build_object(
    'radar', true, 'answers', true, 'notes', true, 'tasks', true,
    'flashcards', true, 'topics', true, 'plan', true, 'overview', true
  ),
  flashcards_url     text not null default '',
  flashcards_kicker  text not null default '',
  is_published       boolean not null default true,
  origin             text not null default 'custom' check (origin in ('builtin', 'custom')),
  created_by         uuid references auth.users(id),
  updated_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists subject_pages_category_idx
  on public.subject_pages(category_id, subject_code);
create index if not exists subject_pages_published_idx
  on public.subject_pages(is_published) where is_published;

alter table public.subject_pages enable row level security;

-- Read: any authenticated user sees published catalog metadata.
drop policy if exists "Read published subject pages" on public.subject_pages;
create policy "Read published subject pages"
  on public.subject_pages
  for select
  to authenticated
  using (is_published or exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

drop policy if exists "Admins manage subject pages" on public.subject_pages;
create policy "Admins manage subject pages"
  on public.subject_pages
  for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

-- Keep updated_at fresh automatically.
create or replace function public.subject_pages_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_subject_pages_touch on public.subject_pages;
create trigger trg_subject_pages_touch
  before update on public.subject_pages
  for each row execute function public.subject_pages_touch();

-- ------------------------------------------------------------
-- 2. Content blocks: topics / plan / radar / tips / formula ...
-- ------------------------------------------------------------
create table if not exists public.subject_page_blocks (
  id            uuid primary key default gen_random_uuid(),
  subject_code  text not null references public.subject_pages(subject_code) on delete cascade,
  section       text not null check (section in (
    'topics', 'plan', 'radar', 'tips', 'formula', 'compendium', 'checklist'
  )),
  sort_order    integer not null default 0,
  title         text not null default '',
  body          text not null default '',
  weight        text not null default '',
  priority      text not null default '',
  meta          jsonb not null default '{}'::jsonb,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists subject_page_blocks_section_idx
  on public.subject_page_blocks(subject_code, section, sort_order);

alter table public.subject_page_blocks enable row level security;

drop policy if exists "Read blocks if entitled" on public.subject_page_blocks;
create policy "Read blocks if entitled"
  on public.subject_page_blocks
  for select
  to authenticated
  using (public.has_subject_entitlement(subject_code));

drop policy if exists "Admins manage blocks" on public.subject_page_blocks;
create policy "Admins manage blocks"
  on public.subject_page_blocks
  for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

create or replace function public.subject_page_blocks_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_subject_page_blocks_touch on public.subject_page_blocks;
create trigger trg_subject_page_blocks_touch
  before update on public.subject_page_blocks
  for each row execute function public.subject_page_blocks_touch();

-- ------------------------------------------------------------
-- 3. Files uploaded per subject (answers / memos / tasks / attachments)
-- ------------------------------------------------------------
create table if not exists public.subject_files (
  id              uuid primary key default gen_random_uuid(),
  subject_code    text not null references public.subject_pages(subject_code) on delete cascade,
  kind            text not null check (kind in ('answer', 'memo', 'task', 'attachment')),
  term            text not null default '',
  grade           text not null default '',
  title           text not null default '',
  description     text not null default '',
  body            text not null default '',
  storage_bucket  text,
  storage_path    text,
  external_url    text not null default '',
  size_bytes      bigint,
  mime_type       text,
  sort_order      integer not null default 0,
  meta            jsonb not null default '{}'::jsonb,
  uploaded_by     uuid references auth.users(id),
  uploaded_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists subject_files_subject_kind_idx
  on public.subject_files(subject_code, kind, sort_order);

alter table public.subject_files enable row level security;

drop policy if exists "Read files if entitled" on public.subject_files;
create policy "Read files if entitled"
  on public.subject_files
  for select
  to authenticated
  using (public.has_subject_entitlement(subject_code));

drop policy if exists "Admins manage files" on public.subject_files;
create policy "Admins manage files"
  on public.subject_files
  for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin = true
  ));

create or replace function public.subject_files_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_subject_files_touch on public.subject_files;
create trigger trg_subject_files_touch
  before update on public.subject_files
  for each row execute function public.subject_files_touch();

-- ------------------------------------------------------------
-- 4. Storage bucket for subject_files
--    Path convention: {subject_code}/{file_id}-{slug}.pdf
--    Entitlement check keys off the first path segment.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subject-files',
  'subject-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read subject files if entitled" on storage.objects;
create policy "Read subject files if entitled"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'subject-files'
    and public.has_subject_entitlement(upper(split_part(storage.objects.name, '/', 1)))
  );

drop policy if exists "Admins manage subject files" on storage.objects;
create policy "Admins manage subject files"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'subject-files'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true)
  )
  with check (
    bucket_id = 'subject-files'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin = true)
  );

-- ------------------------------------------------------------
-- 5. Seed the 11 built-in subjects so they are editable in the hub.
--    Data is mirrored from shared/subject-meta.js and
--    shared/subject-page-data.js.
-- ------------------------------------------------------------
insert into public.subject_pages
  (subject_code, name, kicker, icon, accent, category_id, status_text, progress_percent, lead, next_step, memo_intro, memo_exam, memo_study_advice, origin)
values
  ('RET14', 'Skatterett', 'Skatt og eksamensdrøfting', '⚖️', '#2f62ff', 'electives',   'Aktiv',   0,  'Skatt, fradrag, aksjer, personinntekt, arv og eksamensanalyse.', 'Bruk metodekortene til å bygge trygg drøfting før eksamenspakkene.', 'RET14 handler om presis skattemetode, rettsgrunnlag og drøfting basert på faktum.', 'Eksamen belønner tydelig hjemmel, konkret subsumsjon og korte, presise konklusjoner.', 'Start med metodekort og formeloversikt, gå videre til eksamensoppgaver og A-besvarelser.', 'builtin'),
  ('SOL1',  'Organisasjonsatferd', 'Teori, case og teoriskriving', '🧠', '#20b97a', 'semester2',  'Aktiv',   0,  'Begreper, teorier, modeller, caseforståelse og teoriskriving.', 'Tren teoriskriving med korte drøftingsoppgaver før hele caseeksempler.', 'SOL1 knytter organisasjonsteori til case og eksamens-drøfting med tydelig struktur.', 'Sensor belønner presis teoribruk og at teorien brukes aktivt på casen, ikke gjengis frittstående.', 'Start med begrepskort, øv på teoriskriving og avslutt med A-besvarelsene.', 'builtin'),
  ('SAM2',  'Mikroøkonomi', 'Memoar, radar og oppgaver', '📈', '#f09828', 'semester2',  'Eksamen', 0,  'Memoar, oppgaveprioritering, eksamensradar, figurer og modellvalg.', 'Bruk memoaret som fasit før du sammenligner med sensorveiledningen.', 'SAM2 samler mikroøkonomi, memoar-inntak og eksamensrettet oppgavebank.', 'Eksamen krever figurforståelse, presis modellbruk og velvalgte forklaringer.', 'Start i memoaret, gå videre til oppgaver og til slutt A-besvarelsene.', 'builtin'),
  ('SAM3',  'Makroøkonomi', 'Makromodeller og mock-eksamen', '🌍', '#ef4444', 'semester4',  'Aktiv',   0,  'Makromodeller, formler, quiz, eksamensradar og mock-eksamen.', 'Kjør mock-eksamen etter formeldrill og modellrepetisjon.', 'SAM3 dekker makromodeller, tolkning av tallmateriale og drøfting i eksamensformat.', 'Sensor belønner sammenheng mellom modell, tall og økonomisk tolkning.', 'Start med formelark, quiz og modeller, gå videre til mock-eksamen og pakker.', 'builtin'),
  ('MET2',  'Metode', 'Statistikk og metode', 'Σ', '#7c3aed', 'semester2', 'MVP',    28, 'Metode, statistikk, hypotesetesting, konfidensintervall og regresjon.', 'Fyll MET2 med kort fra notater, forelesninger og oppgavesett.', 'MET2 samler metode, statistikk og presis tolkning av usikkerhet, tester og regresjon.', 'Eksamen belønner både riktig fremgangsmåte og presist språk om p-verdi, konfidensintervall og regresjonsoutput.', 'Bruk begrepskort først, deretter oppgaver der du velger test og skriver konklusjon i kontekst.', 'builtin'),
  ('MAT10', 'Matematikk', 'Analyse og lineær algebra', '∫', '#0891b2', 'electives',  'MVP',    34, 'Formler, regneteknikk og eksamensnære økter for funksjoner, derivasjon, integrasjon, matriser og lineære systemer.', 'Bygg første komplette MAT10-kortpakke fra lokale forelesnings- og eksamensfiler.', 'MAT10 handler om å kjenne igjen riktig matematisk metode raskt og skrive ryddig nok til at regningen blir kontrollerbar.', 'Eksamen er typisk regnetung, med høy verdi i metodevalg, mellomregning og kort tolkning av svaret.', 'Start med formelark og korte metodekort før du bruker oppgavebanken til mer sammenhengende regneøkter.', 'builtin'),
  ('SAM1A', 'Mikroøkonomi intro', 'Første semester', '↗', '#f09828', 'semester1', 'Ny',     18, 'Grunnleggende samfunnsøkonomi med etterspørsel, tilbud, markedslikevekt, velferd og sentrale modeller fra læringsmålene.', 'Importere læringsmål og kompendium til kortpakker.', 'SAM1A er grunnmuren i mikro: marked, elastisitet, velferd og markedssvikt forklart med enkle modeller.', 'Eksamen krever ofte at figur, begrep og kort forklaring henger sammen i samme svar.', 'Begynn med læringsmålene, tren på standardskift i figurer, og bruk hurtigkort for å låse begrepene.', 'builtin'),
  ('MET1',  'Matematikk for økonomer', 'Første semester', '%', '#06b6d4', 'semester1', 'Ny',     22, 'Nåverdi, rente, rekker og grunnleggende metode samlet i en rolig treningsside for første semester.', 'Bygge kort fra MET1 NNV- og renteoppgaver.', 'MET1 handler om rente, nåverdi, annuitet og økonomisk matematikk der tid og kontantstrøm må holdes ryddig.', 'Eksamen tester typisk formelvalg, periodeforståelse og evnen til å konkludere fra tallene.', 'Start med rente- og NNV-kort, og bruk formelark som sjekkliste før lengre regneoppgaver.', 'builtin'),
  ('KOM1',  'Kommunikasjon', 'Første semester', '✎', '#e8bc68', 'semester1', 'Ny',     20, 'Skriving, presentasjon og akademisk kommunikasjon basert på rapporter, refleksjonstekster og presentasjonsmateriale.', 'Lage skrivekort fra KOM1-innleveringene.', 'KOM1 samler rapportskriving, presentasjon og akademisk kommunikasjon til praktiske skrivegrep.', 'Vurderingen handler ofte om struktur, presisjon, refleksjon og tydelig kobling mellom problemstilling og argumentasjon.', 'Bruk siden som skriveverksted: bygg disposisjon, øv på analyseavsnitt og repeter overganger før levering.', 'builtin'),
  ('RET1A', 'Juridiske emner', 'Første semester', '§', '#3b82f6', 'semester1', 'Eksamen', 24, 'Avtalerett, selskapsrett, pengekrav og eksamensdrøfting samlet i én fagside med juridisk metode i sentrum.', 'Strukturere RET1A-eksamensøving og teorioppgaver.', 'RET1A handler om juridisk metode i praksis: finne rettsregel, drøfte vilkår og bruke faktum presist.', 'Eksamen belønner ryddig struktur, tydelige delkonklusjoner og konkret subsumsjon fremfor lange generelle utlegninger.', 'Tren først på metodekortene, deretter på gamle oppgaver med samme faste drøftingsmal.', 'builtin'),
  ('BED1',  'Bedriftsøkonomi', 'Første semester', '◆', '#20b97a', 'semester1', 'Eksamen', 26, 'Resultat, kalkyler, investering, budsjettering og eksamensoppgaver samlet som første-semester økonomitrening.', 'Bygge BED1-kort fra eksamens- og gruppeøvingsfilene.', 'BED1 samler kalkyler, resultat, investering og budsjettering i beslutninger som må regnes og forklares.', 'Eksamen er ofte poengtung på standardoppsett, riktige kostnadsbegreper og en kort økonomisk anbefaling.', 'Start med begreper og formler, gå videre til korte regnedriller, og avslutt med gamle eksamensoppgaver.', 'builtin')
on conflict (subject_code) do update
  set name              = excluded.name,
      kicker            = excluded.kicker,
      icon              = excluded.icon,
      accent            = excluded.accent,
      category_id       = excluded.category_id,
      status_text       = excluded.status_text,
      progress_percent  = excluded.progress_percent,
      lead              = excluded.lead,
      next_step         = excluded.next_step,
      memo_intro        = excluded.memo_intro,
      memo_exam         = excluded.memo_exam,
      memo_study_advice = excluded.memo_study_advice,
      origin            = 'builtin';

-- Seed topic and plan blocks. Only insert when the subject has no blocks
-- of that section yet, so re-running the migration will not duplicate
-- rows that an admin has already customised.
do $$
declare
  seed_blocks jsonb := jsonb_build_object(
    'RET14', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Formuesskatt og fradrag', 'body', 'Skattepliktig inntekt, fradragsregler og hjemmelbruk.', 'weight', '82%'),
        jsonb_build_object('title', 'Aksjer og aksjonær',      'body', 'Utbytte, gevinst, skjerming og aksjonærmodellen.',    'weight', '75%'),
        jsonb_build_object('title', 'Personinntekt og arv',    'body', 'Trygdeavgift, arv, gaveregler og typiske fallgruver.', 'weight', '65%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Metodekort',    'body', 'Trene på rettsregel, vilkår og subsumsjon.', 'weight', '20 min'),
        jsonb_build_object('title', '2. Regneøkter',    'body', 'Fradrag, skatteberegning og aksjeutbytte.',   'weight', '30 min'),
        jsonb_build_object('title', '3. Eksamensdrill', 'body', 'Gamle eksamensoppgaver med A-besvarelser.',    'weight', '45 min')
      )
    ),
    'SOL1', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Motivasjonsteori og ledelse', 'body', 'Behovsteori, forventningsteori, transformasjons- og transaksjonsledelse.', 'weight', '80%'),
        jsonb_build_object('title', 'Gruppedynamikk og team',      'body', 'Rolleteori, gruppeutvikling, konflikthåndtering.',                        'weight', '72%'),
        jsonb_build_object('title', 'Endring og kultur',           'body', 'Organisasjonskultur, endringsledelse, motstand og læring.',              'weight', '68%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Begrepskort',     'body', 'Definer sentrale teorier og modeller.',                'weight', '20 min'),
        jsonb_build_object('title', '2. Case-øving',      'body', 'Bruk teori på små case for teoriskriving.',            'weight', '30 min'),
        jsonb_build_object('title', '3. A-besvarelsene',  'body', 'Analyser struktur og teoribruk i sensorroste svar.',   'weight', '40 min')
      )
    ),
    'SAM2', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Konsument- og produsentteori', 'body', 'Nyttemaksimering, kostnadsminimering og markedslikevekt.', 'weight', '82%'),
        jsonb_build_object('title', 'Markedsformer',                'body', 'Fullkommen konkurranse, monopol og oligopol.',           'weight', '76%'),
        jsonb_build_object('title', 'Velferd og markedssvikt',      'body', 'Overskuddsanalyse, eksternaliteter og virkemidler.',    'weight', '68%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Memoar',      'body', 'Les gjennom hovedtemaene i rekkefølge.',              'weight', '25 min'),
        jsonb_build_object('title', '2. Oppgaver',    'body', 'Kjør prioriterte oppgaver med figurforklaring.',      'weight', '35 min'),
        jsonb_build_object('title', '3. A-besvarelse','body', 'Sammenlign egen løsning mot sensorveiledningen.',     'weight', '30 min')
      )
    ),
    'SAM3', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'IS/LM og AS/AD-modeller',  'body', 'Modellsammenhenger, skift og tolkning.', 'weight', '85%'),
        jsonb_build_object('title', 'Pengepolitikk og inflasjon', 'body', 'Rentesetting, transmisjon og inflasjonsmål.', 'weight', '78%'),
        jsonb_build_object('title', 'Åpen økonomi',             'body', 'Valutakurser, handelsbalanse og kapitalflyt.', 'weight', '70%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Formelark',      'body', 'Repeter kjerneformler og definisjoner.',              'weight', '15 min'),
        jsonb_build_object('title', '2. Quiz og modeller','body', 'Bruk quizzen til å låse modellsammenhenger.',        'weight', '30 min'),
        jsonb_build_object('title', '3. Mock-eksamen',   'body', 'Gjør en full mock-eksamen mot tiden.',                'weight', '90 min')
      )
    ),
    'MET2', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Hypotesetesting',      'body', 'Må sitte presist',        'weight', '78%'),
        jsonb_build_object('title', 'Konfidensintervall',   'body', 'Standard eksamensgrep',    'weight', '70%'),
        jsonb_build_object('title', 'Regresjon og tolkning','body', 'Høy praktisk verdi',       'weight', '64%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Begrepskort', 'body', 'Få presisjon i språk og definisjoner.',   'weight', '20 min'),
        jsonb_build_object('title', '2. Testvalg',    'body', 'Velg riktig metode ut fra oppgavetekst.', 'weight', '25 min'),
        jsonb_build_object('title', '3. Regresjon',   'body', 'Tolk output og begrunn modellvalg.',      'weight', '35 min')
      )
    ),
    'MAT10', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Derivasjon og optimering',       'body', 'Høy eksamensverdi',      'weight', '86%'),
        jsonb_build_object('title', 'Integrasjon og areal',           'body', 'Mange standardgrep',     'weight', '72%'),
        jsonb_build_object('title', 'Matriser og lineære systemer',   'body', 'Krever repetisjon',      'weight', '68%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Formelbank',      'body', 'Start med regler og typiske fallgruver.',    'weight', '15 min'),
        jsonb_build_object('title', '2. Regneøkter',      'body', 'Løs korte oppgaver med fasitnær tenkning.',   'weight', '30 min'),
        jsonb_build_object('title', '3. Eksamensdrill',   'body', 'Prioriter gamle eksamensoppgaver.',           'weight', '45 min')
      )
    ),
    'SAM1A', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Markedslikevekt',  'body', 'Kjerne i faget',                       'weight', '82%'),
        jsonb_build_object('title', 'Elastisitet',      'body', 'Regne- og tolkningsoppgaver',           'weight', '70%'),
        jsonb_build_object('title', 'Velferdsanalyse',  'body', 'Modellforståelse',                      'weight', '62%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Læringsmål',   'body', 'Oversett hvert mål til spørsmål.',         'weight', '20 min'),
        jsonb_build_object('title', '2. Modellkort',   'body', 'Tegn og forklar standardskift.',          'weight', '25 min'),
        jsonb_build_object('title', '3. Oppgaver',     'body', 'Koble kort til eksamensstil.',            'weight', '30 min')
      )
    ),
    'MET1', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Nåverdi',          'body', 'Svært sentralt',           'weight', '88%'),
        jsonb_build_object('title', 'Annuitet',         'body', 'Typisk eksamen',           'weight', '76%'),
        jsonb_build_object('title', 'Effektiv rente',   'body', 'Presis formelbruk',        'weight', '66%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Formelvalg',   'body', 'Kjenn igjen oppgavetypen.',        'weight', '15 min'),
        jsonb_build_object('title', '2. NNV-oppgaver', 'body', 'Regn korte sett.',                 'weight', '30 min'),
        jsonb_build_object('title', '3. Feilbank',     'body', 'Samle vanlige glipper.',           'weight', '10 min')
      )
    ),
    'KOM1', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Problemstilling',    'body', 'Må være skarp',       'weight', '78%'),
        jsonb_build_object('title', 'Rapportstruktur',    'body', 'Avgjørende for flyt', 'weight', '74%'),
        jsonb_build_object('title', 'Presentasjon',       'body', 'Muntlig levering',    'weight', '63%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Struktur',   'body', 'Lag disposisjon før skriving.',   'weight', '20 min'),
        jsonb_build_object('title', '2. Belegg',     'body', 'Koble på kilder og data.',        'weight', '25 min'),
        jsonb_build_object('title', '3. Språk',      'body', 'Stram inn formuleringer.',        'weight', '15 min')
      )
    ),
    'RET1A', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Avtalerett',     'body', 'Hyppig eksamenstema',           'weight', '80%'),
        jsonb_build_object('title', 'Pengekrav',      'body', 'Vilkårsdrøfting',               'weight', '72%'),
        jsonb_build_object('title', 'Selskapsrett',   'body', 'Teori og anvendelse',           'weight', '62%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Rettsregel',   'body', 'Memorer vilkår og unntak.',       'weight', '20 min'),
        jsonb_build_object('title', '2. Subsumsjon',   'body', 'Bruk faktum aktivt.',             'weight', '30 min'),
        jsonb_build_object('title', '3. Konklusjon',   'body', 'Skriv presist og kort.',          'weight', '10 min')
      )
    ),
    'BED1', jsonb_build_object(
      'topics', jsonb_build_array(
        jsonb_build_object('title', 'Produktkalkulasjon',    'body', 'Svært eksamensnært',         'weight', '84%'),
        jsonb_build_object('title', 'Investering',           'body', 'Regning og vurdering',       'weight', '73%'),
        jsonb_build_object('title', 'Budsjettering',         'body', 'Helhetsforståelse',          'weight', '65%')
      ),
      'plan', jsonb_build_array(
        jsonb_build_object('title', '1. Begreper',    'body', 'Skill mellom kostnadstyper.',   'weight', '15 min'),
        jsonb_build_object('title', '2. Regnedrill',  'body', 'Løs korte standardoppgaver.',    'weight', '35 min'),
        jsonb_build_object('title', '3. Eksamen',     'body', 'Tren på gamle sett.',            'weight', '45 min')
      )
    )
  );
  subj_key text;
  section_key text;
  items jsonb;
  item jsonb;
  idx integer;
begin
  for subj_key in select jsonb_object_keys(seed_blocks) loop
    for section_key in select jsonb_object_keys(seed_blocks -> subj_key) loop
      if exists (
        select 1 from public.subject_page_blocks
        where subject_code = subj_key and section = section_key
      ) then
        continue;
      end if;
      items := seed_blocks -> subj_key -> section_key;
      idx := 0;
      for item in select value from jsonb_array_elements(items) loop
        insert into public.subject_page_blocks
          (subject_code, section, sort_order, title, body, weight)
        values (
          subj_key,
          section_key,
          idx,
          coalesce(item ->> 'title', ''),
          coalesce(item ->> 'body', ''),
          coalesce(item ->> 'weight', '')
        );
        idx := idx + 1;
      end loop;
    end loop;
  end loop;
end $$;

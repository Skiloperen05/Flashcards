-- MET3 content registration, after the subject-studio schema migration.
-- Idempotent: existing catalogue entries and administrator edits are preserved.
-- Uses the app's existing access and default pricing rules.
begin;

insert into public.app_subjects
  (code, name, description, category_id, accent, icon, emblem, path, flashcards_path, status, published, sort_order)
values
  ('MET3', 'Databehandling for økonomer',
   'Excel-formler, formelvalg, praktiske modeller og Power Query fra MET3-oversikten.',
   'semester3', '#15803d', 'ƒ', '../assets/emblems/MET3.png', '../met3/', '../flashcards/?subject=met3', 'active', true, 30)
on conflict (code) do update set emblem = excluded.emblem;

insert into public.subject_pages
  (subject_code, name, kicker, icon, accent, category_id, status_text, lead, next_step,
   memo_intro, memo_exam, memo_study_advice, visibility, flashcards_url, flashcards_kicker, is_published, origin)
values
  ('MET3', 'Databehandling for økonomer', 'Excel · tredje semester', 'ƒ', '#15803d', 'semester3', 'Klar',
   '146 kildebaserte flashcards i 13 temadekk: syntaks, formelvalg, fallgruver og praktiske modeller.',
   'Start med grunnlag og summering. Kombiner flere dekk når formlene sitter.',
   'Excel-delen av MET3, basert på den oppgitte Excel-formeloversikten.',
   'Pakken dekker oversikten, ikke en garanti for hele pensumet. NPV, IRR og SUBTOTAL er supplerende.',
   'Skriv formelen selv før du snur kortet. Marker Igjen, Vanskelig eller Bra og repeter etter økten.',
   '{"overview":true,"radar":false,"answers":false,"notes":false,"tasks":false,"flashcards":true,"topics":true,"plan":true}'::jsonb,
   '../flashcards/?subject=met3', '13 temadekk · 146 kort · kombiner dekk og velg rekkefølge', true, 'builtin')
on conflict (subject_code) do nothing;

insert into public.subject_page_blocks (subject_code, section, sort_order, title, body, meta)
select 'MET3', seed.section, seed.sort_order, seed.title, seed.body, seed.meta::jsonb
from (values
  ('topics', 1, 'Grunnlag og syntaks', 'Cellereferanser, summering, datoer og operatorer.', '{}'),
  ('topics', 2, 'Funksjonsvalg', 'Vilkår, logikk, oppslag, lister og kontroll.', '{}'),
  ('topics', 3, 'Praktiske modeller', 'Lån, vekst, kontantstrøm, energi og Power Query.', '{}'),
  ('plan', 1, '1. Grunnlaget', 'Skriv egne formler for referanser og summering.', '{"duration":"10 min"}'),
  ('plan', 2, '2. Kombiner temaer', 'Velg dekk, vanskelighetsgrad og rekkefølge i øvingen.', '{"duration":"15 min"}'),
  ('plan', 3, '3. Bruk formlene', 'Løs modellkort og repeter Igjen og Vanskelig.', '{"duration":"20 min"}')
) as seed(section, sort_order, title, body, meta)
where not exists (
  select 1 from public.subject_page_blocks existing
  where existing.subject_code = 'MET3' and existing.section = seed.section
);

commit;

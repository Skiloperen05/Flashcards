# Project Map

Last updated: 2026-07-03

Purpose: make future app changes faster by documenting the stable entry points, data sources, and search paths. Update this file whenever a change moves, renames, adds, or removes app-facing functionality.

## Maintenance Rule

- Any app change that affects routes, shared scripts, subject pages, Supabase tables, package/data locations, build/test commands, or published resources must update this file in the same change.
- Keep this file concise and accurate. Prefer pointers to the source of truth over duplicating implementation details.
- If a feature has both legacy code and a newer data source, mark which one is active.

## App Shape

- Static web app deployed from this repository.
- Deployment: `bhflashcards.no` is served by GitHub Pages (no serverless functions). The same repo also deploys to Netlify (`bhflashcards.netlify.app`), which hosts the Netlify functions. Client code that calls `/.netlify/functions/*` must use the absolute Netlify origin when the page is not served from Netlify/localhost (see `functionsBase()` in `user/butikk.html`).
- Main public landing page: `index.html`.
- Login/auth entry: `login.html`.
- Authenticated user pages: `user/`.
- Subject pages: one folder per subject, for example `sam3/`, `sam2/`, `ret14/`, `sol1/`.
- Shared behavior, data, styling, and page enhancement scripts: `shared/`.
- Supabase setup/schema seed reference: `supabase-setup.sql`.
- Supabase Edge Functions: `supabase/functions/`.
- Netlify config and functions: `netlify.toml`, `netlify/functions/`.
- Stripe checkout/webhook functions: `netlify/functions/create-stripe-checkout.js`, `netlify/functions/stripe-webhook.js`.

## User Pages

- Dashboard: `user/index.html`.
- Subject management: `user/subjects.html`.
- Personal subject ratings on `user/subjects.html` use `localStorage` key `hf_subject_ratings_v1` as a cache and sync to `user_custom_data.data.subjectRatings` after auth.
- Shop/entitlement claiming and Stripe checkout entry: `user/butikk.html`.
- Exam analysis hub (all subjects, entitlement-aware): `user/eksamensanalyse.html`. Cards are built from `shared/subject-meta.js` + the `eksamen` resources in `shared/subject-resources.js`; the sidebar "Eksamensanalyse" item points here (was previously hardcoded to `ret14/eksamen/`).
- A-besvarelser / eksamensarkiv shell: `user/a-besvarelser.html`.
- Oppgavebank shell: `user/oppgavebank.html`.
- Study plan shell: `user/studieplan.html`.
- Notes/settings/progress/achievements: `user/notater.html`, `user/settings.html`, `user/progress.html`, `user/achievements.html`.
- User-page loader/enhancer: `user/auth-guard.js`.

## Shared Core Scripts

- Auth/session/client bootstrap: `shared/auth-guard.js`.
- Entitlements and subject access: `shared/entitlements.js`, `shared/subject-access.js`, `shared/subject-gate.js`.
- Subject metadata: `shared/subject-meta.js`.
- Generated learning content contract: `shared/learning-content.js` exposes `window.HaugnesLearningContent`.
- Subject page rendering/data/enhancements: `shared/subject-page-renderer.js`, `shared/subject-page-data.js`, `shared/subject-page-enhancements.js`, `shared/subject-resources.js`.
- Dashboard dynamic progress/recommendations and some legacy SAM3 package pointers: `shared/haugnes-dashboard-progress.js`.
- A-besvarelser / eksamensarkiv dynamic package UI: `shared/haugnes-answer-library.js`.
- User sidebar normalization: `shared/user-sidebar.js`.
- TimeEdit/NHH schedule integration: `shared/timeedit-fetch-proxy.js`, `shared/nhh-schedule-api.js`, `shared/nhh-schedule-normalizer.js`, `shared/nhh-strict-course-filter.js`, `shared/haugnes-studyplan.js`.
- Flashcard session shared logic: `shared/haugnes-flashcard-session.js`, `shared/haugnes-flashcards-structure.js`.

## Learning Content Platform

- Editable source catalog: `data/learning-content.json`.
- Generated browser contract: `shared/learning-content.js`.
- Generator and validator: `scripts/generate-learning-content.mjs`.
- Local source scanner for PDF/DOCX/PPTX/TXT/HTML/XLSX metadata: `scripts/import-learning-sources.mjs`.
- Generated local source indexes use `data/*.generated.json` and are gitignored because they may include local file paths/snippets.
- Public contract name: `window.HaugnesLearningContent`.
- Contract fields: `subjects`, `sources`, `decks`, `questions`, `examAnalyses`, `formulaItems`, `learningPaths`, `memos`, `recommendations`.
- Subject catalog entries include the active personalization fields `toolProfile`, `primaryTools`, `qualityStatus`, `qualityTarget`, `personalNotes`, `personalWarnings`, and `preferredStudyMethod`.
- V1 planning field: top-level `v1` stores the shared V1 target and marks deep subject content as pending joint build.
- Source entries include `sourceRole` so Canvas exports, personal notes, memoarer, protected exam packs, local exercises, spreadsheets, and owned assignments can be treated differently by imports and UI.
- Contract helpers include `sourcesFor`, `decksFor`, `questionsFor`, `analysisFor`, `formulaItemsFor`, `learningPathFor`, `toolsFor`, `qualityFor`, `personalMemoFor`, `sourceRolesFor`, `memoFor`, `recommendationFor`, `notes`, and `pageFor`.
- V1 content rule: subjects can keep `qualityTarget: "exam_ready"` while content is pending; any subject actually marked `qualityStatus: "exam_ready"` must validate with at least 25 catalog cards, 8 catalog questions, a memo, a recommendation, a learning path, method/formula items, and exam radar.
- Active integration points:
  - `shared/haugnes-study-data.js` merges generated decks/questions/notes with legacy manual data.
  - `shared/subject-page-data.js` supplements or creates fagsider from `pageFor` and lets catalog `primaryTools`/personal study guidance drive the main subject-tool grid.
  - `shared/subject-page-renderer.js` renders personal arbeidsmåte/fallgruver from the generated catalog inside the learning suite.
  - `shared/subject-meta.js` decorates subject cards from catalog quality/counts when `shared/learning-content.js` is available.
  - `shared/haugnes-dashboard-progress.js` reads catalog recommendations before legacy fallback.
  - `shared/auth-guard.js` injects `shared/learning-content.js` for user pages.
- Rights rule: local Canvas/course files remain private source metadata until explicitly reviewed for publication.

## Subject Areas

- `sam3/`: SAM3 Makroøkonomi hub, flashcards, formula quiz, mock exam, models, model PDFs, and exam radar.
- `sam3/eksamenspakker/`: local SAM3 exam package PDFs. Current known package: `v26/` with exam, A-besvarelse, and sensorveiledning PDFs.
- `sam2/`: SAM2 Mikroøkonomi hub, memoar, exam radar, oppgaver, and clickable task bank.
- `sam2/memoar/`: SAM2 memoar page plus downloadable source DOCX (`SAM2-memoar.docx`). First SAM2 unlock redirects to `sam2/?memoar=ny`.
- `ret14/`: RET14 Skatterett hub, exam radar, pensum, quiz, and progress.
- `sol1/`: SOL1 subject pages and flashcard data.
- `sam1a/`, `met1/`, `kom1/`, `ret1a/`, `bed1/`, `mat10/`, `met2/`: MVP or planned subject hubs.
- `flashcards/`: generic flashcard app entry.
- Flashcard admin/custom content in `flashcards/index.html` is loaded from Supabase `admin_content` key `flashcards_custom_data`, with `localStorage` key `fc_custom_data` as cache/fallback.

## A-besvarelser / Exam Packages

Active UI:
- Shell page: `user/a-besvarelser.html`.
- Dynamic package renderer: `shared/haugnes-answer-library.js`.
- Data source: Supabase tables `answer_packages` and `answer_resources`.
- Schema, RLS policies, and seed reference: `supabase-setup.sql`.

Important behavior:
- The renderer fetches packages/resources from Supabase after auth and entitlement checks.
- PDF URLs are intended to stay in Supabase-protected metadata, not hardcoded in public client bundles, unless a package is intentionally local/public.
- Legacy V25 SAM3 Google Drive links also exist in `shared/haugnes-dashboard-progress.js`.
- Local SAM3 V26 PDFs currently live under `sam3/eksamenspakker/v26/`.

Typical package IDs:
- Package: `sam3-v26`.
- Resources: `sam3-v26-exam`, `sam3-v26-answer`, `sam3-v26-sensor`.

## Supabase

- Project URL in client code: `shared/auth-guard.js`.
- Schema/source-of-truth file: `supabase-setup.sql`.
- Key content tables:
  - `profiles`
  - `subject_entitlements`
  - `admin_content`
  - `user_custom_data`
  - `answer_packages`
  - `answer_resources`
- RLS/entitlement helpers: `public.has_subject_entitlement(text)`, `public.has_any_entitlement()` (security definer; required because the free-claim insert policy cannot query `subject_entitlements` directly without infinite RLS recursion).
- Payment model: first user-claimed free subject is inserted client-side with `source = 'free'`; paid subjects are inserted by the Stripe webhook with `source = 'stripe'` and optional Stripe session/customer/payment metadata.
- Rule from repo policy: DB schema changes must be mirrored in `supabase-setup.sql`.

## Build And Checks

- JS check: `npm run check:js`.
- Smoke check: `npm run check:smoke`.
- Learning content validation: `npm run check:learning`.
- Regenerate learning contract after editing `data/learning-content.json`: `npm run learning:generate`.
- Full check: `npm run check`.
- Known repo policy: `biome check` has preexisting failures and should not block unless the task specifically concerns Biome cleanup.

## Fast Search Recipes

- Find active code for A-besvarelser:
  `rg -n "answer_packages|answer_resources|HaugnesAnswerLibrary|a-besvarelser" .`
- Find subject metadata or access logic:
  `rg -n "HaugnesSubjects|HaugnesSubjectAccess|subject-meta|subject-access" shared user`
- Find generated learning content usage:
  `rg -n "HaugnesLearningContent|learning-content|check:learning|learning:generate" data shared scripts user flashcards`
- Find SAM3 package references:
  `rg -n "sam3-v|SAM3 V|eksamenspakker|A-besvarelse SAM3|sensorveiledning" .`
- Find injected scripts:
  `rg -n "addScript|createElement\\('script'\\)|script.src" user shared`
- Find Supabase schema/data references:
  `rg -n "create table|answer_packages|answer_resources|has_subject_entitlement|from\\('" . supabase-setup.sql shared user`
- Find user-page route/navigation changes:
  `rg -n "MODEL_PAGES|nav-link|installModelPageLinks|Dashboard|A-besvarelser" user shared`

## Update Checklist

When changing the app:

1. Identify whether the change affects a route, shared script, subject page, Supabase table, package location, or test command.
2. Update the relevant section in this file before finishing.
3. If Supabase schema/data shape changed, also update `supabase-setup.sql`.
4. If new PDFs/resources are added, record their folder and active data source here.
5. Run the relevant checks and mention any checks that could not be run.

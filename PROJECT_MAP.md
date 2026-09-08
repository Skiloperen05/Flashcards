# Project Map

Last updated: 2026-09-08 (Google Drive proxy hardening — API-key file removed)

Purpose: make future app changes faster by documenting the stable entry points, data sources, and search paths. Update this file whenever a change moves, renames, adds, or removes app-facing functionality.

## Maintenance Rule

- Any app change that affects routes, shared scripts, subject pages, Supabase tables, package/data locations, build/test commands, or published resources must update this file in the same change.
- Keep this file concise and accurate. Prefer pointers to the source of truth over duplicating implementation details.
- If a feature has both legacy code and a newer data source, mark which one is active.

## App Shape

- Static web app deployed from this repository.
- Local and container development/serving: `server.js` using Express on port 3000, serving root static assets with clean HTML extension routing and mounting `/api/timeedit` and `/api/drive`.
- Google Drive 5 TB Storage Backend: Secure server-side streaming proxy at `/api/drive` (`api/drive.js`). Allows using Google Drive storage for heavy subject PDFs (A-besvarelser, forelesningsnotater, oppgavepakker) while the lighter Supabase Storage bucket keeps structured uploads. Both storage paths sit behind the same paywall (`subject_entitlements` + subject-specific check). Streams bytes to entitled students via the admin's cached OAuth token; raw Google Drive URLs and file IDs are never exposed to the client (`shared/subjects-studio.js` redacts `storage_path`/`meta.drive_id` for non-admin callers). Admin authoring in `user/admin.html` connects via Google Identity Services (GIS) with `drive.readonly` scope, real-time Drive file search, and 1-click file attachment. **Security rules:** Drive files MUST be shared privately (only with the admin's connected Google account) — never «Anyone with the link». The proxy has no API-key fallback for public files on purpose. All Google credentials are env-only (`GOOGLE_API_KEY` reserved for future use); the previously committed `firebase-applet-config.json` is deleted and .gitignore'd — its API key must be rotated in Google Cloud Console.
- Local development auth bypass: Append `?dev=1` on localhost/127.0.0.1 (e.g. `http://localhost:3000/user/?dev=1`) to simulate an authenticated student (`dev@student.local`) without Supabase credentials.
- GitHub Pages is the active frontend host for `bhflashcards.no`: no build command, publish/output directory `.`.
- The new Kompass app is the active successor being built in Sites. Its source lives in the connected Sites repository, while this repository remains the source for legacy subject pages and the shared Supabase schema/migrations.
- Kompass has no paywall. Existing Stripe/commerce code remains legacy-only and is not used by the new Kompass clients.
- Main public landing page: `index.html`.
- Login/auth entry: `login.html`.
- Authenticated user pages: `user/`.
- Subject pages: one folder per subject, for example `sam3/`, `sam2/`, `ret14/`, `sol1/`.
- Subject app icons/emblems and A-besvarelser flow emblems: `assets/emblems/`, referenced from `shared/subject-meta.js` and `shared/haugnes-answer-library.js`.
- Shared behavior, data, styling, and page enhancement scripts: `shared/`.
- Supabase setup/schema seed reference: `supabase-setup.sql`.
- Supabase Edge Functions: `supabase/functions/`.
- Cloudflare Pages headers: `_headers`.
- Netlify is not an active deployment target; Netlify config/functions have been removed.
- Stripe checkout/webhook functions: `supabase/functions/create-stripe-checkout/`, `supabase/functions/stripe-webhook/`.

## User Pages

- Dashboard: `user/index.html`.
- Admin-hub & Fagstudio: `user/admin.html`. Sentral kontrollside for administratorer (`profiles.is_admin = true`) bygd på `shared/subjects-studio.js`. Redigerer alle fag (både innebygde og egne) fra én katalog med akkordeon-editor: fag-header (kode, navn, kicker, ikon, farge, semester), publisering, memo & studietips (intro/eksamen/studieråd), seksjonssynlighet-brytere, viktige temaer, anbefalt øvingsløp, eksamensradar (m/prioritet), A-besvarelser og forelesningsnotater med støtte for både Google Drive 5 TB skylagring og lokal PDF-opplasting til Supabase Storage (`subject-files` bucket), oppgavebank med trinnvis fasit, samt flashcard-innstillinger. Inkluderer live Google Drive-utforsker (GIS token client), forhåndsvisning i iframe (student- eller admin-visning) og førstegangs-migrering av gammel localStorage-data. Alle endringer publiseres umiddelbart til studenter med entitlement via Supabase Realtime.
- Subject management: `user/subjects.html`.
- Shop/entitlement claiming, Stripe checkout entry, discount field, and admin commerce editor for subjects, bundles, Vennepass, prices, and rabattkoder: `user/butikk.html`.
- Exam analysis catalog with only published/direct analysis links: `user/eksamensanalyse.html`.
- A-besvarelser / eksamensarkiv shell: `user/a-besvarelser.html`.
- Study plan shell: `user/studieplan.html`.
- Memoarer overview: `user/memoarer.html`.
- Notes/settings: `user/notater.html`, `user/settings.html`. Settings live in `localStorage` key `hf_user_settings_v2` and sync to Supabase `user_custom_data.data.settings`; they are applied app-wide by `shared/user-settings.js` (theme/identity) and `shared/haugnes-flashcard-session.js` (session behavior).
- Removed user pages: `user/oppgavebank.html` (erstattet av fagspesifikk oppgavebank direkte på hver fagside), `user/progress.html`, `user/achievements.html`.
- User-page loader/enhancer: `user/auth-guard.js`.

## Shared Core Scripts

- Auth/session/client bootstrap: `shared/auth-guard.js`.
- Entitlements and subject access: `shared/entitlements.js`, `shared/subject-access.js`, `shared/subject-gate.js`.
- Subject metadata: `shared/subject-meta.js`.
- Subject page rendering/data/enhancements: `shared/subject-page-renderer.js`, `shared/subject-page-data.js`, `shared/subject-page-enhancements.js`, `shared/subject-resources.js`.
- Subject Studio API (single source of truth for admin-editable subject pages): `shared/subjects-studio.js`. Reads/writes `subject_pages`, `subject_page_blocks` and `subject_files` (Storage bucket `subject-files`) in Supabase. Legacy localStorage keys (`hf_custom_subjects_v1`, `hf_custom_subject_pages_v1`, `hf_custom_packages_v1`, `hf_custom_memos_v1`, `hf_custom_tasks_v1`) are migrated once per admin and then untouched. Exposes `window.SubjectsStudio` (listSubjects/getSubject/upsertSubject/upsertBlock/reorderBlocks/deleteBlock/uploadFile/updateFile/deleteFile/signedUrl/subscribeChanges).
- Subject-page ↔ Studio bridge: `shared/subject-page-studio-bridge.js`. Patches `HaugnesSubjectPages.get`/`.savePage` so the student subject shell (`subject/index.html`) reads fresh data from Studio and inline edits are persisted to Supabase. Publishes signed PDF URLs to the existing renderer and re-renders on `haugnes:subject-studio-changed`.
- Dashboard dynamic progress/recommendations and some legacy SAM3 package pointers: `shared/haugnes-dashboard-progress.js`.
- A-besvarelser / eksamensarkiv dynamic package UI: `shared/haugnes-answer-library.js`.
- User sidebar normalization: `shared/user-sidebar.js`. It is the source of truth for the grouped left menu used across user/app pages: Hjem, Mine fag, Butikk, Studieplan, Eksamensanalyse, A-besvarelser, Memoarer, Notater, Alle flashcards, Innstillinger.
- Logo normalization: `shared/logo-normalizer.js`. Re-applies the logo image if later branding scripts clear an already normalized logo mark.
- Global user-settings applier: `shared/user-settings.js`. Loaded on every app page from `shared/auth-guard.js` (`loadGlobalPolish`). Reads `hf_user_settings_v2` (plus a one-shot pull from `user_custom_data.data.settings` when newer) and applies accent color, background theme, font-size scaling, reduced motion, high contrast, avatar/display name in sidebars, the friendly check-in banner, and hides recommendation panels when disabled. Exposes `window.HaugnesUserSettings`.
- TimeEdit/NHH schedule integration: `shared/timeedit-fetch-proxy.js`, `shared/nhh-schedule-api.js`, `shared/nhh-schedule-normalizer.js`, `shared/nhh-strict-course-filter.js`, `shared/haugnes-studyplan.js`. Runtime proxy targets are the local `/api/timeedit` endpoint (via `server.js` and `api/timeedit.js`) and the Supabase `timeedit` Edge Function.
- Flashcard session shared logic: `shared/haugnes-flashcard-session.js`, `shared/haugnes-flashcards-structure.js`. The session script also applies learning settings from `hf_user_settings_v2`: session length cap, default start filter (`startWith`), difficult-first ordering (`autoDiff`), exam-topic priority (`examMode`), and optional sound feedback.

## Subject Areas

- Deep/Dedicated Subject Hubs:
  - `sam3/`: SAM3 Makroøkonomi hub, flashcards, formula quiz, mock exam, models, model PDFs, and exam radar (`eksamensradar-v3.html`).
  - `sam3/eksamenspakker/`: local SAM3 exam package PDFs. Current known package: `v26/` with exam, A-besvarelse, and sensorveiledning PDFs.
  - `sam2/`: SAM2 Mikroøkonomi hub, memoar, exam radar, oppgaver, and clickable task bank (`oppgaver-klikkbar/`).
  - `sam2/memoar/`: SAM2 memoar page plus downloadable source DOCX (`SAM2-memoar.docx`). First SAM2 unlock redirects to `sam2/?memoar=ny`.
  - `ret14/`: RET14 Skatterett hub, exam radar (`eksamen/`), pensum (`pensum/`), quiz (`quiz/`), and progress (`progresjon/`).
  - `sol1/`: SOL1 subject pages, complete/advanced flashcards (`flashcards-2-avansert.html`, `flashcards-2-komplett.html`), and theory writing (`teorideler-teoriskriving.html`).
- Lightweight / Template Hubs (driven by `shared/subject-page-renderer.js` and `shared/learning-content.js`):
  - `sam1a/`, `met1/`, `kom1/`, `ret1a/`, `bed1/`, `mat10/`, `met2/`: Clean template subject hubs providing overview, learning tools, topics, recommended study paths, and flashcard links.
  - `subject/`: Universal dynamic subject shell (`subject/index.html`). Accepts query parameter `?id=<kode>` or `?subject=<kode>`. Renders all 6 subject shell modules (Fagoversikt, Eksamensradar, A-besvarelser, Forelesningsnotater, Oppgavebank, Flashcards) for newly created and existing courses. Injects a top admin toolbar when viewed by an administrator, med direkte in-page CRUD-redigering for «Viktige temaer» og «Anbefalt øvingsløp», samt live preview-visningsbryter (Admin-modus vs. Studentvisning).
- Generic Flashcard Application:
  - `flashcards/`: generic flashcard app entry (`flashcards/index.html`). Supports parameters `?subject=<id>` (e.g. `ret14`, `subj_sol1`, `sam2`, `sam3`, `met2`, `mat10`, `bed1`, etc.) and `&mode=quiz`. Fallback library keeps catalog visible if card initialization is pending.

## Learning Content & Data Pipeline

- Source of truth for learning metadata and subject decks: `data/learning-content.json`.
- Generator script: `scripts/generate-learning-content.mjs`.
  - Compiles `data/learning-content.json` into `shared/learning-content.js`.
  - Validation check: `npm run check:learning` (runs `--check`).
- Client API: `window.HaugnesLearningContent` exposes quality metrics, subject tools, topics, and study path recommendations consumed by `shared/subject-page-renderer.js` and `shared/subject-meta.js`.

## A-besvarelser / Exam Packages

Active UI:
- Shell page: `user/a-besvarelser.html`.
- Dynamic package renderer: `shared/haugnes-answer-library.js`.
- Data source: Supabase tables `answer_packages` and `answer_resources`.
- Schema, RLS policies, and seed reference: `supabase-setup.sql`.

Admin authoring (`shared/haugnes-answer-admin.js`, admins only):
- Create/edit/delete packages; creating a new package auto-navigates into it so PDFs can be added immediately.
- Add resources two ways: (1) upload a PDF file directly, or (2) paste a shareable link (Google Drive / repo path).
- Batch upload: select many PDFs at once; each becomes a resource with kind auto-detected from the filename (override with a fixed kind).
- Uploaded files go to the private Supabase Storage bucket `answer-pdfs` at path `{package_id}/{resource_id}-{slug}.pdf`; deleting a resource/package also removes its storage objects.

Important behavior:
- The renderer fetches packages/resources from Supabase after auth and entitlement checks.
- Uploaded PDFs are stored in the private `answer-pdfs` bucket and served as short-lived signed URLs (`storage_bucket` / `storage_path` columns on `answer_resources`); link-based resources still use `url` / `download_url`.
- PDF URLs are intended to stay in Supabase-protected metadata, not hardcoded in public client bundles, unless a package is intentionally local/public.
- Legacy V25 SAM3 Google Drive links also exist in `shared/haugnes-dashboard-progress.js`.
- Local SAM3 V26 PDFs currently live under `sam3/eksamenspakker/v26/`.

Typical package IDs:
- Package: `sam3-v26`.
- Resources: `sam3-v26-exam`, `sam3-v26-answer`, `sam3-v26-sensor`.

## Supabase

- Project URL in client code: `shared/auth-guard.js`.
- Edge Function config: `supabase/config.toml`.
- Kompass migrations: `supabase/migrations/20260725153000_create_kompass_core.sql`, `supabase/migrations/20260725161000_optimize_kompass_rls.sql`, `supabase/migrations/20260725164500_point_core_resources_to_kompass.sql`, `supabase/migrations/20260725193000_create_kompass_course_workspaces.sql`, and `supabase/migrations/20260725194500_index_kompass_course_workspace_foreign_keys.sql`.
- Active Edge Functions:
  - `supabase/functions/timeedit/`: NHH TimeEdit proxy.
  - `supabase/functions/create-stripe-checkout/`: verifies Supabase Auth token, checks entitlements, and creates Stripe Checkout Sessions.
  - `supabase/functions/stripe-webhook/`: verifies Stripe signatures and grants paid subject entitlements.
- Schema/source-of-truth file: `supabase-setup.sql`.
- Key content tables:
  - `profiles`
  - `subject_entitlements`
  - `subject_prices`
  - `commerce_products`
  - `discount_codes`
  - `answer_packages`
  - `answer_resources`
  - `subject_pages` (admin-editable subject metadata, memo copy, visibility, publish flag)
  - `subject_page_blocks` (ordered topics/plan/radar/tips/formula/compendium/checklist)
  - `subject_files` (per-subject PDFs / attachments; Storage bucket `subject-files`)
  - `kompass_subjects`
  - `kompass_resources`
  - `kompass_content_blocks`
  - `kompass_user_state`
  - `kompass_course_folders`
  - `kompass_course_notes`
  - `kompass_course_files`
  - `kompass_course_progress`
- Kompass catalog/content is readable by authenticated users. Admin writes are authorized through `profiles.is_admin`; authenticated users cannot update that authorization field themselves.
- Kompass personal schedule, notes, progress, selected subjects, and settings are stored per user in `kompass_user_state`.
- The active H26 subject workspaces are BED2, SOL2, MET3, and SOL3. Legacy subjects remain in the catalog as archived data.
- Course-room folders, notes, files, and lecture completion use the four `kompass_course_*` tables. Private items are owner-readable; admins can publish shared folders/notes/files to every authenticated user.
- BED2 source content is integrated in the Sites client from `Skiloperen05/bed2-h26-laeringsrom-site`: 41 structured lecture notes, 12 topic groups, chapter starters, and the complete compendium.
- The main Flashcards and Notater catalog entries now point to their native Kompass routes; other subject-specific legacy resources still point to `bhflashcards.no` until migrated.
- Kompass resource uploads use the private `kompass-resources` bucket (100 MB; PDF, image, Office, text/Markdown). Published files are read through short-lived signed URLs; admins manage objects and catalog metadata.
- RLS/entitlement helper: `public.has_subject_entitlement(text)`.
- Storage: private bucket `answer-pdfs` for uploaded exam-package PDFs (PDF only, 50 MB). Admins write; entitled users read via signed URLs. Path convention `{package_id}/{file}.pdf`.
- Payment model: first user-claimed free subject is inserted client-side with `source = 'free'`; paid subjects are inserted by the Supabase Stripe webhook with `source = 'stripe'` and optional Stripe session/customer/payment metadata.
- Bundle/payment model: `user/butikk.html` can send `subjectCode` or `productId` to `supabase/functions/create-stripe-checkout/`. Storefront products and prices come from `subject_prices` and `commerce_products` when available. Bundles insert multiple `subject_entitlements` rows with `source = 'stripe_bundle'`; Vennepass inserts all current subjects with `source = 'stripe_friend_pass'` and sets `profiles.is_friend = true`.
- Discount model: admins manage `discount_codes` in `user/butikk.html`; checkout validates active codes server-side, stores discount metadata on Stripe Checkout Sessions, and `stripe-webhook` increments `redeemed_count` after paid completion.
- Rule from repo policy: DB schema changes must be mirrored in `supabase-setup.sql`.

## Build And Checks

- Dev server: `npm run dev` (starts `server.js` on port 3000).
- Production start: `npm run start` (`node server.js`).
- Build check: `npm run build` (`npm run check:js && npm run check:smoke`).
- JS check: `npm run check:js`.
- Smoke check: `npm run check:smoke`.
- Full check: `npm run check`.
- Known repo policy: `biome check` has preexisting failures and should not block unless the task specifically concerns Biome cleanup.

## Fast Search Recipes

- Find active code for A-besvarelser:
  `rg -n "answer_packages|answer_resources|HaugnesAnswerLibrary|a-besvarelser" .`
- Find subject metadata or access logic:
  `rg -n "HaugnesSubjects|HaugnesSubjectAccess|subject-meta|subject-access" shared user`
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

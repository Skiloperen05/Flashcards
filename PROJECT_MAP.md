# Project Map

Last updated: 2026-10-27

Purpose: make future app changes faster by documenting the stable entry points, data sources, and search paths. Update this file whenever a change moves, renames, adds, or removes app-facing functionality.

## Maintenance Rule

- Any app change that affects routes, shared scripts, subject pages, Supabase tables, package/data locations, build/test commands, or published resources must update this file in the same change.
- Keep this file concise and accurate. Prefer pointers to the source of truth over duplicating implementation details.
- If a feature has both legacy code and a newer data source, mark which one is active.

## App Shape

- Static web app deployed from this repository.
- Local and container development/serving: `server.js` using Express on port 3000, serving root static assets with clean HTML extension routing and mounting `/api/timeedit` and `/api/drive`.
- Google Drive 5 TB Storage Backend: Production streaming runs through Supabase Edge Function `drive-proxy` (`supabase/functions/drive-proxy/`); `api/drive.js` remains local-development support only. It lets heavy subject PDFs live in Drive while the Supabase bucket keeps structured uploads. The client uses bearer headers and in-memory Blob URLs—never JWT query parameters—and raw Drive IDs remain redacted for non-admins. **Admin auth is long-lived**: `user/admin.html` uses GIS `initCodeClient` (offline access) to hand the Edge Function an authorization code; the function exchanges it for `access_token` + `refresh_token`, stores the refresh token in `app_private_config.GOOGLE_DRIVE_REFRESH_TOKEN`, and auto-refreshes access tokens on demand — the admin does NOT re-authorise every hour once this is set up. Requires two Edge Function secrets: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (the OAuth client in Google Cloud Console must be type "Web application"). If the secret is missing the code falls back to the old implicit-token flow (`?action=cache_token`) so nothing breaks — the admin just has to reconnect hourly like before. **Security rules:** Drive files MUST be private; no API-key fallback exists; credentials are env-only; the previously committed `firebase-applet-config.json` is ignored and absent from `main` history.
- Local development auth bypass: Append `?dev=1` on localhost/127.0.0.1 (e.g. `http://localhost:3000/user/?dev=1`) to simulate an authenticated student (`dev@student.local`) without Supabase credentials.
- GitHub Pages is the active frontend host for `bhflashcards.no`: no build command, publish/output directory `.`.
- The new Kompass app is the active successor being built in Sites. Its source lives in the connected Sites repository, while this repository remains the source for legacy subject pages and the shared Supabase schema/migrations.
- Kompass has no paywall. Existing Stripe/commerce code remains legacy-only and is not used by the new Kompass clients.
- Main public landing page: `index.html`.
- Login/auth entry: `login.html` (incl. "Glemt passord?"); password reset landing: `reset-password.html`.
- Authenticated user pages: `user/`.
- Subject pages: one folder per subject, for example `sam3/`, `sam2/`, `ret14/`, `sol1/`.
- Subject app icons/emblems and A-besvarelser flow emblems: `assets/emblems/` (including `MET3.png`, `RRR11.png`, and updated `SAM1A.png`, `SAM2.png`, `SAM3.png`, `MAT10.png`, `SOL1.png`), referenced from `shared/subject-meta.js`, `shared/subject-access.js`, `user/butikk.html`, and `shared/haugnes-answer-library.js`.
- Shared behavior, data, styling, and page enhancement scripts: `shared/`.
- Supabase setup/schema seed reference: `supabase-setup.sql`.
- Supabase Edge Functions: `supabase/functions/`.
- Cloudflare Pages headers: `_headers`.
- Netlify is not an active deployment target; Netlify config/functions have been removed.
- Stripe checkout/webhook functions: `supabase/functions/create-stripe-checkout/`, `supabase/functions/stripe-webhook/`.

## User Pages

- Protected document viewer: `user/document.html?file=<subject_files UUID>`, implemented in `shared/document-viewer.js`. Loads bytes with bearer auth; PDF/image preview and local-only Word text preview using vendored Mammoth 1.11.0. Downloads request a fresh 60-second ticket on click. Drive files remain in Drive (no Supabase Storage copy); native Google Docs/Sheets/Slides are exported to PDF on demand. Import validates downloadable content and rejects public/domain-wide Drive sharing before saving metadata. Tickets recheck current subject access and publication at redemption, and responses are `private, no-store`.
- Document gateway regression tests: `node scripts/document-access-test.mjs` (Node 24+), or `npm run check:documents` (also runs `scripts/subject-publishing-test.mjs` for subject-document publication). Migration `20260913191233_protect_document_access.sql` aligns metadata/Storage publication checks and blocks newly saved external document URLs.
- Known legacy exposure: old exam packages under `*/eksamenspakker/`, the SAM2 DOCX and SAM3 model PDFs are public static assets in this public GitHub repository. Existing hardcoded Drive links in the legacy answer library/dashboard are not protected by the new subject-file gateway. Moving or removing current copies cannot retract already public Git history/downloads. See `docs/document-access.md`.

- Dashboard: `user/index.html`. Shows only active subjects and a link to Mine fag; subject selection lives exclusively on Mine fag to keep Hjem uncluttered.
- Admin-hub & Fagstudio: `user/admin.html`. Sentral kontrollside for administratorer (`profiles.is_admin = true`) bygd på `shared/subjects-studio.js`. Redigerer alle fag (både innebygde og egne) fra én katalog med akkordeon-editor: fag-header (kode, navn, kicker, ikon, farge, semester), publisering, memo & studietips (intro/eksamen/studieråd), seksjonssynlighet-brytere, viktige temaer, anbefalt øvingsløp, eksamensradar (m/prioritet), A-besvarelser og forelesningsnotater med støtte for både Google Drive 5 TB skylagring og lokal PDF-opplasting til Supabase Storage (`subject-files` bucket), oppgavebank med trinnvis fasit, samt flashcard-innstillinger. Inkluderer live Google Drive-utforsker (GIS token client), forhåndsvisning i iframe (student- eller admin-visning) Gamle lokale nettlesermaler importeres ikke automatisk; publisert Studio-innhold er autoritativt. Alle endringer publiseres umiddelbart til studenter med entitlement via Supabase Realtime.
- Subject management: `user/subjects.html`. Always shows every entitled subject (including inactive ones); the expanded «Velg fag» panel above the search controls changes the personal active set without removing access or progress.
- Shop/entitlement claiming, Stripe checkout entry, discount field, and admin commerce editor for subjects, bundles, Vennepass, prices, and rabattkoder: `user/butikk.html`.
- Admin Hub: `user/admin-hub.html`. Admin-only course catalogue, subject pricing, standalone exam-package pricing, activity overview, user list, and ownership counts.
- Exam analysis catalog with only published/direct analysis links: `user/eksamensanalyse.html`.
- A-besvarelser / eksamensarkiv shell: `user/a-besvarelser.html`. Groups subjects with exam packages into «Dine aktive fag» first and «Flere eksamenspakker» underneath. Active selection orders the archive rather than hiding other offers. The archive uses the full subject catalogue, including RRR11 and future subjects; public package document counts keep separately sold packages discoverable when their resources are protected by RLS.
- Study plan shell: `user/studieplan.html`.
- Memoarer overview: `user/memoarer.html`.
- Notes/settings: `user/notater.html`, `user/settings.html`. Settings live in `localStorage` key `hf_user_settings_v2` and sync to Supabase `user_custom_data.data.settings`; they are applied app-wide by `shared/user-settings.js` (theme/identity) and the flashcard study controls (session length; optional library sound in `shared/haugnes-flashcard-session.js`).
- Legacy global task page: `user/oppgavebank.html` still exists but is absent from the main sidebar; current subject authoring publishes tasks directly in each subject. Removed pages: `user/progress.html`, `user/achievements.html`.
- User-page loader/enhancer: `user/auth-guard.js`.

## Shared Core Scripts

- Auth/session/client bootstrap: `shared/auth-guard.js`. Root paths resolve from the bootstrap script even when called by inline subject code, keeping login redirects and assets correct for universal subject links. The COSO release versions its subject auth/study entry points and updated study assets to refresh browser caches.
- Entitlements and subject access: `shared/entitlements.js`, `shared/subject-access.js`, `shared/subject-gate.js`. Active choices are independent of ownership, also for admins/Vennepass. `HaugnesSubjectAccess.getAvailable()` returns the full entitled collection; `getSelected()` / patched `HaugnesSubjects.getAll()` supply active subjects to Hjem and existing study overviews. Defaults to all available subjects until the user chooses; an explicit empty set stays empty. Choices sync in existing `user_custom_data.data.activeSubjects` (`codes`, `updatedAt` in Unix milliseconds), with per-user local cache `hf_active_subjects_v1:<user-id>` and pending local edits retained on failure. Sync runs on startup, edits, entitlements, focus and reconnect; newer timestamps win. Writes merge with existing custom data. The legacy browser-wide choice is claimed once via `hf_enabled_subjects_owner`. No schema migration is needed.
- Subject metadata: `shared/subject-meta.js`. Merges the published `app_subjects` catalogue with published custom Fagstudio rows from `subject_pages`, so newly created subjects appear in navigation and the shop, and maps dedicated 3:4 3D emblems (`assets/emblems/*.png`, including `MET3.png` and `RRR11.png`) with cache-busting version query parameters.
- Subject page rendering/data/enhancements: `shared/subject-page-renderer.js`, `shared/subject-page-data.js`, `shared/subject-page-enhancements.js`, `shared/subject-resources.js`.
- Subject Studio API (single source of truth for admin-editable subject pages): `shared/subjects-studio.js`. Reads/writes `subject_pages`, `subject_page_blocks` and `subject_files` (Storage bucket `subject-files`) in Supabase. Automatic import from legacy localStorage templates is retired to prevent removed demos from being restored or published Studio edits from being overwritten. Existing local data is retained; `migrateLegacyIfNeeded` remains a no-op compatibility API. Exposes `window.SubjectsStudio` (listSubjects/getSubject/upsertSubject/upsertBlock/reorderBlocks/deleteBlock/uploadFile/updateFile/deleteFile/signedUrl/subscribeChanges). `uploadAnswerPackage` validates a batch, assigns per-file exam/model/sensor types and uploads sequentially; it removes newly saved documents after a failed batch. The inline subject form accepts multiple local documents; Fagstudio also supports multiple Drive selections. Replacing an existing document remains a single-file operation.
- Subject document publishing: `shared/subject-page-studio-bridge.js` converts files selected in the subject modals from FileReader data to real File uploads. `shared/subjects-studio.js` uploads to private Storage before returning protected viewer links, enables the A-besvarelser section after document publication, rejects empty new answer entries, and supports attaching/replacing a local document on an existing entry through Fagstudio. Failed new uploads remove their incomplete metadata; replacing a file preserves the old document on upload failure. Missing legacy attachments are explicitly marked on the subject page.
- Subject-page ↔ Studio bridge: `shared/subject-page-studio-bridge.js`. Patches `HaugnesSubjectPages.get`/`.savePage` so the student subject shell (`subject/index.html`) reads fresh data from Studio and inline edits are persisted to Supabase. Supplies stable protected document-viewer links (not expiring tickets at page-load time) and re-renders on `haugnes:subject-studio-changed`.
- Dashboard progress derived from recorded answers/sessions (not course-completion percentages), semester/status subject-card badges, and some legacy SAM3 package pointers: `shared/haugnes-dashboard-progress.js`.
- A-besvarelser / eksamensarkiv dynamic package UI: `shared/haugnes-answer-library.js`. Subject cards automatically reuse `emblem` from the shared subject catalogue for both accessible and locked courses, including dynamic subjects such as RRR11; the generic icon is only a fallback when an emblem is unavailable.
- User sidebar normalization: `shared/user-sidebar.js`. It is the source of truth for the grouped left menu used across user/app pages: Hjem, Mine fag, Butikk, Studieplan, Eksamensanalyse, A-besvarelser, Memoarer, Notater, Alle flashcards, Innstillinger.
- Logo normalization: `shared/logo-normalizer.js`. Re-applies the logo image if later branding scripts clear an already normalized logo mark.
- Global user-settings applier: `shared/user-settings.js`. Loaded on every app page from `shared/auth-guard.js` (`loadGlobalPolish`). Reads `hf_user_settings_v2` (plus a one-shot pull from `user_custom_data.data.settings` when newer) and applies accent color, background theme, font-size scaling, reduced motion, high contrast, avatar/display name in sidebars, the friendly check-in banner, and hides recommendation panels when disabled. Exposes `window.HaugnesUserSettings`.
- TimeEdit/NHH schedule integration: `shared/timeedit-fetch-proxy.js`, `shared/nhh-schedule-api.js`, `shared/nhh-schedule-normalizer.js`, `shared/nhh-strict-course-filter.js`, `shared/haugnes-studyplan.js`. Runtime proxy targets are the local `/api/timeedit` endpoint (via `server.js` and `api/timeedit.js`) and the Supabase `timeedit` Edge Function.
- In-subject flashcards: `shared/subject-flashcards.js` and `shared/subject-flashcards.css`, loaded by `shared/auth-guard.js`. Native `#flashcards` study room on supported subject home pages and `subject/?id=<id>`; respects the subject's flashcard visibility. Deck selection, question/answer, binary self-rating, retries and summary stay on the subject page. Decks with quiz data also offer native multiple choice with shuffled alternatives, one answer per question, explanations and an explicit next step; quiz answers use the same source-card progress and Leitner baskets as self-rating. Subject study/deck links open this room; the global sidebar's “Alle flashcards” remains a separate library. KOM1 has no study-room CTA. SAM1A also has no study CTA until a deck matching its actual course exists (`studyEnabled: false` in first-semester data). Empty deck collections do not mount a study room. A compact entry sits beside the subject’s learning/deck tools (after the reading content on author-led semester pages), replacing duplicate flashcard tool tiles. Setup shows deck selection and a session plan first; basket details are collapsed. Deck shortcuts open the matching setup before the session starts. Subject length/filter choices reuse `hf_study_options_v1` and initially honor the saved session-length preference.
- Shared Leitner engine: `shared/flashcard-study-session.js`. Stable source deck/card identities also work in mixed sessions. Five baskets: 10 minutes, 1 day, 3 days, 7 days, 21 days. A new correct card starts in basket 2; due correct cards advance one basket, wrong/legacy “half” answers reset to basket 1. Early correct practice keeps the existing basket/due time. Recommended sessions select due cards before new cards; not-yet-due cards are available through explicit extra practice. Existing ratings are migrated lazily. `sessionLengths` supplies both setup surfaces with choices bounded by the eligible cards after deck and rating/difficulty filters; temporary caps retain the preferred length for larger selections.
- Shared flashcard content API: `shared/flashcard-library.js` owns the existing RET14 and SOL1 built-in decks (moved from inline HTML without changing their IDs/order), adds `shared/haugnes-study-data.js` / `shared/learning-content.js` decks and custom published content. SAM3's 13 dedicated decks / 166 cards are available through `shared/sam3-flashcard-catalog.js`, generated from the existing `sam3/sam3-flashcards-data.js` compressed source by `scripts/generate-sam3-flashcards.mjs`; run `npm run sam3:generate` after editing that source. HTML in these legacy answers becomes readable plain text in the shared engine.
- Shared progress persistence: `shared/flashcard-store.js`. Both study surfaces use `fc_stats` and existing per-user Supabase `user_stats.stats` JSON, with `box` / `dueAt` stored per source card (no schema changes). Merges newest card states and deduplicated history, preserves pending local answers on reload, retries on reconnect and flushes when hidden. Reset timestamps prevent resurrection of cleared statistics. Local ownership guards isolate account switches; existing local SAM3 ratings are imported once into the prefixed `sam3-d*` identities. Local SAM3 source data is retained.
- Global flashcard presentation: `shared/flashcard-progress.js`, `shared/haugnes-flashcards.css` and `shared/haugnes-flashcards-structure.js`. `shared/haugnes-flashcard-session.js` retains optional sound, last-route tracking and mirroring to `hf_subject_stats`; native subject sessions mirror there directly so the existing dashboard still receives summaries.
  - Global study setup: `shared/flashcard-study-options.js` and `.css`; defaults to smart due/new practice, with advanced deck/filter/difficulty/order/length controls. Choices persist in `hf_study_options_v1`; session length initially honors `hf_user_settings_v2.sessionLen`.
  - Global sessions freeze the selected collection, preserve original deck IDs/indices, and finish after the last unique rating. Topic/rating switches retain answers; retries select failures from the current session. `?deck=<deck-id>` opens a subject deck; the global library remains optional.

## Subject Areas

- Deep/Dedicated Subject Hubs:
  - `met3/`: Excel overview and deck entry points, rendered by `met3/met3.js` from the learning catalogue. 146 cards in 13 decks, with difficulty and PDF page references; 37 documented Excel functions, practical models, Power Query, and a separately marked supplementary NPV/IRR/SUBTOTAL deck. The original user-provided PDF is not committed or published. MET3 belongs to semester 3 and follows existing entitlement rules.
  - `sam3/`: SAM3 Makroøkonomi hub, flashcards, formula quiz, mock exam, models, model PDFs, and exam radar (`eksamensradar-v3.html`).
  - `sam3/eksamenspakker/`: local SAM3 exam package PDFs. Current known package: `v26/` with exam, A-besvarelse, and sensorveiledning PDFs.
  - `sam2/`: SAM2 Mikroøkonomi hub, memoar, exam radar, oppgaver, and clickable task bank (`oppgaver-klikkbar/`).
  - `sam2/memoar/`: SAM2 memoar page plus downloadable source DOCX (`SAM2-memoar.docx`). First SAM2 unlock redirects to `sam2/?memoar=ny`.
  - `ret14/`: RET14 Skatterett hub, exam radar (`eksamen/`), pensum (`pensum/`), quiz (`quiz/`), and progress (`progresjon/`).
  - `sol1/`: SOL1 subject pages, complete/advanced flashcards (`flashcards-2-avansert.html`, `flashcards-2-komplett.html`), and theory writing (`teorideler-teoriskriving.html`).
- Lightweight / Content Hubs (driven by `shared/subject-page-renderer.js` and `shared/learning-content.js`):
  - `mat10/`, `met2/`: Template hubs driven by the shared subject renderer.
  - `sam1a/`, `met1/`, `kom1/`, `ret1a/`, `bed1/`: Author-led first-semester pages. `data/first-semester.json` is the active source for BH's verbatim memo text, concise introductions, resource links and two explanatory learning-method diagrams. The old generated study paths, radar percentages, placeholder notes and progress widgets are not used on these pages. KOM1 deliberately has no exam or flashcard call to action. Course names follow NHH's course catalog (source URL and verification date in the JSON), including SAM1A Etikk, økonomi og bærekraft.
  - `scripts/generate-first-semester.mjs` generates these five static HTML pages, `shared/first-semester-content.js`, and the marked first-semester resource catalog in `shared/subject-resources.js`; run `npm run semester:generate` after source edits and `npm run check:semester` to check freshness and document targets. Layout: `shared/first-semester.css`. Shared content is loaded before subject catalog decoration, so remote legacy metadata cannot restore old names/descriptions/routes; `user/subjects.html` uses simple memo/answer cards for these five courses, and `user/memoarer.html` uses the author's summaries.
  - `subject/?id=<first-semester-code>` (also `?subject=`) redirects to the corresponding author-led page, preserving other query parameters and the anchor. First-semester page copy is maintained in the JSON source, not the legacy Fagstudio page editor.
  - `subject/`: Universal dynamic subject shell (`subject/index.html`). Accepts query parameter `?id=<kode>` or `?subject=<kode>`. Supports Fagoversikt, Eksamensradar, A-besvarelser, Forelesningsnotater, Oppgavebank and native Flashcards. New subjects start empty; students see populated sections only. Administrators retain empty authoring sections in edit mode, and newly published documents appear immediately. Injects a top admin toolbar when viewed by an administrator, med direkte in-page CRUD-redigering for «Viktige temaer» og «Anbefalt øvingsløp», samt live preview-visningsbryter (Admin-modus vs. Studentvisning).
- RRR11 uses a focused layout in the universal shell: actual lecture notes and the native flashcard/quiz room (8 decks, 110 cards), with the existing A-besvarelser section available when enabled in Fagstudio. `shared/subject-page-renderer.js` omits the generic tool dashboard, generated memo/exam advice and empty learning suite for this course; `shared/haugnes-subject.css` removes placeholder status panels and the duplicate next-step CTA. Contextual links connect notes and study without leaving the subject. Studio refreshes retain the active study room. Other shared subject shells also hide empty student sections and no longer display template progress or fabricated resources.
- Generic Flashcard Application:
  - `flashcards/`: generic flashcard app entry (`flashcards/index.html`). Supports parameters `?subject=<id>` (e.g. `ret14`, `subj_sol1`, `sam2`, `sam3`, `met2`, `mat10`, `bed1`, etc.) and `&mode=quiz`. Fallback library keeps catalog visible if card initialization is pending.

## Learning Content & Data Pipeline

- Source of truth for learning metadata and MET3 source-based decks: `data/learning-content.json`. The old two-card import stubs, generic questions/memos, artificial exam weights and generated next-step placeholders were removed. Concrete legacy decks remain in `shared/haugnes-study-data.js` and `shared/flashcard-library.js`; SAM3 and RRR11 use their dedicated generated catalogs. MAT10/MET2 retain concrete question/answer examples in `shared/subject-page-data.js`.
- MET3 database registration: `data/met3-catalog.sql` inserts `app_subjects`, `subject_pages` and initial topic/plan blocks idempotently, preserving existing administrator edits; uses existing access/default price rules. Catalogue seed is mirrored in `supabase-setup.sql`. No schema or RLS changes.
- RRR11 COSO: `data/rrr11-coso-flashcards.json` preserves the user-supplied 30-question deck. `scripts/generate-coso-study.mjs` validates answer keys and generates `shared/rrr11-coso-study.js` for both native subject study and the global flashcard/quiz library. Run `npm run coso:generate` after source edits. Source question 25 has standalone flashcard wording; its original multiple-choice question is preserved. Explanations and COSO (2013) attribution are retained. The course uses `subject/?id=rrr11#flashcards`; `data/rrr11-coso-catalog.sql` enables the existing RRR11 flashcard flag without changing other Fagstudio settings.
- RRR11 additional decks: `data/rrr11-nye-flashcards.json` is the unchanged JSON supplied by Aleksander Moe on 21 October 2026 (7 decks, 80 cards). `scripts/generate-rrr11-study.mjs` validates IDs, stable ordering, required content and quiz answer keys, then generates `shared/rrr11-study.js` (`window.HaugnesRrr11Study`); run `npm run rrr11:generate` after source edits. `shared/flashcard-library.js` registers these after the separate COSO deck, and `shared/subject-flashcards.js` plus `flashcards/index.html` load them for both study surfaces. Per-card explanations and source references are retained in flashcards and quizzes. No database change is required.
- Generator script: `scripts/generate-learning-content.mjs`.
  - Compiles `data/learning-content.json` into `shared/learning-content.js`.
  - Validation check: `npm run check:learning` (runs `--check`).
- Client API: `window.HaugnesLearningContent` exposes actual catalog counts, subject tools, topics, and explicitly supplied study paths consumed by `shared/subject-page-renderer.js` and `shared/subject-meta.js`.

## A-besvarelser / Exam Packages

Active UI:
- Shell page: `user/a-besvarelser.html`.
- Dynamic package renderer: `shared/haugnes-answer-library.js`.
- Data source: Supabase tables `answer_packages`, `answer_resources`, and `answer_package_entitlements`. Migration `supabase/migrations/20261027090838_sync_subject_exam_packages.sql` automatically mirrors protected `subject_files.kind=answer` documents into the archive, including the existing RRR11 H25 answer. H2025/H25 normalize to one package per subject/term. `meta.resource_kind`, `meta.package_title` and optional `meta.answer_package_id` control batch labels/grouping; existing package prices and purchases are preserved. New generated packages require explicit sale activation/pricing. `answer_resources.subject_file_id` references the source and uses the existing protected document viewer for open/download; source edits, term changes and deletion update the archive. `answer_packages.resource_count` exposes counts without exposing resource rows. Package buyers can read only linked documents in their published package; download tickets recheck that access. Legacy public/static resources retain their existing delivery.
- Schema, RLS policies, and seed reference: `supabase-setup.sql`.

Admin authoring (`shared/haugnes-answer-admin.js`, admins only):
- Create/edit/delete packages; creating a new package auto-navigates into it so PDFs can be added immediately.
- Add resources two ways: (1) upload a PDF file directly, or (2) paste a shareable link (Google Drive / repo path).
- Batch upload: select many PDFs at once; each becomes a resource with kind auto-detected from the filename (override with a fixed kind).
- Uploaded files go to the private Supabase Storage bucket `answer-pdfs` at path `{package_id}/{resource_id}-{slug}.pdf`; deleting a resource/package also removes its storage objects.

Important behavior:
- The renderer fetches packages/resources from Supabase after auth and entitlement checks.
- Owning a subject opens every one of its exam packages at no extra cost. A published package can also be sold separately; that grants only the package through `answer_package_entitlements`, not the subject.
- Uploaded PDFs are stored in the private `answer-pdfs` bucket and served as short-lived signed URLs (`storage_bucket` / `storage_path` columns on `answer_resources`); link-based resources still use `url` / `download_url`.
- PDF URLs are intended to stay in Supabase-protected metadata, not hardcoded in public client bundles, unless a package is intentionally local/public.
- Legacy V25 SAM3 Google Drive links also exist in `shared/haugnes-dashboard-progress.js`.
- Local SAM3 V26 PDFs currently live under `sam3/eksamenspakker/v26/`.
- Existing public BED1 H25 documents: `bed1/eksamenspakker/h25/` (A-besvarelse, exam, solution). RET1A H25: `ret1a/eksamenspakker/h25/` (A-besvarelse PDF, sensorveiledning Word `.doc`). The first-semester pages and `shared/subject-resources.js` link directly to these already published files; they are not newly protected uploads. The answer library retains its existing package/access behavior.

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
  - `supabase/functions/drive-proxy/`: authenticated Google Drive picker and entitlement-protected Drive streams for the static GitHub Pages frontend.
- Schema/source-of-truth file: `supabase-setup.sql`.
- Key content tables:
  - `profiles`
  - `subject_entitlements`
  - `subject_prices`
  - `commerce_products`
  - `discount_codes`
  - `answer_packages`
  - `answer_resources`
  - `answer_package_entitlements`
  - `app_subjects` (admin-managed legacy subject catalogue; published entries extend `shared/subject-meta.js` and the shop at runtime)
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
- Bundle/payment model: `user/butikk.html` can send `subjectCode` or `productId`; `shared/haugnes-answer-library.js` can send `packageId` to `supabase/functions/create-stripe-checkout/`. Storefront products and prices come from `app_subjects`, `subject_prices`, and `commerce_products` when available. Bundles insert multiple `subject_entitlements` rows with `source = 'stripe_bundle'`; standalone packages insert one `answer_package_entitlements` row with `source = 'stripe_package'`; Vennepass inserts all current subjects with `source = 'stripe_friend_pass'` and sets `profiles.is_friend = true`.
- Admin analytics is returned only to admins by the security-definer RPC `public.admin_dashboard_snapshot()`.
- Discount model: admins manage `discount_codes` in `user/butikk.html`; checkout validates active codes server-side, stores discount metadata on Stripe Checkout Sessions, and `stripe-webhook` increments `redeemed_count` after paid completion.
- Rule from repo policy: DB schema changes must be mirrored in `supabase-setup.sql`.

## Build And Checks

- Dev server: `npm run dev` (starts `server.js` on port 3000).
- Production start: `npm run start` (`node server.js`).
- Build check: `npm run build` (`npm run check:js && npm run check:smoke && npm run check:study && npm run check:content && npm run check:subjects && npm run check:archive`).
- JS check: `npm run check:js`.
- Smoke check: `npm run check:smoke`.
- Study regression check: `npm run check:study` validates SAM3 and both RRR11 generated catalogs, then runs `node scripts/flashcard-study-test.mjs` with the existing jsdom dependency. Covers timed Leitner transitions, early practice/lapses, legacy content, native in-subject sessions, combined source identities, filters/order/limits, keyboard, completion/retry, cloud failure recovery, account isolation, subject-tool placement, dynamically bounded session lengths, COSO source fidelity, all 80 additional RRR11 cards in flashcard and quiz modes, ID collision checks, deck registration on both surfaces, source display, native multiple-choice grading/retry/shared progress, and RRR11 notes/study navigation with repeated Studio rendering.
- Content regression check: `npm run check:content` (`scripts/content-cleanup-test.mjs`): empty subjects, populated-section visibility, administrator authoring, explicit visibility flags, retained edited local notes, source cards and disabled legacy demo migration.
- Content inventory: `docs/content-inventory.md` records the material kept per subject and the removed filler. `data/remove-placeholder-content.sql` removes only audited legacy seed blocks/copy and unpublishes empty seeded answer packages, leaving documents, user state, entitlements, MET3 blocks and authored RRR11 copy intact. Run it after historical seed imports; historical migrations are unchanged.
- Active-subject regression check: `npm run check:subjects` (`scripts/active-subjects-test.mjs`): entitlement bounds, full-access selection, empty/reload, remote persistence and merge, failure recovery, account isolation, rapid edits, legacy migration, keyboard focus, dashboard filtering and the full Mine fag collection. Uses jsdom and a simulated cloud client.
- Archive regression check: `npm run check:archive` (`scripts/answer-archive-test.mjs`): active-first groups, dynamic subjects, protected document links and discoverable locked packages. `scripts/subject-publishing-test.mjs` also checks typed multi-file batches, failed-batch cleanup and the real inline upload form. `scripts/archive-database-test.sql` runs in a rolled-back transaction against the applied migration: administrator RLS writes, normalized term grouping, package-only access, publication/revocation, updates, counts and cascade deletion.
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

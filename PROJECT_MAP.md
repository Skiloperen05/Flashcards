# Project Map

Last updated: 2026-07-04

Purpose: make future app changes faster by documenting the stable entry points, data sources, and search paths. Update this file whenever a change moves, renames, adds, or removes app-facing functionality.

## Maintenance Rule

- Any app change that affects routes, shared scripts, subject pages, Supabase tables, package/data locations, build/test commands, or published resources must update this file in the same change.
- Keep this file concise and accurate. Prefer pointers to the source of truth over duplicating implementation details.
- If a feature has both legacy code and a newer data source, mark which one is active.

## App Shape

- Static web app deployed from this repository.
- GitHub Pages is the active frontend host for `bhflashcards.no`: no build command, publish/output directory `.`.
- Main public landing page: `index.html`.
- Login/auth entry: `login.html`.
- Authenticated user pages: `user/`.
- Subject pages: one folder per subject, for example `sam3/`, `sam2/`, `ret14/`, `sol1/`.
- Shared behavior, data, styling, and page enhancement scripts: `shared/`.
- Supabase setup/schema seed reference: `supabase-setup.sql`.
- Supabase Edge Functions: `supabase/functions/`.
- Cloudflare Pages headers: `_headers`.
- Netlify is not an active deployment target; Netlify config/functions have been removed.
- Stripe checkout/webhook functions: `supabase/functions/create-stripe-checkout/`, `supabase/functions/stripe-webhook/`.

## User Pages

- Dashboard: `user/index.html`.
- Subject management: `user/subjects.html`.
- Shop/entitlement claiming, Stripe checkout entry, discount field, and admin commerce editor for subjects, bundles, Vennepass, prices, and rabattkoder: `user/butikk.html`.
- Exam analysis catalog with only published/direct analysis links: `user/eksamensanalyse.html`.
- A-besvarelser / eksamensarkiv shell: `user/a-besvarelser.html`.
- Oppgavebank shell: `user/oppgavebank.html`.
- Study plan shell: `user/studieplan.html`.
- Notes/settings: `user/notater.html`, `user/settings.html`. Settings live in `localStorage` key `hf_user_settings_v2` and sync to Supabase `user_custom_data.data.settings`; they are applied app-wide by `shared/user-settings.js` (theme/identity) and `shared/haugnes-flashcard-session.js` (session behavior).
- Removed user pages: `user/progress.html`, `user/achievements.html`.
- User-page loader/enhancer: `user/auth-guard.js`.

## Shared Core Scripts

- Auth/session/client bootstrap: `shared/auth-guard.js`.
- Entitlements and subject access: `shared/entitlements.js`, `shared/subject-access.js`, `shared/subject-gate.js`.
- Subject metadata: `shared/subject-meta.js`.
- Subject page rendering/data/enhancements: `shared/subject-page-renderer.js`, `shared/subject-page-data.js`, `shared/subject-page-enhancements.js`, `shared/subject-resources.js`.
- Dashboard dynamic progress/recommendations and some legacy SAM3 package pointers: `shared/haugnes-dashboard-progress.js`.
- A-besvarelser / eksamensarkiv dynamic package UI: `shared/haugnes-answer-library.js`.
- User sidebar normalization: `shared/user-sidebar.js`.
- Global user-settings applier: `shared/user-settings.js`. Loaded on every app page from `shared/auth-guard.js` (`loadGlobalPolish`). Reads `hf_user_settings_v2` (plus a one-shot pull from `user_custom_data.data.settings` when newer) and applies accent color, background theme, font-size scaling, reduced motion, high contrast, avatar/display name in sidebars, the friendly check-in banner, and hides recommendation panels when disabled. Exposes `window.HaugnesUserSettings`.
- TimeEdit/NHH schedule integration: `shared/timeedit-fetch-proxy.js`, `shared/nhh-schedule-api.js`, `shared/nhh-schedule-normalizer.js`, `shared/nhh-strict-course-filter.js`, `shared/haugnes-studyplan.js`. Runtime proxy target is the Supabase `timeedit` Edge Function.
- Flashcard session shared logic: `shared/haugnes-flashcard-session.js`, `shared/haugnes-flashcards-structure.js`. The session script also applies learning settings from `hf_user_settings_v2`: session length cap, default start filter (`startWith`), difficult-first ordering (`autoDiff`), exam-topic priority (`examMode`), and optional sound feedback.

## Subject Areas

- `sam3/`: SAM3 Makroøkonomi hub, flashcards, formula quiz, mock exam, models, model PDFs, and exam radar.
- `sam3/eksamenspakker/`: local SAM3 exam package PDFs. Current known package: `v26/` with exam, A-besvarelse, and sensorveiledning PDFs.
- `sam2/`: SAM2 Mikroøkonomi hub, memoar, exam radar, oppgaver, and clickable task bank.
- `sam2/memoar/`: SAM2 memoar page plus downloadable source DOCX (`SAM2-memoar.docx`). First SAM2 unlock redirects to `sam2/?memoar=ny`.
- `ret14/`: RET14 Skatterett hub, exam radar, pensum, quiz, and progress.
- `sol1/`: SOL1 subject pages and flashcard data.
- `sam1a/`, `met1/`, `kom1/`, `ret1a/`, `bed1/`, `mat10/`, `met2/`: MVP or planned subject hubs.
- `flashcards/`: generic flashcard app entry.

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
- Edge Function config: `supabase/config.toml`.
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
- RLS/entitlement helper: `public.has_subject_entitlement(text)`.
- Payment model: first user-claimed free subject is inserted client-side with `source = 'free'`; paid subjects are inserted by the Supabase Stripe webhook with `source = 'stripe'` and optional Stripe session/customer/payment metadata.
- Bundle/payment model: `user/butikk.html` can send `subjectCode` or `productId` to `supabase/functions/create-stripe-checkout/`. Storefront products and prices come from `subject_prices` and `commerce_products` when available. Bundles insert multiple `subject_entitlements` rows with `source = 'stripe_bundle'`; Vennepass inserts all current subjects with `source = 'stripe_friend_pass'` and sets `profiles.is_friend = true`.
- Discount model: admins manage `discount_codes` in `user/butikk.html`; checkout validates active codes server-side, stores discount metadata on Stripe Checkout Sessions, and `stripe-webhook` increments `redeemed_count` after paid completion.
- Rule from repo policy: DB schema changes must be mirrored in `supabase-setup.sql`.

## Build And Checks

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

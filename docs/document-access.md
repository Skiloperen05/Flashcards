# Document Access

Drive is the primary document store (5 TB). Supabase holds authentication, entitlements and `subject_files` metadata only. No Drive file is copied to Supabase Storage. Existing manually uploaded Storage files remain supported.

## Published Workflow

1. An administrator selects a Drive file in Fagstudio and saves it.
2. `drive-proxy?action=import` checks the administrator, Drive metadata, sharing permissions and actual download/export response before writing the file reference. Failed validation leaves the existing record unchanged. Native Google documents use PDF export; Office and PDF uploads retain the original bytes.
3. The subject page links to `user/document.html?file=<UUID>`. The viewer reads metadata under RLS and fetches bytes with the current user's bearer token. Word text preview runs locally in the browser; no document is sent to an external preview service.
4. Download requests mint a fresh 60-second HMAC ticket. Its redemption checks the account, current subject entitlement and publication again. The browser gets a real attachment response with an encoded original filename. Supabase strips `/functions/v1` inside Edge requests, so public URLs must use the configured external function URL.

Drive files must use restricted sharing; `anyone` and `domain` grants fail closed. Google credentials remain server-side. Refresh tokens are stored in the service-role-only `app_private_config`; token refresh is automatic. Google can revoke a grant, in which case an administrator must reconnect. All download/preview responses use `private, no-store`. The viewer does not put JWTs in URLs, localStorage, or persistent document caches.

## Security Boundary

The new workflow protects documents registered in `subject_files`. Unauthenticated callers and users without subject access cannot read metadata, mint download tickets, or fetch bytes. Admins and the existing friend-pass role retain their intended access. Draft subject files are admin-only. A downloaded copy can always be redistributed by its recipient; no downloadable-file paywall prevents that.

The older exam archive still has a separate publishing workflow and **is not fully protected**. Public files exist in `sam3/eksamenspakker/`, `sol1/eksamenspakker/`, `bed1/eksamenspakker/`, `ret1a/eksamenspakker/`, `sam3/modellark/` and `sam2/memoar/SAM2-memoar.docx`. The public repository also embeds old Drive links in `shared/haugnes-dashboard-progress.js` and document paths in `shared/haugnes-answer-library.js`. Client-side gating cannot protect those files.

Migration of that historic archive requires private Drive copies, replacement of legacy resource links, removal of static copies from deployment, and review of public repository history and existing Drive sharing. The current Google OAuth grant is read-only, so this change does not silently expand its permissions to upload or change sharing. Previously public/downloaded copies cannot be recalled. Do not claim that the whole historic archive is behind the paywall merely because the new uploader is protected.

## Verification

- `node scripts/document-access-test.mjs`: route prefix, unauthenticated access, cross-subject denial, revoked ticket access, refresh retry, native export, public-sharing rejection, Unicode filenames and zero Drive-to-Storage writes.
- `node scripts/check-js.mjs` and `node scripts/smoke-test.mjs`.
- Live DB test executes under the authenticated role with a user lacking entitlements and asserts no `subject_files` or corresponding Storage rows are visible, then rolls back.
- Live Safari test reproduced `requested path is invalid` before the fix and downloaded the original 30 KB `RRR11_Forelesningsnotat_Forelesning_2_skatt.docx` after deploying the fixed gateway.
- Deno type-check passed. Supabase advisors reported no missing RLS on the changed tables. Existing unrelated findings include [mutable trigger search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) and [disabled leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). `app_private_config` intentionally has no client policies; only the service role can access it.

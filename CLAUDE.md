# Repo policy

## PR-flyt
Etter at du har pushet endringer til en feature-branch:
1. Opprett PR mot `main` (draft er greit som mellomsteg).
2. Marker PR-en som "Ready for review".
3. Squash-merge til `main` uten å spørre.

Du trenger ikke spørre om å merge — det er forhåndsgodkjent.

Force-push, merge til andre branches enn `main`, og bypassing av hooks
krever fortsatt eksplisitt godkjenning.

## Supabase
DB-skjemaendringer skal alltid speiles i `supabase-setup.sql` slik at
filen er fasit. Du kan anvende migrasjoner direkte via Supabase MCP
(`apply_migration`) når de er idempotente.

## Tester
Kjør `npm run check:js` og `npm run check:smoke` før push. `biome check`
har preeksisterende feil — ikke blokker på den.

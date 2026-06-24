# Codex Repo Instructions

## Project Map

- Read `PROJECT_MAP.md` before doing non-trivial app exploration or app changes.
- Keep `PROJECT_MAP.md` updated in the same change whenever routes, shared scripts, subject pages, Supabase tables, package/data locations, build/test commands, or published resources change.
- Do not leave `PROJECT_MAP.md` pointing at stale files or outdated active data sources.

## GitHub Push On This Mac

When pushing to GitHub from this Mac, use GitHub Desktop's bundled Git with `credential.helper=manager`:

```bash
PATH="/Applications/GitHub Desktop.app/Contents/Resources/app/git/libexec/git-core:/Applications/GitHub Desktop.app/Contents/Resources/app/git/bin:$PATH" git -c credential.helper= -c credential.helper=manager push origin main
```

Do not use `git-credential-desktop`; it requires `DESKTOP_PORT`.

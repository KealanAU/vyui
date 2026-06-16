# AGENTS.md

Agent-facing notes for working in this repo. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development guide.

## Changesets are required

Every PR that changes published package source (`packages/core/**` or `packages/kit/**`) must include a changeset:

```bash
pnpm exec changeset
```

- Pick the affected package(s) and bump level (almost always `patch` pre-1.0).
- For breaking changes, flag the breaking nature in the changeset summary — reviewers rely on that line.
- Commit the generated `.changeset/*.md` file with the PR. If a PR merged without one, add it in a small follow-up PR before releasing.

## Releasing (manual-only)

Publishing never happens on merge to main. The flow is:

1. GitHub → Actions → **Release** → Run workflow (gated by the `npm-publish` protected environment).
2. The changesets action opens a **"chore: release packages"** PR — merge it.
3. Run the **Release** workflow again to publish to npm (OIDC trusted publishing, no token).

The version step (`pnpm version-packages`) also runs `tools/gen-changelog-docs.ts`, which writes a docs changelog entry (`apps/docs/content/changelog/<pkg>-<version>.md`) for each newly bumped version so the docs site timeline stays in sync. It's generate-if-missing: hand-write a curated entry before releasing to override the auto-generated one. Backfill history with `tsx tools/gen-changelog-docs.ts --all` (auto-entries get today's date — fix `date:` by hand if order matters).

## Pre-PR checks

- `pnpm --filter @vyui/core test` / `pnpm --filter @vyui/kit test` for touched packages.
- `pnpm --filter <pkg> typecheck` for any package changed.
- If you touched `packages/core/src/**`, verify the demo via `dev:local` against a fresh dist.

---
"@vyui/kit": patch
"@vyui/core": patch
---

Fix broken/unresolvable published packages.

**@vyui/kit** — components were emitted as self-importing wrappers, so `import { Button } from '@vyui/kit'` resolved to `undefined` (shipped in 0.0.4). Now bundles from explicit named entries, guarded by a packed-tarball smoke test.

- `provideVyUI(app, options)` provides theme config without registering every component (tree-shaking-friendly); `app.use(VyUI, { components })` registers a chosen subset.
- `exports` list `types` before `import`; add a `prepublishOnly` build guard.

**@vyui/core** — shipped `.d.ts` files imported the internal `@/*` path alias (unresolvable for consumers, which also degraded `@vyui/kit`'s re-exported types). Declaration emit now rewrites `@/*` to relative paths and adds explicit `.js` extensions, so types resolve under both `bundler` and `node16`/`nodenext`. Declare `@lynx-js/types` (optional peer) and `vue-component-type-helpers` (dependency), both used by public types. Added a packed-tarball smoke test.

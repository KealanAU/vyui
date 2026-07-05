# Local dependency patches

pnpm-native patches applied via `pnpm.patchedDependencies` (declared in the root
`pnpm-workspace.yaml`, since pnpm 11 reads that key from the workspace file).

## `vue-lynx@0.4.0.patch` — follow VyUI worklet imports in the MT loader

**Status:** Local stopgap. Remove when the upstream fix lands.

**Upstream issue:** `docs/upstream/vue-lynx-mt-worklet-import-issue.md`

### What it does

`vue-lynx`'s main-thread worklet loader (`plugin/dist/loaders/worklet-loader-mt.js`,
`extractLocalImports(source)`) re-emits a module's imports into the main-thread
graph but matched **only relative** specifiers:

```js
const fromRe = /from\s+['"](\.[^'"]+)['"]/g;
const bareRe = /import\s+['"](\.[^'"]+)['"]/g;
```

So worklets imported through an `@/…` path alias, or through published
`@vyui/core` / `@vyui/kit` package imports, were never re-emitted into the MT
graph and never registered (runtime `TypeError: cannot read property 'bind'
of undefined`). The patch broadens **both** regexes to also follow:

- relative imports (`./…` / `../…`) — unchanged upstream behavior
- project aliases under `@/…`
- the known worklet-bearing VyUI packages: `@vyui/core`, `@vyui/kit`, and their
  subpaths

It deliberately does **not** follow every bare npm specifier. Pulling arbitrary
dependencies into the MT graph is the upstream Tier-2 policy question; this
local patch only unblocks VyUI packages.

```js
const fromRe = /from\s+['"](\.[^'"]+|@\/[^'"]+|@vyui\/(?:core|kit)(?:\/[^'"]*)?)['"]/g;
const bareRe = /import\s+['"](\.[^'"]+|@\/[^'"]+|@vyui\/(?:core|kit)(?:\/[^'"]*)?)['"]/g;
```

The re-emitted imports are resolved by the consumer bundler. For `@/…`, that
uses the project's existing alias. For `@vyui/core` / `@vyui/kit`, it pulls the
published package module into the MT bundle so the precompiled
`registerWorkletInternal` calls in `@vyui/core/dist` can run.

The patched file also carries a `[vyui local patch — REMOVE WHEN UPSTREAM FIXED]`
banner comment at the top, so the change is self-documenting in the diff.

### Verifying it works

1. Ensure a worklet-bearing path is imported through either the source alias
   (`@/…`) or published package imports (`@vyui/kit` / `@vyui/core`).
2. `pnpm --filter @vyui/kit-demo build`
3. Audit the MT bundle for referenced-but-unregistered worklets, from
   `apps/examples/kit-demo/dist`:
   ```sh
   node -e '
   const s=require("fs").readFileSync("main.web.bundle","utf8");
   const g=re=>[...s.matchAll(re)].map(m=>m[1]);
   const reg=new Set(g(/registerWorkletInternal\(\\"main-thread\\",\\"([0-9a-f:]+)\\"/g));
   const refs=new Set([...g(/_wkltId:\\"([0-9a-f:]+)\\"/g),...g(/_workletMap\[\\"([0-9a-f:]+)\\"\]/g)]);
   const un=[...refs].filter(id=>!reg.has(id));
   console.log("registered:",reg.size,"referenced:",refs.size,"UNRESOLVED:",un.length,un.slice(0,20));
   '
   ```
   PASS = `UNRESOLVED: 0`.

### Undo (when upstream is fixed)

1. Delete `patches/vue-lynx@0.4.0.patch`.
2. Remove the `vue-lynx@0.4.0` entry under `patchedDependencies:` in the root
   `pnpm-workspace.yaml`.
3. `pnpm install`.

// Ambient module declaration for Vue SFCs so `import App from './App.vue'`
// type-resolves under plain `tsc` / `vue-tsc` / non-Volar LSPs. Volar (the
// VS Code Vue TypeScript service) handles `.vue` imports natively, but raw
// TypeScript outside Volar still needs this shim — it's the canonical Vue
// pattern (Vite scaffolds drop it by default; vue-cli ships `shims-vue.d.ts`).
//
// This file is shared across all demos under `apps/examples/`. Reference it
// from each demo's `src/lynx-env.d.ts` with a `/// <reference path>` so the
// shim is in scope without duplication.
//
// Long-term: this declaration belongs in `vue-lynx/types/dist/index.d.ts`
// upstream — vue-lynx is the framework binding; consumers shouldn't have to
// hand-roll an SFC shim. See the Desktop upstream-fix doc.

declare module '*.vue' {
  // Resolve via `vue-lynx` (which re-exports `@vue/runtime-core` per the
  // demos' `vue-lynx-types-shim.d.ts`). Avoids depending on `'vue'` resolving
  // from `_shared/` — only the consuming demo's node_modules has `vue`.
  import type { DefineComponent } from 'vue-lynx'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

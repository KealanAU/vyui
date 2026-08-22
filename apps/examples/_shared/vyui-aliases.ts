import { resolve } from 'node:path'

/**
 * Canonical workspace-source alias block used by every vyui demo's
 * `lynx.config.ts`. Pass each demo's `__dirname` (resolved from
 * `fileURLToPath(new URL('.', import.meta.url))`) so paths are relative to
 * the consuming demo.
 *
 * `@vyui/core` is aliased straight at the workspace SOURCE so vue-lynx's
 * MT worklet loader walks INTO our component files (it skips
 * `node_modules`). Each subpath needs its own `$`-suffixed exact alias
 * because rspack alias rewriting bypasses the package's `exports` map (the
 * real files live under the `dist` tree, not the public path). Mirrors
 * `packages/core/package.json#exports`.
 *
 * The bare `@` alias is required because `packages/core/src/**` has
 * internal `@/...` paths (see core's `tsconfig.json#paths`). When we
 * alias `@vyui/core` at source above, those internal imports leak into
 * the demo bundler and need this resolution. Do NOT use `@/` in demo
 * src — prefer `@vyui/core` or its subpaths.
 *
 * The `vue-lynx$` (and subpath) aliases force every `import 'vue-lynx'`
 * to resolve to ONE physical module — pnpm's peer-dep system can
 * otherwise hand each workspace package its own vue-lynx dir, producing
 * two worklet registries that don't share `_wkltId` hashes. Mirrors
 * `node_modules/vue-lynx/package.json#exports`.
 */
export function createVyuiAliases(__dirname: string): Record<string, string> {
  return {
    '@vyui/core$': resolve(__dirname, '../../../packages/core/src/index.ts'),
    '@vyui/core/shared$': resolve(__dirname, '../../../packages/core/src/shared/index.ts'),
    '@vyui/kit': resolve(__dirname, '../../../packages/kit/src/index.ts'),
    '@': resolve(__dirname, '../../../packages/core/src'),
    'vue': 'vue-lynx',
    'vue-lynx$': resolve(__dirname, 'node_modules/vue-lynx/runtime/dist/index.js'),
    'vue-lynx/entry-background$': resolve(__dirname, 'node_modules/vue-lynx/runtime/dist/entry-background.js'),
    'vue-lynx/main-thread$': resolve(__dirname, 'node_modules/vue-lynx/main-thread/dist/entry-main.js'),
    'vue-lynx/plugin$': resolve(__dirname, 'node_modules/vue-lynx/plugin/dist/index.js'),
    'vue-lynx/internal/ops$': resolve(__dirname, 'node_modules/vue-lynx/internal/dist/ops.js'),
    'vue-lynx/types$': resolve(__dirname, 'node_modules/vue-lynx/types/dist/index.js'),
  }
}

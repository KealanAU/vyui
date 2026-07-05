import { defineConfig } from '@rslib/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { vueLynxLoaderOptions } from '@vyui/shared-build-config/vue-loader-options'

// INVARIANT: This package contains no `'main thread'` worklets. All worklet
// logic lives in `@vyui/core`. The components here are pure BG-thread wrappers
// that forward to core primitives.
//
// If you ever add a worklet to `@vyui/kit` (a `'main thread'` directive,
// `useMainThreadRef`, `runOnMainThread`/`runOnBackground`, or
// `:main-thread-bind*` / `:main-thread-ref` template attrs), this config needs
// the same `pluginVyuiWorklet` hookup AND the same widened `sideEffects`
// (`src/**/*.vue`, `src/**/*.ts`, `dist/**/*.js`) as `packages/core` —
// otherwise rspack's tree-shaker will silently strip the side-effect imports
// the vue-lynx MT loader emits, and downstream consumers will crash with
// `bind of undefined`. See packages/core/rslib.config.ts.
//
// We BUNDLE (`bundle: true`) from a fixed set of entry modules — one per public
// `exports` subpath — exactly like `packages/core`. The previous config used
// `bundle: false` with a `./src/**/*.vue` glob entry, which emitted every SFC
// as its own top-level chunk. rslib names each chunk by basename, so a `.vue`
// file's wrapper chunk and its compiled `<script>` chunk both wanted
// `<Name>.js` and collided: the wrapper clobbered the real code and was left
// importing itself (`import … from "./Button.js"` inside `Button.js`). Every
// component's default export resolved to `undefined` from the packed tarball.
// Bundling from named entries removes the per-file collision entirely — the
// packed-tarball smoke test (`scripts/smoke-test.mjs`) guards against a
// regression.
export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      source: {
        tsconfigPath: './tsconfig.build.json',
        // One entry per public `exports` subpath. Keep in sync with
        // package.json `exports`.
        entry: {
          index: './src/index.ts',
          'theme/index': './src/theme/index.ts',
          tailwind: './src/tailwind.js',
          config: './src/config.js',
        },
      },
    },
  ],
  plugins: [
    pluginVue({
      vueLoaderOptions: vueLynxLoaderOptions,
    }),
  ],
  output: {
    distPath: { root: 'dist' },
    externals: [
      // Bundled mode inlines anything not listed. Keep peers and runtime
      // deps external so a single copy is shared with the consumer app.
      'vue',
      'vue-lynx',
      'tailwindcss',
      '@vyui/core',
      'tailwind-variants',
      'defu',
      /^@lynx-js\//,
    ],
  },
})

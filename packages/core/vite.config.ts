import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vueLynxViteOptions } from '@vyui/shared-build-config/vite-vue-options'
import { vyuiWorkletPlugin } from '@vyui/shared-build-config/vite-worklet-plugin'
import { vyuiSfcCssImports } from '@vyui/shared-build-config/vite-sfc-css-imports'
import { vyuiPruneVueFacades } from '@vyui/shared-build-config/vite-prune-vue-facades'

const root = fileURLToPath(new URL('.', import.meta.url))
const src = resolve(root, 'src')

// Per-file, source-shaped ESM dist (Rollup `preserveModules`). We do NOT bundle:
// the whole main-thread worklet toolchain (SWC transform + registration slicing
// + import re-emit) assumes source-shaped ESM with direct named `vue-lynx`
// imports. A bundle turns those into a webpack external namespace that the
// consumer's registration slicing orphans, crashing MT with a `ReferenceError`
// (`__WEBPACK_EXTERNAL_MODULE_vue_lynx_*`). See
// docs/upstream/vue-lynx-mt-worklet-import-issue.md. `.d.ts` is emitted
// separately by vue-tsc (`build-types`).
//
// Everything in deps + peers stays external so a single copy is shared with the
// consumer app (and `vue` resolves to vue-lynx via the consumer's alias).
export default defineConfig({
  resolve: {
    // `src/**` uses internal `@/...` paths (tsconfig `paths`).
    alias: [{ find: /^@\//, replacement: `${src}/` }],
  },
  plugins: [
    vue(vueLynxViteOptions),
    vyuiWorkletPlugin(),
    vyuiSfcCssImports(),
    vyuiPruneVueFacades(),
  ],
  build: {
    target: 'es2022',
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: {
      entry: {
        index: resolve(src, 'index.ts'),
        'date/index': resolve(src, 'date/index.ts'),
        'shared/index': resolve(src, 'shared/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-lynx',
        'ohash',
        'tailwind-merge',
        'vue-component-type-helpers',
        /^@lynx-js\//,
        /^@iconify\//,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
      onwarn(warning, warn) {
        // Component graphs are legitimately circular; `this` at module top level
        // is expected in compiled SFC output.
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.code === 'THIS_IS_UNDEFINED') return
        warn(warning)
      },
    },
  },
})

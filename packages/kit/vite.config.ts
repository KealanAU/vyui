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

// Per-file, source-shaped ESM dist (Rollup `preserveModules`), same shape as
// @vyui/core — see packages/core/vite.config.ts for the full rationale.
//
// INVARIANT: @vyui/kit contains no `'main thread'` worklets today (all worklet
// logic lives in @vyui/core; the components here are pure BG-thread wrappers).
// The worklet plugin is wired anyway for parity: if a worklet is ever added
// here, this build already pre-compiles it correctly and `sideEffects` must be
// widened to keep the vue-lynx MT side-effect imports (see package.json).
// The prune plugin collapses plugin-vue's redundant re-export sub-modules so
// each SFC ships as a single `X.vue.js` (this is what the old `bundle: false`
// glob build got wrong: colliding wrapper/script chunks — a collision that does
// not exist under Rollup preserveModules).
export default defineConfig({
  resolve: {
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
        'theme/index': resolve(src, 'theme/index.ts'),
        // Plain `.js` (CJS-compatible ESM) consumed by the consumer's Tailwind
        // via jiti — kept as their own entry files, not bundled.
        tailwind: resolve(src, 'tailwind.js'),
        config: resolve(src, 'config.js'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-lynx',
        'tailwind-variants',
        'defu',
        /^@vyui\/core(\/|$)/,
        /^tailwindcss(\/|$)/,
        /^@lynx-js\//,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.code === 'THIS_IS_UNDEFINED') return
        warn(warning)
      },
    },
  },
})

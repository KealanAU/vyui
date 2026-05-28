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
export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: false,
      dts: false,
    },
  ],
  source: {
    tsconfigPath: './tsconfig.build.json',
    entry: {
      index: [
        './src/**/*.{ts,tsx,vue,js}',
        '!./src/**/*.test.{ts,tsx,vue}',
        '!./src/**/*.bench.ts',
        '!./src/test-utils.ts',
        '!./src/test/**',
      ],
    },
  },
  plugins: [
    pluginVue({
      vueLoaderOptions: vueLynxLoaderOptions,
    }),
  ],
  output: {
    distPath: { root: 'dist' },
  },
})

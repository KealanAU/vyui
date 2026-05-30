import { defineConfig } from '@rslib/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vueLynxLoaderOptions } from '@vyui/shared-build-config/vue-loader-options'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// We use rslib with `bundle: false` (preserve-modules) for the JS emit
// and run vue-tsc separately for `.d.ts` files. The worklet pre-compile
// step is bolted onto the build chain via a custom rsbuild plugin (see
// `pluginVyuiWorklet`) that wires vue-lynx's worklet-loader logic — but
// against `@lynx-js/react/internal` so the LEPUS output's runtime imports
// are valid for both BG and MT consumers of our published package.

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      source: {
        tsconfigPath: './tsconfig.build.json',
        entry: {
          index: './src/index.ts',
          internal: './src/internal.ts',
          'date/index': './src/date/index.ts',
          'shared/index': './src/shared/index.ts',
        },
      },
    },
  ],
  plugins: [
    pluginVue({
      vueLoaderOptions: vueLynxLoaderOptions,
    }),
  ],
  tools: {
    rspack: (config, { addRules }) => {
      // Wire the worklet pre-compile loader. Mirrors vue-lynx's
      // `worklet-loader-mt` chain but emits a HYBRID output (script body
      // with `_wkltId` placeholders + `registerWorkletInternal(...)`
      // registrations gated by `loadWorkletRuntime`) so a single file is
      // valid on BOTH the BG and MT bundles of any consumer.
      const workletLoader = resolve(__dirname, './scripts/worklet-loader.cjs')
      addRules([
        {
          test: /\.(?:[cm]?[jt]sx?|vue)$/,
          exclude: [/node_modules/],
          use: [{ loader: workletLoader }],
          enforce: 'post',
        },
      ])
      return config
    },
  },
  output: {
    distPath: { root: 'dist' },
    externals: [
      // Bundleless mode externalizes everything by default. List bare
      // peers explicitly to be safe.
      'vue',
      'vue-lynx',
      /^@lynx-js\//,
      /^@iconify/,
      /^@internationalized\//,
      /^@vueuse\//,
      'ohash',
    ],
  },
})

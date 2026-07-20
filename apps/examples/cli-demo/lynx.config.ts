import { defineConfig } from '@lynx-js/rspeedy'
import { pluginVueLynx } from 'vue-lynx/plugin'
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLynxFullscreenHintPlugin } from '../_shared/lynx-fullscreen-hint.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// This demo intentionally does NOT use `../_shared/vyui-aliases.ts`: that helper
// points `@vyui/core` at the workspace SOURCE and therefore has to claim `@` for
// core's internal paths. A real CLI consumer installs `@vyui/core` from npm and
// keeps `@` for its OWN source. So here we resolve `@vyui/core` from its built
// package (its `exports` map → `dist`) and map `@` to this app's `src` — exactly
// what `vyui init` writes into a normal project's tsconfig.
export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
  },
  resolve: {
    alias: {
      // The CLI-installed components import each other via the `@` alias
      // (tsconfig + vyui.config.json) — the CLI's default prefix.
      '@': resolve(__dirname, 'src'),
      // vue-lynx single-instance pins: pnpm can otherwise hand each workspace
      // package its own vue-lynx dir, producing two worklet registries that
      // don't share `_wkltId` hashes. Mirrors `_shared/vyui-aliases.ts`.
      'vue': 'vue-lynx',
      'vue-lynx$': resolve(__dirname, 'node_modules/vue-lynx/runtime/dist/index.js'),
      'vue-lynx/entry-background$': resolve(__dirname, 'node_modules/vue-lynx/runtime/dist/entry-background.js'),
      'vue-lynx/main-thread$': resolve(__dirname, 'node_modules/vue-lynx/main-thread/dist/entry-main.js'),
      'vue-lynx/plugin$': resolve(__dirname, 'node_modules/vue-lynx/plugin/dist/index.js'),
      'vue-lynx/internal/ops$': resolve(__dirname, 'node_modules/vue-lynx/internal/dist/ops.js'),
      'vue-lynx/types$': resolve(__dirname, 'node_modules/vue-lynx/types/dist/index.js'),
    },
  },
  tools: {
    rspack: {
      resolve: {
        modules: [
          resolve(__dirname, 'node_modules'),
          'node_modules',
        ],
      },
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      // What `vyui init`/`vyui check` now write into a real consumer's config.
      // `@vyui/core` stays an npm dependency here (only styled components are
      // copied to src), so its main-thread worklets live in node_modules —
      // which vue-lynx's MT loader skips unless the package is allowlisted.
      // The Sortable card in App.vue is the canary: without this line it throws
      // `cannot read property 'bind' of undefined` on first long-press.
      includeWorkletPackages: ['@vyui/core'],
    }),
    pluginTailwindCSS({
      config: 'tailwind.config.ts',
      exclude: [/[\\/]node_modules[\\/]/],
    }),
    createLynxFullscreenHintPlugin('cli-demo:lynx-fullscreen-hint'),
    pluginQRCode(),
  ],
})

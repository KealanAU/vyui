import { defineConfig } from '@lynx-js/rspeedy'
import { pluginVueLynx } from 'vue-lynx/plugin'
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLynxFullscreenHintPlugin } from '../_shared/lynx-fullscreen-hint.ts'
import { createVyuiAliases } from '../_shared/vyui-aliases.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

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
      ...createVyuiAliases(__dirname),
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
    }),
    pluginTailwindCSS({
      config: 'tailwind.config.ts',
      exclude: [/[\\/]node_modules[\\/]/],
    }),
    createLynxFullscreenHintPlugin('kit-demo:lynx-fullscreen-hint'),
  ],
})

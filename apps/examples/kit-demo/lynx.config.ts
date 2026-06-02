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
      // Dark mode (CSS-var flip via root `:style`) needs BOTH: inline-variables
      // alone is unstable (the cascade locks after a few toggles). Cost of
      // enableCSSInheritance: font-size/line-height become inheritable and bleed
      // into components (e.g. taller tabs) — see README; scope TBD.
      enableCSSInheritance: true,
      enableCSSInlineVariables: true,
    }),
    pluginTailwindCSS({
      config: 'tailwind.config.ts',
      exclude: [/[\\/]node_modules[\\/]/],
    }),
    createLynxFullscreenHintPlugin('kit-demo:lynx-fullscreen-hint'),
  ],
})

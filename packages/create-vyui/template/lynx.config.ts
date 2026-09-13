import { defineConfig } from '@lynx-js/rspeedy'
import { pluginVueLynx } from 'vue-lynx/plugin'
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'

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
  plugins: [
    // `includeWorkletPackages` registers the `'main thread'` worklets shipped
    // inside @vyui/* — without it the first gesture crashes with
    // `TypeError: cannot read property 'bind' of undefined`.
    pluginVueLynx({
      includeWorkletPackages: ['@vyui/core', '@vyui/kit'],
    }),
    pluginTailwindCSS({
      config: 'tailwind.config.ts',
      // Tailwind rebuilds `content` from the module graph and drops
      // node_modules by default — let the Vy UI packages back through so
      // their utility classes are not purged on device.
      exclude: [/[\\/]node_modules[\\/](?!.*@vyui)/],
    }),
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`
      },
    }),
  ],
})

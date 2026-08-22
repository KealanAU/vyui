import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // `as any` — two Vite versions are hoisted in this workspace (one via rollup,
  // one via rolldown). The plugin's hook signature diverges between them; this
  // is a config-time type only, with no runtime effect.
  plugins: [vue() as any],
  define: {
    __DEV__: 'true',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**'],
    include: ['./**/*.test.{ts,js}'],
    setupFiles: [
      '@vyui/testing-utils/setup',
      './vitest.setup.ts',
    ],
    env: { TZ: 'US/Eastern' },
    server: {
      deps: {
        inline: [
          'vue-lynx',
          '@vyui/testing-utils',
        ],
      },
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
})

import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // `as any` — see packages/core/vitest.config.ts: two Vite versions are hoisted
  // in this workspace and the plugin hook signature diverges. Config-time only.
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
    // Importing the plugin pulls REGISTRY → every Vy* SFC → @vyui/core, which
    // touches vue-lynx's Lynx PAPI globals at import time; this setup installs them.
    setupFiles: ['@vyui/testing-utils/setup'],
    server: {
      deps: {
        inline: ['vue-lynx', '@vyui/testing-utils'],
      },
    },
  },
})

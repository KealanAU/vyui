import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'node e2e/serve.mjs',
    // The bundle doubles as the readiness probe: a clear fast failure when
    // `playground:build` hasn't run instead of 80 opaque boot timeouts.
    url: 'http://localhost:4173/playground/main.web.bundle',
    reuseExistingServer: !process.env.CI,
  },
})

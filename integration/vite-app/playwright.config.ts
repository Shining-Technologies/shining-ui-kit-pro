import { defineConfig, devices } from '@playwright/test'

const DEV = process.env.SUI_DEV === '1'

export default defineConfig({
  testDir: './e2e',
  testMatch: DEV ? /dev\.spec\.ts/ : /preview\.spec\.ts/,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: DEV ? 'http://localhost:5173' : 'http://localhost:4173',
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 1000 },
  },
  webServer: {
    command: DEV ? 'npx vite' : 'npx vite preview',
    url: DEV ? 'http://localhost:5173' : 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})

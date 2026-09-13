import { defineConfig, devices } from '@playwright/test'

// Production suite: `next build` first, then `npx playwright test`.
// DEV=turbopack|webpack runs the smoke suite against `next dev` instead.
const dev = process.env.DEV
const port = dev ? 3100 : 3200
const command = dev
  ? `npx next dev -p ${port}${dev === 'webpack' ? ' --webpack' : ''}`
  : `npx next start -p ${port}`

export default defineConfig({
  testDir: dev ? './tests-dev' : './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: dev ? 120_000 : 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    // The browser is deliberately in a different zone from the server (Asia/Dhaka)
    // and from the table's zone (Australia/Sydney), like a real remote visitor.
    timezoneId: 'America/Los_Angeles',
    locale: 'en-US',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command,
    url: `http://localhost:${port}/api/users`,
    reuseExistingServer: false,
    // First compile in dev on this (slow, per Next's own warning) filesystem takes 30s+ per route.
    timeout: dev ? 300_000 : 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: dev === 'webpack' ? { NEXT_DIST_DIR: '.next-webpack' } : {},
  },
})

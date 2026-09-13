import { expect, test } from '@playwright/test'

test('dev server: page loads without console errors and the table renders', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  await page.goto('/')
  const rows = page.locator('section[aria-label="Orders"] tbody tr[data-row-id]')
  await expect(rows.first()).toBeVisible({ timeout: 45_000 })
  await expect(rows).toHaveCount(10)
  await expect(page.getByTestId('trend-chart').locator('svg.recharts-surface').first()).toBeVisible()
  await page.waitForTimeout(1000)
  expect(errors).toEqual([])
})

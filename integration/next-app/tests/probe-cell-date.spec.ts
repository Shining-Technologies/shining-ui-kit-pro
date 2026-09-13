import { test, expect } from './fixtures'

// Regression test for a package bug fixed in 2.0.0-rc.0: CellDate ignored the DataTable's timeZone and
// locale, so server and browser rendered different days and React reported a hydration mismatch.
const bugTest = test

bugTest('CellDate inside DataTable(timeZone, locale) hydrates without mismatch and shows the Sydney day', async ({ page }) => {
  await page.goto('/probe/cell-date')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator('td[data-column-id="createdAt"]')).toHaveText('13 Oct 2025')
  await expect(page.locator('td[data-column-id="lastLogin"]')).toContainText('10 Mar 2026')
})

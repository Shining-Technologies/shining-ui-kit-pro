import { test, expect } from '../tests/fixtures'

const ROUTES = ['/', '/users', '/client-table', '/shell', '/theme', '/charts']

for (const route of ROUTES) {
  test(`D dev ${route}: no console errors and no Next error overlay`, async ({ page }) => {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    // Rendered text only: the portal's shadow root also contains <style> text, which must be ignored.
    const overlay = await page.evaluate(() =>
      Array.from(document.querySelectorAll('nextjs-portal'))
        .flatMap((p) => Array.from(p.shadowRoot?.children ?? []))
        .filter((el) => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT')
        .map((el) => (el as HTMLElement).innerText ?? '')
        .join('\n'),
    )
    expect(overlay).not.toMatch(/\d+\s+Issues?\b|Runtime Error|Build Error|Console Error|Hydration|Unhandled/i)
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  })
}

test('D dev /users: search and sort still work', async ({ page }) => {
  await page.goto('/users')
  await page.waitForLoadState('networkidle')
  const search = page.getByRole('searchbox', { name: 'Search table' })
  await search.pressSequentially('ann', { delay: 120 })
  await expect(page).toHaveURL(/q=ann/, { timeout: 30_000 })
  await expect(search).toHaveValue('ann')
  await page.getByRole('button', { name: /^Score, sort/ }).click()
  await expect(page).toHaveURL(/sort=score/, { timeout: 30_000 })
})

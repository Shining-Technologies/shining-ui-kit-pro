import { test, expect } from './fixtures'

const ROUTES = ['/', '/users', '/client-table', '/shell', '/theme', '/charts']

for (const route of ROUTES) {
  test(`C1 ${route}: loads with no console errors, page errors or hydration warnings`, async ({ page, problems }) => {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(750)
    // The auto fixture asserts `problems` is empty after the test; assert here too for a clearer failure.
    expect(problems.filter((p) => /hydrat|did not match|#418|#423|#425/i.test(p.text))).toEqual([])
  })
}

import { test, expect } from './fixtures'

test('C8 /charts: TrendChart and DonutChart render sized svg', async ({ page }) => {
  await page.goto('/charts')
  await page.waitForLoadState('networkidle')
  for (const id of ['trend', 'donut']) {
    const svg = page.getByTestId(id).locator('svg.recharts-surface').first()
    await expect(svg).toBeVisible()
    const box = (await svg.boundingBox())!
    expect(box.width, id).toBeGreaterThan(0)
    expect(box.height, id).toBeGreaterThan(0)
  }
})

test('E /api/users: route handler uses /core and /theme', async ({ request }) => {
  const res = await request.get('/api/users?q=ann&sort=-score&size=25&f.status=includes:["active"]')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.pageSize).toBe(25)
  expect(body.rows.length).toBeGreaterThan(0)
  expect(body.rows.length).toBeLessThanOrEqual(25)
  const scores = body.rows.map((u: { score: number | null }) => u.score)
  for (const u of body.rows) expect(u.status).toBe('active')
  const nonNull = scores.filter((s: number | null) => s !== null)
  expect(nonNull).toEqual([...nonNull].sort((a: number, b: number) => b - a))
  expect(body.theme.presets).toBe(10)
  expect(body.theme.css).toContain('--primary')
})

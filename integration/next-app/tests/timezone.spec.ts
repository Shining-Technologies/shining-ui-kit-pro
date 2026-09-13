import { users } from '../lib/users'
import { test, expect, dayIn } from './fixtures'
import { rowIds } from './users-helpers'

const DATE = '2026-03-10'

test('C4 /users: date "on" filter uses the Sydney calendar day, not UTC or the browser zone', async ({ page, request }) => {
  const sydney = users.filter((u) => u.lastLogin && dayIn(u.lastLogin, 'Australia/Sydney') === DATE).map((u) => u.id).sort()
  const utc = users.filter((u) => u.lastLogin && u.lastLogin.slice(0, 10) === DATE).map((u) => u.id).sort()
  const la = users.filter((u) => u.lastLogin && dayIn(u.lastLogin, 'America/Los_Angeles') === DATE).map((u) => u.id).sort()
  // Preconditions: the data really distinguishes the zones and fits one page.
  expect(sydney).not.toEqual(utc)
  expect(sydney).not.toEqual(la)
  expect(sydney.length).toBeGreaterThan(0)
  expect(sydney.length).toBeLessThanOrEqual(50)

  const url = `/users?size=50&f.lastLogin=on:"${DATE}"`
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  expect((await rowIds(page)).sort()).toEqual(sydney)
  await expect(page.locator('.sui-pagination__range')).toContainText(`of ${sydney.length}`)
  for (const text of await page.locator('td[data-column-id="lastLogin"]').allTextContents()) {
    expect(text).toContain('10 Mar 2026')
  }

  const api = await (await request.get(url.replace('/users', '/api/users'))).json()
  expect(api.rows.map((u: { id: string }) => u.id).sort()).toEqual(sydney)
})

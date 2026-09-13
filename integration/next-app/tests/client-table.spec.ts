import { users, type User } from '../lib/users'
import { test, expect, dayIn } from './fixtures'
import { rowIds } from './users-helpers'

function expected(filters: { status: boolean; lastLogin: boolean }) {
  const rows = users.filter(
    (u) =>
      (!filters.status || u.status === 'active') &&
      (!filters.lastLogin || (u.lastLogin !== null && dayIn(u.lastLogin, 'Australia/Sydney') > '2026-03-15')),
  )
  const sorted = [...rows].sort((a: User, b: User) => {
    if (a.score === null) return b.score === null ? 0 : 1
    if (b.score === null) return -1
    return b.score - a.score
  })
  return { total: rows.length, ids: sorted.slice(0, 10).map((u) => u.id), first: sorted[0]! }
}

test('C5 /client-table: server HTML already filtered/sorted/formatted; hydration keeps it; filter count; clearing', async ({ page, request }) => {
  const both = expected({ status: true, lastLogin: true })
  const html = await (await request.get('/client-table')).text()
  expect([...html.matchAll(/data-row-id="([^"]+)"/g)].map((m) => m[1])).toEqual(both.ids)
  expect(html).toContain('aria-label="Filters, 2 active"')
  const formatted = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Sydney',
  }).format(new Date(both.first.lastLogin!))
  expect(html).toContain(formatted)
  expect(html).toContain(`of ${both.total}`)

  await page.goto('/client-table')
  await page.waitForLoadState('networkidle')
  expect(await rowIds(page)).toEqual(both.ids)
  const filtersButton = page.getByRole('button', { name: /^Filters, / })
  await expect(filtersButton).toHaveAccessibleName('Filters, 2 active')
  await expect(page.locator('.sui-active-filters .sui-chip')).toHaveCount(2)

  await page.getByRole('button', { name: 'Remove Status filter' }).click()
  await expect(filtersButton).toHaveAccessibleName('Filters, 1 active')
  await expect(page.locator('.sui-active-filters .sui-chip')).toHaveCount(1)
  const one = expected({ status: false, lastLogin: true })
  await expect.poll(() => rowIds(page)).toEqual(one.ids)
  await expect(page.locator('.sui-pagination__range')).toContainText(`of ${one.total}`)
})

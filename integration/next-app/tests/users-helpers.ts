import type { Page } from '@playwright/test'
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'
import { users } from '../lib/users'
import { userColumns } from '../lib/user-columns'
import { expect } from './fixtures'

export const rowIds = (page: Page) =>
  page.locator('table tbody tr[data-row-id]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-row-id')!))

export function expectedFor(search: string) {
  const query = parseQuerySearchParams(search, { columns: userColumns, defaultPageSize: 10, pageSizeOptions: [10, 25, 50] })
  return applyQuery(users, query, { columns: userColumns, timeZone: 'Australia/Sydney', locale: 'en-AU' })
}

/** Wait until the rendered rows equal what applyQuery returns for the current URL. */
export async function expectTableMatchesUrl(page: Page) {
  await expect
    .poll(
      async () => {
        const expected = expectedFor(new URL(page.url()).search)
        const ids = await rowIds(page)
        const range = await page.locator('.sui-pagination__range').textContent()
        return JSON.stringify(ids) === JSON.stringify(expected.rows.map((u) => u.id)) &&
          (range ?? '').includes(`of ${expected.total.toLocaleString('en-AU')}`)
      },
      { timeout: 15_000, message: `rows for ${page.url()}` },
    )
    .toBe(true)
}

/** Record every history.pushState/replaceState URL (Next's router uses them). */
export async function trackHistory(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __urls: string[] }
    w.__urls = []
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = history[method].bind(history)
      history[method] = (data: unknown, unused: string, url?: string | URL | null) => {
        original(data, unused, url)
        w.__urls.push(`${method} ${location.pathname}${location.search}`)
      }
    }
  })
  return async () => {
    const all = await page.evaluate(() => (window as unknown as { __urls: string[] }).__urls)
    return all.filter((entry, i) => i === 0 || entry.split(' ')[1] !== all[i - 1]!.split(' ')[1])
  }
}

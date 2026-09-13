import { users } from '../lib/users'
import { test, expect, normalize } from './fixtures'
import { expectTableMatchesUrl, expectedFor, rowIds, trackHistory } from './users-helpers'

const searchBox = (page: import('@playwright/test').Page) => page.getByRole('searchbox', { name: 'Search table' })

test('C3a /users: typing "ann" slowly never loses characters; URL and rows follow', async ({ page }) => {
  await page.goto('/users')
  await page.waitForLoadState('networkidle')
  const search = searchBox(page)
  await search.click()
  let typed = ''
  for (const ch of 'ann') {
    await search.pressSequentially(ch, { delay: 120 })
    typed += ch
    await expect(search).toHaveValue(typed)
  }
  await expect(page).toHaveURL(/[?&]q=ann(&|$)/)
  await expectTableMatchesUrl(page)
  // Still intact after all round trips have settled.
  await page.waitForTimeout(1500)
  await expect(search).toHaveValue('ann')

  const cells = await page.locator('table tbody tr[data-row-id]').allTextContents()
  expect(cells.length).toBeGreaterThan(0)
  for (const text of cells) expect(normalize(text)).toContain('ann')

  const expectedTotal = users.filter((u) =>
    [u.name, u.email, u.role, u.status].some((v) => normalize(v).includes('ann')),
  ).length
  await expect(page.locator('.sui-pagination__range')).toContainText(`of ${expectedTotal}`)
})

test('C3b /users: sorting updates sort= and resets page in the same navigation', async ({ page }) => {
  const history = await trackHistory(page)
  await page.goto('/users?page=3')
  await page.waitForLoadState('networkidle')
  await expectTableMatchesUrl(page)
  const before = (await history()).length

  await page.getByRole('button', { name: /^Score, sort/ }).click()
  await expect(page).toHaveURL(/[?&]sort=score(&|$)/)
  await expectTableMatchesUrl(page)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)

  const after = (await history()).slice(before)
  // Every URL written after the click must carry the sort and no page: no intermediate navigation.
  expect(after.length, JSON.stringify(after)).toBeGreaterThan(0)
  for (const entry of after) {
    expect(entry, JSON.stringify(after)).toMatch(/sort=score/)
    expect(entry, JSON.stringify(after)).not.toMatch(/page=/)
  }
  await expect(page.locator('th[data-column-id="score"]')).toHaveAttribute('aria-sort', 'ascending')
})

test('C3c /users: page, page size, multiSelect and number filters; reload; Back restores URL and table', async ({ page, request }) => {
  await page.goto('/users')
  await page.waitForLoadState('networkidle')

  await searchBox(page).pressSequentially('ann', { delay: 120 })
  await expect(page).toHaveURL(/q=ann/)
  await expectTableMatchesUrl(page)

  await page.getByRole('button', { name: 'Go to page 2' }).click()
  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  await expectTableMatchesUrl(page)

  await page.getByRole('combobox', { name: 'Rows per page' }).click()
  await page.getByRole('option', { name: '25' }).click()
  await expect(page).toHaveURL(/[?&]size=25(&|$)/)
  await expectTableMatchesUrl(page)

  await page.getByRole('button', { name: 'Status filter' }).click()
  await page.getByRole('option', { name: 'Active' }).click()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/f\.status=includes(%3A|:)/)
  await expectTableMatchesUrl(page)

  await page.getByRole('button', { name: 'Score filter' }).click()
  await page.getByRole('spinbutton', { name: 'Score minimum' }).fill('50')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/f\.score=/)
  await expectTableMatchesUrl(page)

  const urlA = page.url()
  const idsA = await rowIds(page)
  expect(idsA.length).toBeGreaterThan(0)
  const expectedA = expectedFor(new URL(urlA).search)
  for (const u of expectedA.rows) {
    expect(u.status).toBe('active')
    expect(u.score!).toBeGreaterThanOrEqual(50)
  }

  // Server-rendered HTML for that URL contains the same rows.
  const html = await (await request.get(urlA)).text()
  expect([...html.matchAll(/data-row-id="([^"]+)"/g)].map((m) => m[1])).toEqual(idsA)
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(await rowIds(page)).toEqual(idsA)
  await expect(searchBox(page)).toHaveValue('ann')

  // Client navigation away (push), then Back.
  await page.getByTestId('reset-view').click()
  await expect(page).toHaveURL(/\/users$/)
  await expectTableMatchesUrl(page)
  await expect(searchBox(page)).toHaveValue('')

  await page.goBack()
  await expect(page).toHaveURL(urlA)
  await expectTableMatchesUrl(page)
  expect(await rowIds(page)).toEqual(idsA)
  await expect(searchBox(page)).toHaveValue('ann')
  await expect(page.getByRole('button', { name: 'Status filter', exact: true })).toContainText('Active')
})

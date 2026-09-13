import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

const orders = (page: Page) => page.getByRole('region', { name: 'Orders' }).or(page.locator('section[aria-label="Orders"]'))
const bodyRows = (page: Page) => page.locator('section[aria-label="Orders"] tbody tr[data-row-id]')
const rangeText = (page: Page) => page.locator('section[aria-label="Orders"] .sui-pagination__range')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(bodyRows(page).first()).toBeVisible()
})

test('no console errors or page errors on load and interaction', async ({ page }) => {
  const errors = trackErrors(page)
  await page.reload()
  await expect(bodyRows(page).first()).toBeVisible()
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  expect(errors).toEqual([])
})

test('table: search filters rows', async ({ page }) => {
  await page.locator('section[aria-label="Orders"]').getByRole('searchbox', { name: 'Search table' }).fill('Customer 123')
  await expect(rangeText(page)).toContainText('of 1')
  await expect(bodyRows(page)).toHaveCount(1)
  await expect(bodyRows(page).first()).toContainText('Customer 123')
})

test('table: multiSelect filter narrows to one status', async ({ page }) => {
  await page.getByRole('button', { name: 'Status filter' }).click()
  const pop = page.locator('[data-radix-popper-content-wrapper]').last()
  await pop.getByText('Paid', { exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(rangeText(page)).toContainText('of 75')
  const statuses = await bodyRows(page).locator('td[data-column-id="status"]').allInnerTexts()
  expect(new Set(statuses)).toEqual(new Set(['paid']))
})

test('table: number range filter', async ({ page }) => {
  await page.getByRole('button', { name: 'Total filter' }).click()
  const pop = page.locator('[data-radix-popper-content-wrapper]').last()
  const inputs = pop.locator('input')
  // Choose the "between" operator when an operator control exists, then fill min/max.
  const operator = pop.getByRole('combobox')
  if (await operator.count()) {
    await operator.first().click()
    await page.getByRole('option', { name: /between/i }).click()
  }
  await expect(inputs).toHaveCount(2)
  await inputs.nth(0).fill('100')
  await inputs.nth(1).fill('120')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  // totals are (i*37)%1000 for i in 0..299
  const expected = Array.from({ length: 300 }, (_, i) => (i * 37) % 1000).filter((t) => t >= 100 && t <= 120).length
  await expect(rangeText(page)).toContainText(`of ${expected}`)
  const values = await bodyRows(page).locator('[data-testid="total-cell"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-value'))))
  expect(values.length).toBeGreaterThan(0)
  for (const v of values) expect(v >= 100 && v <= 120).toBe(true)
})

test('table: sort by Total and paginate', async ({ page }) => {
  await page.locator('section[aria-label="Orders"]').getByRole('button', { name: 'Total, sort ascending' }).click()
  const totals = async () => bodyRows(page).locator('[data-testid="total-cell"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-value'))))
  const asc = await totals()
  expect(asc).toEqual([...asc].sort((a, b) => a - b))
  expect(asc[0]).toBe(0)
  await expect(page.locator('section[aria-label="Orders"] th[data-column-id="total"]')).toHaveAttribute('aria-sort', 'ascending')
  await page.getByRole('button', { name: 'Go to page 2' }).click()
  await expect(rangeText(page)).toContainText('11–20 of 300')
  const page2 = await totals()
  expect(Math.min(...page2)).toBeGreaterThanOrEqual(Math.max(...asc))
})

test('table: selecting rows updates the selection count', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Select row 2', exact: true }).click()
  await expect(page.locator('section[aria-label="Orders"]')).toContainText('2 of 300 selected')
  await expect(bodyRows(page).first()).toHaveAttribute('aria-selected', 'true')
})

test('table: expanding a row shows its details', async ({ page }) => {
  const firstRow = bodyRows(page).first()
  await firstRow.getByRole('button', { name: 'Expand row details' }).click()
  await expect(page.getByTestId('expanded-content')).toHaveText('Details for Customer 1')
  await expect(firstRow.locator('.sui-expander')).toHaveAttribute('aria-expanded', 'true')
})

test('table: row actions render and CSV exports all filtered rows', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Edit ord-1', exact: true })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('orders.csv')
  await expect(page.getByTestId('csv-lines')).toHaveText('301')
})

test('dialog, dropdown, select and combobox open and close', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog', { name: 'Test dialog' })).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('menuitem', { name: 'Edit item' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Fruit' }).click()
  await page.getByRole('option', { name: 'Banana' }).click()
  await expect(page.getByTestId('fruit-value')).toHaveText('banana')
  await expect(page.getByRole('listbox')).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Country' }).click()
  await page.getByRole('option', { name: 'New Zealand' }).click()
  await expect(page.getByTestId('country-value')).toHaveText('nz')
  await expect(page.getByRole('combobox', { name: 'Country' })).toHaveAttribute('aria-expanded', 'false')
})

test('date field picks a date', async ({ page }) => {
  await page.getByRole('button', { name: 'Start date' }).click()
  const grid = page.getByRole('grid')
  await expect(grid).toBeVisible()
  await grid.getByRole('gridcell').filter({ hasText: /^15$/ }).first().click()
  await expect(page.getByTestId('date-value')).toHaveText(/^\d{4}-\d{2}-15$/)
})

test('toast appears', async ({ page }) => {
  await page.getByRole('button', { name: 'Show toast' }).click()
  await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Saved')
})

test('colour mode toggle adds/removes .dark and persists across reload', async ({ page }) => {
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/\bdark\b/)
  await page.getByTestId('color-toggle').click()
  await expect(html).toHaveClass(/\bdark\b/)
  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
  // class is set by the inline script before React runs
  const scriptApplied = await page.evaluate(() => localStorage.getItem('sui-color-mode'))
  expect(scriptApplied).toBe('dark')
  await page.getByTestId('color-toggle').click()
  await expect(html).not.toHaveClass(/\bdark\b/)
  await page.reload()
  await expect(html).not.toHaveClass(/\bdark\b/)
})

test('Tailwind override beats component styles; bg-primary equals --primary', async ({ page }) => {
  const bg = (id: string) => page.getByTestId(id).evaluate((el) => getComputedStyle(el).backgroundColor)
  const red = await bg('btn-red')
  const ref = await bg('ref-red')
  const def = await bg('btn-default')
  expect(red).toBe(ref)
  expect(def).not.toBe(ref)

  const { primaryUtility, primaryVar } = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--primary)'
    document.body.appendChild(probe)
    const primaryVar = getComputedStyle(probe).backgroundColor
    probe.remove()
    const primaryUtility = getComputedStyle(document.querySelector('[data-testid="tw-primary"]')!).backgroundColor
    return { primaryUtility, primaryVar }
  })
  expect(primaryUtility).toBe(primaryVar)
  expect(def).toBe(primaryVar)
})

test('charts render non-empty svg', async ({ page }) => {
  for (const id of ['trend-chart', 'donut-chart']) {
    const svg = page.getByTestId(id).locator('svg.recharts-surface').first()
    await expect(svg).toBeVisible()
    const shapes = await page.getByTestId(id).locator('svg.recharts-surface path, svg.recharts-surface rect, svg.recharts-surface circle').count()
    expect(shapes, `${id} drawn shapes`).toBeGreaterThan(1)
    const box = await svg.boundingBox()
    expect(box!.width).toBeGreaterThan(50)
    expect(box!.height).toBeGreaterThan(50)
  }
})

test('virtualized table renders few DOM rows and scrolling reveals later rows', async ({ page }) => {
  const section = page.getByTestId('virtualized')
  const rows = section.locator('tbody tr[data-row-id]')
  await expect(rows.first()).toBeVisible()
  const initial = await rows.count()
  expect(initial).toBeGreaterThan(0)
  expect(initial).toBeLessThan(100)
  await expect(section.locator('tr[data-row-id="ord-4000"]')).toHaveCount(0)
  const scroller = section.locator('.sui-container[data-sui-scroll]')
  await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight * 0.8 })
  await expect(section.locator('tr[data-row-id="ord-4000"]')).toBeAttached()
  expect(await rows.count()).toBeLessThan(100)
  await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight })
  await expect(section.locator('tr[data-row-id="ord-5000"]')).toBeAttached()
})

// keep the helper referenced for future checks
void orders

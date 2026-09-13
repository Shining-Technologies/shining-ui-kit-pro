import { test, expect } from './fixtures'

test('C6 /shell: overlays, form controls, toast, sidebar, colour mode', async ({ page }) => {
  await page.goto('/shell')
  await page.waitForLoadState('networkidle')

  // Dialog: open, close, focus returns to the trigger.
  const open = page.getByTestId('open-dialog')
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Demo dialog' })
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()

  // Dropdown menu.
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(page.getByTestId('menu-choice')).toHaveText('edit')

  // Popover.
  await page.getByRole('button', { name: 'Open popover' }).click()
  await expect(page.getByText('Popover body')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Popover body')).toBeHidden()

  // Select.
  await page.getByRole('combobox', { name: 'Fruit' }).click()
  await page.getByRole('option', { name: 'Banana' }).click()
  await expect(page.getByTestId('fruit')).toHaveText('banana')

  // Combobox.
  await page.getByRole('combobox', { name: 'Framework' }).click()
  await page.getByRole('option', { name: 'Remix' }).click()
  await expect(page.getByTestId('framework')).toHaveText('remix')

  // DateField.
  await page.getByRole('button', { name: 'Start date' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /\b15\b/ }).first().click()
  await expect(page.getByTestId('date')).toHaveText(/^\d{4}-\d{2}-15$/)
  await page.keyboard.press('Escape')

  // Toast.
  await page.getByRole('button', { name: 'Show toast' }).click()
  await expect(page.getByText('Toast from useToast')).toBeVisible()

  // Nested nav item expands and uses next/link hrefs; current page is marked.
  const nav = page.locator('[data-slot="sidebar"]')
  await expect(nav.getByRole('link', { name: 'Shell' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('button', { name: 'Data' }).click()
  await expect(nav.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users')
  await expect(nav.getByRole('link', { name: 'Client table' })).toHaveAttribute('href', '/client-table')

  // Sidebar trigger collapses.
  const sidebar = page.locator('[data-slot="sidebar"]')
  const widthBefore = (await sidebar.boundingBox())!.width
  const trigger = page.locator('[data-slot="sidebar-trigger"]')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 0).toBeLessThan(widthBefore)
})

test('C6 /shell: ColorModeToggle sets dark, persists across reload at first paint without hydration warnings', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __darkAtBody?: boolean }
    const record = () => {
      if (document.body && w.__darkAtBody === undefined) w.__darkAtBody = document.documentElement.classList.contains('dark')
    }
    new MutationObserver(record).observe(document, { childList: true, subtree: true })
  })
  await page.goto('/shell')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)

  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  expect(await page.evaluate(() => localStorage.getItem('sui-color-mode'))).toBe('dark')

  await page.reload({ waitUntil: 'domcontentloaded' })
  const early = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    atBody: (window as unknown as { __darkAtBody?: boolean }).__darkAtBody,
  }))
  expect(early).toEqual({ dark: true, atBody: true })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
})

import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from './fixtures'

test('C2 /: page.tsx import chain has no app-level use client', async () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8')
  expect(source).not.toMatch(/^\s*['"]use client['"]/m)
  const localImports = [...source.matchAll(/from '(@\/[^']+|\.[^']+)'/g)].map((m) => m[1]!)
  for (const spec of localImports) {
    const base = path.join(process.cwd(), spec.replace(/^@\//, ''))
    const file = ['.ts', '.tsx'].map((ext) => base + ext).find((f) => fs.existsSync(f))!
    expect(fs.readFileSync(file, 'utf8'), file).not.toMatch(/['"]use client['"]/)
  }
})

test('C2 /: server-called helpers rendered, tenant theme scoped, interactive parts work', async ({ page, request }) => {
  // Server HTML already contains the helper results.
  const html = await (await request.get('/')).text()
  expect(html).toContain('name,score,initial')
  expect(html).toContain('[0,&quot;ellipsis-start&quot;,3,4,5,&quot;ellipsis-end&quot;,19]')
  expect(html).toContain('51-75 of 480')
  expect(html).toContain('[data-tenant]')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('helper-columns')).toHaveText('name,score,initial')
  await expect(page.getByTestId('page-numbers')).toHaveText('[0,"ellipsis-start",3,4,5,"ellipsis-end",19]')
  await expect(page.getByTestId('page-range')).toHaveText('51-75 of 480')
  expect(Number(await page.getByTestId('theme-css-length').textContent())).toBeGreaterThan(200)

  const { rootPrimary, tenantPrimary, rootButtonBg, tenantButtonBg } = await page.evaluate(() => {
    const tenant = document.querySelector('[data-tenant]')!
    return {
      rootPrimary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
      tenantPrimary: getComputedStyle(tenant).getPropertyValue('--primary').trim(),
      rootButtonBg: getComputedStyle(document.querySelector('[data-testid="home-primary-button"]')!).backgroundColor,
      tenantButtonBg: getComputedStyle(document.querySelector('[data-testid="tenant-button"]')!).backgroundColor,
    }
  })
  expect(tenantPrimary).not.toBe('')
  expect(tenantPrimary).not.toBe(rootPrimary)
  expect(tenantButtonBg).not.toBe(rootButtonBg)

  await page.getByRole('tab', { name: 'Two' }).click()
  await expect(page.getByText('Second panel')).toBeVisible()
  await page.getByRole('button', { name: 'Hover me' }).hover()
  await expect(page.getByRole('tooltip')).toContainText('Tooltip from a Server Component')
})

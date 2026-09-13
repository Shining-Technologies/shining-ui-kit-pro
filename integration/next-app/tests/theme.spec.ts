import { test, expect } from './fixtures'

test('C7 /theme: Tailwind utilities override kit styles; presets scope --primary', async ({ page }) => {
  await page.goto('/theme')
  await page.waitForLoadState('networkidle')

  const styles = await page.evaluate(() => {
    const cs = (id: string) => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!)
    return {
      defaultBg: cs('default-button').backgroundColor,
      overrideBg: cs('override-button').backgroundColor,
      referenceBg: cs('red-reference').backgroundColor,
      overrideRadius: cs('override-button').borderTopLeftRadius,
      defaultRadius: cs('default-button').borderTopLeftRadius,
      twPrimaryBg: cs('tw-primary').backgroundColor,
      rootPrimary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
      slatePrimary: cs('theme-slate').getPropertyValue('--primary').trim(),
      emberPrimary: cs('theme-ember').getPropertyValue('--primary').trim(),
    }
  })
  expect(styles.overrideBg).not.toBe(styles.defaultBg)
  expect(styles.overrideBg).toBe(styles.referenceBg)
  expect(styles.overrideRadius).toBe('0px')
  expect(styles.defaultRadius).not.toBe('0px')
  // bg-primary resolves to the same colour the default Button uses.
  expect(styles.twPrimaryBg).toBe(styles.defaultBg)
  expect(styles.slatePrimary).not.toBe('')
  expect(styles.slatePrimary).not.toBe(styles.emberPrimary)
  expect(styles.slatePrimary).not.toBe(styles.rootPrimary)
  expect(styles.emberPrimary).not.toBe(styles.rootPrimary)
})

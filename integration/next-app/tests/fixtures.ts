import { test as base, expect, type Page } from '@playwright/test'

export interface ConsoleProblem {
  kind: 'console.error' | 'console.warning' | 'pageerror'
  text: string
}

const HYDRATION = /hydrat|did not match|Minified React error #(418|419|423|425)/i

/** Attach listeners that record console errors, hydration warnings and uncaught errors. */
export function watchConsole(page: Page): ConsoleProblem[] {
  const problems: ConsoleProblem[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') problems.push({ kind: 'console.error', text })
    else if (msg.type() === 'warning' && HYDRATION.test(text)) problems.push({ kind: 'console.warning', text })
  })
  page.on('pageerror', (err) => problems.push({ kind: 'pageerror', text: `${err.name}: ${err.message}` }))
  return problems
}

export const test = base.extend<{ problems: ConsoleProblem[] }>({
  problems: [
    async ({ page }, use) => {
      const problems = watchConsole(page)
      await use(problems)
      // Every test fails on any console error, uncaught error or hydration warning.
      expect(problems, 'console errors / hydration warnings / page errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Text of every body row's cells, as arrays. */
export async function tableRows(page: Page, scope = page.locator('body')): Promise<string[][]> {
  return scope.locator('table tbody tr').evaluateAll((rows) =>
    rows.map((row) => Array.from(row.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  )
}

export const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Calendar day of a timestamp in a zone, yyyy-mm-dd. */
export function dayIn(timestamp: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(timestamp),
  )
}

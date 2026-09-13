// Dev helper: start `vite preview`, dump DOM landmarks for writing selectors, then stop the server.
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

// Spawn vite's own node process (no shell) so server.pid is the server itself and kill() really stops it.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1'], { stdio: 'pipe' })
const kill = () => server.kill()
let serverLog = ''
server.stdout.on('data', (d) => { serverLog += d; process.stdout.write(`[server] ${d}`) })
server.stderr.on('data', (d) => { serverLog += d; process.stdout.write(`[server:err] ${d}`) })
server.on('exit', (code) => console.log(`[server] exited with code ${code}`))
try {
  const started = Date.now()
  while (!/Local:/.test(serverLog)) {
    if (server.exitCode !== null) throw new Error(`vite preview exited early:\n${serverLog}`)
    if (Date.now() - started > 90_000) throw new Error(`vite preview did not start within 90s:\n${serverLog}`)
    await new Promise((r) => setTimeout(r, 250))
  }
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  page.on('console', (m) => console.log('CONSOLE', m.type(), m.text()))
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  await page.goto('http://127.0.0.1:4173')
  await page.waitForTimeout(1500)
  const out = await page.evaluate(() => {
    const orders = document.querySelector('section[aria-label="Orders"]')
    const strip = (el, max) => (el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, max) : 'MISSING')
    const firstRow = orders?.querySelector('tbody tr')
    return {
      htmlClass: document.documentElement.className,
      toolbar: strip(orders?.querySelector('[class*="toolbar"]'), 6000),
      thead: strip(orders?.querySelector('thead'), 3000),
      firstRow: strip(firstRow, 3000),
      pagination: strip(orders?.querySelector('[class*="pagination"]'), 2500),
      bodyRows: orders?.querySelectorAll('tbody tr').length,
      virtRows: document.querySelectorAll('[data-testid="virtualized"] tbody tr').length,
      virtScroller: strip(document.querySelector('[data-testid="virtualized"] [class*="container"]')?.cloneNode(false), 500),
      toggle: strip(document.querySelector('[data-testid="color-toggle"]'), 500),
      combobox: strip(document.querySelector('[aria-label="Country"]'), 500),
      dateField: strip(document.querySelector('section[aria-label="Overlays and fields"]')?.querySelectorAll('button')[4]?.parentElement, 1200),
      trendSvg: document.querySelectorAll('[data-testid="trend-chart"] svg').length,
    }
  })
  for (const [k, v] of Object.entries(out)) console.log(`\n== ${k}\n${v}`)
  await browser.close()
} finally {
  kill()
}

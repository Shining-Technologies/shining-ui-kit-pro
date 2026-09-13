// Builds one minified production bundle per entry and reports raw/gzip JS size plus unrelated-code markers.
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const entries = {
  'button-root': `import { createRoot } from 'react-dom/client'
import { Button } from '@shining-technologies/ui'
createRoot(document.getElementById('root')).render(<Button>Hi</Button>)`,
  'button-family': `import { createRoot } from 'react-dom/client'
import { Button } from '@shining-technologies/ui/button'
createRoot(document.getElementById('root')).render(<Button>Hi</Button>)`,
  'core-applyQuery': `import { applyQuery } from '@shining-technologies/ui/core'
const r = applyQuery([{ a: 1 }, { a: 2 }], { pageIndex: 0, pageSize: 10 }, { columns: [{ accessorKey: 'a' }] })
document.body.textContent = String(r.total)`,
  'datatable-root': `import { createRoot } from 'react-dom/client'
import { DataTable } from '@shining-technologies/ui'
createRoot(document.getElementById('root')).render(<DataTable data={[{ a: 1 }]} columns={[{ accessorKey: 'a', header: 'A' }]} />)`,
  'react-baseline': `import { createRoot } from 'react-dom/client'
createRoot(document.getElementById('root')).render(<button>Hi</button>)`,
}

const markers = ['sui-sidebar', 'Combobox', 'sui-combobox', '@tanstack', 'getCoreRowModel', 'recharts', 'react-day', 'phone', 'sui-data-table', 'sui-dialog', '@radix-ui', 'data-radix', 'countries']

const results = []
for (const [name, code] of Object.entries(entries)) {
  const dir = join(here, 'entries', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'main.jsx'), code)
  writeFileSync(join(dir, 'index.html'), '<!doctype html><div id="root"></div><script type="module" src="./main.jsx"></script>')
  const outDir = join(here, 'dist', name)
  await build({
    root: dir,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    build: { outDir, emptyOutDir: true, minify: true, reportCompressedSize: false },
  })
  const assets = join(outDir, 'assets')
  const js = readdirSync(assets).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n')
  const found = markers.filter((m) => js.includes(m))
  results.push({ name, raw: js.length, gzip: gzipSync(js).length, found })
}

console.table(results.map((r) => ({ entry: r.name, 'raw kB': (r.raw / 1000).toFixed(2), 'gzip kB': (r.gzip / 1000).toFixed(2), markers: r.found.join(', ') || '-' })))
writeFileSync(join(here, 'results.json'), JSON.stringify(results, null, 2))

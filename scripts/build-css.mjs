// Inline `@import './x.css'` into a single distributable stylesheet.
// Deliberately dependency-free: the library ships plain CSS, so the build
// should not need a CSS toolchain of its own.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const IMPORT = /^@import\s+['"](.+?)['"];?\s*$/gm

async function inline(file, seen = new Set()) {
  const path = resolve(file)
  if (seen.has(path)) return ''
  seen.add(path)
  const source = await readFile(path, 'utf8')
  const parts = []
  let cursor = 0
  for (const match of source.matchAll(IMPORT)) {
    parts.push(source.slice(cursor, match.index))
    parts.push(await inline(resolve(dirname(path), match[1]), seen))
    cursor = match.index + match[0].length
  }
  parts.push(source.slice(cursor))
  return parts.join('')
}

const [entry, out] = process.argv.slice(2)
if (!entry || !out) {
  console.error('usage: build-css.mjs <entry.css> <out.css>')
  process.exit(1)
}
await mkdir(dirname(resolve(out)), { recursive: true })
await writeFile(resolve(out), await inline(entry), 'utf8')
console.error(`css -> ${out}`)

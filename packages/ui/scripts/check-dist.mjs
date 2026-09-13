// Verify the built package keeps its promises. Fails the build on any violation.
//
// 1. Every source module that declares 'use client' ships with it, and only those do.
// 2. Modules without the directive call no client-only React API at module or render level.
// 3. core/ and theme/ import nothing outside themselves and touch no browser global.
// 4. Barrels never carry a directive.
// 5. Every exports-map target exists; styles are layered.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = fileURLToPath(new URL('../', import.meta.url))
const src = join(pkgDir, 'src')
const dist = join(pkgDir, 'dist')
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
const posix = (p) => p.split('\\').join('/')
const errors = []

const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/[^\n]*/g, '$1')

// 1 + 4
const sourceModules = walk(src).filter(
  (f) => /\.(ts|tsx)$/.test(f) && !/__tests__|\.test\.|\.d\.ts$/.test(f),
)
let clientCount = 0
for (const file of sourceModules) {
  const rel = posix(relative(src, file)).replace(/\.(ts|tsx)$/, '.js')
  const out = join(dist, rel)
  const declares = DIRECTIVE.test(readFileSync(file, 'utf8'))
  if (!existsSync(out)) continue // type-only modules emit no JavaScript
  const ships = DIRECTIVE.test(readFileSync(out, 'utf8'))
  if (declares) clientCount++
  if (declares && !ships) errors.push(`${rel}: source is 'use client' but the output is not`)
  if (!declares && ships) errors.push(`${rel}: output is 'use client' but the source is not`)
  // Barrels are `index.ts`; an `index.tsx` is a component module like any other.
  if (declares && /(^|[\\/])index\.ts$/.test(file)) errors.push(`${rel}: a barrel must not be 'use client'`)
}

// 2
// Any hook call (compiled output has no generics, so `useDataTable<T>()` reads as `useDataTable()`).
const CLIENT_API = /\b(use[A-Z]\w*|createContext)\s*\(/
const jsFiles = walk(dist).filter((f) => f.endsWith('.js'))
for (const file of jsFiles) {
  const code = readFileSync(file, 'utf8')
  if (DIRECTIVE.test(code)) continue
  const match = CLIENT_API.exec(stripComments(code))
  if (match) errors.push(`${posix(relative(dist, file))}: calls ${match[1]}() without 'use client'`)
}

// 3
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"]+)\1/g
const BROWSER = /\b(window|document|localStorage|sessionStorage|navigator|matchMedia|ResizeObserver)\b/
for (const area of ['core', 'theme']) {
  for (const file of jsFiles.filter((f) => posix(relative(dist, f)).startsWith(`${area}/`))) {
    const rel = posix(relative(dist, file))
    const code = stripComments(readFileSync(file, 'utf8'))
    if (DIRECTIVE.test(code)) errors.push(`${rel}: ${area}/ must not be 'use client'`)
    for (const [, , spec] of code.matchAll(IMPORT)) {
      const resolved = spec.startsWith('.') ? posix(join(rel, '..', spec)) : spec
      if (!resolved.startsWith(`${area}/`)) errors.push(`${rel}: ${area}/ imports "${spec}"`)
    }
    const browser = BROWSER.exec(code)
    if (browser) errors.push(`${rel}: ${area}/ references the browser global "${browser[1]}"`)
  }
}

// 5
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
for (const [key, value] of Object.entries(pkg.exports)) {
  if (key.includes('*')) continue
  for (const target of typeof value === 'string' ? [value] : Object.values(value)) {
    if (!existsSync(join(pkgDir, target))) errors.push(`exports["${key}"] -> ${target} does not exist`)
  }
}
for (const dir of readdirSync(join(src, 'components'))) {
  if (!existsSync(join(dist, 'components', dir, 'index.js'))) {
    errors.push(`exports["./*"]: components/${dir}/index.js does not exist`)
  }
}
const styles = readFileSync(join(dist, 'styles.css'), 'utf8')
if (!styles.startsWith('@layer theme,base,components,utilities;')) {
  errors.push('styles.css must start with the layer order statement')
}
for (const file of walk(dist)) {
  if (/\.(js|d\.ts|css)$/.test(file) && /__V1_REMOVED__|['"]tailwind-merge['"]/.test(readFileSync(file, 'utf8'))) {
    errors.push(`${posix(relative(dist, file))}: references a removed V1 module`)
  }
}

if (errors.length) {
  console.error(`check-dist: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.error(
  `check-dist: ok — ${jsFiles.length} modules, ${clientCount} 'use client', core/ and theme/ dependency-free`,
)

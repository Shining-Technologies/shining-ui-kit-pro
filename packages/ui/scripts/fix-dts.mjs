// Give relative specifiers in emitted declarations explicit extensions.
//
// Sources use extensionless imports (bundler resolution), and tsc copies them
// into .d.ts files verbatim. Under `moduleResolution: node16 | nodenext` an
// extensionless relative import in an ES module does not resolve, so types
// would silently become `any` for those consumers. Rewrite `./x` to `./x.js`
// or `./x/index.js` depending on what exists.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const SPECIFIER = /((?:from|import)\s*\(?\s*)(['"])(\.\.?\/[^'"]*)\2/g
let rewritten = 0
const unresolved = []

for (const file of walk(dist).filter((f) => f.endsWith('.d.ts'))) {
  const source = readFileSync(file, 'utf8')
  const next = source.replace(SPECIFIER, (whole, lead, quote, spec) => {
    if (/\.(js|mjs|cjs|json|css)$/.test(spec)) return whole
    const base = join(dirname(file), spec)
    const target = existsSync(`${base}.d.ts`)
      ? `${spec}.js`
      : existsSync(join(base, 'index.d.ts'))
        ? `${spec.replace(/\/$/, '')}/index.js`
        : null
    if (!target) {
      unresolved.push(`${file.slice(dist.length)}: ${spec}`)
      return whole
    }
    rewritten++
    return `${lead}${quote}${target}${quote}`
  })
  if (next !== source) writeFileSync(file, next)
}

if (unresolved.length) {
  console.error(`unresolved relative imports in declarations:\n  ${unresolved.join('\n  ')}`)
  process.exit(1)
}
console.error(`dts -> ${rewritten} relative specifiers given extensions`)

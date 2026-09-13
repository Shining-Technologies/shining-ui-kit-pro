/*
 * Client/server boundaries, checked at the source.
 *
 * A module that needs the client and lacks `'use client'` is a build error (or
 * a 500) the first time a Server Component imports it; a barrel or a pure
 * module that has it drags everything behind it onto the client. The build
 * checks the output (`scripts/check-dist.mjs`); this checks the source, so the
 * failure shows up in `vitest` rather than at release.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Not `new URL(…, import.meta.url)`: under happy-dom `URL` is the DOM's, which refuses file: URLs.
const PKG = resolve(__dirname, '..')
const SRC = join(PKG, 'src')
const DIST = join(PKG, 'dist')

const posix = (path: string) => path.split('\\').join('/')
const rel = (file: string) => posix(relative(SRC, file))
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const modules = walk(SRC).filter((file) => /\.(ts|tsx)$/.test(file) && !/__tests__|\.test\.|\.d\.ts$/.test(file))
const source = new Map(modules.map((file) => [file, readFileSync(file, 'utf8')]))

/** The directive as the first statement: only whitespace and comments may precede it. */
const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/

/**
 * Two views of a module: `code` without comments, and `bare` without comments
 * or string/template contents (template `${}` expressions stay). Regex literals
 * are skipped whole, so `/\/\*` in a pattern does not open a comment.
 */
function scan(text: string): { code: string; bare: string } {
  let code = ''
  let bare = ''
  const emit = (ch: string, inString: boolean) => {
    code += ch
    bare += inString && ch !== '\n' ? ' ' : ch
  }
  const templateDepth: number[] = []
  let braces = 0
  let lastSignificant = ''
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]!
    const next = text[i + 1]
    if (ch === '/' && next === '/') {
      while (i < n && text[i] !== '\n') i++
      continue
    }
    if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end < 0 ? n : end + 2
      code += ' '
      bare += ' '
      continue
    }
    if (ch === "'" || ch === '"') {
      emit(ch, false)
      i++
      while (i < n && text[i] !== ch && text[i] !== '\n') {
        if (text[i] === '\\') {
          emit(text[i]!, true)
          i++
        }
        emit(text[i]!, true)
        i++
      }
      if (i < n) emit(text[i]!, false)
      i++
      lastSignificant = ch
      continue
    }
    if (ch === '`' || (ch === '}' && templateDepth.at(-1) === braces)) {
      if (ch === '}') templateDepth.pop()
      emit(ch, false)
      i++
      while (i < n && text[i] !== '`') {
        if (text[i] === '\\') {
          emit(text[i]!, true)
          i++
        } else if (text[i] === '$' && text[i + 1] === '{') {
          break
        }
        emit(text[i]!, true)
        i++
      }
      if (text[i] === '$') {
        emit('${', false)
        i += 2
        templateDepth.push(braces)
      } else {
        if (i < n) emit('`', false)
        i++
      }
      lastSignificant = '`'
      continue
    }
    if (ch === '/' && (lastSignificant === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSignificant))) {
      // A regex literal.
      emit(ch, false)
      i++
      let inClass = false
      while (i < n && text[i] !== '\n') {
        const c = text[i]!
        if (c === '\\') {
          emit(c, true)
          i++
          emit(text[i] ?? '', true)
          i++
          continue
        }
        if (c === '[') inClass = true
        else if (c === ']') inClass = false
        else if (c === '/' && !inClass) break
        emit(c, true)
        i++
      }
      if (i < n) emit(text[i]!, false)
      i++
      lastSignificant = ')'
      continue
    }
    if (ch === '{') braces++
    else if (ch === '}') braces--
    emit(ch, false)
    if (!/\s/.test(ch)) {
      // `return /x/` and `typeof /x/` are rare enough to ignore; identifiers end a regex context.
      lastSignificant = /[\w$)\]]/.test(ch) ? 'a' : ch
    }
    i++
  }
  return { code, bare }
}

const scanned = new Map(modules.map((file) => [file, scan(source.get(file)!)]))

const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\bexport\s*\*\s*from\s*)(['"])([^'"]+)\1/g
const specifiers = (file: string) => [...scanned.get(file)!.code.matchAll(IMPORT)].map((m) => m[2]!)
/** Import statements that bring in a value, not only types. */
const valueSpecifiers = (file: string) =>
  [...scanned.get(file)!.code.matchAll(/(?:^|[;\n])\s*(import|export)\s+(type\s+)?([^;]*?)\bfrom\s*(['"])([^'"]+)\4/g)]
    .filter((m) => !m[2])
    .map((m) => m[5]!)
    .concat([...scanned.get(file)!.code.matchAll(/(?:^|[;\n])\s*import\s*(['"])([^'"]+)\1/g)].map((m) => m[2]!))

const HOOK_CALL = /(?<![\w$.])(?:React\.)?(use[A-Z]\w*)\s*(?:<[^()]*?>)?\s*\(/g
const CONTEXT_CALL = /(?<![\w$])(?:React\.)?createContext\s*(?:<[^()]*?>)?\s*\(/
const BROWSER_GLOBAL = /(?<![\w$.])(window|document|localStorage|sessionStorage)\b(?!\s*:(?!:))/
const EVENT_HANDLER = /\son[A-Z]\w*=\{/

/** Why a module needs `'use client'`, or null. */
function clientReason(file: string): string | null {
  const { code, bare } = scanned.get(file)!
  for (const m of bare.matchAll(HOOK_CALL)) {
    const before = bare.slice(Math.max(0, m.index! - 20), m.index)
    if (/\bfunction\s+$/.test(before)) continue // a definition, not a call
    return `calls ${m[1]}()`
  }
  if (CONTEXT_CALL.test(bare)) return 'calls createContext()'
  const radix = specifiers(file).find((s) => s.startsWith('@radix-ui/') && s !== '@radix-ui/react-slot')
  if (radix && valueSpecifiers(file).includes(radix)) return `imports ${radix}`
  const global = BROWSER_GLOBAL.exec(bare)
  if (global) return `references ${global[1]}`
  if (file.endsWith('.tsx') && EVENT_HANDLER.test(bare)) return `has a JSX event handler (${EVENT_HANDLER.exec(bare)![0].trim()})`
  void code
  return null
}

describe('the scanner', () => {
  it('ignores comments, strings and regex literals, but not template expressions', () => {
    const { bare, code } = scan(
      "// useState()\n/* window */ const a = 'localStorage.getItem(' + `x ${document.title}` + /\\/\\*/.source; useFoo<T>(x)",
    )
    expect(bare).not.toContain('useState')
    expect(bare).not.toContain('localStorage')
    expect(bare).toContain('document.title')
    expect(code).toContain("'localStorage.getItem('")
    expect([...bare.matchAll(HOOK_CALL)].map((m) => m[1])).toEqual(['useFoo'])
  })
})

describe("'use client' in source modules", () => {
  it('finds the modules', () => {
    expect(modules.length).toBeGreaterThan(50)
  })

  it('recognises what makes a module client-only (the rule below is not vacuous)', () => {
    const reason = (name: string) => clientReason(join(SRC, name))
    expect(reason('components/color-mode/color-mode.tsx')).toMatch(/^calls use/)
    expect(reason('components/sidebar/sidebar.tsx')).toMatch(/^calls (use|createContext)/)
    expect(reason('components/color-mode/color-mode-script.tsx')).toBeNull()
    expect(reason('theme/index.ts')).toBeNull()
    const flagged = modules.filter((file) => DIRECTIVE.test(source.get(file)!) && clientReason(file) !== null)
    expect(flagged.length).toBeGreaterThan(20)
  })

  const needingClient = () =>
    modules
      .filter((file) => !DIRECTIVE.test(source.get(file)!))
      .map((file) => [rel(file), clientReason(file)] as const)
      .filter(([, reason]) => reason !== null)
      .map(([name, reason]) => `${name}: ${reason}`)

  /** Known defects, each with its own skipped test below, so the rule still holds for every other module. */
  const KNOWN = ['csv/index.ts']

  it('is on every module that needs the client', () => {
    expect(needingClient().filter((line) => !KNOWN.some((name) => line.startsWith(`${name}:`)))).toEqual([])
  })

  it('is on csv/index.ts, or csv/index.ts keeps browser code out', () => {
    expect(needingClient().filter((line) => line.startsWith('csv/index.ts:'))).toEqual([])
  })

  /** An `index.ts`, or an `index.tsx` that only re-exports. `cells/index.tsx` is a module, not a barrel. */
  const isBarrel = (file: string) => {
    if (/(^|[\\/])index\.ts$/.test(file)) return true
    if (!/(^|[\\/])index\.tsx$/.test(file)) return false
    const rest = scanned
      .get(file)!
      .code.replace(/\bexport\s+(type\s+)?(\*(\s+as\s+\w+)?|\{[^}]*\})\s*from\s*(['"])[^'"]+\4\s*;?/g, '')
      .replace(/\bimport\s*(['"])[^'"]+\1\s*;?/g, '')
    return rest.trim() === ''
  }

  it('is never on a barrel', () => {
    const barrels = modules.filter(isBarrel)
    expect(barrels.length).toBeGreaterThan(10)
    expect(barrels.filter((file) => DIRECTIVE.test(source.get(file)!)).map(rel)).toEqual([])
  })

  it('is not applied package-wide: the root entry and pure components stay server-safe', () => {
    for (const name of [
      'index.ts',
      'components/color-mode/color-mode-script.tsx',
      'components/color-mode/index.ts',
    ]) {
      expect(DIRECTIVE.test(source.get(join(SRC, name))!), name).toBe(false)
    }
    const server = modules.filter((file) => !DIRECTIVE.test(source.get(file)!))
    expect(server.length).toBeGreaterThan(20)
  })

  it('appears only as the first statement when it appears at all', () => {
    const misplaced = modules
      .filter((file) => !DIRECTIVE.test(source.get(file)!))
      .filter((file) => /^\s*['"]use client['"]/m.test(scanned.get(file)!.code))
      .map(rel)
    expect(misplaced).toEqual([])
  })
})

describe('core/ and theme/ run anywhere', () => {
  for (const area of ['core', 'theme']) {
    const files = modules.filter((file) => rel(file).startsWith(`${area}/`) && !rel(file).includes('__tests__'))

    describe(area, () => {
      it('has modules', () => {
        expect(files.length).toBeGreaterThan(2)
      })

      it("has no 'use client'", () => {
        expect(files.filter((file) => /['"]use client['"]/.test(scanned.get(file)!.code)).map(rel)).toEqual([])
      })

      it('imports nothing outside its own folder, React included', () => {
        const offenders: string[] = []
        for (const file of files) {
          for (const spec of specifiers(file)) {
            const target = spec.startsWith('.') ? posix(relative(SRC, resolve(dirname(file), spec))) : spec
            if (!target.startsWith(`${area}/`)) offenders.push(`${rel(file)} imports "${spec}"`)
          }
        }
        expect(offenders).toEqual([])
      })

      it('references no browser global', () => {
        const BROWSER = /(?<![\w$.])(window|document|localStorage|sessionStorage|navigator|matchMedia|ResizeObserver|IntersectionObserver|HTMLElement)\b/
        const offenders = files
          .map((file) => [rel(file), BROWSER.exec(scanned.get(file)!.bare)?.[1]] as const)
          .filter(([, global]) => global)
          .map(([name, global]) => `${name}: ${global}`)
        expect(offenders).toEqual([])
      })
    })
  }
})

describe('optional peers stay out of the root entry', () => {
  /** Every module reachable from `entry` through relative imports and re-exports. */
  function graph(entry: string): Set<string> {
    const seen = new Set<string>()
    const visit = (file: string) => {
      if (seen.has(file)) return
      seen.add(file)
      for (const spec of valueSpecifiers(file)) {
        if (!spec.startsWith('.')) continue
        const base = resolve(dirname(file), spec)
        const target = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx'), base].find(
          (candidate) => source.has(candidate),
        )
        if (target) visit(target)
      }
    }
    visit(entry)
    return seen
  }

  const reachable = graph(join(SRC, 'index.ts'))

  it('follows the graph', () => {
    expect(reachable.size).toBeGreaterThan(50)
  })

  it('does not reach charts, csv or the virtualized table', () => {
    const offenders = [...reachable]
      .map(rel)
      .filter((name) => /^(charts|csv)\//.test(name) || name === 'components/data-table/virtualized.tsx')
    expect(offenders).toEqual([])
  })

  it('imports neither recharts nor @tanstack/react-virtual', () => {
    const offenders = [...reachable].flatMap((file) =>
      valueSpecifiers(file)
        .filter((spec) => /^(recharts|@tanstack\/react-virtual)(\/|$)/.test(spec))
        .map((spec) => `${rel(file)}: ${spec}`),
    )
    expect(offenders).toEqual([])
  })

  it('has no direct export from those entries in src/index.ts', () => {
    const root = scanned.get(join(SRC, 'index.ts'))!.code
    expect(root).not.toMatch(/from\s*['"]\.\/(charts|csv)(\/|['"])/)
    expect(root).not.toMatch(/virtualized/)
  })
})

describe.skipIf(!existsSync(DIST))('built output keeps the directives', () => {
  it("ships 'use client' on every module whose source has it, and on no other", () => {
    const problems: string[] = []
    for (const file of modules) {
      const out = join(DIST, rel(file).replace(/\.(ts|tsx)$/, '.js'))
      if (!existsSync(out)) continue // type-only modules emit no JavaScript
      const declares = DIRECTIVE.test(source.get(file)!)
      const ships = DIRECTIVE.test(readFileSync(out, 'utf8'))
      if (declares && !ships) problems.push(`${rel(file)}: source is 'use client', output is not`)
      if (!declares && ships) problems.push(`${rel(file)}: output is 'use client', source is not`)
    }
    expect(problems).toEqual([])
  })
})

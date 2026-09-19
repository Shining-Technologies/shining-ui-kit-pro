/*
 * Static checks over the V2 stylesheets.
 *
 * Carries over V1 `tests/styles.test.ts` (table rules, header/cell alignment)
 * and `tests/tokens.test.ts` (no colour literals, every token declared, every
 * stylesheet bundled), pointed at `src/styles` and `src/theme`, plus the rules
 * the CSS-variable theme rests on: layering, zero specificity, and every token
 * a component reads being defined by something.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { SEMANTIC_TOKENS, parseColor } from '@shining-technologies/ui/theme'
import { describe, expect, it } from 'vitest'

// Not `new URL(…, import.meta.url)`: under happy-dom `URL` is the DOM's, which refuses file: URLs.
const PKG = resolve(__dirname, '..')
const SRC = join(PKG, 'src')
const STYLES = join(SRC, 'styles')
const THEME = join(SRC, 'theme')

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const sheet = (name: string) => read(join(STYLES, name))
const stripCssComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const componentSheets = readdirSync(STYLES).filter((name) => name.endsWith('.css'))
const themeCss = read(join(THEME, 'theme.css'))
const tokensCss = read(join(THEME, 'tokens.css'))
const tailwindCss = read(join(THEME, 'tailwind.css'))
const sourceModules = walk(SRC).filter(
  (file) => /\.(ts|tsx)$/.test(file) && !/__tests__|\.test\.|\.d\.ts$/.test(file),
)

interface Rule {
  /** Selector or at-rule prelude of every enclosing block, outermost first. */
  path: string[]
  selector: string
  body: string
}

/** Every innermost `selector { declarations }` block, with its enclosing at-rules. */
function parseRules(css: string): Rule[] {
  const text = stripCssComments(css)
  const rules: Rule[] = []
  const stack: string[] = []
  let prelude = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === '{') {
      stack.push(prelude.trim())
      prelude = ''
    } else if (ch === '}') {
      const selector = stack.pop() ?? ''
      // A block with no nested block: `prelude` holds its declarations.
      if (prelude.trim() || !text.slice(0, i).trimEnd().endsWith('}')) {
        rules.push({ path: [...stack], selector, body: prelude })
      }
      prelude = ''
    } else if (ch === ';' && stack.length === 0) {
      prelude = ''
    } else {
      prelude += ch
    }
  }
  return rules
}

/** Top-level `@...` preludes and top-level statements, in order. */
function topLevel(css: string): string[] {
  const text = stripCssComments(css)
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (depth === 0 && (ch === '{' || ch === ';')) {
      out.push(current.trim() + (ch === ';' ? ';' : ''))
      current = ''
      if (ch === '{') depth++
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (depth === 0) current += ch
  }
  return out.filter(Boolean)
}

/** `--name: value` pairs of a declaration block. */
function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const part of body.split(';')) {
    const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(part)
    if (match) out.set(match[1]!, match[2]!)
  }
  return out
}

/** The one rule in `css` with exactly this selector (and, when given, inside this layer). */
function ruleFor(css: string, selector: string, layer?: string): Rule {
  const found = parseRules(css).filter(
    (rule) => rule.selector === selector && (layer === undefined || rule.path.includes(layer)),
  )
  expect(found, `exactly one "${selector}" rule`).toHaveLength(1)
  return found[0]!
}

/** The selector list inside one `:where(...)`, or null when the selector is not exactly that. */
function whereList(selector: string): string[] | null {
  if (!selector.startsWith(':where(')) return null
  let depth = 0
  for (let i = ':where'.length; i < selector.length; i++) {
    if (selector[i] === '(') depth++
    else if (selector[i] === ')' && --depth === 0) {
      if (i !== selector.length - 1) return null
      return splitTopLevel(selector.slice(':where('.length, i))
    }
  }
  return null
}

function splitTopLevel(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      out.push(current.trim())
      current = ''
    } else current += ch
  }
  if (current.trim()) out.push(current.trim())
  return out
}

// The palette: theme.css's `base` rules. Its `theme` rule holds fonts, tracking and spacing.
const rootTokens = declarations(ruleFor(themeCss, ':where(:root)', '@layer base').body)
const darkTokens = declarations(ruleFor(themeCss, ':where(.dark)', '@layer base').body)
const sharedRootTokens = declarations(ruleFor(themeCss, ':where(:root)', '@layer theme').body)

/* ------------------------------------------------------------------ V1 port */

/**
 * The class names the table puts on real table elements.
 *
 * A generic helper that shares one of these names is not a naming quibble:
 * `display: flex` landing on a `<tr>` detaches the body from the header's
 * column widths, and the two rules live in different files.
 */
const TABLE_ELEMENT_CLASSES = [
  'sui-table',
  'sui-thead',
  'sui-tbody',
  'sui-tfoot',
  'sui-tr',
  'sui-th',
  'sui-td',
  'sui-row',
  'sui-caption',
]

/** Every `display:` declaration, with the selector block it belongs to. */
function displayRules(css: string): { selector: string; value: string }[] {
  const out: { selector: string; value: string }[] = []
  for (const match of stripCssComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const display = /(?:^|;)\s*display\s*:\s*([^;]+)/.exec(match[2] ?? '')
    if (display) out.push({ selector: (match[1] ?? '').trim(), value: display[1]!.trim() })
  }
  return out
}

describe('table element classes are not reused as layout helpers', () => {
  const files = componentSheets.filter((name) => name !== 'table.css')

  it.each(files)('%s does not redefine a table class', (file) => {
    const offenders = displayRules(sheet(file))
      .filter(({ selector }) =>
        TABLE_ELEMENT_CLASSES.some((name) => new RegExp(`\\.${name}(?![\\w-])`).test(selector)),
      )
      .map(({ selector, value }) => `${file}: ${selector} { display: ${value} }`)
    expect(offenders).toEqual([])
  })
})

describe('the table stylesheet', () => {
  const css = sheet('table.css')

  it('drives cell widths through a variable a stylesheet can override', () => {
    expect(css).toMatch(/\.sui-th,\s*\n?\s*\.sui-td\s*\{[^}]*width:\s*var\(--sui-cell-size\)/)
  })

  it('offsets sticky header rows instead of stacking them at zero', () => {
    expect(css).toContain('top: var(--sui-sticky-top, 0)')
  })

  it('shows pinned shadows only while the container is scrolled', () => {
    expect(css).toContain('.sui-container[data-overflow-start] .sui-pinned--left')
    expect(css).toContain('.sui-container[data-overflow-end] .sui-pinned--right')
  })

  it('switches the auto responsive mode on the container, not the viewport', () => {
    expect(css).toContain('container-type: inline-size')
    expect(css).toContain('@container sui-table (max-width: 47.9375rem)')
  })

  it('rules between column heads, and only between column heads', () => {
    expect(css).toContain('.sui-th + .sui-th')
    expect(css).not.toMatch(/\.sui-td \+ \.sui-td\s*\{[^}]*border-inline-start/)
  })

  it('keeps the header menu out of flow so labels line up with their column', () => {
    const menu = /\.sui-th__menu\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(menu).toContain('position: absolute')
    expect(menu).not.toContain('margin-inline-start: auto')
  })

  it('writes the same card rules for the viewport and the container trigger', () => {
    const block = (at: string) => {
      const start = css.indexOf(at)
      expect(start, `missing ${at}`).toBeGreaterThan(-1)
      const end = css.slice(start + at.length).search(/\n@/)
      return css.slice(start + at.length, end < 0 ? undefined : start + at.length + end)
    }
    const cards = block('@media (max-width: 47.9375rem) {')
    const auto = block('@container sui-table (max-width: 47.9375rem) {')
    expect(auto.replaceAll("[data-responsive='auto']", "[data-responsive='cards']")).toBe(cards)
  })

  it('keeps pinned cells opaque and in step with their row', () => {
    const pinned = /\n\.sui-pinned\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(pinned).toContain('background-color: var(--sui-surface-base)')
    expect(pinned).toContain('var(--sui-row-bg')
  })

  it('stacks a pinned footer cell above the footer cells scrolling under it', () => {
    expect(css).toMatch(/\.sui-tfoot--sticky \.sui-tf\.sui-pinned\s*\{\s*z-index: 4;/)
  })
})

/**
 * Header text and cell text must start at the same x, which holds because the
 * two padding tokens are equal in every rule that sets either of them.
 */
describe('header and cell alignment', () => {
  const rules = parseRules(tokensCss)
  const densities = rules.filter((rule) => /data-sui-density='(\w+)'/.test(rule.selector))

  it('finds every density block, and the comfortable defaults', () => {
    const names = densities.map((rule) => /data-sui-density='(\w+)'/.exec(rule.selector)![1])
    // `comfortable` is explicit too, so a comfortable island inside a compact wrapper works.
    expect(names).toEqual(['compact', 'comfortable', 'spacious'])
    const root = rules.find((rule) => rule.selector === ':where(:root)')
    expect(declarations(root!.body).get('--sui-cell-padding-x')).toMatch(/^calc\(var\(--spacing\) \* [\d.]+\)$/)
  })

  it('pads header and cell identically in every rule that sets either', () => {
    const setting = rules.filter((rule) => {
      const decl = declarations(rule.body)
      return decl.has('--sui-cell-padding-x') || decl.has('--sui-header-padding-x')
    })
    expect(setting.length).toBeGreaterThanOrEqual(4)
    for (const rule of setting) {
      const decl = declarations(rule.body)
      expect(decl.get('--sui-cell-padding-x'), rule.selector).toMatch(/^calc\(var\(--spacing\) \* [\d.]+\)$/)
      expect(decl.get('--sui-header-padding-x'), rule.selector).toBe(decl.get('--sui-cell-padding-x'))
    }
  })
})

/**
 * The rule the design system rests on: a component that hardcodes a colour
 * will not follow the theme. Black and white at an alpha are shadows and
 * scrims (light is not a palette colour); bare `#000`/`#fff` were allowed in V1
 * for the same reason and still are.
 */
describe('no hardcoded colours outside the theme', () => {
  const COLOR_LITERAL =
    /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d[^)]*\)|\bhsla?\(\s*\d|\boklch\(\s*[\d.]|\boklab\(\s*[\d.]|\bhwb\(\s*\d|\blab\(\s*\d|\blch\(\s*\d/g
  const ALLOWED =
    /^(?:rgb\(0 0 0 \/[^)]*\)|rgba\(0, ?0, ?0,[^)]*\)|rgb\(255 255 255 \/[^)]*\)|rgba\(255, ?255, ?255,[^)]*\)|#000|#fff|#000000|#ffffff)$/i

  const targets = [...componentSheets.map((name) => join(STYLES, name)), join(THEME, 'tokens.css')]

  it.each(targets.map((path) => [path.slice(SRC.length + 1).replace(/\\/g, '/'), path]))(
    '%s resolves every colour to a token',
    (_name, path) => {
      const lines = stripCssComments(read(path)).split('\n')
      const offenders: string[] = []
      lines.forEach((line) => {
        for (const match of line.match(COLOR_LITERAL) ?? []) {
          if (!ALLOWED.test(match)) offenders.push(`${match}  in  ${line.trim()}`)
        }
      })
      expect(offenders).toEqual([])
    },
  )

  it('bundles exactly the stylesheets in src/styles', () => {
    const build = read(join(PKG, 'scripts/build-css.mjs'))
    const list = /const COMPONENTS = \[([\s\S]*?)\]/.exec(build)?.[1] ?? ''
    const bundled = [...list.matchAll(/'([\w-]+)'/g)].map((m) => `${m[1]}.css`)
    expect(bundled.length).toBeGreaterThan(5)
    expect([...bundled].sort()).toEqual([...componentSheets].sort())
  })
})

/* --------------------------------------------------------- semantic tokens */

describe('the default theme (theme.css)', () => {
  it('defines every semantic token for :root and for .dark', () => {
    const light = SEMANTIC_TOKENS.filter((token) => !rootTokens.has(`--${token}`))
    const dark = SEMANTIC_TOKENS.filter((token) => !darkTokens.has(`--${token}`))
    expect({ light, dark }).toEqual({ light: [], dark: [] })
    expect(rootTokens.get('--radius')).toMatch(/^\d*\.?\d+(rem|px)$/)
  })

  it('defines no token the API does not know about, and only parseable colours', () => {
    const shadows = new Set(['--shadow-2xs', '--shadow-xs', '--shadow-sm', '--shadow', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-2xl'])
    const known = new Set([...SEMANTIC_TOKENS.map((t) => `--${t}`), '--radius', ...shadows])
    for (const [mode, tokens] of [
      ['light', rootTokens],
      ['dark', darkTokens],
    ] as const) {
      for (const [name, value] of tokens) {
        expect(known.has(name), `${mode}: unexpected ${name}`).toBe(true)
        if (name !== '--radius' && !shadows.has(name)) {
          expect(parseColor(value), `${mode}: ${name}: ${value}`).not.toBeNull()
        }
      }
    }
  })

  it('is zero-specificity rules: Tailwind-configured names in @layer theme, the rest in @layer base', () => {
    expect(topLevel(themeCss)).toEqual([
      '@layer theme, base, components, utilities;',
      '@layer theme',
      '@layer base',
    ])
    const rules = parseRules(themeCss)
    expect(rules.map((rule) => [rule.path.join(' '), rule.selector])).toEqual([
      ['@layer theme', ':where(:root)'],
      ['@layer base', ':where(:root)'],
      ['@layer base', ':where(.dark)'],
    ])
  })

  it('ships the tweakcn font, tracking, spacing and shadow tokens', () => {
    const configured = ['--font-sans', '--font-serif', '--font-mono', '--tracking-normal', '--spacing']
    // Names an app configures in Tailwind's @theme live in the theme layer, below Tailwind's values.
    expect([...sharedRootTokens.keys()]).toEqual(configured)
    // Shadows sit in base, with a dark value each: Tailwind's :root defaults must not replace them.
    for (const name of ['--shadow-2xs', '--shadow-xs', '--shadow-sm', '--shadow', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-2xl']) {
      expect(rootTokens.has(name), name).toBe(true)
      expect(darkTokens.has(name), name).toBe(true)
    }
  })

  it('still honours the deprecated 2.0 font and shadow names', () => {
    expect(sharedRootTokens.get('--font-sans')).toMatch(/^var\(\s*--sui-font-family,/)
    expect(sharedRootTokens.get('--font-mono')).toMatch(/^var\(\s*--sui-font-family-mono,/)
    expect(rootTokens.get('--shadow-sm')).toMatch(/^var\(--sui-shadow-surface,/)
    expect(rootTokens.get('--shadow-md')).toMatch(/^var\(\s*--sui-shadow-overlay,/)
    expect(rootTokens.get('--shadow-lg')).toMatch(/^var\(\s*--sui-shadow-modal,/)
  })

  it('leaves dark mode to the application: no prefers-color-scheme', () => {
    expect(stripCssComments(themeCss)).not.toContain('prefers-color-scheme')
    expect(stripCssComments(tokensCss)).not.toContain('prefers-color-scheme')
  })

  it('declares color-scheme for both modes', () => {
    expect(ruleFor(themeCss, ':where(:root)', '@layer base').body).toMatch(/color-scheme:\s*light/)
    expect(ruleFor(themeCss, ':where(.dark)', '@layer base').body).toMatch(/color-scheme:\s*dark/)
  })
})

describe('derived tokens (tokens.css)', () => {
  const rules = parseRules(tokensCss)

  it('puts every rule inside @layer base, after the layer order', () => {
    expect(topLevel(tokensCss)).toEqual(['@layer theme, base, components, utilities;', '@layer base'])
    for (const rule of rules) expect(rule.path, rule.selector).toEqual(['@layer base'])
  })

  it('uses only zero-specificity :where(...) selectors', () => {
    const offenders = rules.map((rule) => rule.selector).filter((selector) => whereList(selector) === null)
    expect(offenders).toEqual([])
  })

  it('re-declares the derived tokens wherever a theme can change', () => {
    const scoped = rules.filter((rule) => (whereList(rule.selector) ?? []).includes('[data-theme]'))
    expect(scoped).toHaveLength(1)
    expect(whereList(scoped[0]!.selector)).toEqual([':root', '.dark', '[data-theme]', '.sui-theme'])
    // Only values computed from other tokens belong there: anything declared as a
    // plain value would override what the scope inherits (density, dark mode).
    for (const [name, value] of declarations(scoped[0]!.body)) {
      expect(value, name).toMatch(/var\(--|^transparent$/)
    }
  })

  it('names only --sui-* tokens and shadcn radius scale, never a semantic token an app owns', () => {
    for (const rule of rules) {
      for (const name of declarations(rule.body).keys()) {
        // `--radius-sm…xl` are derived from `--radius`, exactly as shadcn's `@theme inline` derives them.
        expect(name, rule.selector).toMatch(/^--sui-|^--radius-(sm|md|lg|xl)$/)
      }
    }
  })

  it('uses the same layer order statement as the build and the theme', () => {
    const build = read(join(PKG, 'scripts/build-css.mjs'))
    const order = /const LAYER_ORDER = '([^']+)'/.exec(build)?.[1]
    expect(order).toBe('@layer theme, base, components, utilities;')
    expect(themeCss).toContain(order)
    expect(tokensCss).toContain(order)
  })

  it('lets a density set on an ancestor survive a nested theme scope', () => {
    const densityTokens = new Set(
      rules
        .filter((rule) => rule.selector.includes('data-sui-density'))
        .flatMap((rule) => [...declarations(rule.body).keys()]),
    )
    const scopes = rules.filter((rule) =>
      (whereList(rule.selector) ?? []).some((s) => ['.dark', '[data-theme]', '.sui-theme'].includes(s)),
    )
    const clobbered = scopes.flatMap((rule) =>
      [...declarations(rule.body).keys()].filter((name) => densityTokens.has(name)),
    )
    expect(clobbered).toEqual([])
  })

  it('lets the dark overrides inherit into theme scopes inside .dark', () => {
    const dark = rules.find((rule) => rule.selector === ':where(.dark)')
    expect(dark).toBeDefined()
    const darkNames = new Set(declarations(dark!.body).keys())
    expect(darkNames.size).toBeGreaterThan(0)
    // A scope that re-declared one of these would reset it to its light value.
    const scopes = rules.filter((rule) =>
      (whereList(rule.selector) ?? []).some((s) => s === '[data-theme]' || s === '.sui-theme'),
    )
    const reset = scopes.flatMap((rule) =>
      [...declarations(rule.body).keys()].filter((name) => darkNames.has(name)),
    )
    expect(reset).toEqual([])
  })
})

/* ------------------------------------------------------ component stylesheets */

describe('component stylesheets', () => {
  it.each(componentSheets)('%s declares no @layer and no @import (the build layers them)', (file) => {
    const css = sheet(file)
    expect(css).not.toMatch(/@layer\b/)
    expect(css).not.toMatch(/@import\b/)
  })

  /** Every custom property a stylesheet or a component declares, and every dynamic prefix. */
  function declaredSuiTokens() {
    const names = new Set<string>()
    const prefixes = new Set<string>(['--sui-c-'])
    for (const css of [tokensCss, ...componentSheets.map(sheet)]) {
      for (const m of stripCssComments(css).matchAll(/(--sui-[\w-]+)\s*:/g)) names.add(m[1]!)
    }
    for (const file of sourceModules) {
      const code = read(file)
      // Set inline: `style={{ '--sui-sidebar-width': w }}`, `setProperty('--sui-x', …)`.
      for (const m of code.matchAll(/['"`](--sui-[\w-]+)['"`]/g)) names.add(m[1]!)
      // Built at runtime: `` `--sui-c-${key}` ``.
      for (const m of code.matchAll(/`(--sui-[\w-]*)\$\{/g)) prefixes.add(m[1]!)
    }
    return { names, prefixes }
  }

  it('reads no --sui-* token without a fallback unless something declares it', () => {
    const { names, prefixes } = declaredSuiTokens()
    const reads: string[] = []
    const collect = (text: string, where: string) => {
      for (const m of text.matchAll(/var\(\s*(--sui-[\w-]+)\s*\)/g)) {
        const name = m[1]!
        if (names.has(name) || [...prefixes].some((p) => name.startsWith(p))) continue
        reads.push(`${where}: ${name}`)
      }
    }
    for (const file of componentSheets) collect(stripCssComments(sheet(file)), `styles/${file}`)
    for (const file of sourceModules.filter((f) => f.endsWith('.tsx'))) {
      collect(read(file), file.slice(SRC.length + 1).replace(/\\/g, '/'))
    }
    expect([...new Set(reads)]).toEqual([])
  })

  it('reads only semantic tokens theme.css defines, and colours for both modes', () => {
    const local = new Set<string>()
    for (const css of [tokensCss, ...componentSheets.map(sheet)]) {
      for (const m of stripCssComments(css).matchAll(/(--[\w-]+)\s*:/g)) local.add(m[1]!)
    }
    for (const file of sourceModules) {
      for (const m of read(file).matchAll(/['"`](--[\w-]+)['"`]/g)) local.add(m[1]!)
    }

    const missing: string[] = []
    const missingDark: string[] = []
    for (const file of componentSheets) {
      for (const m of stripCssComments(sheet(file)).matchAll(/var\(\s*(--[\w-]+)/g)) {
        const name = m[1]!
        // `--radix-*` are measured and set by Radix on the element at runtime.
        if (name.startsWith('--sui-') || name.startsWith('--radix-') || local.has(name)) continue
        if (sharedRootTokens.has(name)) continue
        if (!rootTokens.has(name)) {
          missing.push(`${file}: ${name}`)
          continue
        }
        const isColour = parseColor(rootTokens.get(name)!) !== null
        if (isColour && !darkTokens.has(name)) missingDark.push(`${file}: ${name}`)
      }
    }
    expect({ missing: [...new Set(missing)], missingDark: [...new Set(missingDark)] }).toEqual({
      missing: [],
      missingDark: [],
    })
  })
})

/* ----------------------------------------------------------------- tailwind */

describe('the Tailwind mapping (tailwind.css)', () => {
  const theme = parseRules(tailwindCss).find((rule) => rule.selector === '@theme inline')
  const mapping = declarations(theme?.body ?? '')

  it('maps every shadow as tweakcn does, in a reference block that writes no variable', () => {
    // Without `reference`, Tailwind writes `--shadow-sm: var(--shadow-sm)` onto :root: a cycle.
    const reference = parseRules(tailwindCss).find((rule) => rule.selector === '@theme inline reference')
    const shadows = ['--shadow-2xs', '--shadow-xs', '--shadow-sm', '--shadow', '--shadow-md']
    shadows.push('--shadow-lg', '--shadow-xl', '--shadow-2xl')
    expect([...declarations(reference?.body ?? '')]).toEqual(shadows.map((name) => [name, `var(${name})`]))
    expect([...mapping.keys()].filter((name) => name.startsWith('--shadow'))).toEqual([])
  })

  it('has one @theme inline block and the class-based dark variant', () => {
    expect(theme).toBeDefined()
    expect(tailwindCss).toContain('@custom-variant dark (&:where(.dark, .dark *));')
  })

  it('maps every --color-* to a token theme.css defines in both modes', () => {
    const offenders: string[] = []
    for (const [name, value] of mapping) {
      if (!name.startsWith('--color-')) continue
      const target = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
      if (!target) offenders.push(`${name}: ${value} is not a single var()`)
      else if (!rootTokens.has(target)) offenders.push(`${name}: ${target} not in :root`)
      else if (!darkTokens.has(target)) offenders.push(`${name}: ${target} not in .dark`)
    }
    expect(offenders).toEqual([])
  })

  it('exposes every semantic colour token as a Tailwind colour', () => {
    const missing = SEMANTIC_TOKENS.filter((token) => mapping.get(`--color-${token}`) !== `var(--${token})`)
    expect(missing).toEqual([])
  })

  it('derives radii only from --radius, which theme.css defines', () => {
    const radii = [...mapping].filter(([name]) => name.startsWith('--radius-'))
    expect(radii.length).toBeGreaterThan(0)
    for (const [name, value] of radii) {
      for (const m of value.matchAll(/var\((--[\w-]+)\)/g)) expect(m[1], name).toBe('--radius')
    }
  })
})

/* ------------------------------------------------------ application shell */

describe('the application shell and the sidebar', () => {
  const shell = sheet('shell.css')
  const sidebar = sheet('sidebar.css')

  it('is one column without a Sidebar, and the Sidebar adds and sizes its own column', () => {
    expect(ruleFor(shell, '.sui-shell').body).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\);/)
    expect(ruleFor(shell, '.sui-shell').body).not.toContain('sidebar')
    expect(ruleFor(sidebar, '.sui-shell:has(> .sui-sidebar)').body).toMatch(
      /grid-template-columns:\s*auto minmax\(0, 1fr\);/,
    )
  })

  it('never sets the sidebar width from the shell, so it cannot leak into a Sidebar', () => {
    const setting = parseRules(shell)
      .filter((rule) => /--sui-sidebar-[\w-]*\s*:/.test(rule.body))
      .map((rule) => rule.selector)
    expect(setting).toEqual([])
    expect(stripCssComments(shell)).not.toContain('sui-shell__sidebar')
  })

  it('uses one default sidebar width in every stylesheet', () => {
    const fallbacks = componentSheets.flatMap((file) =>
      [...stripCssComments(sheet(file)).matchAll(/var\(--sui-sidebar-width,\s*([^)]+)\)/g)].map((m) =>
        m[1]!.trim(),
      ),
    )
    expect(fallbacks.length).toBeGreaterThan(0)
    expect([...new Set(fallbacks)]).toEqual(['16rem'])
  })
})

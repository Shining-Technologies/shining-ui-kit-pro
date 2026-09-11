import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const STYLES = resolve(process.cwd(), 'packages/react/src/styles')
const sheet = (name: string) => readFileSync(join(STYLES, name), 'utf8')

/**
 * The class names the table puts on real table elements.
 *
 * A generic helper that happens to share one of these names is not a naming
 * quibble: `display: flex` landing on a `<tr>` detaches the body from the
 * header's column widths, and the two rules live in different files, so the
 * damage is invisible until someone looks at a rendered table. This is exactly
 * how `.sui-row` (layout helper) and `.sui-row` (body row) shipped together.
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
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = match[2] ?? ''
    const display = /(?:^|;)\s*display\s*:\s*([^;]+)/.exec(body)
    if (display) out.push({ selector: (match[1] ?? '').trim(), value: display[1]!.trim() })
  }
  return out
}

describe('table element classes are not reused as layout helpers', () => {
  const files = readdirSync(STYLES).filter(
    (name) => name.endsWith('.css') && name !== 'table.css' && name !== 'tokens.generated.css',
  )

  it.each(files)('%s does not redefine a table class', (file) => {
    const offenders = displayRules(sheet(file))
      .filter(({ selector }) =>
        TABLE_ELEMENT_CLASSES.some((name) =>
          // Exactly this class, not `.sui-row-actions` or `.sui-table-wrapper`.
          new RegExp(`\\.${name}(?![\\w-])`).test(selector),
        ),
      )
      .map(({ selector, value }) => `${file}: ${selector} { display: ${value} }`)

    expect(offenders).toEqual([])
  })
})

describe('the table stylesheet', () => {
  const css = sheet('table.css')

  it('drives cell widths through a variable a stylesheet can override', () => {
    // Inline `width` would win over every rule, including the card layout's.
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
    // A ruled body turns a list of records into a spreadsheet.
    expect(css).not.toMatch(/\.sui-td \+ \.sui-td\s*\{[^}]*border-inline-start/)
  })

  it('keeps the header menu out of flow so labels line up with their column', () => {
    const menu = /\.sui-th__menu\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(menu).toContain('position: absolute')
    // `margin-inline-start: auto` is what used to reserve 1.5rem in every head.
    expect(menu).not.toContain('margin-inline-start: auto')
  })

  it('writes the same card rules for the viewport and the container trigger', () => {
    const block = (at: string) => {
      const start = css.indexOf(at)
      expect(start, `missing ${at}`).toBeGreaterThan(-1)
      // Each block runs to the next top-level at-rule (or the end of the file).
      const end = css.slice(start + at.length).search(/\n@/)
      return css.slice(start + at.length, end < 0 ? undefined : start + at.length + end)
    }
    const cards = block('@media (max-width: 47.9375rem) {')
    const auto = block('@container sui-table (max-width: 47.9375rem) {')
    expect(auto.replaceAll("[data-responsive='auto']", "[data-responsive='cards']")).toBe(cards)
  })

  it('keeps pinned cells opaque and in step with their row', () => {
    const pinned = /\n\.sui-pinned\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    // A transparent pinned cell shows the cells scrolling underneath it.
    expect(pinned).toContain('background-color: var(--sui-surface-base)')
    expect(pinned).toContain('var(--sui-row-bg')
  })

  it('stacks a pinned footer cell above the footer cells scrolling under it', () => {
    expect(css).toMatch(/\.sui-tfoot--sticky \.sui-tf\.sui-pinned\s*\{\s*z-index: 4;/)
  })
})

/**
 * Header text and cell text must start at the same x.
 *
 * They do because the two padding tokens are equal at every density — which is
 * an invariant nobody would think to check when tuning one of them, and the
 * failure it produces (every column looking half a character out) is the kind
 * of thing people stare past for months.
 */
describe('header and cell alignment', () => {
  const css = sheet('tokens.css')

  const densities = [...css.matchAll(/data-density='(\w+)'\]\s*\{([^}]*)\}/g)]

  it('finds every density block', () => {
    expect(densities.map((match) => match[1])).toEqual(['compact', 'comfortable', 'spacious'])
  })

  it.each(['compact', 'comfortable', 'spacious'])(
    '%s pads header and cell identically',
    (density) => {
      const block = densities.find((match) => match[1] === density)?.[2] ?? ''
      // Parsed by hand rather than by regex: one declaration per line is
      // exactly what these blocks are, and it reads as what it checks.
      const value = (name: string) =>
        block
          .split(';')
          .map((line) => line.trim())
          .find((line) => line.startsWith(`--sui-${name}:`))
          ?.split(':')[1]
          ?.trim()

      // Both defined, or the comparison would pass on two undefineds.
      expect(value('cell-padding-x')).toMatch(/rem$/)
      expect(value('header-padding-x')).toBe(value('cell-padding-x'))
    },
  )
})

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { CSS_VAR_NAMES } from '@shining-ui-kit/core'
import { describe, expect, it } from 'vitest'
import { generateTokensCss } from '../scripts/generate-tokens'

const STYLES = resolve(process.cwd(), 'packages/react/src/styles')
const GENERATED = join(STYLES, 'tokens.generated.css')

/**
 * The stylesheet defaults and the runtime palette generator are the same
 * palette expressed twice. This is what stops them drifting: run
 * `pnpm tokens` (or `UPDATE_TOKENS=1 pnpm test`) after changing the generator.
 */
describe('generated tokens', () => {
  it('matches the committed stylesheet', () => {
    const expected = generateTokensCss()
    if (process.env.UPDATE_TOKENS) writeFileSync(GENERATED, expected, 'utf8')
    expect(readFileSync(GENERATED, 'utf8').replace(/\r\n/g, '\n')).toBe(expected)
  })

  it('declares every token the type system knows about', () => {
    const css = readFileSync(GENERATED, 'utf8')
    // Rhythm and sizing tokens that only density blocks set are declared in
    // tokens.css, so both files are searched.
    const hand = readFileSync(join(STYLES, 'tokens.css'), 'utf8')
    const missing = CSS_VAR_NAMES.filter(
      (name) => !css.includes(`${name}:`) && !hand.includes(`${name}:`),
    )
    expect(missing).toEqual([])
  })
})

/**
 * The rule the whole design system rests on: a component that hardcodes a
 * colour is a component that will not follow the active project. It is easy to
 * break by accident and invisible until someone switches theme, so it is
 * enforced here rather than left to review.
 */
describe('no hardcoded colours outside the token layer', () => {
  const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d|\boklch\(\s*[\d.]/g

  /**
   * The only permitted literals, and why.
   *
   * Black and white at an alpha are shadows and scrims — light is not a
   * palette colour, and tinting a drop shadow with the brand makes it read as
   * a glow rather than depth.
   */
  const ALLOWED = /^rgb\(0 0 0 \/|^rgba\(0, ?0, ?0,|^#000$|^#fff$/

  const files = readdirSync(STYLES).filter(
    (name) => name.endsWith('.css') && name !== 'tokens.generated.css',
  )

  it.each(files)('%s resolves every colour to a token', (file) => {
    const css = readFileSync(join(STYLES, file), 'utf8')

    const offenders: string[] = []
    css.split('\n').forEach((line, index) => {
      if (line.trimStart().startsWith('*') || line.trimStart().startsWith('/*')) return
      for (const match of line.match(COLOR_LITERAL) ?? []) {
        const context = line.slice(line.indexOf(match))
        if (ALLOWED.test(context) || ALLOWED.test(match)) continue
        offenders.push(`${file}:${index + 1}  ${line.trim()}`)
      }
    })

    expect(offenders).toEqual([])
  })

  it('covers every stylesheet the entry point imports', () => {
    const index = readFileSync(join(STYLES, 'index.css'), 'utf8')
    const imported = [...index.matchAll(/@import '\.\/([\w.-]+\.css)'/g)].map((m) => m[1]!)
    expect(imported.length).toBeGreaterThan(5)
    for (const name of imported) expect(files).toContain(name)
  })
})

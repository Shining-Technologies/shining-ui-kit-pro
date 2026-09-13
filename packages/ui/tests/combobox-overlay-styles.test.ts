/*
 * The combobox's clear and chip-remove buttons live in a layer stacked over the
 * trigger (a button inside a button is invalid). That layer repeats the chips
 * to reserve room for the buttons, so its chips must not paint: painted, they
 * cover the labels of the real chips underneath.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(resolve(__dirname, '..'), 'src/styles/inputs.css'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * The declarations of the first rule whose selector list is exactly `selector`.
 * A rule starts after the previous `}` (or at the start of the file), so a
 * selector that is only the second line of a longer list does not match.
 */
function declarationsOf(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match![1]!
}

describe('combobox overlay layer', () => {
  it('does not paint the chips it repeats over the real ones', () => {
    expect(declarationsOf('.sui-combobox__overlay .sui-combobox__chip')).toMatch(
      /background:\s*transparent/,
    )
  })

  it('lets clicks through everywhere except its buttons', () => {
    expect(declarationsOf('.sui-combobox > .sui-combobox__overlay')).toMatch(/pointer-events:\s*none/)
    expect(declarationsOf('.sui-combobox__overlay button')).toMatch(/pointer-events:\s*auto/)
  })

  it('gives the small clear and remove glyphs a hit area of at least 24px', () => {
    // Glyph boxes measured in the gallery: clear 18px, chip remove 11px.
    const rem = (value: string) => Number.parseFloat(value) * 16
    const clearInset = /inset:\s*-([\d.]+)rem/.exec(
      declarationsOf('button.sui-combobox__clear::after,\nbutton.sui-combobox__chip-remove::after'),
    )
    const removeInset = /inset:\s*-([\d.]+)rem/.exec(declarationsOf('button.sui-combobox__chip-remove::after'))
    expect(18 + 2 * rem(clearInset![1]!)).toBeGreaterThanOrEqual(24)
    expect(11 + 2 * rem(removeInset![1]!)).toBeGreaterThanOrEqual(24)
  })
})

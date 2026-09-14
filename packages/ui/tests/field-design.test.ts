/*
 * Every field is one box with one set of states. The states are written once,
 * in the "field focus" section of inputs.css; a component that draws its own
 * focus border, or is left out of the shared lists, is how fields drift apart.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '..')

function stylesheet(name: string): string {
  return readFileSync(join(root, 'src/styles', name), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every selector of every rule whose declarations match all of `patterns`. */
function selectorsDeclaring(css: string, ...patterns: RegExp[]): Set<string> {
  const selectors = new Set<string>()
  for (const [, list, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!patterns.every((pattern) => pattern.test(body!))) continue
    // Split on the commas between selectors, not those inside `:is(…)` or `:has(…)`.
    for (const selector of list!.split(/,(?![^(]*\))/)) selectors.add(selector.trim().replace(/\s+/g, ' '))
  }
  return selectors
}

const inputs = stylesheet('inputs.css')

describe('field states', () => {
  it('lights every field the same way on focus, and while its picker is open', () => {
    const focus = selectorsDeclaring(inputs, /border-color:\s*var\(--sui-field-focus-border\)/)
    for (const selector of [
      '.sui-input:focus-visible',
      '.sui-textarea:focus-visible',
      '.sui-input-group:focus-within',
      '.sui-tags:focus-within',
      '.sui-otp__box:focus-visible',
      '.sui-select__trigger:focus-visible',
      ".sui-select__trigger[data-state='open']",
      '.sui-combobox__trigger:focus-visible',
      ".sui-combobox__trigger[data-state='open']",
      '.sui-date-field__trigger:focus-visible',
      ".sui-date-field__trigger[data-state='open']",
      '.sui-time-input:focus-within',
      '.sui-inline-filter__trigger:focus-visible',
      ".sui-inline-filter__trigger[data-state='open']",
    ]) {
      expect(focus, selector).toContain(selector)
    }
  })

  it('lights an applied inline filter and its clear button as one object', () => {
    const lit =
      "> :is(.sui-inline-filter__trigger:is(:focus-visible, [data-state='open']), .sui-inline-filter__reset:focus-visible)"
    const halo = selectorsDeclaring(inputs, /box-shadow:\s*var\(--sui-field-focus-ring\)/)
    const borders = selectorsDeclaring(inputs, /border-color:\s*var\(--sui-field-focus-border\)/)
    expect(halo).toContain(`.sui-inline-filter[data-active]:has(${lit})`)
    expect(borders).toContain(`.sui-inline-filter[data-active]:has(${lit}) > *`)
  })

  it('marks every field invalid, focused or not, the same way', () => {
    const invalid = selectorsDeclaring(inputs, /border-color:\s*var\(--destructive\)/)
    const invalidFocus = selectorsDeclaring(inputs, /box-shadow:\s*var\(--sui-field-invalid-ring\)/)
    for (const box of ['.sui-input', '.sui-textarea', '.sui-tags', '.sui-otp__box', '.sui-select__trigger', '.sui-combobox__trigger', '.sui-date-field__trigger']) {
      expect(invalid, box).toContain(`${box}[aria-invalid='true']`)
      expect([...invalidFocus].some((selector) => selector.startsWith(`${box}[aria-invalid='true']:focus`)), box).toBe(true)
    }
  })

  it('disables every field with the same faded, muted box', () => {
    const disabled = selectorsDeclaring(
      inputs,
      /opacity:\s*0\.5/,
      /background:\s*var\(--muted\)/,
      /cursor:\s*not-allowed/,
    )
    for (const selector of [
      '.sui-input:disabled',
      '.sui-textarea:disabled',
      '.sui-input-group[data-disabled]',
      '.sui-input-group:has(> .sui-input-group__input:disabled)',
      '.sui-tags[data-disabled]',
      '.sui-otp__box:disabled',
      '.sui-select__trigger:disabled',
      '.sui-combobox__trigger:disabled',
      '.sui-date-field__trigger:disabled',
      '.sui-time-input[data-disabled]',
    ]) {
      expect(disabled, selector).toContain(selector)
    }
  })

  it('leaves no component drawing a focus border of its own', () => {
    for (const name of ['primitives.css', 'forms.css', 'composites.css', 'controls.css', 'inputs.css']) {
      const own = [...selectorsDeclaring(stylesheet(name), /border-color:\s*var\(--ring\)/)].filter(
        (selector) => selector.includes(':focus') && !selector.startsWith('.sui-images__add'),
      )
      expect(own, name).toEqual([])
    }
  })
})

describe('list panel search', () => {
  it('is the shared field box in the combobox, the multi-select and the phone country list', () => {
    for (const file of [
      'src/components/form/combobox.tsx',
      'src/components/form/phone-input.tsx',
      'src/components/data-table/filters/multi-select.tsx',
    ]) {
      const source = readFileSync(join(root, file), 'utf8')
      expect(source, file).toContain('sui-input-group sui-combobox__search-field')
      expect(source, file).toContain('sui-input-group__input sui-combobox__search-input')
    }
  })
})

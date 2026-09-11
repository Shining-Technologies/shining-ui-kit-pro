import { describe, expect, it } from 'vitest'
import {
  CSS_VAR_NAMES,
  createTableTheme,
  createTheme,
  cssVarsToDeclarations,
  hasDarkOverrides,
  mergeThemes,
  themeToCssVars,
} from '../theme'

describe('themeToCssVars', () => {
  it('emits only the tokens that were provided', () => {
    expect(
      themeToCssVars({
        colors: { headerBackground: '#111827', rowHover: '#1f2937' },
        radius: { table: '12px' },
      }),
    ).toEqual({
      '--sui-header-background': '#111827',
      '--sui-row-hover': '#1f2937',
      '--sui-radius-surface': '12px',
    })
  })

  it('returns nothing for an empty or missing theme', () => {
    expect(themeToCssVars(undefined)).toEqual({})
    expect(themeToCssVars({})).toEqual({})
  })

  it('ignores unknown token names instead of emitting broken variables', () => {
    expect(themeToCssVars({ colors: { nope: 'red' } } as never)).toEqual({})
  })
})

describe('mergeThemes / createTableTheme', () => {
  it('merges token groups at the leaf level', () => {
    const base = { colors: { border: '#eee', rowHover: '#fafafa' }, density: 'compact' } as const
    const merged = mergeThemes(base, { colors: { rowHover: '#000' } })
    expect(merged.colors).toEqual({ border: '#eee', rowHover: '#000' })
    expect(merged.density).toBe('compact')
  })

  it('does not mutate the base theme', () => {
    const base = { colors: { border: '#eee' } }
    mergeThemes(base, { colors: { border: '#000' } })
    expect(base.colors.border).toBe('#eee')
  })

  it('inherits when given a base', () => {
    const base = createTableTheme({ radius: { table: '8px' } })
    const child = createTableTheme({ radius: { control: '4px' } }, base)
    expect(child.radius).toEqual({ table: '8px', control: '4px' })
  })

  it('merges dark overrides too', () => {
    const merged = mergeThemes(
      { dark: { colors: { border: '#333' } } },
      { dark: { colors: { rowHover: '#222' } } },
    )
    expect(merged.dark?.colors).toEqual({ border: '#333', rowHover: '#222' })
  })
})

describe('dark mode helpers', () => {
  it('detects meaningful dark overrides', () => {
    expect(hasDarkOverrides(undefined)).toBe(false)
    expect(hasDarkOverrides({ dark: {} })).toBe(false)
    expect(hasDarkOverrides({ dark: { colors: { border: '#333' } } })).toBe(true)
  })

  it('serialises variables to a declaration block', () => {
    expect(cssVarsToDeclarations({ '--sui-border': '#333', '--sui-radius': '8px' })).toBe(
      '--sui-border:#333;--sui-radius:8px',
    )
  })

  it('keeps the deprecated alias pointing at the current factory', () => {
    expect(createTableTheme).toBe(createTheme)
  })
})

describe('token map', () => {
  it('exposes a unique, prefixed name for every token', () => {
    expect(CSS_VAR_NAMES.length).toBeGreaterThan(30)
    expect(new Set(CSS_VAR_NAMES).size).toBe(CSS_VAR_NAMES.length)
    expect(CSS_VAR_NAMES.every((name) => name.startsWith('--sui-'))).toBe(true)
  })
})

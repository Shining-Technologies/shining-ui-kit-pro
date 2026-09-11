import { CSS_VAR_NAMES, themeToCssVars } from '@shining-technologies/ui-kit-core'
import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_PALETTES,
  dashboardTheme,
  defaultTheme,
  midnightTheme,
  minimalTheme,
  themes,
} from '../index'

const ALL = { defaultTheme, minimalTheme, dashboardTheme, midnightTheme }

describe('shipped themes', () => {
  it('are registered under stable names', () => {
    expect(Object.keys(themes)).toEqual(['default', 'minimal', 'dashboard', 'midnight'])
  })

  it.each(Object.entries(ALL))('%s emits only known CSS variables', (_name, theme) => {
    const emitted = Object.keys(themeToCssVars(theme))
    expect(emitted.every((variable) => CSS_VAR_NAMES.includes(variable))).toBe(true)
  })

  it.each(Object.entries(ALL))('%s declares a variant and a density', (_name, theme) => {
    expect(theme.variant).toBeDefined()
    expect(theme.density).toBeDefined()
  })

  it('keeps the default theme free of hardcoded colours so dark mode still works', () => {
    // Pinning colours here would freeze the table into light mode.
    expect(defaultTheme.colors).toBeUndefined()
  })

  it('gives midnight a complete table palette', () => {
    const vars = themeToCssVars(midnightTheme)
    expect(Object.keys(vars).length).toBeGreaterThan(10)
    expect(vars['--sui-primary']).toBe('#38bdf8')
    expect(vars['--sui-header-background']).toBe('#0f1a2f')
  })

  it('re-exports the palettes a provider is given', () => {
    expect(BUILT_IN_PALETTES.length).toBeGreaterThan(4)
    expect(BUILT_IN_PALETTES.every((palette) => Boolean(palette.seed.primary))).toBe(true)
  })

  it('are plain data, so they can be serialised and stored', () => {
    for (const theme of Object.values(ALL)) {
      expect(() => JSON.parse(JSON.stringify(theme))).not.toThrow()
    }
  })
})

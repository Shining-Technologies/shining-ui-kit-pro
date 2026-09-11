import type { DeepPartial, Density, TableVariant } from '../types/common'
import type { TokenGroup, UIKitTokens } from './tokens'
import { CSS_VAR_MAP } from './tokens'

/**
 * A user-supplied theme. Every field is optional: anything you leave out falls
 * through to the stylesheet defaults, which already handle light and dark.
 *
 * ```ts
 * const midnight = createTheme({
 *   colors: { primary: '#38bdf8', headerBackground: '#0f1a2f' },
 *   radius: { base: '12px' },
 *   density: 'comfortable',
 * })
 * ```
 */
export interface UIKitTheme extends DeepPartial<UIKitTokens> {
  density?: Density
  variant?: TableVariant
  /** Overrides applied only while the surrounding app is in dark mode. */
  dark?: DeepPartial<UIKitTokens>
}

/** @deprecated Use {@link UIKitTheme}; a theme now covers every component. */
export type TableTheme = UIKitTheme

const TOKEN_GROUPS = Object.keys(CSS_VAR_MAP) as TokenGroup[]

/** Merge two themes; `override` wins at the leaf level. */
export function mergeThemes(base: UIKitTheme | undefined, override: UIKitTheme | undefined) {
  if (!base) return override ?? {}
  if (!override) return base
  const result: UIKitTheme = { ...base, ...override }
  for (const group of TOKEN_GROUPS) {
    const a = base[group]
    const b = override[group]
    if (a && b) Object.assign((result[group] = { ...a }), b)
  }
  if (base.dark || override.dark) {
    result.dark = mergeThemes(base.dark, override.dark) as DeepPartial<UIKitTokens>
  }
  return result
}

/**
 * Author a theme with full type-checking and optional inheritance from another.
 *
 * This is deliberately not a class or a provider — a theme is plain data, which
 * is what lets it be serialised, diffed, stored per project, or built at runtime.
 */
export function createTheme(theme: UIKitTheme, base?: UIKitTheme): UIKitTheme {
  return base ? mergeThemes(base, theme) : { ...theme }
}

/** @deprecated Renamed to {@link createTheme}. */
export const createTableTheme = createTheme

/**
 * Flatten a theme's token groups into CSS custom properties.
 *
 * Only tokens that are actually set are emitted, so unspecified values keep
 * inheriting from the stylesheet (and therefore keep working in dark mode).
 */
export function themeToCssVars(theme: DeepPartial<UIKitTokens> | undefined) {
  const vars: Record<string, string> = {}
  if (!theme) return vars
  for (const group of TOKEN_GROUPS) {
    const values = theme[group] as Record<string, string | undefined> | undefined
    if (!values) continue
    const names = CSS_VAR_MAP[group] as Record<string, string>
    for (const [key, value] of Object.entries(values)) {
      const varName = names[key]
      if (varName && value !== undefined && value !== null) vars[varName] = String(value)
    }
  }
  return vars
}

/** `true` when the theme carries dark-mode specific overrides. */
export function hasDarkOverrides(theme: UIKitTheme | undefined): boolean {
  return Boolean(theme?.dark && Object.keys(themeToCssVars(theme.dark)).length > 0)
}

/** Serialise CSS variables to a declaration block, used for scoped dark rules. */
export function cssVarsToDeclarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(';')
}

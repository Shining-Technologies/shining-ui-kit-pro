import type { Density, TableVariant } from '../types/common'
import type { UIKitTheme } from '../theme/create-theme'

/**
 * The handful of colours a project is actually *authored* from.
 *
 * Everything else — surfaces, hovers, borders, selected rows, chart series,
 * the sidebar — is derived. That is the whole point: picking a brand colour
 * should be a complete theming action, not the first of forty. A seed with
 * only `primary` set already produces a coherent light and dark palette.
 */
export interface ProjectSeed {
  /** The brand colour. Filled buttons, active states, focus rings. */
  primary: string
  /**
   * A second brand colour, used for chart series and highlight accents.
   * Defaults to a hue rotated off `primary`.
   */
  accent?: string
  /**
   * Hue of the greys. Defaults to a barely-tinted version of `primary`, which
   * is what stops a warm brand from sitting on cold neutral chrome.
   */
  neutral?: string
  /** Page background. Defaults to the lightest neutral step. */
  surface?: string
  destructive?: string
  success?: string
  warning?: string
  info?: string
}

/** How much the greys pick up the brand hue. */
export type NeutralTint = 'pure' | 'subtle' | 'tinted'

export interface ProjectShape {
  /** Base corner radius, e.g. `'0.65rem'`. Every other radius derives from it. */
  radius: string
  /** Row and control rhythm. */
  density: Density
  /** Table chrome preset. */
  variant: TableVariant
  /** Hairline width for borders and rules. */
  borderWidth: string
  /** How present shadows are. `flat` removes them entirely. */
  elevation: 'flat' | 'soft' | 'raised'
}

export interface ProjectTypography {
  fontFamily: string
  fontFamilyMono: string
  /** Base body size, e.g. `'0.875rem'`. */
  fontSize: string
  /** Weight for headings, card titles and table headers. */
  titleFontWeight: string
}

/**
 * A project: one named, serialisable design decision set.
 *
 * Plain data on purpose — it round-trips through JSON, so a project can live in
 * localStorage, in a database row, or in a config file checked into the app
 * that consumes it.
 */
export interface ProjectDefinition {
  /** Stable slug. Used as the storage key and the `data-sui-project` value. */
  id: string
  name: string
  description?: string
  /** The built-in palette this project started from, for "reset to preset". */
  basePalette?: string
  seed: ProjectSeed
  neutralTint: NeutralTint
  shape: ProjectShape
  typography: ProjectTypography
  /**
   * Token overrides applied *after* generation, for the cases where a designer
   * wants one specific value that no seed would produce.
   */
  overrides?: UIKitTheme
  /** Shipped with the kit; the registry refuses to delete these. */
  builtIn?: boolean
  /** ISO timestamps, present on user-created projects. */
  createdAt?: string
  updatedAt?: string
}

/** Everything except the generated bits, for `createProject()`. */
export interface ProjectInput {
  id?: string
  name: string
  description?: string
  basePalette?: string
  seed: ProjectSeed
  neutralTint?: NeutralTint
  shape?: Partial<ProjectShape>
  typography?: Partial<ProjectTypography>
  overrides?: UIKitTheme
  builtIn?: boolean
}

/**
 * The quick way to put your own brand on a preset: one flat object instead of
 * a seed, a shape and a typography block. Every field is optional, and a bare
 * string is shorthand for `{ primary }`.
 */
export interface BrandOptions extends Partial<ProjectSeed> {
  /** Base corner radius, e.g. `'0.5rem'`. */
  radius?: string
  density?: Density
  elevation?: ProjectShape['elevation']
  borderWidth?: string
  /** Table chrome preset. */
  variant?: TableVariant
  neutralTint?: NeutralTint
  fontFamily?: string
  fontSize?: string
  titleFontWeight?: string
  /** Token-level escape hatch, applied after generation. */
  overrides?: UIKitTheme
}

export type BrandInput = string | BrandOptions

export type ColorMode = 'light' | 'dark'

/** A project resolved into concrete tokens for both colour modes. */
export interface ResolvedProject {
  project: ProjectDefinition
  light: UIKitTheme
  dark: UIKitTheme
}

/**
 * `@shining-technologies/ui-kit-themes` — the shipped design presets.
 *
 * Two kinds of preset live here, and they operate at different levels:
 *
 * - **Palettes** are whole projects. They carry seed colours, geometry and
 *   density, and resolving one produces the complete token set every component
 *   in the kit reads. This is what you pass to `<UIKitProvider>`.
 * - **Chrome themes** are narrow overrides that change the *table's* own
 *   dressing — header fill, container radius, header type — without touching
 *   the project's colours. Pass one to `<DataTable theme={…} />`.
 *
 * Both are plain data, so unused presets disappear from your bundle and any of
 * them can be serialised, diffed or stored per user (§26, §53).
 */
import { createTheme, type UIKitTheme } from '@shining-technologies/ui-kit-core'

// ------------------------------------------------------------------ palettes

export {
  BUILT_IN_PALETTES,
  darwindPalette,
  defaultPalette,
  emberPalette,
  forestPalette,
  midnightPalette,
  monoPalette,
  paletteById,
  rosePalette,
  shiningPalette,
  slatePalette,
  unnPalette,
  violetPalette,
} from '@shining-technologies/ui-kit-core'

// ------------------------------------------------------------ chrome themes

/**
 * The shipped default: whatever the active project says.
 *
 * Deliberately colourless — pinning colours here would freeze the table into
 * one palette and undo the point of the project system. It only sets the
 * geometry the variant system does not.
 */
export const defaultTheme: UIKitTheme = createTheme({
  variant: 'default',
  density: 'comfortable',
})

/**
 * Stripped back: no container chrome, no header fill, generous rhythm.
 * Good for reading-heavy tables embedded in a page rather than a panel.
 */
export const minimalTheme: UIKitTheme = createTheme({
  variant: 'minimal',
  density: 'comfortable',
  radius: { table: '0px' },
  typography: { headerLetterSpacing: '0.04em', headerFontSize: '0.6875rem' },
  spacing: { cellPaddingX: '0.25rem', headerPaddingX: '0.25rem' },
})

/**
 * Dense and high-contrast, sized for an admin panel where rows-per-screen
 * matters more than whitespace.
 */
export const dashboardTheme: UIKitTheme = createTheme({
  variant: 'dashboard',
  density: 'compact',
  typography: { headerFontWeight: '600', headerLetterSpacing: '0.02em' },
})

/**
 * A worked example of pinning table colours explicitly, including dark-mode
 * overrides. Reach for this only when a table has to look the same regardless
 * of the surrounding project — otherwise use a palette.
 */
export const midnightTheme: UIKitTheme = createTheme({
  variant: 'default',
  density: 'comfortable',
  colors: {
    headerBackground: '#0f1a2f',
    headerForeground: '#94a3b8',
    headerBorder: '#1e293b',
    rowForeground: '#e2e8f0',
    rowHover: '#111c33',
    rowSelected: '#152544',
    rowSelectedHover: '#1a2d52',
    rowStriped: '#0d1424',
    rowBorder: '#16233c',
    primary: '#38bdf8',
    primaryForeground: '#04121f',
    ring: '#38bdf8',
  },
  radius: { table: '12px' },
})

export const themes = {
  default: defaultTheme,
  minimal: minimalTheme,
  dashboard: dashboardTheme,
  midnight: midnightTheme,
} as const

export type ThemeName = keyof typeof themes

export { createTheme, createTableTheme, mergeThemes, themeToCssVars } from '@shining-technologies/ui-kit-core'
export { applyBrand } from '@shining-technologies/ui-kit-core'
export type {
  BrandInput,
  BrandOptions,
  PresetId,
  ProjectDefinition,
  UIKitTheme,
  UIKitTokens,
} from '@shining-technologies/ui-kit-core'

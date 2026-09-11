/**
 * The complete design-token surface of the kit.
 *
 * Every visual property every component reads comes from here. No component may
 * hardcode a colour, radius or spacing value — that is what makes a whole
 * application re-themable by swapping one project (§24, §57).
 *
 * The colour names deliberately mirror the shadcn/ui vocabulary
 * (`background`/`foreground`, `card`, `popover`, `primary`, `secondary`,
 * `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`,
 * `sidebar-*`) so a design authored against that vocabulary — such as the
 * Shining Services portal — maps across one-to-one.
 */
export interface ThemeColors {
  // ---------------------------------------------------------------- surfaces
  /** Surface behind the whole page. */
  background: string
  foreground: string
  /** Raised panel surface: cards, tables, sheets. */
  card: string
  cardForeground: string
  /** Floating surface: popovers, dropdowns, tooltips, dialogs. */
  popover: string
  popoverForeground: string
  popoverBorder: string

  // ------------------------------------------------------------------ intent
  /** The brand colour. Filled buttons, active states, focus rings. */
  primary: string
  primaryForeground: string
  /** A quieter filled surface for secondary actions. */
  secondary: string
  secondaryForeground: string
  /** Recessed surface: toolbars, skeletons, footers, disabled fills. */
  muted: string
  mutedForeground: string
  /** Subtle hover/active surface — *not* the brand colour (shadcn semantics). */
  accent: string
  accentForeground: string

  // ----------------------------------------------------------------- status
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  info: string
  infoForeground: string

  // ------------------------------------------------------------------ lines
  /** Decorative rules: card edges, dividers, table rules. */
  border: string
  /** Form-control boundary. Held to WCAG 1.4.11 (3:1), so it is darker than `border`. */
  input: string
  /** Focus ring. */
  ring: string

  // ----------------------------------------------------------------- charts
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string

  // ---------------------------------------------------------------- sidebar
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string

  // ------------------------------------------------------------------ table
  headerBackground: string
  headerForeground: string
  headerBorder: string

  rowBackground: string
  rowForeground: string
  rowHover: string
  rowSelected: string
  rowSelectedHover: string
  /** Applies to odd rows in the `striped` variant. */
  rowStriped: string
  rowBorder: string
}

export interface ThemeRadius {
  /** The base radius every other step is derived from. */
  base: string
  /** Outer radius of large containers: cards, tables, dialogs. */
  table: string
  /** Radius of buttons, inputs and badges. */
  control: string
  /** Radius of small chips and indicators. */
  small: string
  /** Radius of the largest surfaces: sheets, drawers. */
  large: string
}

export interface ThemeSpacing {
  cellPaddingX: string
  cellPaddingY: string
  headerPaddingX: string
  headerPaddingY: string
  /** Gap between toolbar and pagination items. */
  gap: string
  /** Rhythm between stacked blocks inside a card or page. */
  stack: string
  /** Inner padding of cards, dialogs and panels. */
  surfacePadding: string
}

export interface ThemeSizing {
  headerHeight: string
  rowHeight: string
  minColumnWidth: string
  /** Height of a default-size control (button, input, select). */
  controlHeight: string
  controlHeightSm: string
  controlHeightLg: string
}

export interface ThemeTypography {
  fontFamily: string
  /** Face used for numeric/tabular and code content. */
  fontFamilyMono: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  headerFontSize: string
  headerFontWeight: string
  headerLetterSpacing: string
  /** Weight applied to headings and titles. */
  titleFontWeight: string
}

export interface ThemeBorder {
  width: string
}

export interface ThemeShadow {
  /** Cast to the right of a left-pinned column group. */
  pinnedLeft: string
  /** Cast to the left of a right-pinned column group. */
  pinnedRight: string
  /** Popovers, dropdowns, tooltips. */
  overlay: string
  /** Resting elevation of a card. */
  surface: string
  /** Elevation of a modal dialog or sheet. */
  modal: string
}

export interface UIKitTokens {
  colors: ThemeColors
  radius: ThemeRadius
  spacing: ThemeSpacing
  sizing: ThemeSizing
  typography: ThemeTypography
  border: ThemeBorder
  shadow: ThemeShadow
}

/** @deprecated Kept for source compatibility; the token surface is kit-wide now. */
export type TableThemeTokens = UIKitTokens

export type TokenGroup = keyof UIKitTokens

/**
 * Token → CSS custom property. Written out in full rather than derived, so the
 * public variable names are greppable and can never change by accident.
 */
export const CSS_VAR_MAP: { [G in TokenGroup]: Record<keyof UIKitTokens[G], string> } = {
  colors: {
    background: '--sui-background',
    foreground: '--sui-foreground',
    card: '--sui-card',
    cardForeground: '--sui-card-foreground',
    popover: '--sui-popover',
    popoverForeground: '--sui-popover-foreground',
    popoverBorder: '--sui-popover-border',

    primary: '--sui-primary',
    primaryForeground: '--sui-primary-foreground',
    secondary: '--sui-secondary',
    secondaryForeground: '--sui-secondary-foreground',
    muted: '--sui-muted',
    mutedForeground: '--sui-muted-foreground',
    accent: '--sui-accent',
    accentForeground: '--sui-accent-foreground',

    destructive: '--sui-destructive',
    destructiveForeground: '--sui-destructive-foreground',
    success: '--sui-success',
    successForeground: '--sui-success-foreground',
    warning: '--sui-warning',
    warningForeground: '--sui-warning-foreground',
    info: '--sui-info',
    infoForeground: '--sui-info-foreground',

    border: '--sui-border',
    input: '--sui-input',
    ring: '--sui-ring',

    chart1: '--sui-chart-1',
    chart2: '--sui-chart-2',
    chart3: '--sui-chart-3',
    chart4: '--sui-chart-4',
    chart5: '--sui-chart-5',

    sidebar: '--sui-sidebar',
    sidebarForeground: '--sui-sidebar-foreground',
    sidebarPrimary: '--sui-sidebar-primary',
    sidebarPrimaryForeground: '--sui-sidebar-primary-foreground',
    sidebarAccent: '--sui-sidebar-accent',
    sidebarAccentForeground: '--sui-sidebar-accent-foreground',
    sidebarBorder: '--sui-sidebar-border',
    sidebarRing: '--sui-sidebar-ring',

    headerBackground: '--sui-header-background',
    headerForeground: '--sui-header-foreground',
    headerBorder: '--sui-header-border',
    rowBackground: '--sui-row-background',
    rowForeground: '--sui-row-foreground',
    rowHover: '--sui-row-hover',
    rowSelected: '--sui-row-selected',
    rowSelectedHover: '--sui-row-selected-hover',
    rowStriped: '--sui-row-striped',
    rowBorder: '--sui-row-border',
  },
  radius: {
    base: '--sui-radius',
    table: '--sui-radius-surface',
    control: '--sui-radius-control',
    small: '--sui-radius-sm',
    large: '--sui-radius-lg',
  },
  spacing: {
    cellPaddingX: '--sui-cell-padding-x',
    cellPaddingY: '--sui-cell-padding-y',
    headerPaddingX: '--sui-header-padding-x',
    headerPaddingY: '--sui-header-padding-y',
    gap: '--sui-gap',
    stack: '--sui-stack',
    surfacePadding: '--sui-surface-padding',
  },
  sizing: {
    headerHeight: '--sui-header-height',
    rowHeight: '--sui-row-height',
    minColumnWidth: '--sui-min-column-width',
    controlHeight: '--sui-control-height',
    controlHeightSm: '--sui-control-height-sm',
    controlHeightLg: '--sui-control-height-lg',
  },
  typography: {
    fontFamily: '--sui-font-family',
    fontFamilyMono: '--sui-font-family-mono',
    fontSize: '--sui-font-size',
    fontWeight: '--sui-font-weight',
    lineHeight: '--sui-line-height',
    headerFontSize: '--sui-header-font-size',
    headerFontWeight: '--sui-header-font-weight',
    headerLetterSpacing: '--sui-header-letter-spacing',
    titleFontWeight: '--sui-title-font-weight',
  },
  border: {
    width: '--sui-border-width',
  },
  shadow: {
    pinnedLeft: '--sui-shadow-pinned-left',
    pinnedRight: '--sui-shadow-pinned-right',
    overlay: '--sui-shadow-overlay',
    surface: '--sui-shadow-surface',
    modal: '--sui-shadow-modal',
  },
}

/** Every CSS custom property the library reads, useful for docs and tests. */
export const CSS_VAR_NAMES: string[] = Object.values(CSS_VAR_MAP).flatMap((group) =>
  Object.values(group as Record<string, string>),
)

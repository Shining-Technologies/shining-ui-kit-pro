import {
  contrastRatio,
  formatHex,
  generateScale,
  mix,
  readableForeground,
  toOklch,
  withLightness,
  type ColorScale,
} from './color'

/**
 * Generate a complete, contrast-checked colour set from a few seed colours.
 *
 * This is the V1 project palette engine, kept as a pure function. It runs at
 * build time or on a server to *produce CSS*; nothing in the library needs it
 * at runtime.
 */

export type ColorMode = 'light' | 'dark'

/** How much the greys pick up the brand hue. */
export type NeutralTint = 'pure' | 'subtle' | 'tinted'

/** The handful of colours a theme is authored from. Everything else is derived. */
export interface ThemeSeed {
  /** The brand colour. Filled buttons, active states, focus rings. */
  primary: string
  /** A second brand colour for chart series. Defaults to a hue rotated off `primary`. */
  accent?: string
  /** Hue of the greys. Defaults to a barely-tinted `primary`. */
  neutral?: string
  /** Page background in light mode. Defaults to the lightest neutral step. */
  surface?: string
  destructive?: string
  success?: string
  warning?: string
  info?: string
}

/** Every colour the generator produces for one mode. */
export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  popoverBorder: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  info: string
  infoForeground: string
  border: string
  input: string
  ring: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
  headerBackground: string
  headerForeground: string
  headerBorder: string
  rowBackground: string
  rowForeground: string
  rowHover: string
  rowSelected: string
  rowSelectedHover: string
  rowStriped: string
  rowBorder: string
}

const TINT_CHROMA: Record<NeutralTint, number> = {
  pure: 0,
  subtle: 0.004,
  tinted: 0.012,
}

const DEFAULTS = {
  destructive: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  info: '#2563eb',
} as const

interface Derived {
  primary: string
  accent: string
  neutral: ColorScale
  seed: Required<Omit<ThemeSeed, 'surface' | 'neutral'>> & { surface?: string }
}

function deriveInputs(seed: ThemeSeed, tint: NeutralTint): Derived {
  const primary = seed.primary
  const primaryOk = toOklch(primary)

  // A complementary-ish hue rather than a true complement: 150° reads as a
  // deliberate second brand colour, 180° reads as a clash.
  const accent =
    seed.accent ??
    formatHex({ l: 0.7, c: Math.max(primaryOk.c, 0.12), h: (primaryOk.h + 150) % 360, alpha: 1 })

  // Greys carry the brand hue at a chroma low enough to still read as grey.
  const neutralSeed =
    seed.neutral ?? formatHex({ l: 0.5, c: TINT_CHROMA[tint], h: primaryOk.h, alpha: 1 })

  return {
    primary,
    accent,
    neutral: generateScale(neutralSeed),
    seed: {
      primary,
      accent,
      destructive: seed.destructive ?? DEFAULTS.destructive,
      success: seed.success ?? DEFAULTS.success,
      warning: seed.warning ?? DEFAULTS.warning,
      info: seed.info ?? DEFAULTS.info,
      surface: seed.surface,
    },
  }
}

/** Lift a brand colour until it is legible against the mode's page background. */
function fitToMode(color: string, background: string, mode: ColorMode): string {
  let out = color
  for (let i = 0; i < 12 && contrastRatio(out, background) < 3.2; i++) {
    const ok = toOklch(out)
    out = withLightness(
      out,
      mode === 'dark' ? Math.min(0.92, ok.l + 0.05) : Math.max(0.2, ok.l - 0.05),
    )
  }
  return out
}

interface Fill {
  fill: string
  ink: string
}

/**
 * Make a filled surface and its label a readable pair (4.5:1). The ink is
 * chosen by the direction the mode wants, then only the fill's lightness moves
 * — the seed's hue and chroma survive.
 */
function harmonizeFill(seed: string, mode: ColorMode, darkInk: string): Fill {
  const lightInk = '#ffffff'
  const lightness = toOklch(seed).l

  let ink = readableForeground(seed, lightInk, darkInk)
  if (mode === 'light' && lightness < 0.72) ink = lightInk
  if (mode === 'dark' && lightness > 0.45) ink = darkInk

  const away = ink === lightInk ? -0.02 : 0.02
  let fill = seed
  for (let i = 0; i < 40 && contrastRatio(ink, fill) < 4.5; i++) {
    const next = toOklch(fill).l + away
    if (next <= 0.05 || next >= 0.98) break
    fill = withLightness(fill, next)
  }
  return { fill, ink }
}

const NEUTRAL_TINTS: readonly string[] = ['pure', 'subtle', 'tinted'] satisfies NeutralTint[]

/** Throw a `TypeError` unless `tint` is a `NeutralTint`. */
export function assertNeutralTint(tint: unknown): asserts tint is NeutralTint {
  if (typeof tint !== 'string' || !NEUTRAL_TINTS.includes(tint)) {
    throw new TypeError(
      `[shining-ui] neutralTint must be 'pure', 'subtle' or 'tinted': ${JSON.stringify(tint)}`,
    )
  }
}

const SEED_KEYS = ['primary', 'accent', 'neutral', 'surface', 'destructive', 'success', 'warning', 'info'] as const

/**
 * Every seed re-serialised as hex. Nothing the caller passed is ever copied
 * into the output, so a seed can only ever contribute a colour. (An
 * unparseable seed becomes the mid grey `toOklch` falls back to.)
 */
function normalizeSeed(seed: ThemeSeed): ThemeSeed {
  const out: ThemeSeed = { primary: formatHex(toOklch(seed.primary)) }
  for (const key of SEED_KEYS) {
    const value = seed[key]
    if (value !== undefined) out[key] = formatHex(toOklch(value))
  }
  return out
}

export function generateColors(seed: ThemeSeed, tint: NeutralTint, mode: ColorMode): ThemeColors {
  assertNeutralTint(tint)
  const safe = normalizeSeed(seed)
  const d = deriveInputs(safe, tint)
  return mode === 'light' ? light(d, d.neutral, safe) : dark(d, d.neutral)
}

function light(d: Derived, n: ColorScale, seed: ThemeSeed): ThemeColors {
  const background = seed.surface ?? n[50]
  const card = '#ffffff'
  const ink = n[950]

  const brand = harmonizeFill(fitToMode(d.primary, card, 'light'), 'light', ink)
  const primary = brand.fill
  const tinted = mix(primary, '#ffffff', 0.94)
  const primaryForeground =
    brand.ink === '#ffffff' && contrastRatio(tinted, primary) >= 4.5 ? tinted : brand.ink

  const accentSurface = mix(n[100], primary, 0.06)

  const { fill: destructive, ink: destructiveInk } = harmonizeFill(d.seed.destructive, 'light', ink)
  const { fill: success, ink: successInk } = harmonizeFill(d.seed.success, 'light', ink)
  const { fill: warning, ink: warningInk } = harmonizeFill(d.seed.warning, 'light', ink)
  const { fill: info, ink: infoInk } = harmonizeFill(d.seed.info, 'light', ink)

  return {
    background,
    foreground: n[950],
    card,
    cardForeground: n[950],
    popover: card,
    popoverForeground: n[950],
    popoverBorder: n[200],

    primary,
    primaryForeground,
    secondary: n[100],
    secondaryForeground: n[900],
    muted: n[100],
    // Pinned by contrast: 11px column labels on the muted header fill must clear 4.5:1.
    mutedForeground: withLightness(n[500], 0.5),
    accent: accentSurface,
    accentForeground: n[900],

    destructive,
    destructiveForeground: destructiveInk,
    success,
    successForeground: successInk,
    warning,
    warningForeground: warningInk,
    info,
    infoForeground: infoInk,

    border: n[200],
    // WCAG 1.4.11 wants 3:1 for a control boundary, which `border` does not reach.
    input: withLightness(n[400], 0.64),
    ring: primary,

    ...chartColors(primary, d.accent, 'light'),

    sidebar: card,
    sidebarForeground: n[950],
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: accentSurface,
    sidebarAccentForeground: n[900],
    sidebarBorder: n[200],
    sidebarRing: primary,

    headerBackground: mix(card, n[100], 0.55),
    headerForeground: withLightness(n[500], 0.45),
    headerBorder: n[200],

    rowBackground: 'transparent',
    rowForeground: n[900],
    rowHover: mix(n[50], primary, 0.05),
    rowSelected: mix(card, primary, 0.1),
    rowSelectedHover: mix(card, primary, 0.16),
    rowStriped: mix(card, n[100], 0.45),
    rowBorder: n[200],
  }
}

function dark(d: Derived, n: ColorScale): ThemeColors {
  // Not "invert the scale": the darkest steps are too close together to
  // separate a page from a card from a popover, so they are picked absolutely.
  const hue = toOklch(n[500]).h
  const chroma = toOklch(n[500]).c
  const shade = (l: number) => formatHex({ l, c: chroma, h: hue, alpha: 1 })

  const background = shade(0.16)
  const card = shade(0.21)
  const ink = shade(0.13)

  const brand = harmonizeFill(fitToMode(d.primary, card, 'dark'), 'dark', ink)
  const primary = brand.fill
  const primaryForeground = brand.ink
  const accentSurface = mix(shade(0.28), primary, 0.1)

  const { fill: destructive, ink: destructiveInk } = harmonizeFill(
    withLightness(d.seed.destructive, 0.65),
    'dark',
    ink,
  )
  const { fill: success, ink: successInk } = harmonizeFill(
    withLightness(d.seed.success, 0.68),
    'dark',
    ink,
  )
  const { fill: warning, ink: warningInk } = harmonizeFill(
    withLightness(d.seed.warning, 0.75),
    'dark',
    ink,
  )
  const { fill: info, ink: infoInk } = harmonizeFill(withLightness(d.seed.info, 0.68), 'dark', ink)

  return {
    background,
    foreground: shade(0.97),
    card,
    cardForeground: shade(0.97),
    popover: shade(0.24),
    popoverForeground: shade(0.97),
    popoverBorder: shade(0.32),

    primary,
    primaryForeground,
    secondary: shade(0.28),
    secondaryForeground: shade(0.97),
    muted: shade(0.26),
    mutedForeground: shade(0.72),
    accent: accentSurface,
    accentForeground: shade(0.97),

    destructive,
    destructiveForeground: destructiveInk,
    success,
    successForeground: successInk,
    warning,
    warningForeground: warningInk,
    info,
    infoForeground: infoInk,

    border: shade(0.3),
    input: shade(0.45),
    ring: primary,

    ...chartColors(primary, d.accent, 'dark'),

    sidebar: card,
    sidebarForeground: shade(0.97),
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: accentSurface,
    sidebarAccentForeground: shade(0.97),
    sidebarBorder: shade(0.3),
    sidebarRing: primary,

    headerBackground: shade(0.24),
    headerForeground: shade(0.72),
    headerBorder: shade(0.3),

    rowBackground: 'transparent',
    rowForeground: shade(0.93),
    rowHover: mix(shade(0.25), primary, 0.08),
    rowSelected: mix(card, primary, 0.22),
    rowSelectedHover: mix(card, primary, 0.3),
    rowStriped: shade(0.19),
    rowBorder: shade(0.27),
  }
}

/**
 * Five chart series that read as one family: hues walk from the primary to the
 * accent, and lightness zig-zags so neighbours stay apart in greyscale.
 */
function chartColors(
  primary: string,
  accent: string,
  mode: ColorMode,
): Pick<ThemeColors, 'chart1' | 'chart2' | 'chart3' | 'chart4' | 'chart5'> {
  const p = toOklch(primary)
  const a = toOklch(accent)

  let delta = a.h - p.h
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360

  const lightness =
    mode === 'light' ? [0.52, 0.63, 0.74, 0.58, 0.45] : [0.7, 0.79, 0.87, 0.68, 0.58]
  const chroma = Math.max(0.09, (p.c + a.c) / 2)

  const at = (i: number) =>
    formatHex({
      l: lightness[i]!,
      c: chroma * (i === 2 ? 0.85 : 1),
      h: (((p.h + (delta * i) / 4) % 360) + 360) % 360,
      alpha: 1,
    })

  return { chart1: at(0), chart2: at(1), chart3: at(2), chart4: at(3), chart5: at(4) }
}

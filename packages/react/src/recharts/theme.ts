/**
 * The one place a chart's appearance is decided.
 *
 * Every chart in this folder resolves its colours, type sizes, spacing and
 * responsive behaviour here, so the whole set stays one design instead of five
 * independent ones that happen to look similar. Nothing below hardcodes a
 * colour: series take `--sui-chart-*` and the furniture takes the same surface,
 * border and muted tokens as the rest of the kit, which is what makes a chart
 * follow a project switch with no adapter layer.
 */

/**
 * Which token each series slot takes, in assignment order.
 *
 * Not `1,2,3,4,5`. The generated ramp walks the brand hue from teal through
 * olive to brown, so consecutive tokens are perceptual neighbours: slots 2 and
 * 3 (`#559d55` / `#abb25f`) measure ΔE 12.7 to normal vision and 8.6 under
 * protanopia — close enough that a reader cannot reliably tell the two series
 * apart. Taking the ramp in this order puts the widest gap between the slots a
 * two- or three-series chart actually uses, which lifts the worst adjacent
 * pair to ΔE 13.6 (light) and 17.0 (dark) without touching the tokens.
 *
 * The remaining shortfall is in the ramp, not the ordering — see
 * `docs/components/charts.md`. Until it is regenerated, identity never rests on hue alone
 * here: every multi-series chart carries a legend, a tooltip and a table view,
 * and touching marks are separated by a surface gap rather than by colour.
 */
export const CHART_SLOT_ORDER = [1, 3, 5, 2, 4] as const

/** How many distinct series the palette can carry before colour stops working. */
export const MAX_SERIES = CHART_SLOT_ORDER.length

/**
 * The colour for series `index`.
 *
 * Past the fifth series the ramp is exhausted. Cycling would hand series 6 the
 * exact colour of series 1, so extra slots take a lighter tint of the token
 * instead — still not something to lean on, but visibly *different*, which a
 * repeat is not. Five or fewer series is the supported case; past that, fold
 * the tail into an "Other" row or facet into small multiples.
 */
export function seriesColor(index: number, explicit?: string): string {
  if (explicit) return explicit
  const slot = CHART_SLOT_ORDER[index % MAX_SERIES]
  const token = `var(--sui-chart-${slot})`
  if (index < MAX_SERIES) return token
  const tint = 100 - Math.min(3, Math.floor(index / MAX_SERIES)) * 22
  return `color-mix(in oklab, ${token} ${tint}%, ${CHART_SURFACE})`
}

/**
 * The surface a chart is drawn on.
 *
 * Marks are separated from each other by a gap in this colour rather than by a
 * stroke, so it has to match whatever sits behind the chart.
 * `--sui-chart-surface` defaults to the card in the stylesheet; put a chart on
 * a different surface and you override that one variable.
 */
export const CHART_SURFACE = 'var(--sui-chart-surface)'

/** Gridlines and axis rules: one step off the surface, hairline, never dashed. */
export const AXIS_LINE_COLOR = 'var(--sui-border)'
/** Axis ticks and other chart furniture text. */
export const AXIS_TEXT_COLOR = 'var(--sui-muted-foreground)'

/** The 2px surface gap that separates touching marks. */
export const MARK_GAP = 2
/** Bars never fill their slot — the leftover band is deliberate air. */
export const MAX_BAR_SIZE = 24
/** Rounded data-end, square at the baseline. */
export const BAR_RADIUS = 4
export const LINE_WIDTH = 2
export const DOT_RADIUS = 4

// ---------------------------------------------------------------- formatting

/** `1.2M`, `52k`, `938`. The exact figure belongs in the tooltip. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${trim(value / 1e9)}B`
  if (abs >= 1e6) return `${trim(value / 1e6)}M`
  if (abs >= 1e3) return `${trim(value / 1e3)}k`
  return trim(value)
}

/** Full precision with thousands separators, for tooltips and the table view. */
export function formatFull(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString() : '—'
}

export function formatPercent(value: number, digits = 0): string {
  return Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—'
}

function trim(n: number): string {
  return Number(n.toFixed(1)).toString()
}

/** Receives the raw datum value, returns display text. */
export type ValueFormatter = (value: number) => string
/** Receives the raw x/category value. */
export type LabelFormatter = (label: string | number) => string

// --------------------------------------------------------------- responsive

/**
 * Size buckets, measured on the chart's **own container** — not the viewport.
 *
 * A chart in a narrow dashboard column on a 27-inch monitor has exactly the
 * problems of a chart on a phone, and a viewport media query cannot see that.
 * Every responsive decision in this folder keys off these buckets.
 */
export type ChartSize = 'xs' | 'sm' | 'md' | 'lg'

export const SIZE_BREAKPOINTS: { size: ChartSize; min: number }[] = [
  { size: 'lg', min: 900 },
  { size: 'md', min: 640 },
  { size: 'sm', min: 420 },
  { size: 'xs', min: 0 },
]

export function sizeForWidth(width: number): ChartSize {
  return SIZE_BREAKPOINTS.find((b) => width >= b.min)?.size ?? 'xs'
}

/** A value that may differ per bucket. Missing buckets fall back downward. */
export type Responsive<T> = T | Partial<Record<ChartSize, T>>

const SIZE_ORDER: ChartSize[] = ['xs', 'sm', 'md', 'lg']

/** Resolve a responsive value at `size`, taking the nearest smaller bucket. */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined,
  size: ChartSize,
): T | undefined {
  if (value === undefined) return undefined
  if (!isBucketMap<T>(value)) return value
  const upto = SIZE_ORDER.slice(0, SIZE_ORDER.indexOf(size) + 1)
  for (let i = upto.length - 1; i >= 0; i--) {
    const bucket = upto[i]
    const found = bucket === undefined ? undefined : value[bucket]
    if (found !== undefined) return found
  }
  return undefined
}

function isBucketMap<T>(value: Responsive<T>): value is Partial<Record<ChartSize, T>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return SIZE_ORDER.some((k) => k in (value as object))
}

/**
 * Default plot heights.
 *
 * A chart that keeps its desktop height in a phone-width column spends most of
 * it on empty vertical space, so the plot shrinks with its container.
 */
export const DEFAULT_HEIGHT: Record<ChartSize, number> = {
  xs: 190,
  sm: 224,
  md: 264,
  lg: 300,
}

/** Plot margins. Tight at every size; the axes reserve their own room. */
export const DEFAULT_MARGIN: Record<
  ChartSize,
  { top: number; right: number; bottom: number; left: number }
> = {
  xs: { top: 8, right: 4, bottom: 0, left: 0 },
  sm: { top: 8, right: 8, bottom: 0, left: 0 },
  md: { top: 12, right: 12, bottom: 0, left: 0 },
  lg: { top: 12, right: 16, bottom: 0, left: 0 },
}

export const TICK_FONT_SIZE = 11
/** Rough advance width of the tick font, used to predict label collisions. */
const CHAR_WIDTH = 6.2

/**
 * How many category labels fit, and whether they have to be angled.
 *
 * Recharts will draw every label and let them overlap into mush, so the count
 * is decided here instead: thin first — dropping every other label costs
 * nothing, because the tooltip and the table view still carry every value —
 * and only angle them when thinning alone would still collide.
 */
export function categoryTicks(options: {
  count: number
  width: number
  longestLabel: number
  size: ChartSize
}): { interval: number; angle: number; height: number } {
  const { count, width, longestLabel, size } = options
  if (count === 0 || width <= 0) return { interval: 0, angle: 0, height: 24 }

  const slot = width / count
  const labelWidth = longestLabel * CHAR_WIDTH + 8

  if (labelWidth <= slot) return { interval: 0, angle: 0, height: 24 }

  // Thin: keep every Nth label so each survivor owns enough slot to sit flat.
  const interval = Math.ceil(labelWidth / slot) - 1
  const survivors = count / (interval + 1)

  // Thinning past a handful of survivors stops being a readable axis; angle
  // the labels instead so more of them stay on it.
  if (survivors >= 3 && interval <= 4) return { interval, angle: 0, height: 24 }

  const angle = size === 'xs' ? -45 : -35
  const height = Math.min(72, Math.round(longestLabel * CHAR_WIDTH * 0.62) + 20)
  return { interval: Math.max(0, Math.ceil(interval / 2) - 1), angle, height }
}

/** Width to reserve for the value axis, from the widest tick it will draw. */
export function valueAxisWidth(ticks: string[], size: ChartSize): number {
  const longest = ticks.reduce((max, t) => Math.max(max, t.length), 1)
  const base = Math.ceil(longest * CHAR_WIDTH) + 12
  return Math.min(size === 'xs' ? 44 : 72, Math.max(28, base))
}

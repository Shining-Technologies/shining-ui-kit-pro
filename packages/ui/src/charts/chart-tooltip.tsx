import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/cn'
import {
  AXIS_LINE_COLOR,
  CHART_SURFACE,
  formatFull,
  type LabelFormatter,
  type ValueFormatter,
} from './theme'

/** One row of a tooltip, after the chart has resolved it. */
export interface TooltipRow {
  key: string
  label: ReactNode
  value: number | string | null
  color: string
}

export interface ChartTooltipContentProps {
  /** Recharts sets this; the content renders nothing while the pointer is away. */
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
  label?: string | number
  labelFormatter?: LabelFormatter
  /** Formats numeric values. Defaults to `formatFull` in `locale`. */
  valueFormatter?: ValueFormatter
  /**
   * Formatters by row `dataKey`, for tooltips whose rows are different measures
   * (a scatter point's x and y). A row without an entry uses `valueFormatter`.
   */
  valueFormatters?: Record<string, ValueFormatter | undefined>
  /** Locale for the default formatter. Defaults to `'en-US'`. */
  locale?: string
  /**
   * Read the heading from this property of the hovered datum instead of from
   * `label` — for charts with no category axis to label a point by (scatter).
   */
  labelKey?: string
  /** Appended after every value — `%`, `ms`, a currency code. */
  unit?: string
  /** Hide the heading when the label adds nothing (a single-category chart). */
  hideLabel?: boolean
  /** Drop rows whose value is null rather than showing them as em dashes. */
  hideNullRows?: boolean
  /** A closing line under the rows — a total, a share, a note. */
  footer?: ReactNode
  className?: string
}

/**
 * What Recharts hands a custom tooltip.
 *
 * Typed here rather than imported: Recharts' own `TooltipProps` generics change
 * shape between minor versions, and this is the whole of the surface used.
 */
export interface TooltipPayloadItem {
  name?: string | number
  dataKey?: string | number
  value?: number | string | (number | string)[] | null
  color?: string
  fill?: string
  stroke?: string
  hide?: boolean
  payload?: Record<string, unknown>
}

/**
 * The kit's tooltip, drawn from popover tokens so it matches every other
 * floating surface in the library rather than looking like a chart accessory.
 *
 * Recharts positions the wrapper; this only paints the inside of it.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  valueFormatters,
  locale,
  labelKey,
  unit,
  hideLabel = false,
  hideNullRows = true,
  footer,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  const rows = payload
    .filter((item) => !item.hide)
    .map((item) => {
      const raw = Array.isArray(item.value) ? item.value[item.value.length - 1] : item.value
      return {
        key: String(item.dataKey ?? item.name ?? ''),
        label: item.name ?? item.dataKey ?? '',
        value: raw === undefined ? null : raw,
        color: item.color ?? item.stroke ?? item.fill ?? 'currentColor',
      }
    })
    .filter((row) => !hideNullRows || row.value !== null)

  if (rows.length === 0) return null

  const fromDatum = labelKey ? payload[0]?.payload?.[labelKey] : undefined
  const source =
    labelKey !== undefined
      ? typeof fromDatum === 'string' || typeof fromDatum === 'number'
        ? fromDatum
        : undefined
      : label
  const heading =
    hideLabel || source === undefined || source === null
      ? null
      : labelFormatter
        ? labelFormatter(source)
        : String(source)

  const format = (key: string, value: number) =>
    (valueFormatters?.[key] ?? valueFormatter ?? ((v: number) => formatFull(v, locale)))(value)

  return (
    <div className={cn('sui-viz__tooltip', className)} role="tooltip">
      {heading ? <div className="sui-viz__tooltip-label">{heading}</div> : null}
      {rows.map((row, i) => (
        <div key={`${i}-${row.key}`} className="sui-viz__tooltip-row">
          <span
            className="sui-viz__swatch"
            style={{ '--sui-series-color': row.color } as CSSProperties}
          />
          <span className="sui-viz__tooltip-name">{row.label}</span>
          <span className="sui-viz__tooltip-value">
            {row.value === null
              ? '—'
              : `${typeof row.value === 'number' ? format(row.key, row.value) : row.value}${unit ?? ''}`}
          </span>
        </div>
      ))}
      {footer ? <div className="sui-viz__tooltip-footer">{footer}</div> : null}
    </div>
  )
}

/**
 * The crosshair drawn under a line or area tooltip: a hairline in the border
 * colour, not the dashed grey Recharts defaults to. It marks the read position
 * without competing with the data for attention.
 */
export const CROSSHAIR_CURSOR = {
  stroke: AXIS_LINE_COLOR,
  strokeWidth: 1,
} as const

/**
 * The band drawn behind a hovered column or bar. A tint of the surface rather
 * than a fill, so the mark on top of it keeps its own colour.
 */
export const BAND_CURSOR = {
  fill: `color-mix(in oklab, ${AXIS_LINE_COLOR} 35%, ${CHART_SURFACE})`,
  fillOpacity: 0.6,
} as const

/** Recharts `<Tooltip>` props shared by every chart here. */
export const TOOLTIP_DEFAULTS = {
  // The pointer is already over the mark being described; letting the tooltip
  // take the pointer makes it flicker as it chases the cursor.
  wrapperStyle: { outline: 'none', zIndex: 20 },
  allowEscapeViewBox: { x: false, y: true },
  offset: 12,
  isAnimationActive: false,
} as const

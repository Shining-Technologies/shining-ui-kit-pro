'use client'

import { useId, useMemo } from 'react'
import {
  Area,
  AreaChart as RcAreaChart,
  CartesianGrid,
  Line,
  LineChart as RcLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { categoryAxisProps, gridProps, valueAxisProps, zeroBasedDomain } from './axes'
import {
  ChartFrame,
  tableRowsFrom,
  useHiddenSeries,
  useResolvedSeries,
  type BaseChartProps,
  type ChartDatum,
  type ChartSeries,
} from './chart-frame'
import { ChartTooltipContent, CROSSHAIR_CURSOR, TOOLTIP_DEFAULTS } from './chart-tooltip'
import {
  AXIS_TEXT_COLOR,
  CHART_SURFACE,
  DEFAULT_MARGIN,
  DOT_RADIUS,
  formatCompact,
  formatFull,
  LINE_WIDTH,
  MARK_GAP,
  type LabelFormatter,
  type ValueFormatter,
} from './theme'

export interface TrendChartProps extends BaseChartProps {
  data: ChartDatum[]
  /** The key holding each datum's time or category label. */
  xKey: string
  series: ChartSeries[]
  /** `'line'` for comparison, `'area'` for volume. Default `'line'`. */
  variant?: 'line' | 'area'
  /** Areas only: stack the series into a total. */
  stacked?: boolean
  /**
   * Curve the line between points. Uses a monotone fit, so the curve never
   * overshoots into impossible territory — a visitor count dipping below zero
   * between two positive days.
   */
  smooth?: boolean
  /** `'auto'` (default) marks points only when they are sparse enough to read. */
  showPoints?: boolean | 'auto'
  showGrid?: boolean
  showXAxis?: boolean
  /** `'auto'` (default) drops the axis on the narrowest containers. */
  showYAxis?: boolean | 'auto'
  /** Force the value axis to include zero. Default `true`. */
  startAtZero?: boolean
  /** Draw a horizontal marker — a target, a budget, an SLA. */
  reference?: { value: number; label?: string }
  /**
   * Formats values. Given, it is used everywhere a value is shown — axis ticks,
   * tooltip, table view. Omitted, ticks are compact (`52k`) and the tooltip and
   * table show full precision in `locale`.
   */
  valueFormatter?: ValueFormatter
  labelFormatter?: LabelFormatter
  /** Appended to every tooltip value. */
  unit?: string
}

/**
 * Change over time.
 *
 * One component for line and area, because an area chart *is* a line chart
 * with the space beneath it filled — splitting them would duplicate the axes,
 * the domain and the pointer handling to change one path.
 *
 * ```tsx
 * <TrendChart
 *   title="Bookings"
 *   data={months}
 *   xKey="month"
 *   series={[{ key: 'booked', label: 'Booked' }, { key: 'completed', label: 'Completed' }]}
 * />
 * ```
 */
export function TrendChart({
  data,
  xKey,
  series,
  variant = 'line',
  stacked = false,
  smooth = false,
  showPoints = 'auto',
  showGrid = true,
  showXAxis = true,
  showYAxis = 'auto',
  startAtZero = true,
  reference,
  valueFormatter,
  labelFormatter,
  unit,
  legend = 'auto',
  locale,
  ...frameProps
}: TrendChartProps) {
  const fullFormatter = useMemo(
    () => valueFormatter ?? ((v: number) => formatFull(v, locale)),
    [valueFormatter, locale],
  )
  const gradientId = useId().replace(/:/g, '')
  const [hidden, toggle] = useHiddenSeries()
  const resolved = useResolvedSeries(series, hidden)
  const visible = resolved.filter((s) => !s.hidden)

  const labels = useMemo(
    () =>
      data.map((d) => {
        const raw = d[xKey]
        const text = raw === null || raw === undefined ? '' : String(raw)
        return labelFormatter ? labelFormatter(raw as string | number) : text
      }),
    [data, xKey, labelFormatter],
  )

  const values = useMemo(() => {
    const out: number[] = []
    for (const datum of data) {
      for (const s of visible) {
        const v = datum[s.key]
        if (typeof v === 'number' && Number.isFinite(v)) out.push(v)
      }
    }
    if (startAtZero) out.push(0)
    if (reference) out.push(reference.value)
    return out
  }, [data, visible, startAtZero, reference])

  const tableRows = useMemo(
    () => tableRowsFrom(data, xKey, series, labelFormatter),
    [data, xKey, series, labelFormatter],
  )

  const Chart = variant === 'area' ? RcAreaChart : RcLineChart

  return (
    <ChartFrame
      {...frameProps}
      legend={legend}
      series={resolved}
      onToggleSeries={toggle}
      isEmpty={data.length === 0 || series.length === 0}
      tableRows={tableRows}
      valueFormatter={fullFormatter}
      locale={locale}
      tableLabelHeader={xKey}
    >
      {({ size, width, label }) => {
        const points =
          showPoints === 'auto' ? data.length <= 12 && size !== 'xs' : Boolean(showPoints)

        return (
          <ResponsiveContainer width="100%" height="100%">
            <Chart title={label} data={data} margin={DEFAULT_MARGIN[size]} accessibilityLayer>
              {variant === 'area' && !stacked ? (
                <defs>
                  {resolved.map((s, i) => (
                    <linearGradient
                      key={s.key}
                      id={`${gradientId}-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      {/* A wash, never a saturated block: the line carries the
                          series, the fill only says "this is a quantity". */}
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
              ) : null}

              {showGrid ? <CartesianGrid {...gridProps('y')} /> : null}

              <XAxis
                {...categoryAxisProps({
                  dataKey: xKey,
                  size,
                  width,
                  labels,
                  formatter: labelFormatter,
                  hide: !showXAxis,
                })}
              />
              <YAxis
                {...valueAxisProps({
                  size,
                  values,
                  formatter: valueFormatter ?? formatCompact,
                  hide: showYAxis === 'auto' ? size === 'xs' : !showYAxis,
                  domain: startAtZero ? zeroBasedDomain(values) : undefined,
                })}
              />

              <Tooltip
                {...TOOLTIP_DEFAULTS}
                cursor={CROSSHAIR_CURSOR}
                content={
                  <ChartTooltipContent
                    labelFormatter={labelFormatter}
                    valueFormatter={fullFormatter}
                    unit={unit}
                  />
                }
              />

              {reference ? (
                <ReferenceLine
                  y={reference.value}
                  stroke={AXIS_TEXT_COLOR}
                  strokeDasharray="4 4"
                  label={
                    reference.label
                      ? {
                          value: reference.label,
                          position: 'insideTopRight',
                          fill: AXIS_TEXT_COLOR,
                          fontSize: 11,
                        }
                      : undefined
                  }
                />
              ) : null}

              {resolved.map((s, i) =>
                variant === 'area' ? (
                  <Area
                    key={s.key}
                    type={smooth ? 'monotone' : 'linear'}
                    dataKey={s.key}
                    name={s.label}
                    hide={s.hidden}
                    stackId={stacked ? 'stack' : undefined}
                    stroke={s.color}
                    strokeWidth={LINE_WIDTH}
                    // Stacked areas have to be opaque to read as parts of a
                    // whole; the surface-coloured stroke is the gap between
                    // them. An unstacked area stays a wash so overlaps show.
                    fill={stacked ? s.color : `url(#${gradientId}-${i})`}
                    fillOpacity={stacked ? 0.9 : 1}
                    activeDot={{ r: DOT_RADIUS + 1, stroke: CHART_SURFACE, strokeWidth: MARK_GAP }}
                    dot={
                      points
                        ? {
                            r: DOT_RADIUS,
                            fill: s.color,
                            stroke: CHART_SURFACE,
                            strokeWidth: MARK_GAP,
                          }
                        : false
                    }
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ) : (
                  <Line
                    key={s.key}
                    type={smooth ? 'monotone' : 'linear'}
                    dataKey={s.key}
                    name={s.label}
                    hide={s.hidden}
                    stroke={s.color}
                    strokeWidth={LINE_WIDTH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    // The 2px surface ring keeps a marker legible where it
                    // crosses another line, and doubles the hover target.
                    activeDot={{ r: DOT_RADIUS + 1, stroke: CHART_SURFACE, strokeWidth: MARK_GAP }}
                    dot={
                      points
                        ? {
                            r: DOT_RADIUS,
                            fill: s.color,
                            stroke: CHART_SURFACE,
                            strokeWidth: MARK_GAP,
                          }
                        : false
                    }
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        )
      }}
    </ChartFrame>
  )
}

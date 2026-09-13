'use client'

import { useMemo, type ReactNode } from 'react'
import { Cell, Pie, PieChart as RcPieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  ChartFrame,
  useHiddenSeries,
  useResolvedSeries,
  type BaseChartProps,
  type ChartSeries,
} from './chart-frame'
import { ChartTooltipContent, TOOLTIP_DEFAULTS } from './chart-tooltip'
import {
  CHART_SURFACE,
  formatCompact,
  formatFull,
  MARK_GAP,
  seriesColor,
  type ValueFormatter,
} from './theme'

/** One wedge. */
export interface DonutSlice {
  /**
   * Stable identity. The colour follows this, not the slice's position or rank:
   * palette slots are assigned in the sorted order of the keys, so re-sorting
   * `data` by value never swaps two slices' colours.
   */
  key: string
  label?: string
  value: number
  /** Any CSS colour. Defaults to the `--chart-*` slot for the key. */
  color?: string
}

export interface DonutChartProps extends Omit<BaseChartProps, 'legend'> {
  data: DonutSlice[]
  /**
   * `'donut'` (default) keeps the hole for a total; `'pie'` fills it. Prefer
   * the donut: the hole is the only place a part-to-whole chart can state the
   * whole, and reading a wedge against a stated total is far easier than
   * estimating angles.
   */
  variant?: 'donut' | 'pie'
  /** Centre figure. Defaults to the sum of the slices. */
  centerValue?: ReactNode
  /** Caption under the centre figure. */
  centerLabel?: ReactNode
  legend?: 'auto' | 'always' | 'interactive' | false
  /**
   * Show each slice's share of the total in the tooltip, with the total as a
   * footer. Default `true`.
   */
  showShare?: boolean
  /**
   * Formats values. Given, it is used for the centre figure, the tooltip, the
   * wedges' accessible names and the table view. Omitted, the centre figure is
   * compact and everything else is full precision in `locale`.
   */
  valueFormatter?: ValueFormatter
  unit?: string
}

/**
 * Part of a whole.
 *
 * Sound for a handful of slices and nothing more — past about six, wedge
 * angles stop being comparable and a ranked `BarChart` reads better. The
 * component does not enforce that; it is a judgement about the data.
 *
 * ```tsx
 * <DonutChart
 *   title="Jobs by status"
 *   centerLabel="jobs"
 *   data={[
 *     { key: 'done', label: 'Completed', value: 412 },
 *     { key: 'active', label: 'In progress', value: 96 },
 *   ]}
 * />
 * ```
 */
export function DonutChart({
  data,
  variant = 'donut',
  centerValue,
  centerLabel,
  legend = 'auto',
  showShare = true,
  valueFormatter,
  unit,
  locale,
  ...frameProps
}: DonutChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const fullFormatter = useMemo(
    () => valueFormatter ?? ((v: number) => formatFull(v, locale)),
    [valueFormatter, locale],
  )

  // Slot by the key's place among the sorted keys, not by array position.
  const colorFor = useMemo(() => {
    const keys = [...new Set(data.map((slice) => slice.key))].sort()
    const slots = new Map(keys.map((key, i) => [key, i]))
    return (slice: DonutSlice) => seriesColor(slots.get(slice.key) ?? 0, slice.color)
  }, [data])

  // Slices are the series here: each one is its own identity in the legend,
  // the tooltip and the table, exactly like a plotted measure elsewhere.
  const asSeries: ChartSeries[] = useMemo(
    () => data.map((slice) => ({ key: slice.key, label: slice.label, color: colorFor(slice) })),
    [data, colorFor],
  )
  const resolved = useResolvedSeries(asSeries, hidden)
  const visible = useMemo(
    () =>
      data
        .map((slice) => ({
          ...slice,
          label: slice.label ?? slice.key,
          color: colorFor(slice),
          hidden: hidden.has(slice.key),
        }))
        .filter((slice) => !slice.hidden && Number.isFinite(slice.value) && slice.value > 0),
    [data, hidden, colorFor],
  )

  const total = visible.reduce((sum, slice) => sum + slice.value, 0)
  const shareOf = (value: number) => Math.round((value / total) * 100)

  // Recharts draws every wedge as a `role="img"` path and spreads the datum's
  // SVG attributes onto it — so without a label here each wedge is an image
  // with no name, which is announced as nothing and fails axe `svg-img-alt`.
  const wedges = useMemo(
    () =>
      visible.map((slice) => ({
        ...slice,
        // Stated rather than inherited: Recharts 2 makes each wedge an image
        // itself, Recharts 3 does not — and a label on a role-less path is
        // prohibited ARIA there (axe `aria-prohibited-attr`).
        role: 'img',
        'aria-label': `${slice.label}: ${fullFormatter(slice.value)}${unit ?? ''}${
          total > 0 ? `, ${Math.round((slice.value / total) * 100)}%` : ''
        }`,
      })),
    [visible, total, unit, fullFormatter],
  )

  const tableRows = useMemo(
    () =>
      data.map((slice) => ({
        label: slice.label ?? slice.key,
        // One column per slice would be a diagonal of blanks; the table is one
        // row per slice with a single value column instead.
        values: [Number.isFinite(slice.value) ? slice.value : null],
      })),
    [data],
  )

  // The unit goes before the share, so the formatter carries both.
  const tooltipFormatter = (value: number) =>
    `${fullFormatter(value)}${unit ?? ''}${showShare && total > 0 ? ` (${shareOf(value)}%)` : ''}`

  return (
    <ChartFrame
      {...frameProps}
      legend={legend}
      series={resolved}
      onToggleSeries={toggle}
      isEmpty={visible.length === 0}
      tableRows={tableRows}
      tableLabelHeader="Slice"
      tableColumns={['Value']}
      valueFormatter={fullFormatter}
      locale={locale}
    >
      {({ size, height, label }) => {
        // Radii follow the plot box rather than fixed pixels, so the ring keeps
        // its proportions from a phone-width card up to a full-width panel.
        const outer = Math.max(40, Math.min(height / 2 - 8, 160))
        const inner = variant === 'donut' ? Math.round(outer * 0.66) : 0
        const showCenter = variant === 'donut' && inner >= 44 && size !== 'xs'

        return (
          <div className="sui-viz__radial">
            <ResponsiveContainer width="100%" height="100%">
              <RcPieChart title={label} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Tooltip
                  {...TOOLTIP_DEFAULTS}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      valueFormatter={tooltipFormatter}
                      footer={
                        showShare && total > 0 ? (
                          <span>{`of ${fullFormatter(total)}${unit ?? ''} total`}</span>
                        ) : null
                      }
                    />
                  }
                />
                <Pie
                  data={wedges}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={inner}
                  outerRadius={outer}
                  // The wedges are separated by a gap in the surface colour,
                  // the same 2px used between stacked bars.
                  paddingAngle={visible.length > 1 ? 1.5 : 0}
                  stroke={CHART_SURFACE}
                  strokeWidth={MARK_GAP}
                  isAnimationActive={false}
                >
                  {visible.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
              </RcPieChart>
            </ResponsiveContainer>

            {showCenter ? (
              // Plain HTML over the plot rather than an SVG <text>: it wraps,
              // it inherits the kit's type, and it never needs a font-size
              // computed against the viewBox.
              <div className="sui-viz__center" aria-hidden="true">
                <div className="sui-viz__center-value">
                  {centerValue ?? (valueFormatter ?? formatCompact)(total)}
                </div>
                {centerLabel ? <div className="sui-viz__center-label">{centerLabel}</div> : null}
              </div>
            ) : null}
          </div>
        )
      }}
    </ChartFrame>
  )
}

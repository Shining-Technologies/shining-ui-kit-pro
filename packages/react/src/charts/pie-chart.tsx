import { useMemo, type CSSProperties, type ReactNode, type SVGProps } from 'react'
import { cn } from '../lib/cn'
import {
  ChartContainer,
  describeTooltip,
  seriesColor,
  useActivePoint,
  type ChartTableProps,
  type TooltipState,
} from './chart-frame'
import {
  arcPath,
  extent,
  formatCompact,
  linePath,
  linearScale,
  smoothPath,
  type Point,
} from './scale'

export interface PieSlice {
  key: string
  label?: string
  value: number
  color?: string
}

export interface PieChartProps extends ChartTableProps {
  data: PieSlice[]
  height?: number
  className?: string
  /**
   * 0 is a solid pie, 0.6 a donut. A donut is easier to read — the eye
   * compares arc lengths better than it compares wedge areas — and the hole
   * gives the total somewhere to live.
   */
  innerRadius?: number
  /** Shown in the middle of a donut. */
  centerLabel?: ReactNode
  centerCaption?: ReactNode
  legend?: boolean
  valueFormatter?: (value: number) => string
  emptyMessage?: ReactNode
  /**
   * The chart's accessible name. Defaults to every slice with its share —
   * "Pie chart: Completed 81%, In progress 19%." — which is the whole of what
   * the drawing says.
   */
  ariaLabel?: string
}

/** A slice's contribution: negative, `NaN` and infinite values count as nothing. */
const sliceValue = (slice: PieSlice) =>
  Number.isFinite(slice.value) && slice.value > 0 ? slice.value : 0

export function PieChart({
  data,
  height = 220,
  className,
  innerRadius = 0.6,
  centerLabel,
  centerCaption,
  legend = true,
  valueFormatter = formatCompact,
  emptyMessage,
  ariaLabel,
  showTableToggle,
  tableToggleLabel,
}: PieChartProps) {
  // One `NaN` slice used to make the total `NaN`, which failed every guard
  // below and drew no slices at all — the valid ones included.
  const total = useMemo(() => data.reduce((sum, slice) => sum + sliceValue(slice), 0), [data])

  // Only the slices that are drawn can be reached: an empty one has no arc
  // to highlight. Up/Down step too, because a circle has no "left".
  const indices = useMemo(
    () => data.flatMap((slice, i) => (sliceValue(slice) > 0 ? [i] : [])),
    [data],
  )
  const point = useActivePoint(indices, { upDown: true })
  const active = point.index

  const label = useMemo(() => {
    if (ariaLabel) return ariaLabel
    const parts = data
      .filter((slice) => sliceValue(slice) > 0)
      .map(
        (slice) =>
          `${slice.label ?? slice.key} ${Math.round((sliceValue(slice) / (total || 1)) * 100)}%`,
      )
    return `${innerRadius > 0 ? 'Donut chart' : 'Pie chart'}: ${parts.join(', ')}.`
  }, [ariaLabel, data, total, innerRadius])

  const series = useMemo(
    () => data.map((slice) => ({ key: slice.key, label: slice.label, color: slice.color })),
    [data],
  )

  const tooltip: TooltipState | null =
    active === null || !data[active]
      ? null
      : {
          x: '50%',
          y: 8,
          label: data[active]!.label ?? data[active]!.key,
          rows: [
            {
              color: seriesColor(series[active]!, active),
              label: total > 0 ? `${((sliceValue(data[active]!) / total) * 100).toFixed(1)}%` : '—',
              value: valueFormatter(data[active]!.value),
            },
          ],
        }

  return (
    <ChartContainer
      className={className}
      height={height}
      series={series}
      legend={legend}
      tooltip={tooltip}
      announcement={point.keyboard ? describeTooltip(tooltip) : null}
      isEmpty={total <= 0}
      emptyMessage={emptyMessage}
      showTableToggle={showTableToggle}
      tableToggleLabel={tableToggleLabel}
      table={
        showTableToggle
          ? {
              caption: label,
              labelHeader: 'Slice',
              columns: ['Value', 'Share (%)'],
              rows: indices.map((i) => ({
                label: data[i]!.label ?? data[i]!.key,
                values: [
                  sliceValue(data[i]!),
                  total > 0 ? Math.round((sliceValue(data[i]!) / total) * 1000) / 10 : null,
                ],
              })),
            }
          : undefined
      }
    >
      {({ width }) => {
        const size = Math.min(width, height)
        const cx = width / 2
        const cy = height / 2
        const outer = size / 2 - 4
        const inner = outer * Math.min(0.9, Math.max(0, innerRadius))

        // Start at twelve o'clock: a chart that begins at three reads as
        // rotated, because every clock and every pie chart people know does not.
        let angle = -Math.PI / 2

        return (
          <svg
            className="sui-chart__svg"
            width={width}
            height={height}
            // An application, as the cartesian charts are: it takes the arrow keys.
            role="application"
            aria-label={label}
            {...point.keyboardProps}
            onMouseLeave={() => point.leave()}
          >
            {data.map((slice, i) => {
              const value = sliceValue(slice)
              const sweep = total > 0 ? (value / total) * Math.PI * 2 : 0
              const start = angle
              angle += sweep
              if (sweep <= 0) return null

              return (
                <path
                  key={slice.key}
                  className="sui-chart__slice"
                  style={{ '--sui-series-color': seriesColor(series[i]!, i) } as CSSProperties}
                  d={arcPath(cx, cy, outer, inner, start, angle)}
                  opacity={active === null || active === i ? 1 : 0.4}
                  onMouseEnter={() => point.hover(i)}
                />
              )
            })}

            {inner > 0 && (centerLabel !== undefined || centerCaption !== undefined) && (
              <g>
                {centerLabel !== undefined && (
                  <text className="sui-chart__donut-label" x={cx} y={cy - (centerCaption ? 2 : -6)}>
                    {centerLabel}
                  </text>
                )}
                {centerCaption !== undefined && (
                  <text className="sui-chart__donut-caption" x={cx} y={cy + 16}>
                    {centerCaption}
                  </text>
                )}
              </g>
            )}
          </svg>
        )
      }}
    </ChartContainer>
  )
}

export interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  data: number[]
  /** Any CSS colour; defaults to the first chart token. */
  color?: string
  /** Fill under the line. */
  area?: boolean
  smooth?: boolean
  strokeWidth?: number
  height?: number
}

/**
 * A trend, no axes.
 *
 * Sized in its own `viewBox` rather than measured: a sparkline lives inside a
 * table cell or a stat card and has to render correctly on the first paint,
 * where a measured chart would flash empty. The distortion that a stretched
 * viewBox causes is invisible here because there is no type to stretch.
 */
export function Sparkline({
  data,
  color,
  area = false,
  smooth = true,
  strokeWidth = 1.5,
  height = 28,
  className,
  style,
  ...props
}: SparklineProps) {
  const W = 100
  const H = 32

  const points = useMemo<Point[]>(() => {
    const range = extent(data)
    if (!range) return []
    const x = linearScale([0, Math.max(1, data.length - 1)], [1, W - 1])
    // Padded by the stroke width so the extremes are not clipped in half.
    const y = linearScale(range, [H - strokeWidth, strokeWidth])
    // A non-finite reading is skipped rather than drawn: one `NaN` used to
    // turn the whole path into `MNaN,NaN …` and the line vanished.
    const out: Point[] = []
    data.forEach((value, i) => {
      if (Number.isFinite(value)) out.push({ x: x(i), y: y(value) })
    })
    return out
  }, [data, strokeWidth])

  if (points.length === 0) return null

  // One reading has no trend to draw — a lone `M` point paints nothing — so
  // show it as a level line across the box at its height.
  const d =
    points.length === 1
      ? `M1,${points[0]!.y} L${W - 1},${points[0]!.y}`
      : smooth
        ? smoothPath(points)
        : linePath(points)

  return (
    <svg
      className={cn('sui-chart__sparkline', className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      height={height}
      aria-hidden="true"
      {...props}
      style={
        {
          '--sui-series-color': color ?? 'var(--sui-chart-1)',
          // Inline, not only the attribute: `.sui-chart__sparkline` sets a CSS
          // height, and CSS outranks a presentation attribute — so `height`
          // was silently ignored whenever the stylesheet was loaded.
          height,
          ...style,
        } as CSSProperties
      }
    >
      {area && (
        <path
          className="sui-chart__area"
          d={`${d} L${points[points.length - 1]!.x},${H} L${points[0]!.x},${H} Z`}
        />
      )}
      <path className="sui-chart__line" d={d} strokeWidth={strokeWidth} />
    </svg>
  )
}

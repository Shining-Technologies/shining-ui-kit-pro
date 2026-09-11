import { useMemo, useState, type CSSProperties, type ReactNode, type SVGProps } from 'react'
import { cn } from '../lib/cn'
import { ChartContainer, seriesColor, type TooltipState } from './chart-frame'
import { arcPath, formatCompact, linePath, linearScale, smoothPath, type Point } from './scale'

export interface PieSlice {
  key: string
  label?: string
  value: number
  color?: string
}

export interface PieChartProps {
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
}

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
}: PieChartProps) {
  const [active, setActive] = useState<number | null>(null)

  const total = useMemo(
    () => data.reduce((sum, slice) => sum + Math.max(0, slice.value), 0),
    [data],
  )

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
              label: total > 0 ? `${((data[active]!.value / total) * 100).toFixed(1)}%` : '—',
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
      isEmpty={total <= 0}
      emptyMessage={emptyMessage}
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
            role="img"
            onMouseLeave={() => setActive(null)}
          >
            {data.map((slice, i) => {
              const value = Math.max(0, slice.value)
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
                  onMouseEnter={() => setActive(i)}
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
  ...props
}: SparklineProps) {
  const W = 100
  const H = 32

  const points = useMemo<Point[]>(() => {
    if (data.length === 0) return []
    const min = Math.min(...data)
    const max = Math.max(...data)
    const x = linearScale([0, Math.max(1, data.length - 1)], [1, W - 1])
    // Padded by the stroke width so the extremes are not clipped in half.
    const y = linearScale([min, max], [H - strokeWidth, strokeWidth])
    return data.map((value, i) => ({ x: x(i), y: y(value) }))
  }, [data, strokeWidth])

  if (points.length === 0) return null

  const d = smooth ? smoothPath(points) : linePath(points)

  return (
    <svg
      className={cn('sui-chart__sparkline', className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      height={height}
      aria-hidden="true"
      style={{ '--sui-series-color': color ?? 'var(--sui-chart-1)' } as CSSProperties}
      {...props}
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

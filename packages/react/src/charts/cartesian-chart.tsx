import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ChartContainer,
  DEFAULT_MARGIN,
  seriesColor,
  useHiddenSeries,
  type ChartDatum,
  type ChartMargin,
  type ChartSeries,
  type TooltipState,
} from './chart-frame'
import {
  areaPath,
  formatCompact,
  linePath,
  linearScale,
  niceDomain,
  smoothPath,
  ticks,
  type Point,
} from './scale'

export interface CartesianChartProps {
  data: ChartDatum[]
  /** Key holding the category or time label for each datum. */
  xKey: string
  series: ChartSeries[]
  height?: number
  margin?: Partial<ChartMargin>
  className?: string
  legend?: boolean | 'interactive'
  /** Force the value axis to start at zero even when the data does not. */
  startAtZero?: boolean
  showGrid?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  emptyMessage?: ReactNode
}

const num = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Everything the line, area and bar charts share: the value domain, the axes,
 * the grid, and the pointer tracking that drives the tooltip.
 */
function useCartesian(
  data: ChartDatum[],
  xKey: string,
  series: ChartSeries[],
  hidden: Set<string>,
  startAtZero: boolean,
  stacked = false,
) {
  const visible = useMemo(() => series.filter((s) => !hidden.has(s.key)), [series, hidden])

  const domain = useMemo<[number, number]>(() => {
    let min = Infinity
    let max = -Infinity
    for (const datum of data) {
      if (stacked) {
        let positive = 0
        let negative = 0
        for (const s of visible) {
          const v = num(datum[s.key]) ?? 0
          if (v >= 0) positive += v
          else negative += v
        }
        min = Math.min(min, negative)
        max = Math.max(max, positive)
      } else {
        for (const s of visible) {
          const v = num(datum[s.key])
          if (v === null) continue
          min = Math.min(min, v)
          max = Math.max(max, v)
        }
      }
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    if (startAtZero) min = Math.min(0, min)
    return niceDomain(min, max)
  }, [data, visible, startAtZero, stacked])

  const labels = useMemo(() => data.map((d) => String(d[xKey] ?? '')), [data, xKey])

  return { visible, domain, labels }
}

/** Show every label that fits; past that, thin them evenly. */
function labelStride(count: number, width: number): number {
  const perLabel = 56
  return Math.max(1, Math.ceil(count / Math.max(1, Math.floor(width / perLabel))))
}

/* ------------------------------------------------------------ line / area */

export interface LineChartProps extends CartesianChartProps {
  /** Fill the space under each line. */
  area?: boolean
  /** Curve through the points instead of joining them with straight segments. */
  smooth?: boolean
  /** Draw a marker at every data point. */
  showPoints?: boolean
}

/**
 * A line or area chart.
 *
 * One component for both because an area chart *is* a line chart with the space
 * beneath it filled — splitting them would duplicate the axes, the domain
 * calculation and the pointer handling to change one path.
 */
export function LineChart({
  data,
  xKey,
  series,
  height = 220,
  margin,
  className,
  legend = 'interactive',
  startAtZero = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  area = false,
  smooth = false,
  showPoints = false,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  emptyMessage,
}: LineChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const [active, setActive] = useState<number | null>(null)
  const { visible, domain, labels } = useCartesian(data, xKey, series, hidden, startAtZero)

  const m = { ...DEFAULT_MARGIN, ...margin }

  return (
    <ChartContainer
      className={className}
      height={height}
      series={series}
      legend={legend}
      hidden={hidden}
      onToggleSeries={toggle}
      isEmpty={data.length === 0 || series.length === 0}
      emptyMessage={emptyMessage}
      tooltip={buildTooltip(active)}
    >
      {({ width }) => {
        const plotW = Math.max(0, width - m.left - m.right)
        const plotH = Math.max(0, height - m.top - m.bottom)
        const x = linearScale([0, Math.max(1, data.length - 1)], [m.left, m.left + plotW])
        const y = linearScale(domain, [m.top + plotH, m.top])
        const yTicks = ticks(domain, Math.max(2, Math.round(plotH / 44)))
        const stride = labelStride(labels.length, plotW)

        return (
          <svg
            className="sui-chart__svg"
            width={width}
            height={height}
            role="img"
            onMouseLeave={() => setActive(null)}
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              const px = event.clientX - box.left
              // Nearest index rather than a hit area per point: the pointer is
              // never "between" two points, so the tooltip never blinks out.
              const index = Math.round(((px - m.left) / (plotW || 1)) * (data.length - 1))
              setActive(index >= 0 && index < data.length ? index : null)
            }}
          >
            {showGrid && (
              <g className="sui-chart__grid">
                {yTicks.map((t) => (
                  <line key={t} x1={m.left} x2={m.left + plotW} y1={y(t)} y2={y(t)} />
                ))}
              </g>
            )}

            {showYAxis && (
              <g className="sui-chart__axis">
                {yTicks.map((t) => (
                  <text key={t} x={m.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                    {valueFormatter(t)}
                  </text>
                ))}
              </g>
            )}

            {showXAxis && (
              <g className="sui-chart__axis">
                {labels.map((label, i) =>
                  i % stride === 0 ? (
                    <text key={i} x={x(i)} y={height - m.bottom + 16} textAnchor="middle">
                      {labelFormatter(label)}
                    </text>
                  ) : null,
                )}
              </g>
            )}

            {active !== null && (
              <line
                className="sui-chart__cursor"
                x1={x(active)}
                x2={x(active)}
                y1={m.top}
                y2={m.top + plotH}
              />
            )}

            {visible.map((s) => {
              const index = series.indexOf(s)
              const color = seriesColor(s, index)
              const points: Point[] = []
              data.forEach((datum, i) => {
                const value = num(datum[s.key])
                if (value !== null) points.push({ x: x(i), y: y(value) })
              })

              return (
                <g
                  key={s.key}
                  className="sui-chart__series"
                  style={{ '--sui-series-color': color } as CSSProperties}
                >
                  {area && points.length > 1 && (
                    <path className="sui-chart__area" d={areaPath(points, m.top + plotH, smooth)} />
                  )}
                  <path
                    className="sui-chart__line"
                    d={smooth ? smoothPath(points) : linePath(points)}
                  />
                  {(showPoints || points.length === 1) &&
                    points.map((p, i) => (
                      <circle key={i} className="sui-chart__point" cx={p.x} cy={p.y} r={3} />
                    ))}
                  {active !== null && points[active] && (
                    <circle
                      className="sui-chart__point"
                      cx={points[active]!.x}
                      cy={points[active]!.y}
                      r={4.5}
                    />
                  )}
                </g>
              )
            })}
          </svg>
        )
      }}
    </ChartContainer>
  )

  function buildTooltip(index: number | null): TooltipState | null {
    if (index === null || !data[index]) return null
    return {
      ...tooltipPosition(index, data.length, { ...DEFAULT_MARGIN, ...margin }),
      label: labelFormatter(labels[index] ?? ''),
      rows: visible.map((s) => ({
        color: seriesColor(s, series.indexOf(s)),
        label: s.label ?? s.key,
        value: valueFormatter(num(data[index]![s.key]) ?? 0),
      })),
    }
  }
}

/**
 * Where the tooltip sits.
 *
 * Computed from the index rather than the raw pointer position so it snaps to
 * the highlighted point, and clamped so the first and last points do not push
 * it off the side of the chart.
 */
function tooltipPosition(index: number, count: number, m: ChartMargin): { x: string; y: number } {
  const fraction = count <= 1 ? 0.5 : index / (count - 1)
  // Expressed against the container's own width so it stays correct through a
  // resize without the chart having to re-measure and re-render the tooltip.
  return {
    x: `calc(${m.left}px + (100% - ${m.left + m.right}px) * ${fraction})`,
    y: m.top + 8,
  }
}

/* ------------------------------------------------------------------- bars */

export interface BarChartProps extends CartesianChartProps {
  /** Stack the series instead of placing them side by side. */
  stacked?: boolean
  /** Draw bars along the x-axis instead of up the y-axis. */
  horizontal?: boolean
  /** 0–1: how much of each slot is bar rather than gap. */
  barRatio?: number
}

export function BarChart({
  data,
  xKey,
  series,
  height = 220,
  margin,
  className,
  legend = 'interactive',
  startAtZero = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  stacked = false,
  barRatio = 0.7,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  emptyMessage,
}: BarChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const [active, setActive] = useState<number | null>(null)
  const { visible, domain, labels } = useCartesian(data, xKey, series, hidden, startAtZero, stacked)

  const m = { ...DEFAULT_MARGIN, ...margin }

  return (
    <ChartContainer
      className={className}
      height={height}
      series={series}
      legend={legend}
      hidden={hidden}
      onToggleSeries={toggle}
      isEmpty={data.length === 0 || series.length === 0}
      emptyMessage={emptyMessage}
      tooltip={
        active === null || !data[active]
          ? null
          : {
              ...tooltipPosition(active, data.length, m),
              label: labelFormatter(labels[active] ?? ''),
              rows: visible.map((s) => ({
                color: seriesColor(s, series.indexOf(s)),
                label: s.label ?? s.key,
                value: valueFormatter(num(data[active]![s.key]) ?? 0),
              })),
            }
      }
    >
      {({ width }) => {
        const plotW = Math.max(0, width - m.left - m.right)
        const plotH = Math.max(0, height - m.top - m.bottom)
        const y = linearScale(domain, [m.top + plotH, m.top])
        const yTicks = ticks(domain, Math.max(2, Math.round(plotH / 44)))
        const stride = labelStride(labels.length, plotW)

        const slot = plotW / Math.max(1, data.length)
        const bandWidth = slot * barRatio
        const barWidth = stacked ? bandWidth : bandWidth / Math.max(1, visible.length)
        const zero = y(Math.max(domain[0], Math.min(0, domain[1])))

        return (
          <svg className="sui-chart__svg" width={width} height={height} role="img">
            {showGrid && (
              <g className="sui-chart__grid">
                {yTicks.map((t) => (
                  <line key={t} x1={m.left} x2={m.left + plotW} y1={y(t)} y2={y(t)} />
                ))}
              </g>
            )}

            {showYAxis && (
              <g className="sui-chart__axis">
                {yTicks.map((t) => (
                  <text key={t} x={m.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                    {valueFormatter(t)}
                  </text>
                ))}
              </g>
            )}

            {data.map((datum, i) => {
              const slotStart = m.left + i * slot + (slot - bandWidth) / 2
              let stackTop = 0
              let stackBottom = 0

              return (
                <g
                  key={i}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive((current) => (current === i ? null : current))}
                >
                  {/* A full-height target so the tooltip appears anywhere in
                      the column, not only over the bar itself. */}
                  <rect
                    x={m.left + i * slot}
                    y={m.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                  />
                  {visible.map((s, si) => {
                    const value = num(datum[s.key]) ?? 0
                    const color = seriesColor(s, series.indexOf(s))

                    let top: number
                    let barHeight: number
                    if (stacked) {
                      const base = value >= 0 ? stackTop : stackBottom
                      const next = base + value
                      top = y(Math.max(base, next))
                      barHeight = Math.abs(y(next) - y(base))
                      if (value >= 0) stackTop = next
                      else stackBottom = next
                    } else {
                      top = value >= 0 ? y(value) : zero
                      barHeight = Math.abs(y(value) - zero)
                    }

                    return (
                      <rect
                        key={s.key}
                        className="sui-chart__bar"
                        style={{ '--sui-series-color': color } as CSSProperties}
                        x={slotStart + (stacked ? 0 : si * barWidth)}
                        y={top}
                        width={Math.max(1, barWidth - (stacked ? 0 : 1))}
                        height={Math.max(0, barHeight)}
                        rx={Math.min(3, barWidth / 3)}
                        opacity={active === null || active === i ? 1 : 0.45}
                      />
                    )
                  })}
                </g>
              )
            })}

            {showXAxis && (
              <g className="sui-chart__axis">
                {labels.map((label, i) =>
                  i % stride === 0 ? (
                    <text
                      key={i}
                      x={m.left + i * slot + slot / 2}
                      y={height - m.bottom + 16}
                      textAnchor="middle"
                    >
                      {labelFormatter(label)}
                    </text>
                  ) : null,
                )}
              </g>
            )}
          </svg>
        )
      }}
    </ChartContainer>
  )
}

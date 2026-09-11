import { useMemo, type CSSProperties, type ReactNode } from 'react'
import {
  ChartContainer,
  DEFAULT_MARGIN,
  describeTooltip,
  seriesColor,
  useActivePoint,
  useHiddenSeries,
  type ChartDatum,
  type ChartMargin,
  type ChartSeries,
  type ChartTableData,
  type ChartTableProps,
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

export interface CartesianChartProps extends ChartTableProps {
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
  /**
   * The chart's accessible name. The drawing is one image to assistive
   * technology, so without a name it is announced as nothing at all. Defaults
   * to a summary of what is plotted — pass a sentence saying what it *shows*.
   */
  ariaLabel?: string
}

const num = (value: unknown): number | null => {
  // `Number(null)` and `Number('')` are 0, which would plot a missing reading
  // as a real zero; only numbers and numeric strings count as values.
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** What a tooltip shows for a datum with no reading: a gap, not a zero. */
const MISSING = '—'

/** "Line chart of Bookings and Completed, 12 points from Jan to Dec." */
function describeCartesian(
  kind: string,
  series: ChartSeries[],
  labels: string[],
  labelFormatter: (label: string) => string,
): string {
  const names = series.map((s) => s.label ?? s.key)
  const list =
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
  const count = `${labels.length} ${labels.length === 1 ? 'point' : 'points'}`
  const first = labels[0]
  const last = labels[labels.length - 1]
  const range =
    first === undefined || last === undefined
      ? ''
      : labels.length === 1
        ? ` at ${labelFormatter(first)}`
        : ` from ${labelFormatter(first)} to ${labelFormatter(last)}`
  return `${kind} of ${list ?? 'no series'}, ${count}${range}.`
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
    // Zero on whichever side the data is not: all-negative data needs it at
    // the top, or the value nearest zero is drawn as a zero-height bar.
    if (startAtZero) {
      min = Math.min(0, min)
      max = Math.max(0, max)
    }
    return niceDomain(min, max)
  }, [data, visible, startAtZero, stacked])

  const labels = useMemo(() => data.map((d) => String(d[xKey] ?? '')), [data, xKey])

  // Every datum is a stop for the keyboard, gaps included: the tooltip says
  // "—" there, which is the reading.
  const indices = useMemo(() => data.map((_, i) => i), [data])

  return { visible, domain, labels, indices }
}

/** The table view: a row per datum, a column per series — hidden ones too. */
function cartesianTable(
  data: ChartDatum[],
  xKey: string,
  series: ChartSeries[],
  labels: string[],
  labelFormatter: (label: string) => string,
  caption: string,
): ChartTableData {
  return {
    caption,
    labelHeader: xKey,
    columns: series.map((s) => s.label ?? s.key),
    rows: data.map((datum, i) => ({
      label: labelFormatter(labels[i] ?? ''),
      values: series.map((s) => num(datum[s.key])),
    })),
  }
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
  /**
   * Join the line across a missing reading instead of breaking it there.
   * Default `false`: a gap in the data is a gap in the line, so a missing
   * month never reads as a straight-line guess between its neighbours.
   */
  connectNulls?: boolean
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
  connectNulls = false,
  valueFormatter = formatCompact,
  labelFormatter = (l) => l,
  emptyMessage,
  ariaLabel,
  showTableToggle,
  tableToggleLabel,
}: LineChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const { visible, domain, labels, indices } = useCartesian(
    data,
    xKey,
    series,
    hidden,
    startAtZero,
  )
  const point = useActivePoint(indices)
  const active = point.index

  const m = { ...DEFAULT_MARGIN, ...margin }
  const label =
    ariaLabel ??
    describeCartesian(area ? 'Area chart' : 'Line chart', series, labels, labelFormatter)
  const tooltip = buildTooltip(active)

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
      tooltip={tooltip}
      announcement={point.keyboard ? describeTooltip(tooltip) : null}
      showTableToggle={showTableToggle}
      tableToggleLabel={tableToggleLabel}
      table={
        showTableToggle
          ? cartesianTable(data, xKey, series, labels, labelFormatter, label)
          : undefined
      }
    >
      {({ width }) => {
        const plotW = Math.max(0, width - m.left - m.right)
        const plotH = Math.max(0, height - m.top - m.bottom)
        // One datum has no span to spread across; centre it, which is also
        // where its tooltip is placed.
        const x =
          data.length === 1
            ? () => m.left + plotW / 2
            : linearScale([0, Math.max(1, data.length - 1)], [m.left, m.left + plotW])
        const y = linearScale(domain, [m.top + plotH, m.top])
        const yTicks = ticks(domain, Math.max(2, Math.round(plotH / 44)))
        const stride = labelStride(labels.length, plotW)

        return (
          // An application, not an image: that is what makes a screen reader
          // hand the arrow keys to the chart instead of reading on past it.
          <svg
            className="sui-chart__svg"
            width={width}
            height={height}
            role="application"
            aria-label={label}
            {...point.keyboardProps}
            onMouseLeave={() => point.leave()}
            onMouseMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              const px = event.clientX - box.left
              // Nearest index rather than a hit area per point: the pointer is
              // never "between" two points, so the tooltip never blinks out.
              const index = Math.round(((px - m.left) / (plotW || 1)) * (data.length - 1))
              point.hover(index >= 0 && index < data.length ? index : null)
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
              // Runs of consecutive readings. A missing one ends the run, so the
              // line — and the area under it — breaks there instead of drawing
              // a straight guess across it, unless the caller asked for that.
              const segments: Point[][] = []
              let run: Point[] = []
              // Indexed by datum, not by drawn point: with a gap in the data the
              // two diverge, and the hover marker landed on the wrong reading.
              const byIndex: (Point | undefined)[] = []
              data.forEach((datum, i) => {
                const value = num(datum[s.key])
                if (value === null) {
                  if (!connectNulls && run.length) {
                    segments.push(run)
                    run = []
                  }
                  return
                }
                const p = { x: x(i), y: y(value) }
                run.push(p)
                byIndex[i] = p
              })
              if (run.length) segments.push(run)
              const activePoint = active === null ? undefined : byIndex[active]
              // A reading with a gap on both sides is a run of one: a line of no
              // length, which draws nothing. It gets a marker so it is not lost.
              const marked = showPoints ? segments.flat() : segments.filter((r) => r.length === 1).flat()

              return (
                <g
                  key={s.key}
                  className="sui-chart__series"
                  style={{ '--sui-series-color': color } as CSSProperties}
                >
                  {area && segments.some((r) => r.length > 1) && (
                    <path
                      className="sui-chart__area"
                      d={segments
                        .filter((r) => r.length > 1)
                        .map((r) => areaPath(r, m.top + plotH, smooth))
                        .join(' ')}
                    />
                  )}
                  <path
                    className="sui-chart__line"
                    d={segments.map((r) => (smooth ? smoothPath(r) : linePath(r))).join(' ')}
                  />
                  {marked.map((p, i) => (
                    <circle key={i} className="sui-chart__point" cx={p.x} cy={p.y} r={3} />
                  ))}
                  {activePoint && (
                    <circle
                      className="sui-chart__point"
                      cx={activePoint.x}
                      cy={activePoint.y}
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
      rows: visible.map((s) => tooltipRow(s, series, data[index]!, valueFormatter)),
    }
  }
}

function tooltipRow(
  s: ChartSeries,
  series: ChartSeries[],
  datum: ChartDatum,
  valueFormatter: (value: number) => string,
) {
  const value = num(datum[s.key])
  return {
    color: seriesColor(s, series.indexOf(s)),
    label: s.label ?? s.key,
    value: value === null ? MISSING : valueFormatter(value),
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
  /**
   * Draw bars along the x-axis instead of up the y-axis.
   *
   * **Not implemented yet — currently ignored.** For horizontal bars use
   * `BarChart` from `@shining-technologies/ui-kit-react/recharts` with `orientation="bars"`.
   */
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
  ariaLabel,
  showTableToggle,
  tableToggleLabel,
}: BarChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const { visible, domain, labels, indices } = useCartesian(
    data,
    xKey,
    series,
    hidden,
    startAtZero,
    stacked,
  )
  const point = useActivePoint(indices)
  const active = point.index

  const m = { ...DEFAULT_MARGIN, ...margin }
  const label =
    ariaLabel ??
    describeCartesian(stacked ? 'Stacked bar chart' : 'Bar chart', series, labels, labelFormatter)
  const tooltip: TooltipState | null =
    active === null || !data[active]
      ? null
      : {
          ...tooltipPosition(active, data.length, m),
          label: labelFormatter(labels[active] ?? ''),
          rows: visible.map((s) => tooltipRow(s, series, data[active]!, valueFormatter)),
        }

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
      tooltip={tooltip}
      announcement={point.keyboard ? describeTooltip(tooltip) : null}
      showTableToggle={showTableToggle}
      tableToggleLabel={tableToggleLabel}
      table={
        showTableToggle
          ? cartesianTable(data, xKey, series, labels, labelFormatter, label)
          : undefined
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
          <svg
            className="sui-chart__svg"
            width={width}
            height={height}
            role="application"
            aria-label={label}
            {...point.keyboardProps}
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

            {data.map((datum, i) => {
              const slotStart = m.left + i * slot + (slot - bandWidth) / 2
              let stackTop = 0
              let stackBottom = 0

              return (
                <g key={i} onMouseEnter={() => point.hover(i)} onMouseLeave={() => point.leave(i)}>
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

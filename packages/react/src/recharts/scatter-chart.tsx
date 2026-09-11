import { useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RcScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { finiteExtent, gridProps, valueAxisProps } from './axes'
import {
  ChartFrame,
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
  formatCompact,
  formatFull,
  MARK_GAP,
  TICK_FONT_SIZE,
  type ValueFormatter,
} from './theme'

export interface ScatterChartProps extends BaseChartProps {
  data: ChartDatum[]
  /** The numeric key on the horizontal axis. */
  xKey: string
  /** The numeric key on the vertical axis. */
  yKey: string
  /**
   * Split the points into series by this key's value — region, plan, channel.
   * Each distinct value takes its own palette slot and legend entry.
   */
  groupKey?: string
  /** A third numeric measure, encoded as the point's *area*. */
  sizeKey?: string
  /** Names each point in the tooltip. */
  labelKey?: string
  xLabel?: string
  yLabel?: string
  showGrid?: boolean
  xFormatter?: ValueFormatter
  yFormatter?: ValueFormatter
}

const UNGROUPED = '__all__'

/**
 * Whether two measures move together.
 *
 * The one form here that answers a question a bar or a line cannot: a trend
 * chart shows both measures against time and leaves the reader to correlate
 * them by eye, which is exactly the comparison people get wrong.
 *
 * ```tsx
 * <ScatterChart
 *   title="Quote value against time to close"
 *   data={quotes}
 *   xKey="daysToClose"
 *   yKey="value"
 *   groupKey="channel"
 *   labelKey="client"
 * />
 * ```
 */
export function ScatterChart({
  data,
  xKey,
  yKey,
  groupKey,
  sizeKey,
  labelKey,
  xLabel,
  yLabel,
  showGrid = true,
  xFormatter = formatCompact,
  yFormatter = formatCompact,
  legend = 'interactive',
  ...frameProps
}: ScatterChartProps) {
  const [hidden, toggle] = useHiddenSeries()

  const groups = useMemo(() => {
    const buckets = new Map<string, ChartDatum[]>()
    for (const datum of data) {
      const raw = groupKey ? datum[groupKey] : UNGROUPED
      const key = raw === null || raw === undefined ? UNGROUPED : String(raw)
      const bucket = buckets.get(key)
      if (bucket) bucket.push(datum)
      else buckets.set(key, [datum])
    }
    return [...buckets.entries()].map(([key, rows]) => ({ key, rows }))
  }, [data, groupKey])

  const asSeries: ChartSeries[] = useMemo(
    () =>
      groups.map((group) => ({
        key: group.key,
        label: group.key === UNGROUPED ? (yLabel ?? yKey) : group.key,
      })),
    [groups, yLabel, yKey],
  )
  const resolved = useResolvedSeries(asSeries, hidden)

  const xValues = useMemo(() => numbersAt(data, xKey), [data, xKey])
  const yValues = useMemo(() => numbersAt(data, yKey), [data, yKey])
  const sizeRange = useMemo(() => {
    if (!sizeKey) return undefined
    return finiteExtent(numbersAt(data, sizeKey)) ?? undefined
  }, [data, sizeKey])

  const tableRows = useMemo(
    () =>
      data.map((datum, i) => ({
        label: labelKey ? String(datum[labelKey] ?? i + 1) : String(i + 1),
        values: [
          numberOrNull(datum[xKey]),
          numberOrNull(datum[yKey]),
          ...(sizeKey ? [numberOrNull(datum[sizeKey])] : []),
        ],
      })),
    [data, xKey, yKey, sizeKey, labelKey],
  )

  return (
    <ChartFrame
      {...frameProps}
      legend={groupKey ? legend : false}
      series={resolved}
      onToggleSeries={toggle}
      isEmpty={data.length === 0}
      tableRows={tableRows}
      tableLabelHeader={labelKey ?? '#'}
      tableColumns={[xLabel ?? xKey, yLabel ?? yKey, ...(sizeKey ? [sizeKey] : [])]}
      valueFormatter={formatFull}
    >
      {({ size, label }) => {
        // Axis titles are the first thing to go: on a narrow card the plot
        // needs the pixels more than the reader needs the axis named twice
        // (the card's title and the tooltip both carry it).
        const showAxisLabels = size !== 'xs' && size !== 'sm'
        const margin = DEFAULT_MARGIN[size]

        return (
          <ResponsiveContainer width="100%" height="100%">
            <RcScatterChart
              title={label}
              margin={{
                ...margin,
                bottom: showAxisLabels && xLabel ? margin.bottom + 18 : margin.bottom,
                left: showAxisLabels && yLabel ? margin.left + 10 : margin.left,
              }}
              accessibilityLayer
            >
              {showGrid ? <CartesianGrid {...gridProps('both')} /> : null}

              <XAxis
                {...valueAxisProps({
                  size,
                  values: xValues,
                  formatter: xFormatter,
                  horizontal: true,
                })}
                dataKey={xKey}
                name={xLabel ?? xKey}
                label={
                  showAxisLabels && xLabel
                    ? {
                        value: xLabel,
                        position: 'insideBottom',
                        offset: -12,
                        fill: AXIS_TEXT_COLOR,
                        fontSize: TICK_FONT_SIZE,
                      }
                    : undefined
                }
              />
              <YAxis
                {...valueAxisProps({ size, values: yValues, formatter: yFormatter })}
                dataKey={yKey}
                name={yLabel ?? yKey}
                label={
                  showAxisLabels && yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: 'insideLeft',
                        fill: AXIS_TEXT_COLOR,
                        fontSize: TICK_FONT_SIZE,
                      }
                    : undefined
                }
              />
              {/*
                Area, not radius: a circle whose *radius* is the value makes a
                doubled figure look four times as big. Recharts scales `range`
                as area, so the range is given in px² and the smallest point
                stays big enough to hover.
              */}
              {sizeKey ? (
                <ZAxis dataKey={sizeKey} range={[64, 640]} domain={sizeRange} name={sizeKey} />
              ) : (
                <ZAxis range={[90, 90]} />
              )}

              <Tooltip
                {...TOOLTIP_DEFAULTS}
                cursor={CROSSHAIR_CURSOR}
                content={<ChartTooltipContent hideLabel valueFormatter={formatFull} />}
              />

              {resolved.map((series, i) => (
                <Scatter
                  key={series.key}
                  name={series.label}
                  data={groups[i]?.rows}
                  hide={series.hidden}
                  fill={series.color}
                  // Points overlap by nature; the surface ring is what keeps
                  // two on top of each other readable as two.
                  stroke={CHART_SURFACE}
                  strokeWidth={MARK_GAP}
                  fillOpacity={0.85}
                  isAnimationActive={false}
                />
              ))}
            </RcScatterChart>
          </ResponsiveContainer>
        )
      }}
    </ChartFrame>
  )
}

function numbersAt(data: ChartDatum[], key: string): number[] {
  const out: number[] = []
  for (const datum of data) {
    const value = datum[key]
    if (typeof value === 'number' && Number.isFinite(value)) out.push(value)
  }
  return out
}

function numberOrNull(value: ChartDatum[string]): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

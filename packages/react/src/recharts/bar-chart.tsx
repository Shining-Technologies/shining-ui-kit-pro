import { useMemo } from 'react'
import {
  Bar,
  BarChart as RcBarChart,
  CartesianGrid,
  LabelList,
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
import { BAND_CURSOR, ChartTooltipContent, TOOLTIP_DEFAULTS } from './chart-tooltip'
import {
  AXIS_TEXT_COLOR,
  BAR_RADIUS,
  CHART_SURFACE,
  DEFAULT_HEIGHT,
  DEFAULT_MARGIN,
  formatCompact,
  formatFull,
  MARK_GAP,
  MAX_BAR_SIZE,
  TICK_FONT_SIZE,
  type ChartSize,
  type LabelFormatter,
  type ValueFormatter,
} from './theme'

export interface BarChartProps extends BaseChartProps {
  data: ChartDatum[]
  /** The key holding each datum's category label. */
  xKey: string
  series: ChartSeries[]
  /**
   * `'columns'` grow up from the baseline, `'bars'` run left to right.
   *
   * `'auto'` (the default) uses columns when there is room and flips to bars
   * once the container is too narrow to hold the category labels flat — a long
   * label reads fine down the side of a bar chart and never fits under a
   * column.
   */
  orientation?: 'columns' | 'bars' | 'auto'
  /** `true` stacks into a total, `'percent'` into a 100% share. */
  stacked?: boolean | 'percent'
  showGrid?: boolean
  showXAxis?: boolean
  /** `'auto'` (default) drops the value axis on the narrowest containers. */
  showValueAxis?: boolean | 'auto'
  /**
   * Print each bar's value on its data end. Ignored when stacked — an interior
   * segment has no free end to label into, and cropping the text there is
   * worse than leaving it to the legend and tooltip.
   */
  showValues?: boolean
  /** Sort categories by their total, largest first. Makes a ranked chart. */
  sort?: 'asc' | 'desc'
  valueFormatter?: ValueFormatter
  labelFormatter?: LabelFormatter
  unit?: string
}

/**
 * Magnitude across categories.
 *
 * ```tsx
 * <BarChart title="Jobs by suburb" data={rows} xKey="suburb" series={[{ key: 'jobs' }]} sort="desc" />
 * <BarChart data={rows} xKey="month" series={series} stacked />
 * ```
 */
export function BarChart({
  data,
  xKey,
  series,
  orientation = 'auto',
  stacked = false,
  showGrid = true,
  showXAxis = true,
  showValueAxis = 'auto',
  showValues = false,
  sort,
  valueFormatter = formatCompact,
  labelFormatter,
  unit,
  legend = 'interactive',
  height,
  ...frameProps
}: BarChartProps) {
  const [hidden, toggle] = useHiddenSeries()
  const resolved = useResolvedSeries(series, hidden)
  const visible = resolved.filter((s) => !s.hidden)

  const ordered = useMemo(() => {
    if (!sort) return data
    const total = (d: ChartDatum) => series.reduce((sum, s) => sum + finite(d[s.key]), 0)
    return [...data].sort((a, b) => (sort === 'asc' ? total(a) - total(b) : total(b) - total(a)))
  }, [data, series, sort])

  // Percent stacking normalises a copy; the originals stay for the table view
  // and the tooltip, so the reader can still get the underlying counts.
  const plotted = useMemo(() => {
    if (stacked !== 'percent') return ordered
    return ordered.map((datum) => {
      const total = visible.reduce((sum, s) => sum + finite(datum[s.key]), 0)
      const scaled: ChartDatum = { ...datum }
      for (const s of visible) {
        scaled[s.key] = total > 0 ? (finite(datum[s.key]) / total) * 100 : 0
      }
      return scaled
    })
  }, [ordered, visible, stacked])

  const labels = useMemo(
    () =>
      ordered.map((d) => {
        const raw = d[xKey]
        const text = raw === null || raw === undefined ? '' : String(raw)
        return labelFormatter ? labelFormatter(raw as string | number) : text
      }),
    [ordered, xKey, labelFormatter],
  )

  const values = useMemo(() => {
    const out: number[] = [0]
    for (const datum of plotted) {
      if (stacked) {
        out.push(visible.reduce((sum, s) => sum + finite(datum[s.key]), 0))
      } else {
        for (const s of visible) {
          const v = datum[s.key]
          if (typeof v === 'number' && Number.isFinite(v)) out.push(v)
        }
      }
    }
    return out
  }, [plotted, visible, stacked])

  const tableRows = useMemo(
    () => tableRowsFrom(ordered, xKey, series, labelFormatter),
    [ordered, xKey, series, labelFormatter],
  )

  const longestLabel = labels.reduce((max, l) => Math.max(max, l.length), 1)
  const percent = stacked === 'percent'
  const axisFormatter = percent ? (v: number) => `${Math.round(v)}%` : valueFormatter

  /*
   * Horizontal bars need a height that grows with the category count — a fixed
   * 264px holds four bars comfortably and twenty not at all. Each category
   * gets a row, and the plot grows until it hits a ceiling worth scrolling to.
   */
  const plotHeight =
    height ??
    (({ size }: { size: ChartSize }) => {
      const asBars = resolveOrientation(orientation, size, longestLabel, labels.length)
      if (!asBars) return DEFAULT_HEIGHT[size]
      const rowsPerCategory = stacked ? 1 : Math.max(1, visible.length)
      const perCategory = rowsPerCategory * (MAX_BAR_SIZE + MARK_GAP) + 12
      return Math.min(720, Math.max(140, labels.length * perCategory + 32))
    })

  return (
    <ChartFrame
      {...frameProps}
      height={plotHeight}
      legend={legend}
      series={resolved}
      onToggleSeries={toggle}
      isEmpty={ordered.length === 0 || series.length === 0}
      tableRows={tableRows}
      valueFormatter={formatFull}
      tableLabelHeader={xKey}
    >
      {({ size, width, label }) => {
        const asBars = resolveOrientation(orientation, size, longestLabel, labels.length)
        // The last visible series owns the rounded end of a stack; the ones
        // underneath it are interior segments and stay square.
        const roundedKey = stacked ? visible[visible.length - 1]?.key : undefined
        const labelsFit = showValues && !stacked && size !== 'xs'

        return (
          <ResponsiveContainer width="100%" height="100%">
            <RcBarChart
              title={label}
              data={plotted}
              layout={asBars ? 'vertical' : 'horizontal'}
              margin={DEFAULT_MARGIN[size]}
              barGap={MARK_GAP}
              barCategoryGap={asBars ? '22%' : '18%'}
              accessibilityLayer
            >
              {showGrid ? <CartesianGrid {...gridProps(asBars ? 'x' : 'y')} /> : null}

              {asBars ? (
                <>
                  <XAxis
                    {...valueAxisProps({
                      size,
                      values,
                      formatter: axisFormatter,
                      horizontal: true,
                      hide: showValueAxis === 'auto' ? size === 'xs' : !showValueAxis,
                      domain: percent ? [0, 100] : zeroBasedDomain(values),
                    })}
                  />
                  <YAxis
                    {...categoryAxisProps({
                      dataKey: xKey,
                      size,
                      width,
                      labels,
                      formatter: labelFormatter,
                      hide: !showXAxis,
                      vertical: true,
                    })}
                  />
                </>
              ) : (
                <>
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
                      formatter: axisFormatter,
                      hide: showValueAxis === 'auto' ? size === 'xs' : !showValueAxis,
                      domain: percent ? [0, 100] : zeroBasedDomain(values),
                    })}
                  />
                </>
              )}

              <Tooltip
                {...TOOLTIP_DEFAULTS}
                cursor={BAND_CURSOR}
                content={
                  <ChartTooltipContent
                    labelFormatter={labelFormatter}
                    valueFormatter={percent ? (v) => `${v.toFixed(1)}` : formatFull}
                    unit={percent ? '%' : unit}
                  />
                }
              />

              {resolved.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  hide={s.hidden}
                  fill={s.color}
                  stackId={stacked ? 'stack' : undefined}
                  maxBarSize={MAX_BAR_SIZE}
                  // A stack is separated by a gap in the surface colour, not by
                  // a border: a stroke would add data-weight ink that is not
                  // data. Unstacked bars are already separated by the band gap.
                  stroke={stacked ? CHART_SURFACE : undefined}
                  strokeWidth={stacked ? MARK_GAP : 0}
                  radius={barRadius({
                    asBars,
                    rounded: !stacked || s.key === roundedKey,
                  })}
                  isAnimationActive={false}
                >
                  {labelsFit ? (
                    <LabelList
                      dataKey={s.key}
                      position={asBars ? 'right' : 'top'}
                      offset={6}
                      fontSize={TICK_FONT_SIZE}
                      fill={AXIS_TEXT_COLOR}
                      formatter={(value: number) => valueFormatter(value)}
                    />
                  ) : null}
                </Bar>
              ))}
            </RcBarChart>
          </ResponsiveContainer>
        )
      }}
    </ChartFrame>
  )
}

/**
 * Columns until they stop fitting, then bars.
 *
 * Category labels are the constraint, not the value: a column axis has one
 * slot's width per label and nothing else, so "Brunswick East" under a 40px
 * column has to be angled or thinned away. The same label sits comfortably
 * down the side of a bar chart at any width.
 */
function resolveOrientation(
  orientation: 'columns' | 'bars' | 'auto',
  size: ChartSize,
  longestLabel: number,
  count: number,
): boolean {
  if (orientation !== 'auto') return orientation === 'bars'
  if (size === 'xs') return longestLabel > 4 || count > 6
  if (size === 'sm') return longestLabel > 8 && count > 5
  return false
}

/**
 * A datum's value for summing, with anything that is not a finite number as 0.
 * `typeof NaN === 'number'`, so the old type check let one `NaN` make a whole
 * category's total `NaN` — which scrambles a sort and blanks a percent stack.
 */
function finite(value: ChartDatum[string]): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Rounded data-end, square at the baseline — mirrored for horizontal bars. */
function barRadius(options: {
  asBars: boolean
  rounded: boolean
}): [number, number, number, number] {
  const { asBars, rounded } = options
  if (!rounded) return [0, 0, 0, 0]
  const r = BAR_RADIUS
  return asBars ? [0, r, r, 0] : [r, r, 0, 0]
}

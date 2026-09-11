/**
 * Axis and grid props, shared by every cartesian chart here.
 *
 * Exported as prop factories rather than wrapper components on purpose:
 * Recharts identifies `<XAxis>`, `<YAxis>` and `<CartesianGrid>` by inspecting
 * its children's component type, so wrapping one in a component of our own
 * makes it invisible to the chart. Spreading props onto the real element keeps
 * the styling in one place without fighting that.
 */
import {
  AXIS_LINE_COLOR,
  AXIS_TEXT_COLOR,
  TICK_FONT_SIZE,
  categoryTicks,
  formatCompact,
  valueAxisWidth,
  type ChartSize,
  type LabelFormatter,
  type ValueFormatter,
} from './theme'

const TICK = {
  fill: AXIS_TEXT_COLOR,
  fontSize: TICK_FONT_SIZE,
  // Ticks are a column of numbers that must line up; this is the one place
  // tabular figures belong.
  style: { fontVariantNumeric: 'tabular-nums' as const },
}

/**
 * Gridlines: hairline, solid, one step off the surface.
 *
 * Solid rather than dashed — a dashed rule is *more* ink at a distance, not
 * less, and reads as a series in its own right on a dense chart.
 */
export function gridProps(axis: 'x' | 'y' | 'both' = 'y') {
  return {
    stroke: AXIS_LINE_COLOR,
    strokeWidth: 1,
    horizontal: axis === 'y' || axis === 'both',
    vertical: axis === 'x' || axis === 'both',
  }
}

/**
 * The category axis — months, statuses, campaign names.
 *
 * Label count is decided from the measured width rather than left to Recharts,
 * which draws every label and lets them overlap. See `categoryTicks`.
 */
export function categoryAxisProps(options: {
  dataKey: string
  size: ChartSize
  /** Measured plot width, so tick thinning reacts to the container. */
  width: number
  /** Every category label, already formatted, used to predict collisions. */
  labels: string[]
  formatter?: LabelFormatter
  hide?: boolean
  /** Set for a horizontal bar chart, where categories run down the Y axis. */
  vertical?: boolean
}) {
  const { dataKey, size, width, labels, formatter, hide, vertical } = options
  const longest = labels.reduce((max, l) => Math.max(max, l.length), 1)

  if (vertical) {
    return {
      type: 'category' as const,
      dataKey,
      hide,
      tick: TICK,
      tickLine: false,
      axisLine: false,
      width: Math.min(size === 'xs' ? 96 : 168, Math.max(56, longest * 6.2 + 12)),
      tickFormatter: formatter,
      interval: 0 as const,
    }
  }

  const { interval, angle, height } = categoryTicks({
    count: labels.length,
    width,
    longestLabel: longest,
    size,
  })

  return {
    dataKey,
    hide,
    tick: TICK,
    tickLine: false,
    // The baseline is the grid's bottom rule; a second line on top of it is
    // duplicate ink.
    axisLine: false,
    tickMargin: 8,
    minTickGap: 4,
    interval,
    height,
    ...(angle ? { angle, textAnchor: 'end' as const } : {}),
    tickFormatter: formatter,
  }
}

/**
 * The value axis.
 *
 * Compact by default (`1.2M`, `52k`) — the exact figure is one hover or one
 * table row away, and a five-digit tick column steals width the plot needs.
 * On the narrowest containers the axis is dropped entirely: the direct labels
 * and the tooltip carry the values, and a plot squeezed to 200px wide has none
 * to spare.
 */
export function valueAxisProps(options: {
  size: ChartSize
  /** Every plotted value, used to size the tick column. */
  values: number[]
  formatter?: ValueFormatter
  hide?: boolean
  /** Set for a horizontal bar chart, where values run along the X axis. */
  horizontal?: boolean
  domain?: [number | string, number | string]
}) {
  const { size, values, formatter = formatCompact, hide, horizontal, domain } = options
  const sample = values.length
    ? [formatter(Math.min(...values)), formatter(Math.max(...values))]
    : ['0']

  const common = {
    hide,
    tick: TICK,
    tickLine: false,
    axisLine: false,
    tickFormatter: formatter,
    ...(domain ? { domain } : {}),
  }

  if (horizontal) {
    return { ...common, type: 'number' as const, height: 24, tickMargin: 8 }
  }

  return {
    ...common,
    width: valueAxisWidth(sample, size),
    tickMargin: 4,
    // Four bands is enough to read a value off; more turns the plot into
    // ruled paper.
    tickCount: size === 'xs' ? 4 : 5,
  }
}

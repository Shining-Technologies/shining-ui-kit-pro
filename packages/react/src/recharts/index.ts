/**
 * Charts, on Recharts.
 *
 * Six forms, one design: they share a frame, a palette, a tooltip, a legend
 * and a set of responsive rules, so adding a chart to a page is a choice about
 * the *data's* job and nothing else. Colours come from `--sui-chart-1..5`, the
 * same tokens every other chart and component here draws from, so these follow
 * a project switch with no adapter layer.
 *
 * ```tsx
 * import { TrendChart, BarChart } from '@shining-technologies/ui-kit-react/recharts'
 * import '@shining-technologies/ui-kit-react/styles.css'
 * ```
 *
 * `recharts` is an optional peer dependency: it is only pulled into a bundle
 * that imports this entry point, so the root package stays dependency-free for
 * apps that use the SVG charts or no charts at all.
 *
 * | Form                        | The job it does                              |
 * | --------------------------- | -------------------------------------------- |
 * | `TrendChart`                | change over time (line or area)              |
 * | `BarChart`                  | magnitude across categories                  |
 * | `DonutChart`                | part of a whole                              |
 * | `GaugeChart`                | one measure against a target                 |
 * | `ScatterChart`              | whether two measures move together           |
 * | `Sparkline` / `StatTile`    | direction beside a figure                    |
 */

// ------------------------------------------------------------------- charts
export { TrendChart } from './trend-chart'
export type { TrendChartProps } from './trend-chart'
export { BarChart } from './bar-chart'
export type { BarChartProps } from './bar-chart'
export { DonutChart } from './donut-chart'
export type { DonutChartProps, DonutSlice } from './donut-chart'
export { GaugeChart } from './gauge-chart'
export type { GaugeChartProps, GaugeThresholds } from './gauge-chart'
export { ScatterChart } from './scatter-chart'
export type { ScatterChartProps } from './scatter-chart'
export { Sparkline, StatTile } from './sparkline'
export type { SparklineProps, StatTileProps } from './sparkline'

// -------------------------------------------------- the frame charts are built on
export {
  ChartFrame,
  FALLBACK_CHART_WIDTH,
  tableRowsFrom,
  useChartWidth,
  useHiddenSeries,
  useResolvedSeries,
} from './chart-frame'
export type { BaseChartProps, ChartDatum, ChartSeries, ResolvedSeries } from './chart-frame'

export {
  BAND_CURSOR,
  ChartTooltipContent,
  CROSSHAIR_CURSOR,
  TOOLTIP_DEFAULTS,
} from './chart-tooltip'
export type { ChartTooltipContentProps, TooltipPayloadItem, TooltipRow } from './chart-tooltip'

export { categoryAxisProps, gridProps, valueAxisProps } from './axes'

// ------------------------------------------------------------------- theme
export {
  AXIS_LINE_COLOR,
  AXIS_TEXT_COLOR,
  BAR_RADIUS,
  CHART_SLOT_ORDER,
  CHART_SURFACE,
  DEFAULT_HEIGHT,
  DEFAULT_MARGIN,
  DOT_RADIUS,
  LINE_WIDTH,
  MARK_GAP,
  MAX_BAR_SIZE,
  MAX_SERIES,
  SIZE_BREAKPOINTS,
  TICK_FONT_SIZE,
  categoryTicks,
  formatCompact,
  formatFull,
  formatPercent,
  resolveResponsive,
  seriesColor,
  sizeForWidth,
  valueAxisWidth,
} from './theme'
export type { ChartSize, LabelFormatter, Responsive, ValueFormatter } from './theme'

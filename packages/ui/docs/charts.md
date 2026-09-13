# Charts

`@shining-technologies/ui/charts` is a set of six charts built on [Recharts](https://recharts.org).
They share one frame (title, description, actions, legend, loading and empty states, an accessible
data table), one palette (`--chart-1` … `--chart-5`) and one set of responsive rules measured on
the chart's own container. The root entry `@shining-technologies/ui` never imports Recharts; only
this entry point does.

```tsx
import { TrendChart, BarChart, DonutChart, GaugeChart, ScatterChart, Sparkline } from '@shining-technologies/ui/charts'
import '@shining-technologies/ui/styles.css'
```

| Component                         | Use it for                                     |
| --------------------------------- | ---------------------------------------------- |
| [`TrendChart`](#trendchart)       | Change over time, as a line or an area         |
| [`BarChart`](#barchart)           | Magnitude across categories                    |
| [`DonutChart`](#donutchart)       | Part of a whole (a handful of slices)          |
| [`GaugeChart`](#gaugechart)       | One measure against a target                   |
| [`ScatterChart`](#scatterchart)   | Whether two measures move together             |
| [`Sparkline`](#sparkline)         | Direction beside a figure, with no axes        |

**Server and client.** Every chart component, `ChartFrame`, `useChartWidth`, `useHiddenSeries`,
`useResolvedSeries`, `tableRowsFrom` and `FALLBACK_CHART_WIDTH` come from `'use client'` modules.
`ChartTooltipContent`, the cursor and tooltip constants, the axis prop factories and the theme
helpers (`seriesColor`, `formatCompact`, …) come from modules without a directive. You can render a
chart from a Server Component as long as every prop is serialisable. Function props
(`valueFormatter`, `labelFormatter`, `xFormatter`, `yFormatter`, a function `height`) cannot cross
from a Server Component to a Client Component. Put the chart in your own `'use client'` file
instead (see [Server rendering](#server-rendering)).

## Installation

`recharts` is an optional peer dependency (`^2.15.0 || ^3.0.0`). Install it in any app that imports
from `@shining-technologies/ui/charts`:

```sh
npm install recharts
```

The chart styles (`.sui-viz*`) are part of `@shining-technologies/ui/styles.css`, so there is no
separate stylesheet to import.

## Shared frame props

Every chart except `Sparkline` accepts `BaseChartProps`. These extend
`HTMLAttributes<HTMLDivElement>` without `title`, `children` and `onClick`. Other attributes
(`className`, `style`, `id`, `aria-label`, `data-*`) are spread onto the outer `<div data-slot="chart" class="sui-viz">`.

| Prop               | Type                                                                                  | Default                           | Description |
| ------------------ | ------------------------------------------------------------------------------------- | --------------------------------- | ----------- |
| `title`            | `ReactNode`                                                                           | —                                 | Heading above the plot. A string title also names the chart (see [Accessibility](#accessibility)) and becomes the data table's caption. |
| `description`      | `ReactNode`                                                                           | —                                 | One line under the title. |
| `actions`          | `ReactNode`                                                                           | —                                 | Controls (filters, a range picker) placed at the trailing edge of the header. Below a container width of `26rem`, the header stacks and the actions wrap. |
| `height`           | `Responsive<number> \| ((context: { size: ChartSize; width: number }) => number)`     | Per chart, see below              | Plot height in pixels: a number, a value per [size bucket](#responsive-behaviour), or a function of the measured box. Width always fills the container. |
| `legend`           | `'auto' \| 'always' \| 'interactive' \| false`                                        | `'auto'`                          | `'auto'` shows no legend for a single series, and toggle buttons that hide and show a series from two series up. `'always'` shows a plain list, even for one series. `'interactive'` shows toggle buttons, even for one series. `false` hides it. Not accepted by `GaugeChart`. |
| `emptyMessage`     | `ReactNode`                                                                           | `'No data to display'`            | Shown in place of the plot when there is nothing to draw. |
| `loading`          | `boolean`                                                                             | `false`                           | Replaces the plot with a shimmer and a `role="status"` region reading "Loading chart". The data table is not rendered while loading. |
| `showTableToggle`  | `boolean`                                                                             | `true` (`false` on `GaugeChart`)  | Renders the [data table view](#data-table-view) and its "Show data" toggle. When `false`, neither is rendered. |
| `tableToggleLabel` | `[show: string, hide: string]`                                                        | `['Show data', 'Hide data']`      | Toggle text in each state. |
| `locale`           | `string`                                                                              | `'en-US'`                         | Locale for the full-precision numbers in tooltips, the data table and the gauge's labels when no formatter is given. It is fixed rather than the runtime's default, so server and client output match. |

The default plot height is `DEFAULT_HEIGHT` for the measured size: 190 px (`xs`), 224 px (`sm`),
264 px (`md`) and 300 px (`lg`). `BarChart` and `GaugeChart` have their own defaults, described in
their sections.

The legend's hidden state is internal. Nothing in the props sets or reads which series are hidden.

### Series and data

`TrendChart` and `BarChart` take rows of data plus a list of series to plot from them.

```ts
type ChartDatum = Record<string, string | number | null | undefined>

interface ChartSeries {
  key: string    // property of each datum to plot
  label?: string // legend, tooltip and table header; defaults to key
  color?: string // any CSS colour; defaults to the next palette slot
}
```

Only finite numbers are plotted. `null`, `undefined`, `NaN` and strings in a series column leave a
gap in lines and areas (`connectNulls` is off). They show as an em dash (`—`) in the data table.

### Formatters

Each chart takes formatters for its values (`valueFormatter`, or `xFormatter` and `yFormatter` on
`ScatterChart`). A formatter you pass is used everywhere that value appears: axis ticks, tooltips,
the data table, and the centre and accessible names of donut and gauge charts. When you pass none,
axis ticks are compact (`1.2M`, `52k`), and tooltips and the table show full precision with
thousands separators in `locale` (`formatFull`).

```tsx
const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

<TrendChart data={months} xKey="month" series={series} valueFormatter={(value) => currency.format(value)} />
```

A full-precision formatter also makes the axis ticks full precision. If you want compact ticks
with a custom tooltip format, the chart has no separate tick formatter. Build the axis yourself
with the [building blocks](#building-your-own-chart).

### Data table view

Every chart builds a `<table>` holding its values. It is rendered while `showTableToggle` is
`true`, the chart is not `loading` and there is at least one row.

- The table is always in the DOM. It is visually hidden (`.sui-visually-hidden`) until the toggle is
  pressed, so screen-reader users reach the numbers without looking for the toggle.
- The toggle is a `<button>` with `aria-expanded` and `aria-controls` pointing at the table.
- The caption is the `title` when it is a string, otherwise "Chart data".
- Values use the chart's formatter, or full precision in `locale` (see [Formatters](#formatters)).
- When printing, the table is shown and the toggle is hidden.

| Chart          | Row header column                  | Value columns                                           |
| -------------- | ---------------------------------- | ------------------------------------------------------- |
| `TrendChart`   | `xKey` (header text is the key)    | One per series, in `series` order                       |
| `BarChart`     | `xKey`, in plotted (sorted) order  | One per series. Raw values, even when `stacked="percent"` |
| `DonutChart`   | "Slice" (every slice, hidden or not) | "Value"                                               |
| `GaugeChart`   | "Measure": rows "Current" and "Target" | "Value". Off unless `showTableToggle` is set        |
| `ScatterChart` | `labelKey` value, or the row number under "#" | `xLabel ?? xKey` (formatted with `xFormatter`), `yLabel ?? yKey` (with `yFormatter`), and `sizeKey` when set |

## TrendChart

Change over time. A single component draws lines (`variant="line"`) or areas (`variant="area"`),
optionally stacked, with an optional horizontal reference line.

```tsx
'use client'
import { TrendChart, type ChartDatum } from '@shining-technologies/ui/charts'

const months: ChartDatum[] = [
  { month: 'Jan', booked: 120, completed: 96 },
  { month: 'Feb', booked: 148, completed: 131 },
  { month: 'Mar', booked: 96, completed: 88 },
]

export function BookingsChart() {
  return (
    <TrendChart
      title="Bookings"
      description="Booked against completed"
      data={months}
      xKey="month"
      series={[
        { key: 'booked', label: 'Booked' },
        { key: 'completed', label: 'Completed' },
      ]}
      reference={{ value: 140, label: 'Target' }}
      unit=" jobs"
    />
  )
}
```

| Prop             | Type                                   | Default          | Description |
| ---------------- | -------------------------------------- | ---------------- | ----------- |
| `data`           | `ChartDatum[]`                         | required         | Rows, in axis order. |
| `xKey`           | `string`                               | required         | Property holding each row's time or category label. |
| `series`         | `ChartSeries[]`                        | required         | Measures to plot. |
| `variant`        | `'line' \| 'area'`                     | `'line'`         | Lines for comparison, areas for volume. Unstacked areas are drawn as a light gradient wash under the line. |
| `stacked`        | `boolean`                              | `false`          | Areas only: stack the series into a total, with opaque fills. Ignored for lines. |
| `smooth`         | `boolean`                              | `false`          | Use a monotone curve (never overshoots between points) instead of straight segments. |
| `showPoints`     | `boolean \| 'auto'`                    | `'auto'`         | Draw a dot at every point. `'auto'` draws them when there are 12 or fewer rows and the chart is wider than `xs`. |
| `showGrid`       | `boolean`                              | `true`           | Horizontal gridlines. |
| `showXAxis`      | `boolean`                              | `true`           | Category axis. |
| `showYAxis`      | `boolean \| 'auto'`                    | `'auto'`         | Value axis. `'auto'` hides it at size `xs`. |
| `startAtZero`    | `boolean`                              | `true`           | Keep zero on the value axis. Data that is all negative gets zero as the upper bound. |
| `reference`      | `{ value: number; label?: string }`    | —                | Dashed horizontal marker (a target, a budget, an SLA). Its value is included in the axis range. |
| `valueFormatter` | `(value: number) => string`            | —                | Formats values on the axis, in the tooltip and in the table. See [Formatters](#formatters). |
| `labelFormatter` | `(label: string \| number) => string`  | —                | Category tick labels, the tooltip heading and the table's row headers. |
| `unit`           | `string`                               | —                | Appended to every tooltip value. |

Plus the [shared frame props](#shared-frame-props).

## BarChart

Magnitude across categories. Columns grow up from the baseline and bars run left to right. By
default the chart switches to bars when the category labels would not fit under columns.

```tsx
'use client'
import { BarChart } from '@shining-technologies/ui/charts'

const suburbs = [
  { suburb: 'Brunswick East', jobs: 42 },
  { suburb: 'Carlton', jobs: 31 },
  { suburb: 'Fitzroy North', jobs: 57 },
]

export function JobsBySuburb() {
  return <BarChart title="Jobs by suburb" data={suburbs} xKey="suburb" series={[{ key: 'jobs', label: 'Jobs' }]} sort="desc" showValues />
}
```

| Prop             | Type                                   | Default          | Description |
| ---------------- | -------------------------------------- | ---------------- | ----------- |
| `data`           | `ChartDatum[]`                         | required         | One row per category. |
| `xKey`           | `string`                               | required         | Property holding the category label. |
| `series`         | `ChartSeries[]`                        | required         | Measures to plot. |
| `orientation`    | `'columns' \| 'bars' \| 'auto'`        | `'auto'`         | `'auto'` uses columns, except at `xs` when the longest label is over 4 characters or there are more than 6 categories, and at `sm` when the longest label is over 8 characters and there are more than 5 categories. |
| `stacked`        | `boolean \| 'percent'`                 | `false`          | `true` stacks into a total. `'percent'` normalises each category to 100% (axis fixed at 0–100%, tooltip shows the share to one decimal with `%`). The table keeps the raw values. |
| `showGrid`       | `boolean`                              | `true`           | Gridlines across the value direction. |
| `showXAxis`      | `boolean`                              | `true`           | The category axis, which runs down the side in bar orientation. |
| `showValueAxis`  | `boolean \| 'auto'`                    | `'auto'`         | The value axis. `'auto'` hides it at `xs`. |
| `showValues`     | `boolean`                              | `false`          | Print each bar's value at its end. Not drawn when stacked or at `xs`. |
| `sort`           | `'asc' \| 'desc'`                      | —                | Order categories by the sum of all series (non-finite values count as 0). Unset keeps `data` order. |
| `valueFormatter` | `(value: number) => string`            | —                | Formats values on the axis, on value labels, in the tooltip and in the table. In percent mode the axis and tooltip keep showing percentages. See [Formatters](#formatters). |
| `labelFormatter` | `(label: string \| number) => string`  | —                | Category labels, tooltip heading and table row headers. |
| `unit`           | `string`                               | —                | Appended to tooltip values. Replaced by `%` in percent mode. |

Plus the [shared frame props](#shared-frame-props).

When `height` is not set, columns use the default height. Bars grow with the category count:
`min(720, max(140, categories × (rows × 26 + 12) + 32))` pixels, where `rows` is 1 when stacked and
the number of visible series otherwise. The value axis always includes zero. Bars are capped at
24 px thick, with a 4 px radius on the data end.

## DonutChart

Part of a whole. The hole states the total, so each wedge is read against it. The chart is suited
to a handful of slices. Past about six, a sorted `BarChart` is easier to read (the component does
not enforce this).

```tsx
'use client'
import { DonutChart } from '@shining-technologies/ui/charts'

export function JobsByStatus() {
  return (
    <DonutChart
      title="Jobs by status"
      centerLabel="jobs"
      data={[
        { key: 'done', label: 'Completed', value: 412 },
        { key: 'active', label: 'In progress', value: 96 },
        { key: 'cancelled', label: 'Cancelled', value: 14 },
      ]}
    />
  )
}
```

| Prop             | Type                                             | Default          | Description |
| ---------------- | ------------------------------------------------ | ---------------- | ----------- |
| `data`           | `DonutSlice[]`                                   | required         | The slices. |
| `variant`        | `'donut' \| 'pie'`                               | `'donut'`        | `'pie'` fills the hole and never shows the centre figure. |
| `centerValue`    | `ReactNode`                                      | Total of the visible slices | Centre figure. The default uses `valueFormatter`, or compact formatting when none is given. |
| `centerLabel`    | `ReactNode`                                      | —                | Caption under the centre figure. |
| `legend`         | `'auto' \| 'always' \| 'interactive' \| false`   | `'auto'`         | See the [shared frame props](#shared-frame-props). Hiding a slice removes it from the ring and the total. |
| `showShare`      | `boolean`                                        | `true`           | Show each slice's share of the visible total in the tooltip, for example "412 (79%)", with a footer "of 522 total". |
| `valueFormatter` | `(value: number) => string`                      | —                | Formats the centre figure, tooltip values, wedge names and the table. See [Formatters](#formatters). |
| `unit`           | `string`                                         | —                | Appended to tooltip values, the tooltip total and each wedge's accessible name. |

Plus the [shared frame props](#shared-frame-props).

```ts
interface DonutSlice {
  key: string    // identity for the legend, hidden state and colour
  label?: string // defaults to key
  value: number
  color?: string // any CSS colour; defaults to the palette slot for the key
}
```

A slice's colour follows its `key`, not its position in `data`. Palette slots are assigned in the
sorted order of the distinct keys, so sorting `data` by value never swaps colours.

Only slices with a finite value greater than zero are drawn. If none qualify (including when every
slice is hidden), `emptyMessage` is shown. The ring's outer radius is half the plot height minus
8 px, clamped to 40–160 px, and the hole is 66% of that. The centre figure is shown only for
`variant="donut"`, when the hole radius is at least 44 px and the chart is wider than `xs`. It is
`aria-hidden`, because the wedges and the table carry the values.

## GaugeChart

One measure against a target, drawn as a ring with the share of the target filled. The centre
figure is the chart's accessible name.

```tsx
'use client'
import { GaugeChart } from '@shining-technologies/ui/charts'

export function SlaGauge() {
  return <GaugeChart title="SLA" value={94.2} target={100} centerLabel="on time" thresholds={{ good: 0.95, warning: 0.9 }} />
}
```

| Prop             | Type                               | Default                               | Description |
| ---------------- | ---------------------------------- | ------------------------------------- | ----------- |
| `value`          | `number`                           | required                              | Current measure. A non-finite value shows `emptyMessage`. |
| `target`         | `number`                           | `100`                                 | What counts as full. The filled share is `value / target`, clamped to 0–1 (0 when `target` is 0 or less). |
| `centerValue`    | `ReactNode`                        | Share as a percentage (1 decimal, or 0 decimals at 99.5% and above) | Centre figure. |
| `centerLabel`    | `ReactNode`                        | "of *target*"                         | Caption under the figure, with the target formatted. |
| `thresholds`     | `GaugeThresholds`                  | —                                     | Colour the arc by severity: `var(--success)` when the share is at least `good`, `var(--warning)` when it is at least `warning`, `var(--destructive)` below that. |
| `color`          | `string`                           | `var(--chart-1)`                      | Arc colour. Takes precedence over `thresholds`. |
| `valueFormatter` | `(value: number) => string`        | Full precision in `locale`            | Formats the value and target in the default `centerLabel`, the accessible name and the table. |
| `height`         | `Responsive<number> \| function`   | `{ xs: 180, sm: 200, md: 220, lg: 240 }` | See the [shared frame props](#shared-frame-props). |
| `showTableToggle`| `boolean`                          | `false`                               | Adds the [data table view](#data-table-view) with the current value and the target. |

Plus the [shared frame props](#shared-frame-props), except `legend`.

```ts
interface GaugeThresholds {
  good: number    // share of target (0–1) at or above which the arc reads as healthy
  warning: number // share at or above which it reads as strained; below is destructive
}
```

The track is `var(--muted)`. The centre element has `role="img"` and
`aria-label="<valueFormatter(value)> of <valueFormatter(target)>"`, for example "94.2 of 100".

## ScatterChart

Whether two numeric measures move together. Points can be split into coloured groups, and a third
measure can set each point's area.

```tsx
'use client'
import { ScatterChart, type ChartDatum } from '@shining-technologies/ui/charts'

const quotes: ChartDatum[] = [
  { client: 'Acme', days: 4, value: 2400, channel: 'Web' },
  { client: 'Borden', days: 11, value: 5200, channel: 'Referral' },
  { client: 'Crane', days: 6, value: 3100, channel: 'Web' },
]

export function QuoteScatter() {
  return (
    <ScatterChart
      title="Quote value against time to close"
      data={quotes}
      xKey="days"
      yKey="value"
      groupKey="channel"
      labelKey="client"
      xLabel="Days to close"
      yLabel="Quote value"
      yFormatter={(value) => `$${value.toLocaleString('en-US')}`}
    />
  )
}
```

| Prop         | Type                          | Default          | Description |
| ------------ | ----------------------------- | ---------------- | ----------- |
| `data`       | `ChartDatum[]`                | required         | One row per point. |
| `xKey`       | `string`                      | required         | Numeric property on the horizontal axis. |
| `yKey`       | `string`                      | required         | Numeric property on the vertical axis. |
| `groupKey`   | `string`                      | —                | Split points into series by this property's value. Each distinct value gets a palette slot and a legend entry. Rows with a `null` or missing value are grouped under `yLabel ?? yKey`. Without `groupKey` there is no legend. |
| `sizeKey`    | `string`                      | —                | A third measure, mapped to point area (64–640 px²). Without it, every point is 90 px². |
| `labelKey`   | `string`                      | —                | Property that names each point: the tooltip heading and the table's row header. Without it, the tooltip has no heading and table rows are numbered. |
| `xLabel`     | `string`                      | —                | Horizontal axis title (drawn at sizes `md` and `lg`). Also used as the row name in the tooltip and the table header. |
| `yLabel`     | `string`                      | —                | Vertical axis title, as above. |
| `showGrid`   | `boolean`                     | `true`           | Gridlines in both directions. |
| `xFormatter` | `(value: number) => string`   | —                | Formats x values on the axis, in the tooltip and in the table. See [Formatters](#formatters). |
| `yFormatter` | `(value: number) => string`   | —                | Formats y values, as above. |

Plus the [shared frame props](#shared-frame-props). `legend` applies only when `groupKey` is set.
The axes use Recharts' automatic domains and are not forced to include zero. A `sizeKey` value
uses full precision in `locale`.

## Sparkline

A small line or area with no axes, gridlines, tooltip, legend or frame. It shows direction and
steadiness beside a figure that states the magnitude.

```tsx
'use client'
import { Sparkline } from '@shining-technologies/ui/charts'

export function WeeklyTrend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <strong>1,284</strong>
      <Sparkline data={[820, 910, 870, 1040, 1180, 1284]} ariaLabel="Rising over six weeks" style={{ width: 96 }} />
    </div>
  )
}
```

| Prop           | Type                  | Default           | Description |
| -------------- | --------------------- | ----------------- | ----------- |
| `data`         | `(number \| null)[]`  | required          | Values, oldest first. `null` breaks the line. An empty array renders nothing. |
| `color`        | `string`              | `var(--chart-1)`  | Any CSS colour. |
| `variant`      | `'line' \| 'area'`    | `'area'`          | Line only, or a line with a fading fill. |
| `showEndPoint` | `boolean`             | `true`            | Mark the most recent value with a dot. |
| `height`       | `number`              | `40`              | Height in pixels. Width fills the container (`width: 100%`). |
| `ariaLabel`    | `string`              | —                 | When set, the sparkline has `role="img"` and this name. When unset, it is `aria-hidden="true"`. |

Other `HTMLAttributes<HTMLDivElement>` (except `children`) are spread onto the wrapper
`<div class="sui-viz__sparkline">`. Curves are monotone. The vertical range is the data's extent
padded by 15%, so a flat series sits mid-height. The end dot's ring uses the
[chart surface](#colours) (`--sui-chart-surface`, falling back to `--card`), inherited from any
ancestor.

## Colours

Series take the shadcn chart tokens, so a chart follows the active theme, preset or generated theme
with no extra configuration ([Theming](theming.md)).

- **Slot order.** Series are assigned `--chart-1`, `--chart-3`, `--chart-5`, `--chart-2`,
  `--chart-4`, in that order (`CHART_SLOT_ORDER`). This order keeps neighbouring series in two- and
  three-series charts visually far apart. Donut slices take slots in the sorted order of their keys.
- **More than five series.** Series 6–10 reuse the slots mixed 78% with the chart surface, series
  11–15 at 56%, and later series at 34% (`color-mix(in oklab, …)`). No colour repeats exactly, but
  five series is the supported number (`MAX_SERIES`). Beyond that, group the tail into an "Other"
  series or split the chart.
- **Per-series colour.** `color` on a `ChartSeries`, a `DonutSlice`, `GaugeChart` or `Sparkline`
  accepts any CSS colour and replaces the slot.
- **Chart surface.** Touching marks (stacked bars, wedges, dots, points) are separated by a 2 px
  gap painted in `var(--sui-chart-surface, var(--card))`. When charts sit on another surface, set
  the variable on the chart or on any ancestor:

  ```tsx
  <section style={{ '--sui-chart-surface': 'var(--background)' } as React.CSSProperties}>
    <BarChart data={rows} xKey="month" series={series} stacked />
  </section>
  ```

- **Furniture.** Gridlines use `var(--border)` (`AXIS_LINE_COLOR`), tick text uses
  `var(--muted-foreground)` (`AXIS_TEXT_COLOR`), and tooltips use the popover tokens. Gauge
  thresholds use `--success`, `--warning` and `--destructive`, with a `--muted` track.

Series identity never depends on colour alone: multi-series charts have a legend, tooltips and the
data table.

## Responsive behaviour

Charts measure their own container with `ResizeObserver`, not the viewport, so a chart in a narrow
dashboard column behaves like a chart on a phone.

| Size | Container width | Default height |
| ---- | --------------- | -------------- |
| `xs` | under 420 px    | 190 px         |
| `sm` | 420–639 px      | 224 px         |
| `md` | 640–899 px      | 264 px         |
| `lg` | 900 px and over | 300 px         |

Before the first measurement, on the server, and in environments without `ResizeObserver`, charts
lay out at `FALLBACK_CHART_WIDTH` (640 px, size `md`).

A `Responsive<T>` value is either a plain value or a map of sizes. A missing size takes the nearest
smaller size that is defined. If no smaller size is defined, the default applies.

```tsx
<TrendChart height={{ xs: 160, md: 280 }} data={data} xKey="day" series={series} />
// xs, sm → 160; md, lg → 280
```

Rules applied at each size:

- **Category labels.** When the labels do not fit, every Nth label is dropped first. If thinning
  alone would leave too few labels, they are angled instead (−35°, or −45° at `xs`). The tooltip
  and the table still carry every category.
- **Value axis.** 4 ticks at `xs` and 5 above. The axis is hidden at `xs` on `TrendChart`
  (`showYAxis="auto"`) and `BarChart` (`showValueAxis="auto"`).
- **Points and labels.** `TrendChart` dots and `BarChart` value labels are not drawn at `xs`.
- **Orientation.** `BarChart` with `orientation="auto"` switches to horizontal bars at narrow sizes
  (see [BarChart](#barchart)).
- **Axis titles.** `ScatterChart` draws `xLabel` and `yLabel` only at `md` and `lg`.
- **Radial charts.** Donut and gauge radii follow the plot height, and the donut hides its centre
  figure at `xs`.
- **Header.** A container query stacks the header and wraps `actions` below `26rem`.

The canvas has `min-width: 0`, so charts shrink inside flex and grid items. The plot height is set
as an inline `style`, which a Content-Security-Policy governs through `style-src-attr`.

## Tooltips

`TrendChart`, `BarChart`, `DonutChart` and `ScatterChart` render `ChartTooltipContent` inside a
Recharts `<Tooltip>`. The tooltip is not animated and does not capture the pointer.

- **Heading.** The category label, passed through `labelFormatter` when one is set. `ScatterChart`
  uses the hovered point's `labelKey` value, and has no heading without `labelKey`. `DonutChart` has
  no heading.
- **Rows.** One row per visible series, with a colour swatch, the series label and the formatted
  value (see [Formatters](#formatters)) plus `unit`. Rows whose value is `null` are dropped.
- **Cursor.** `TrendChart` and `ScatterChart` draw a hairline crosshair (`CROSSHAIR_CURSOR`).
  `BarChart` draws a tinted band behind the hovered category (`BAND_CURSOR`).
- **Donut share.** With `showShare` on, each value is followed by its share of the total, and a
  footer states the total.

## Accessibility

- **Name.** A chart with a `title` renders as `role="figure"`, labelled by the title element unless
  you pass `aria-label` or `aria-labelledby`. The plot's `<svg>` gets a `<title>` from a string
  `title`, falling back to `aria-label`. When `title` is not a string, pass `aria-label` so the
  plot has a name.
- **Values in text.** The [data table view](#data-table-view) is the way screen-reader users get
  the numbers. Leave `showTableToggle` on. It is also what makes up for the palette's limited
  contrast between series.
- **Keyboard.** `TrendChart`, `BarChart` and `ScatterChart` enable Recharts' `accessibilityLayer`.
  The plot is focusable, and Recharts moves the tooltip between data points with the arrow keys.
  The kit replaces Recharts' focus outline with its own ring. Interactive legend entries are
  `<button>`s with `aria-pressed` (pressed means visible). The "Show data" toggle is a `<button>`
  with `aria-expanded`. A legend set to `'always'` is a plain list, not disabled buttons.
- **Donut wedges** have `role="img"` and a name such as "Completed: 412, 79%", including `unit` when
  set.
- **Gauge.** The centre figure is `role="img"` named "*value* of *target*". The ring is decorative:
  it sits in an `aria-hidden` wrapper with Recharts' accessibility layer off, so it is neither
  announced nor focusable. Add `showTableToggle` when the value and target should also be available
  as a table.
- **Sparkline** is hidden from assistive technology unless `ariaLabel` is set. Set it when no nearby
  text states the trend.
- **Loading** is announced through a polite `role="status"` region with the fixed English text
  "Loading chart".
- The test suite checks the frame and the drawn charts with axe (`tests/charts-recharts.test.tsx`,
  `tests/audit-charts.test.tsx`).

## Server rendering

The charts render on the server without `window` or `document`. The frame, header, legend and data
table are in the server HTML, laid out at the 640 px fallback width. Recharts draws the SVG plot
after it measures the container in the browser.

Two consequences:

- Function props cannot be passed from a Server Component. Define the chart in a client file and
  pass it data:

  ```tsx
  // app/dashboard/revenue-chart.tsx
  'use client'
  import { TrendChart, type ChartDatum } from '@shining-technologies/ui/charts'

  const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

  export function RevenueChart({ data }: { data: ChartDatum[] }) {
    return (
      <TrendChart
        title="Revenue"
        data={data}
        xKey="month"
        series={[{ key: 'revenue', label: 'Revenue' }]}
        variant="area"
        valueFormatter={(value) => currency.format(value)}
      />
    )
  }
  ```

  ```tsx
  // app/dashboard/page.tsx (a Server Component)
  import { RevenueChart } from './revenue-chart'

  export default async function Page() {
    const data = await getMonthlyRevenue()
    return <RevenueChart data={data} />
  }
  ```

- Default number formatting uses `locale` (`'en-US'` unless set), never the runtime's default
  locale, so the server HTML and the first client render agree. Formatters you write should
  also name a locale, as `Intl.NumberFormat('en-AU', …)` does above.

See [Next.js](nextjs.md) for the general Server Component rules.

## Building your own chart

The frame, hooks, tooltip and axis helpers are exported, so a chart type the kit does not ship can
share the same header, legend, table view and styling.

```tsx
'use client'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CROSSHAIR_CURSOR,
  ChartFrame,
  ChartTooltipContent,
  DEFAULT_MARGIN,
  TOOLTIP_DEFAULTS,
  categoryAxisProps,
  gridProps,
  tableRowsFrom,
  useHiddenSeries,
  useResolvedSeries,
  valueAxisProps,
  type ChartDatum,
  type ChartSeries,
} from '@shining-technologies/ui/charts'

export function QueueDepthChart({ data, series }: { data: ChartDatum[]; series: ChartSeries[] }) {
  const [hidden, toggle] = useHiddenSeries()
  const resolved = useResolvedSeries(series, hidden)
  const values = data.flatMap((row) =>
    series.map((s) => row[s.key]).filter((v): v is number => typeof v === 'number'),
  )

  return (
    <ChartFrame
      title="Queue depth"
      series={resolved}
      onToggleSeries={toggle}
      isEmpty={data.length === 0}
      tableRows={tableRowsFrom(data, 'hour', series)}
      tableLabelHeader="Hour"
    >
      {({ size, width, label }) => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart title={label} data={data} margin={DEFAULT_MARGIN[size]} accessibilityLayer>
            <CartesianGrid {...gridProps('y')} />
            <XAxis {...categoryAxisProps({ dataKey: 'hour', size, width, labels: data.map((row) => String(row.hour)) })} />
            <YAxis {...valueAxisProps({ size, values })} />
            <Tooltip {...TOOLTIP_DEFAULTS} cursor={CROSSHAIR_CURSOR} content={<ChartTooltipContent />} />
            {resolved.map((s) => (
              <Line key={s.key} type="stepAfter" dataKey={s.key} name={s.label} stroke={s.color} hide={s.hidden} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  )
}
```

### ChartFrame

Accepts every [shared frame prop](#shared-frame-props), plus:

| Prop                    | Type                                                                                   | Default      | Description |
| ----------------------- | -------------------------------------------------------------------------------------- | ------------ | ----------- |
| `series`                | `ResolvedSeries[]`                                                                     | required     | Resolved series for the legend and table headers. |
| `children`              | `(context: { size: ChartSize; width: number; height: number; label?: string }) => ReactNode` | required | Renders the plot. `label` is the string `title` or the `aria-label`. Pass it to the Recharts chart's `title` prop. |
| `onToggleSeries`        | `(key: string) => void`                                                                | —            | Called when a legend entry is pressed. With it, `legend` `'auto'` (two series up) and `'interactive'` render toggle buttons. Without it, the legend is a plain list. |
| `isEmpty`               | `boolean`                                                                              | —            | Show `emptyMessage` instead of calling `children`. |
| `tableRows`             | `{ label: string; values: (number \| null)[] }[]`                                      | —            | Rows for the data table. Without rows there is no table. |
| `tableLabelHeader`      | `string`                                                                               | `''`         | Header of the row-label column. |
| `tableColumns`          | `string[]`                                                                             | One per series label | Value column headers. |
| `valueFormatter`        | `(value: number) => string`                                                            | `formatFull` in `locale` | Formats table cells. |
| `tableColumnFormatters` | `((value: number) => string \| undefined)[]`                                           | —            | Per-column formatters, by value-column index. A missing entry uses `valueFormatter`. |

### Hooks and helpers

| Export | Signature | Description |
| ------ | --------- | ----------- |
| `useChartWidth` | `<T extends HTMLElement>() => [ref: (node: T \| null) => void, width: number, size: ChartSize]` | Measures an element with `ResizeObserver`. Returns `FALLBACK_CHART_WIDTH` until measured. |
| `useHiddenSeries` | `(initial?: string[]) => [hidden: Set<string>, toggle: (key: string) => void]` | Uncontrolled hidden-series state. |
| `useResolvedSeries` | `(series: ChartSeries[], hidden: Set<string>) => ResolvedSeries[]` | Fills in `label` (defaults to `key`), `color` (from `seriesColor`) and `hidden`. |
| `tableRowsFrom` | `(data: ChartDatum[], xKey: string, series: ChartSeries[], labelFormatter?: (label: string \| number) => string) => { label: string; values: (number \| null)[] }[]` | Table rows in series order. Non-finite values become `null`. |
| `FALLBACK_CHART_WIDTH` | `640` | Width used before measurement. |

`ResolvedSeries` is `ChartSeries` with `label: string`, `color: string` and `hidden: boolean` all
required.

### Tooltip

`ChartTooltipContent` paints the inside of a Recharts tooltip. Pass it as
`<Tooltip content={<ChartTooltipContent … />} />`. Recharts supplies `active`, `payload` and `label`.
It renders nothing while inactive or when no rows remain.

| Prop              | Type                                          | Default      | Description |
| ----------------- | --------------------------------------------- | ------------ | ----------- |
| `active`          | `boolean`                                     | —            | Set by Recharts. |
| `payload`         | `readonly TooltipPayloadItem[]`               | —            | Set by Recharts. Items with `hide: true` are skipped. For array values, the last element is shown. |
| `label`           | `string \| number`                            | —            | Set by Recharts. The heading. |
| `labelKey`        | `string`                                      | —            | Take the heading from this property of the hovered datum (`payload[0].payload`) instead of `label`. |
| `labelFormatter`  | `(label: string \| number) => string`         | —            | Formats the heading. |
| `valueFormatter`  | `(value: number) => string`                   | `formatFull` in `locale` | Formats numeric values. String values are shown as is. |
| `valueFormatters` | `Record<string, ((value: number) => string) \| undefined>` | — | Formatters by row `dataKey`. A row without an entry uses `valueFormatter`. |
| `locale`          | `string`                                      | `'en-US'`    | Locale for the default formatter. |
| `unit`            | `string`                                      | —            | Appended to every value. |
| `hideLabel`       | `boolean`                                     | `false`      | Omit the heading. |
| `hideNullRows`    | `boolean`                                     | `true`       | Drop rows whose value is `null` or missing, instead of showing `—`. |
| `footer`          | `ReactNode`                                   | —            | A closing line under the rows. |
| `className`       | `string`                                      | —            | Added to `.sui-viz__tooltip`. |

Exported types: `ChartTooltipContentProps`, `TooltipPayloadItem` (`name`, `dataKey`, `value`,
`color`, `fill`, `stroke`, `hide`, `payload`, all optional) and `TooltipRow`
(`{ key: string; label: ReactNode; value: number | string | null; color: string }`).

| Constant           | Value |
| ------------------ | ----- |
| `TOOLTIP_DEFAULTS` | Recharts `<Tooltip>` props: `wrapperStyle: { outline: 'none', zIndex: 20 }`, `allowEscapeViewBox: { x: false, y: true }`, `offset: 12`, `isAnimationActive: false` |
| `CROSSHAIR_CURSOR` | `{ stroke: 'var(--border)', strokeWidth: 1 }` |
| `BAND_CURSOR`      | `{ fill: 'color-mix(in oklab, var(--border) 35%, var(--sui-chart-surface, var(--card)))', fillOpacity: 0.6 }` |

### Axis prop factories

Recharts identifies `<XAxis>`, `<YAxis>` and `<CartesianGrid>` by component type, so the kit exports
prop objects to spread onto them rather than wrapper components.

| Export | Options | Returns |
| ------ | ------- | ------- |
| `gridProps(axis?)` | `'x' \| 'y' \| 'both'`, default `'y'` | Solid hairline grid in `var(--border)`. `'y'` draws horizontal lines. |
| `categoryAxisProps(options)` | `dataKey: string`, `size: ChartSize`, `width: number`, `labels: string[]` (formatted, used to predict collisions), `formatter?: LabelFormatter`, `hide?: boolean`, `vertical?: boolean` (categories on the Y axis) | Tick styling, thinning interval, angle and height from `categoryTicks`. With `vertical`, a category axis 56–168 px wide (96 px maximum at `xs`) showing every label. |
| `valueAxisProps(options)` | `size: ChartSize`, `values: number[]`, `formatter?: ValueFormatter` (default `formatCompact`), `hide?: boolean`, `horizontal?: boolean` (values on the X axis), `domain?: [bound, bound]` where a bound is `number \| string \| ((dataBound: number) => number)` | Tick styling, a width sized to the widest tick (28–72 px, 44 px maximum at `xs`) and a tick count of 4 at `xs` or 5 above. `horizontal` returns `type: 'number'` and a 24 px height instead. |

### Theme helpers and constants

| Export | Value or signature |
| ------ | ------------------ |
| `seriesColor(index, explicit?)` | Colour for series `index`. See [Colours](#colours). |
| `CHART_SLOT_ORDER` | `[1, 3, 5, 2, 4]` |
| `MAX_SERIES` | `5` |
| `CHART_SURFACE` | `'var(--sui-chart-surface, var(--card))'` |
| `AXIS_LINE_COLOR` | `'var(--border)'` |
| `AXIS_TEXT_COLOR` | `'var(--muted-foreground)'` |
| `MARK_GAP` | `2`: surface gap between touching marks |
| `MAX_BAR_SIZE` | `24` |
| `BAR_RADIUS` | `4` |
| `LINE_WIDTH` | `2` |
| `DOT_RADIUS` | `4` |
| `TICK_FONT_SIZE` | `11` |
| `DEFAULT_HEIGHT` | `{ xs: 190, sm: 224, md: 264, lg: 300 }` |
| `DEFAULT_MARGIN` | Per size: `xs` `{ top: 8, right: 4, bottom: 0, left: 0 }`, `sm` `{ 8, 8, 0, 0 }`, `md` `{ 12, 12, 0, 0 }`, `lg` `{ 12, 16, 0, 0 }` |
| `DEFAULT_CHART_LOCALE` | `'en-US'` |
| `SIZE_BREAKPOINTS` | `[{ size: 'lg', min: 900 }, { size: 'md', min: 640 }, { size: 'sm', min: 420 }, { size: 'xs', min: 0 }]` |
| `sizeForWidth(width)` | `ChartSize` for a width |
| `resolveResponsive(value, size)` | Resolves a `Responsive<T>`, taking the nearest smaller defined size, or `undefined` |
| `categoryTicks({ count, width, longestLabel, size })` | `{ interval, angle, height }` for a category axis |
| `valueAxisWidth(ticks, size)` | Pixel width for a column of tick strings |
| `formatCompact(value)` | `1.2B`, `1.2M`, `52k`, `938` (one decimal at most). `—` for non-finite values |
| `formatFull(value, locale = 'en-US')` | `value.toLocaleString(locale)`. `—` for non-finite values |
| `formatPercent(value, digits = 0)` | `` `${value.toFixed(digits)}%` ``. `—` for non-finite values |

Types: `ChartSize` (`'xs' | 'sm' | 'md' | 'lg'`), `Responsive<T>` (`T | Partial<Record<ChartSize, T>>`),
`ValueFormatter` (`(value: number) => string`), `LabelFormatter` (`(label: string | number) => string`),
`BaseChartProps`, `ChartDatum`, `ChartSeries`, `ResolvedSeries`, and each chart's props type
(`TrendChartProps`, `BarChartProps`, `DonutChartProps`, `DonutSlice`, `GaugeChartProps`,
`GaugeThresholds`, `ScatterChartProps`, `SparklineProps`).

### Styling hooks

| Selector | Element |
| -------- | ------- |
| `[data-slot="chart"]`, `.sui-viz` | Outer frame |
| `.sui-viz__header`, `.sui-viz__title`, `.sui-viz__description`, `.sui-viz__actions` | Header |
| `.sui-viz__canvas` | Plot box (inline height) |
| `.sui-viz__empty`, `.sui-viz__loading` | Empty and loading states |
| `.sui-viz__legend`, `.sui-viz__legend-item[data-hidden]`, `.sui-viz__swatch` | Legend |
| `.sui-viz__center`, `.sui-viz__center-value`, `.sui-viz__center-label` | Donut and gauge centre |
| `.sui-viz__tooltip`, `.sui-viz__tooltip-label`, `.sui-viz__tooltip-row`, `.sui-viz__tooltip-footer` | Tooltip |
| `.sui-viz__table-toggle`, `.sui-viz__table` | Data table view |
| `.sui-viz__sparkline` | Sparkline wrapper |

## Troubleshooting

- **"Cannot find module 'recharts'".** Install the peer dependency (see [Installation](#installation)).
- **The plot area is blank.** Recharts draws only after it measures a non-zero box. Check that the
  chart's container has a width (for example, a flex child without `min-width: 0` inside another
  shrinking parent) and that the page is not a test environment without layout.
- **"Functions cannot be passed directly to Client Components".** A formatter or function `height`
  was passed from a Server Component. See [Server rendering](#server-rendering).
- **Gaps between stacked bars look like the wrong colour.** Set `--sui-chart-surface` on the chart
  or an ancestor to match the surface behind it (see [Colours](#colours)).

More in [Troubleshooting](troubleshooting.md).

## Related

- [Theming](theming.md): `--chart-1` … `--chart-5` and generated themes
- [Card](components/card.md): stat and summary cards to place beside a `Sparkline`
- [Data table](data-table.md): when the numbers themselves are the product
- [Accessibility](accessibility.md)
- [Next.js](nextjs.md)

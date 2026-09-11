# Charts

> Looking for the Recharts set — `TrendChart`, `GaugeChart`, `ScatterChart`, the container-
> responsive rules and the table view? That is a separate entry point, documented in
> [Charts on Recharts](./charts-recharts.md). This page covers the dependency-free SVG charts
> exported from the root package. Both sets draw from the same `--sui-chart-1..5` tokens.

Dependency-free SVG, drawn from `--sui-chart-1..5`. A chart belongs to its
[project](../guide/projects.md) the same way a button does, and adding charts to an app costs nothing
in bundle size beyond the components used.

---

## The shared API

```tsx
<LineChart
  data={months}
  xKey="month"
  series={[
    { key: 'bookings', label: 'Bookings' },
    { key: 'completed', label: 'Completed' },
  ]}
/>
```

| Prop                               |                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `data`                             | An array of objects.                                                                                        |
| `xKey`                             | The key holding each datum's category or time label.                                                        |
| `series`                           | `{ key, label?, color? }[]`. `key` indexes into each datum.                                                 |
| `height`                           | Drawing height in pixels; width always fills the container. Default `220`.                                  |
| `legend`                           | `true` · `false` · `'interactive'` (click to hide a series). Default `'interactive'` for cartesian charts.  |
| `startAtZero`                      | Keep zero on the value axis — at the top for all-negative data. Default `true`.                             |
| `showGrid` `showXAxis` `showYAxis` | Default `true`.                                                                                             |
| `valueFormatter`                   | Default is compact: `1.2M`, `52k`. The exact figure goes in the tooltip.                                    |
| `labelFormatter`                   | Applied to the x-axis labels and the tooltip heading.                                                       |
| `margin`                           | `{ top, right, bottom, left }`, partial.                                                                    |
| `emptyMessage`                     | Shown instead of an empty box when there is nothing to plot.                                                |
| `ariaLabel`                        | The chart's accessible name. Default: a generated summary — "Line chart of Bookings, 12 points from Jan…".  |
| `showTableToggle`                  | Put every plotted value in a table, visually hidden until a "Show data" toggle reveals it. Default `false`. |
| `tableToggleLabel`                 | `[show, hide]` labels for that toggle. Default `['Show data', 'Hide data']`.                                |

`color` on a series is any CSS colour, but leaving it unset is usually right: the default is
`--sui-chart-N`, which the project generator derives from your brand colours.

A `null`, missing or non-finite value is **no reading**, not a zero: nothing is plotted for it,
the tooltip shows "—", and a line (and its area) breaks at the gap rather than dipping to the
baseline — the same as the Recharts set. Pass `connectNulls` to `LineChart` to join the readings
either side instead. A single datum is centred rather than pinned to the left edge.

---

## Line and area

```tsx
<LineChart data={months} xKey="month" series={series} />
<LineChart data={months} xKey="month" series={series} area smooth />
<LineChart data={months} xKey="month" series={series} showPoints />
```

One component for both: an area chart _is_ a line chart with the space beneath it filled, and
splitting them would duplicate the axes, the domain calculation and the pointer handling to
change one path.

`smooth` places control points along the _local_ slope rather than through a global spline,
so the curve never overshoots into impossible territory — a visitor count dipping below zero
between two positive days.

Hovering snaps to the nearest index rather than to a hit area per point, so the tooltip never
blinks out between marks.

## Bar

```tsx
<BarChart data={months} xKey="month" series={series} />
<BarChart data={months} xKey="month" series={series} stacked />
<BarChart data={months} xKey="month" series={series} barRatio={0.5} />
```

`barRatio` is how much of each slot is bar rather than gap, 0–1. Each column has a
full-height hover target, so the tooltip appears anywhere in the column and not only over the
bar itself. Stacking handles negative values by growing downward from the baseline.

`BarChart` declares a `horizontal` prop, but it is **not implemented** — it is ignored and the
bars stay vertical. For horizontal bars use `BarChart` from
[`@shining-technologies/ui-kit-react/recharts`](./charts-recharts.md) with `orientation="bars"`.

## Pie and donut

```tsx
<PieChart data={slices} />                                        {/* donut by default */}
<PieChart data={slices} innerRadius={0} />                        {/* solid pie */}
<PieChart data={slices} centerLabel="4,812" centerCaption="new customers" />
```

`data` is `{ key, label?, value, color? }[]`. It takes `ariaLabel`, `showTableToggle` and
`tableToggleLabel` like the cartesian charts; the table lists each slice's value and share.

The default is a donut because the eye compares arc lengths better than it compares wedge
areas, and the hole gives the total somewhere to live. Slices start at twelve o'clock — a
chart that begins at three reads as rotated, because every clock and every pie chart people
know does not.

## Sparkline

```tsx
<Sparkline data={[12, 18, 15, 24, 22, 31]} area />
<Sparkline data={values} color="var(--sui-chart-3)" height={40} />
```

Sized in its own `viewBox` rather than measured, because a sparkline lives inside a table cell
or a stat card and has to render correctly on the first paint. The distortion a stretched
viewBox causes is invisible here since there is no type to stretch.

`height` (default `28`) is applied inline, so it wins over the stylesheet's `2rem`, and a `style`
you pass merges with it rather than replacing it. Non-finite values are skipped, and a single
reading is drawn as a level line across the box, since one point has no trend. A sparkline
is `aria-hidden` — decoration beside a figure that already says the number. If it stands
alone, pass `role="img"` and an `aria-label`.

---

## Sizing and SSR

Full charts are drawn at real pixel sizes rather than in a scaled `viewBox`: a scaled viewBox
stretches the type and the stroke widths along with the geometry, so a wide chart ends up
with wide letters.

Width comes from a `ResizeObserver`. Where one is unavailable — server rendering, a test
environment — the chart draws at `FALLBACK_CHART_WIDTH` (640) instead of rendering nothing,
so the markup is always complete. In a browser the callback ref runs during commit, so the
real width is known before the first paint and the fallback is never seen.

## Accessibility

Every full chart's `<svg>` is `role="application"` with a name: `ariaLabel` if you pass one,
or a generated summary of what is plotted. Pass a sentence that says what the chart _shows_ —
"Bookings rose every month" — rather than what it is. An application rather than an image,
because that is what makes a screen reader hand the arrow keys to the chart instead of reading
on past it.

- **Keyboard.** The plot is one tab stop. Left/Right step through the data (Up/Down too on a
  pie, which has no horizontal), Home/End jump to the ends, and Escape clears the point. The
  keyboard's point shows the same marker and tooltip as a hover, and is announced through a
  polite live region — "Feb: Booked 3, Completed 1". A pie steps only through its drawn
  slices.
- **The numbers in text.** `showTableToggle` renders every plotted value as a real table, in the
  accessibility tree whenever it is on and visually hidden until the "Show data" toggle reveals
  it. It is off by default here (the [Recharts set](./charts-recharts.md) has it on) — turn it
  on wherever the figures matter, because the drawing is one picture to a screen reader.
- **Legends are a plain list** unless series can be hidden. Then each entry is a `<button>`
  with `aria-pressed`, rather than a disabled button announced as "unavailable".

## The chart palette

Five series whose hues walk from the project's `primary` to its `accent`, so a chart looks
like it belongs to the brand rather than to a generic categorical palette. Lightness rises
toward the middle of the walk and falls after it, which keeps neighbouring series apart in
greyscale and for a colour-blind reader — and puts the yellow hues where yellow actually
lives, rather than forcing a mid-hue dark and turning a green→orange family into olive.

`tests/theming.test.tsx` asserts that every palette produces five distinct series with
lightness separation between neighbours.

## Building your own

The frame and the maths are exported, so a chart type the kit does not ship can reuse them
rather than reinventing them:

```tsx
import {
  ChartContainer,
  useMeasure,
  useHiddenSeries,
  seriesColor,
  linearScale,
  niceDomain,
  ticks,
  linePath,
  smoothPath,
  areaPath,
  arcPath,
  formatCompact,
} from '@shining-technologies/ui-kit-react'

;<ChartContainer height={240} series={series} legend="interactive">
  {({ width, height }) => (
    <svg className="sui-chart__svg" width={width} height={height}>
      …
    </svg>
  )}
</ChartContainer>
```

`ChartContainer` is a render prop rather than a wrapper so your chart receives the measured
pixel box and can lay itself out, instead of guessing and correcting after the first paint.
Use the `.sui-chart__*` classes for the parts — they are already token-driven.

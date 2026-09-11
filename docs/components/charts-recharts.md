# Charts on Recharts

Six chart forms built on [Recharts](https://recharts.org), sharing one frame, one palette,
one tooltip and one set of responsive rules. Series colours come from `--sui-chart-1..5`, the
same tokens everything else in the kit draws from, so these follow a [project](../guide/projects.md)
switch with no adapter layer.

```tsx
import { TrendChart, BarChart } from '@shining-ui-kit/react/recharts'
import '@shining-ui-kit/react/styles.css'
;<TrendChart
  title="Bookings"
  description="Booked against completed"
  data={months}
  xKey="month"
  series={[
    { key: 'booked', label: 'Booked' },
    { key: 'completed', label: 'Completed' },
  ]}
/>
```

> **This is a separate entry point.** `recharts` is an _optional_ peer dependency and is only
> pulled into a bundle that imports `@shining-ui-kit/react/recharts`. The root package still
> costs nothing beyond the components used, and the [dependency-free SVG charts](./charts.md)
> are still there and still exported from the root. Install `recharts@^2.15` alongside the
> kit to use this set.

---

## Choosing a form

The data's job picks the chart, not the other way round.

| The question                                   | The form                 |
| ---------------------------------------------- | ------------------------ |
| How has this moved over time?                  | `TrendChart`             |
| How do these categories compare?               | `BarChart`               |
| What is this made of?                          | `DonutChart`             |
| How close is this to its target?               | `GaugeChart`             |
| Do these two measures move together?           | `ScatterChart`           |
| What is the number, and which way is it going? | `StatTile` / `Sparkline` |

Two rules the components will not enforce for you:

- **Never two value axes.** Two measures on different scales are two charts, small multiples,
  or both indexed to a common base. Nothing here offers a second Y axis, deliberately.
- **Past about five series, colour stops working.** Fold the tail into an "Other" row or
  facet into small multiples. `MAX_SERIES` is the ceiling the palette can actually carry.

---

## The shared API

Every chart accepts these, on top of its own props.

| Prop                                 |                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `title` `description` `actions`      | The header. `actions` sits on the trailing edge — put filters and range pickers there.                       |
| `height`                             | Pixels, one per size bucket (`{ xs: 180, lg: 320 }`), or a function of the measured box. Width always fills. |
| `legend`                             | `'auto'` (default for most) · `'always'` · `'interactive'` (click to hide a series) · `false`.               |
| `emptyMessage`                       | Shown instead of an empty plot.                                                                              |
| `loading`                            | Replaces the plot with a shimmer, and withholds the table view.                                              |
| `showTableToggle` `tableToggleLabel` | The accessible table view. On by default; see below.                                                         |

Cartesian charts add `data`, `xKey`, `series`, `showGrid`, `valueFormatter` and
`labelFormatter`. `series` is `{ key, label?, color? }[]`, where `key` indexes into each
datum — the same shape the [SVG charts](./charts.md) use.

### `'auto'` legends

One series gets no legend: there is a single colour, and the title already says what it
belongs to. A box with one swatch restates the title and costs a row. From two series up the
legend is always there — identity never rests on colour matching alone.

---

## The forms

### TrendChart — change over time

```tsx
<TrendChart data={months} xKey="month" series={series} />
<TrendChart data={months} xKey="month" series={series} variant="area" stacked smooth />
<TrendChart data={months} xKey="month" series={series} reference={{ value: 150, label: 'Target' }} />
```

One component for line and area: an area chart _is_ a line chart with the space beneath it
filled, and splitting them would duplicate the axes, the domain and the pointer handling to
change one path.

`smooth` uses a monotone fit, so the curve never overshoots into impossible territory — a
visitor count dipping below zero between two positive days. `showPoints` defaults to `'auto'`
and marks points only when they are sparse enough to read.

An unstacked area is a **wash** (18% at the top, fading out) so overlapping series stay
readable. A stacked one is opaque, because parts of a whole have to be, and the segments are
held apart by a gap in the surface colour.

### BarChart — magnitude across categories

```tsx
<BarChart data={rows} xKey="suburb" series={[{ key: 'jobs' }]} sort="desc" showValues />
<BarChart data={rows} xKey="month" series={series} stacked />
<BarChart data={rows} xKey="month" series={series} stacked="percent" />
```

`orientation` defaults to `'auto'`: columns while there is room, flipping to horizontal bars
once the container is too narrow to hold the category labels flat. A long label reads fine
down the side of a bar chart and never fits under a column. When it flips, the height grows
with the category count — one row per category rather than twenty bars crushed into 264px.

`stacked="percent"` normalises a _copy_ of the data. The table view and the tooltip still
carry the underlying counts, so nobody has to reverse-engineer a percentage.

`showValues` is ignored when stacked: an interior segment has no free end to label into, and
cropping the text there is worse than leaving it to the legend and tooltip.

### DonutChart — part of a whole

```tsx
<DonutChart data={slices} centerLabel="jobs" />
<DonutChart data={slices} variant="pie" />
```

`data` is `{ key, label?, value, color? }[]`. The default is a donut because the hole is the
only place a part-to-whole chart can state the whole, and reading a wedge against a stated
total is far easier than estimating angles.

Sound for a handful of slices and nothing more. Past about six, wedge angles stop being
comparable and a ranked `BarChart` reads better — the component will not stop you, because
that is a judgement about your data.

### GaugeChart — one measure against a target

```tsx
<GaugeChart title="SLA" value={94.2} centerLabel="on time" />
<GaugeChart value={61} thresholds={{ good: 0.8, warning: 0.6 }} />
```

A gauge is a stat tile that also shows how much room is left, which is the only reason to
spend a card on one number. With no target to read against, a plain `Stat` says the same
thing in less space.

`thresholds` is opt-in. Severity colour is a _claim_ about the data, and most gauges are a
neutral share of a target with no opinion attached — turn it on for the ones that do have
one. The figure in the middle carries the accessible name, so the arc stays decorative.

### ScatterChart — whether two measures move together

```tsx
<ScatterChart data={quotes} xKey="days" yKey="value" groupKey="channel" labelKey="client" />
<ScatterChart data={quotes} xKey="days" yKey="value" sizeKey="headcount" />
```

The one form here that answers a question a bar or a line cannot: a trend chart shows both
measures against time and leaves the reader to correlate them by eye, which is exactly the
comparison people get wrong.

`sizeKey` encodes a third measure as the point's **area**, not its radius — a circle whose
radius is the value makes a doubled figure look four times as big.

### StatTile and Sparkline — figures

```tsx
<StatTile label="Revenue" value={128400} delta={{ value: 12.4, period: 'vs last month' }} trend={weeks} />
<StatTile label="Churn" value="4.1%" delta={{ value: 0.8, upIsGood: false }} />
<Sparkline data={values} ariaLabel="Rising over seven weeks" />
```

A single value plotted as a chart is a chart with one bar in it. The tile says the same thing
in a quarter of the space, and the sparkline adds the direction the bar could not have shown
anyway.

`delta.upIsGood` separates _direction_ from _whether it is welcome_: rising revenue and rising
churn point the same way and mean the opposite. The arrow shows direction, the colour shows
the tone, and the arrow is never the only signal.

A `Sparkline` with no `ariaLabel` is hidden from the accessibility tree — which is correct
when the figure beside it already says everything, and wrong when it stands alone.

---

## Responsive: the container, not the viewport

Every responsive decision here is made from the chart's **own measured width**. A chart in a
narrow dashboard column on a 27-inch monitor has exactly the problems of a chart on a phone,
and a viewport media query cannot see that.

| Bucket | Width     |
| ------ | --------- |
| `xs`   | < 420px   |
| `sm`   | 420–639px |
| `md`   | 640–899px |
| `lg`   | ≥ 900px   |

What changes across them:

- **Height** shrinks with the container (190 → 300px), unless you set `height` yourself.
- **Category labels thin before they angle.** Dropping every other label costs nothing —
  the tooltip and the table still carry every value — so that happens first, and labels are
  only rotated when thinning alone would gut the axis.
- **The value axis leaves at `xs`.** A plot squeezed to 200px wide has no pixels for a tick
  column. Pass `showYAxis` / `showValueAxis` explicitly to override.
- **The bar chart flips orientation**, and grows its height with the category count.
- **Scatter axis titles drop** below `md`; the card title and the tooltip still name them.
- **The header stacks** below 26rem, so filters in `actions` get full-width controls instead
  of a 40px select. That one is a CSS container query — no JavaScript involved.

`height` also takes a function of the measured box when a rule needs to be yours:

```tsx
<BarChart height={({ size }) => (size === 'xs' ? 240 : rows.length * 34)} … />
```

---

## Accessibility

- **A table carries every value**, always in the DOM and revealed by a toggle. A chart is an
  image to a screen reader however carefully it is drawn, so the numbers exist in text —
  gating them behind a control the reader has to find first would make them optional. It also
  opens automatically for print. Turn it off per chart with `showTableToggle={false}`.
- **Keyboard navigation** comes from Recharts' `accessibilityLayer` on the cartesian charts:
  focus the plot and arrow through the points, with the tooltip following.
- **Text never wears the series colour.** Marks carry identity; labels, values and legends
  stay in text tokens with a coloured swatch beside them. A light categorical hue is
  illegible as type.
- Legends are `<button>`s with `aria-pressed` when interactive, and disabled when not.

---

## The palette — and a known problem with it

Slots are assigned in the order **1, 3, 5, 2, 4**, not 1–5.

The generated ramp walks the brand hue from teal through olive to brown, so consecutive
tokens are perceptual neighbours. Taking it in order hands the two closest colours to the
first two series of every two-series chart — the commonest case there is. Spreading the walk
puts the widest gap where it is actually needed.

Measured on the default Shining project, against ΔE (OKLab ×100) on adjacent slots:

| Palette                  | Worst adjacent pair, normal vision | Under protan/deutan |
| ------------------------ | ---------------------------------- | ------------------- |
| Ramp order (1,2,3,4,5)   | 12.7 light · 10.4 dark             | 8.6 · 5.9           |
| Spread order (1,3,5,2,4) | **13.6** light · **17.0** dark     | **6.9** · **11.9**  |

**Dark mode passes. Light mode still does not.** The target is ΔE ≥ 15 for normal vision, and
light mode reaches 13.6. Two further problems belong to the generator rather than to the
charts:

- `--sui-chart-1` (`#007b65`) sits below the chroma floor and reads closer to grey than a
  categorical slot should.
- `--sui-chart-3` (`#abb25f`) measures 2.27:1 against a white card — under the 3:1 a mark
  needs to be distinguishable from its surface.
- In dark mode all five steps sit above the lightness band, so the set reads flat and bright.

The fix is in `packages/core/src/project/generate-palette.ts`, which derives the chart ramp
by walking `primary` → `accent`: a hue walk is a _sequential_ construction, and it is being
asked to do a _categorical_ job. Until it is regenerated, identity in these charts never rests
on hue alone — every multi-series chart carries a legend, a tooltip and a table view, and
touching marks are separated by a gap in the surface colour rather than by their colours.

Re-measure any change with the palette validator before shipping it.

---

## Mark specs

Fixed across every chart, so the set reads as one system:

| Mark             | Spec                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Bar / column     | ≤ 24px thick; 4px rounded data-end, square at the baseline               |
| Line             | 2px, round join and cap                                                  |
| Marker           | r ≥ 4, with a 2px ring in the surface colour                             |
| Area fill        | a wash — 18% fading to 2% — unless stacked, where it is opaque           |
| Gridlines / axes | `--sui-border`, hairline, **solid**; a dashed rule is more ink, not less |

Touching marks are separated by a **2px gap in the surface colour**, never by a border: a
stroke adds data-weight ink that is not data. That colour is `--sui-chart-surface`, which
defaults to `--sui-card`. Put a chart on a different surface and override that one variable:

```css
.my-panel .sui-viz {
  --sui-chart-surface: var(--sui-background);
}
```

---

## Building your own

The frame, the axis prop factories, the tooltip and the theme constants are all exported, so
a form the kit does not ship can reuse them rather than reinventing them:

```tsx
import {
  ChartFrame,
  categoryAxisProps,
  gridProps,
  valueAxisProps,
  ChartTooltipContent,
  TOOLTIP_DEFAULTS,
  useHiddenSeries,
  useResolvedSeries,
  seriesColor,
} from '@shining-ui-kit/react/recharts'

;<ChartFrame title="Mine" series={resolved} height={260}>
  {({ size, width }) => (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>…</FunnelChart>
    </ResponsiveContainer>
  )}
</ChartFrame>
```

`ChartFrame` is a render prop rather than a wrapper so your chart receives the measured box
and its size bucket, and can make its own axis and margin decisions — those differ per chart
type and cannot be made generically.

The axis helpers are **prop factories, not components**, on purpose: Recharts identifies
`<XAxis>`, `<YAxis>` and `<CartesianGrid>` by inspecting its children's component type, so
wrapping one in a component of your own makes it invisible to the chart.

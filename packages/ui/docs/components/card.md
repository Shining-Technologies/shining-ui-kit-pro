# Card

Surfaces for grouped content, and the dashboard pieces built on them. `Card` and its parts are a
composable panel. `StatsCard`, `MetricTile`/`MetricGrid`, `BreakdownList` and `SummaryCard` show
figures and counts. `StepCard` and `StatusFlow` describe or track a process.

```tsx
import {
  Card,
  CardHeader,
  CardIcon,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  StatsCard,
  MetricGrid,
  MetricTile,
  BreakdownList,
  SummaryCard,
  StepCard,
  StatusFlow,
} from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/card'
```

**Server and client.**

| Module                                                                          | Directive      | Exports                                                                                           |
| ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `Card` and parts, `cardVariants`, `cardIconVariants`                             | none           | Server Components                                                                                 |
| `MetricTile`, `MetricGrid`                                                       | none           | Server Components                                                                                 |
| `StepCard`                                                                      | none           | Server Components                                                                                 |
| `SummaryCard`                                                                   | none           | Server Components (it renders the client `BreakdownList`)                                         |
| `StatsCard`, `statsCardVariants`                                                 | `'use client'` | Client component                                                                                  |
| `BreakdownList`                                                                 | `'use client'` | Client component                                                                                  |
| `StatusFlow`                                                                    | `'use client'` | Client component (reads the status registry)                                                      |

You can render client components from a Server Component, but their props must be serialisable.
From a Server Component you cannot pass `StatsCard`'s `onClick`, `BreakdownList`'s `formatValue`,
or `SummaryCard`'s `breakdownProps.formatValue`. JSX elements work, including a client chart
passed to `chart`.

Exported types: `CardProps`, `CardHeaderProps`, `CardTitleProps`, `CardIconProps`,
`CardFooterProps`, `StatsCardProps`, `StatsTrend`, `MetricTileData`, `MetricTileProps`,
`MetricGridProps`, `BreakdownItem`, `BreakdownListProps`, `SummaryCardProps`, `SummaryMetric`,
`StepCardProps`, `StepCardState`, `StatusFlowProps`, `StatusFlowStep`, `StatusFlowStepState`.

Several props take an `AccentTone`: one of the six status tones (`'neutral' | 'primary' | 'success'
| 'warning' | 'destructive' | 'info'`) or a chart tone (`'chart-1'` to `'chart-5'`). Each resolves
to a theme token through the `--sui-tone` custom property.

## Card

A panel. `Card` provides the box and the vertical spacing, and each part provides its own padding.
Content that should reach the card's edges, such as a chart or a table, goes directly inside
`Card` instead of inside `CardContent`.

```tsx
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
  PencilIcon,
} from '@shining-technologies/ui'

<Card>
  <CardHeader bordered>
    <CardIcon tone="info">
      <PencilIcon />
    </CardIcon>
    <CardTitle as="h2">Revenue</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
    <CardAction>
      <Button variant="ghost" size="sm">Export</Button>
    </CardAction>
  </CardHeader>
  <CardContent>$248,120</CardContent>
  <CardFooter bordered>Updated 5 minutes ago</CardFooter>
</Card>
```

| Prop          | Type                              | Default     | Description                                                                                         |
| ------------- | --------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `variant`     | `'default' \| 'flat' \| 'ghost'`  | `'default'` | `default`: border, surface fill and shadow. `flat`: the same without the shadow. `ghost`: no border, fill or shadow; layout only. |
| `interactive` | `boolean`                         | `false`     | Hover styling for a card that is itself clickable, usually combined with `asChild` on a link.       |
| `asChild`     | `boolean`                         | `false`     | Render the single child element instead of a `<div>`.                                               |

Also accepts all `<div>` props. Styling hooks: `data-slot="card"`, classes `sui-card`,
`sui-card--flat`, `sui-card--ghost` and `sui-card--interactive`.

A whole card as a link:

```tsx
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@shining-technologies/ui'

<Card asChild interactive>
  <Link href="/jobs/2043">
    <CardHeader>
      <CardTitle>JOB-2043</CardTitle>
      <CardDescription>Roof inspection, Tuesday</CardDescription>
    </CardHeader>
  </Link>
</Card>
```

### Card parts

| Part              | Element | Props                                                                                        | Notes                                                                                                       |
| ----------------- | ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `CardHeader`      | `div`   | `bordered?: boolean` draws a rule under it. Also all `<div>` props.                          | `data-slot="card-header"`, `sui-card__header`, `sui-card__header--bordered`.                                |
| `CardTitle`       | `as`    | `as?: 'div' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'`, default `'div'`. Also all HTML attributes. | A `div` does not appear in heading navigation. Pass the heading level that fits the page outline. `data-slot="card-title"`. |
| `CardDescription` | `p`     | All `<p>` props.                                                                             | `data-slot="card-description"`.                                                                             |
| `CardAction`      | `div`   | All `<div>` props.                                                                           | Placed at the top right of the header, spanning the title and description rows. `data-slot="card-action"`.  |
| `CardIcon`        | `span`  | `size?: 'sm' \| 'default' \| 'lg'` (default `'default'`), `tone?: AccentTone` (default `'primary'`). Also all `<span>` props. | A tinted icon tile. Always `aria-hidden`. As the first child of `CardHeader` it takes its own column beside the title and description. `data-slot="card-icon"`. |
| `CardContent`     | `div`   | All `<div>` props.                                                                           | Padded body. `data-slot="card-content"`.                                                                    |
| `CardFooter`      | `div`   | `bordered?: boolean` draws a rule above it. Also all `<div>` props.                          | `data-slot="card-footer"`, `sui-card__footer--bordered`.                                                    |

`cardVariants({ variant?, interactive? })` and `cardIconVariants({ size? })` are the
class-variance-authority functions behind `Card` and `CardIcon`.

## StatsCard

A single metric as a complete card: label, value, change, footnote, optional badge, icon and small
chart, and a loading state.

```tsx
import { Badge, StatsCard } from '@shining-technologies/ui'
import { Sparkline } from '@shining-technologies/ui/charts'

<StatsCard
  label="Revenue"
  value="$248,120"
  change="+12.4%"
  trend="up"
  description="vs last month"
  badge={<Badge>30d</Badge>}
  chart={<Sparkline data={[182, 190, 201, 198, 224, 248]} />}
/>
```

`chart` accepts any node, including block content, and renders it full-width below the figure.
`Sparkline` comes from `@shining-technologies/ui/charts`, which requires the optional `recharts`
peer dependency (see [Charts](../charts.md)).

| Prop          | Type                           | Default     | Description                                                                                                                |
| ------------- | ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `label`       | `ReactNode`                    | required    | What the figure measures.                                                                                                  |
| `value`       | `ReactNode`                    | required    | The figure.                                                                                                                |
| `change`      | `ReactNode`                    |             | The change, for example `'+12.4%'`. Rendered only when it is not `undefined`.                                              |
| `trend`       | `'up' \| 'down' \| 'neutral'`  | `'neutral'` | Whether the change is good or bad news. Set it explicitly rather than inferring it from the sign: a fall in churn is `up`. `up` and `down` add an arrow icon. |
| `trendLabel`  | `string`                       | see description | Visually hidden text read after the change. Defaults to `'favourable'` for `up`, `'unfavourable'` for `down`, and nothing for `neutral`. Pass `''` for nothing, or your own wording (for example in another language). |
| `description` | `ReactNode`                    |             | Footnote beside the change, for example `'vs last month'`.                                                                 |
| `badge`       | `ReactNode`                    |             | Usually a `Badge`: the period, or a state.                                                                                 |
| `icon`        | `ReactNode`                    |             | Decorative icon in the header (`aria-hidden`).                                                                             |
| `loading`     | `boolean`                      | `false`     | Replaces the value with a skeleton and sets `aria-busy`.                                                                   |
| `onClick`     | `() => void`                   |             | Makes the whole card clickable through a `<button type="button">` stretched over it. See below.                            |
| `chart`       | `ReactNode`                    |             | A sparkline or small chart, full-width below the figure.                                                                    |
| `size`        | `'sm' \| 'default' \| 'lg'`    | `'default'` | Card size.                                                                                                                 |
| `interactive` | `boolean`                      | `false`     | Hover styling. Always on when `onClick` is set.                                                                            |

Also accepts all `<div>` props except `title` and `onClick`. The root is always a `<div>`, and the
ref goes to it.

**Clickable cards.** With `onClick`, the card renders its content as usual and adds an empty
`<button type="button">` as its last child, positioned over the whole card
(`sui-stats-card__action`). Clicks anywhere on the card, and Enter or Space on the focused button,
call `onClick`. Because the button sits beside the content rather than around it, `chart` and
`badge` may contain block elements.

- The button is named by the label and the value (only the label while `loading`), for example
  "Revenue $248,120". It is described by the footnote, which includes the change and its trend text.
- An `aria-label`, `aria-labelledby` or `aria-describedby` you pass goes to the button instead of
  the card, and replaces the generated name or description.
- The button covers the card, so links or buttons inside `badge` cannot be clicked on a clickable
  card.

Other notes:

- The trend's good-or-bad meaning is shown by colour and an `aria-hidden` arrow, and spoken through
  `trendLabel` (", favourable" by default for `up`).
- Styling hooks: `data-slot="stats-card"`, `data-trend`, classes `sui-stats-card`,
  `sui-stats-card--sm`, `--lg` and `--interactive`, `sui-stats-card__action`, and
  `sui-stats-card__change--<trend>`. `statsCardVariants({ size?, interactive? })` is exported.

## MetricTile

A figure on a filled tile, for headline numbers inside a card you are composing. A `StatsCard`
there would put a card inside a card; a row of tiles reads as part of the card around it.

## MetricGrid

Lays out `MetricTile`s in equal columns.

```tsx
import { Card, CardContent, CardHeader, CardTitle, MetricGrid, MetricTile } from '@shining-technologies/ui'

<Card>
  <CardHeader>
    <CardTitle as="h2">This month</CardTitle>
  </CardHeader>
  <CardContent>
    <MetricGrid columns={3}>
      <MetricTile label="Jobs" value="49" delta="+4" trend="up" hint="vs last month" />
      <MetricTile label="Revenue" value="$1.4M" tone="primary" />
      <MetricTile label="Overdue" value="3" tone="destructive" />
    </MetricGrid>
  </CardContent>
</Card>
```

`MetricTile` props (`MetricTileData`, plus `<div>` props except `title`):

| Prop         | Type                          | Default         | Description                                                                 |
| ------------ | ----------------------------- | --------------- | --------------------------------------------------------------------------- |
| `label`      | `ReactNode`                   | required        |                                                                             |
| `value`      | `ReactNode`                   | required        |                                                                             |
| `hint`       | `ReactNode`                   |                 | Footnote under the figure: the period, the comparison or the unit.          |
| `delta`      | `ReactNode`                   |                 | The change, for example `'+6'`. Rendered when it is not `undefined` and the tile is not loading. |
| `trend`      | `'up' \| 'down' \| 'neutral'` | `'neutral'`     | As on `StatsCard`.                                                          |
| `trendLabel` | `string`                      | see description | Visually hidden text read after the delta, as on `StatsCard`.               |
| `tone`       | `AccentTone`                  |                 | Draws an accent rule on the leading edge. Omit it for a plain tile.         |
| `span`       | `'auto' \| 'full'`            |                 | `'full'` makes the tile span every column of its `MetricGrid`.              |
| `loading`    | `boolean`                     |                 | Replaces the value with a skeleton and sets `aria-busy`.                    |

`MetricGrid` props (plus all `<div>` props):

| Prop      | Type                          | Default | Description                                                                                                                        |
| --------- | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `columns` | `1 \| 2 \| 3 \| 4 \| 'auto'`  | `2`     | A fixed number of columns, set through `--sui-metric-columns`. Fixed counts collapse to one column below a width of 30rem. `'auto'` fits as many tiles of about 9rem as the width allows. |

Styling hooks: `data-slot="metric-tile"` and `data-slot="metric-grid"`, classes `sui-metric-tile`,
`sui-metric-tile--accent`, `sui-metric-tile--full`, `sui-metric-tile__delta--<trend>`,
`sui-metric-grid` and `sui-metric-grid--auto`.

## BreakdownList

Shows a count for each bucket (a dot, a label and a figure), optionally with share bars,
percentages and a stacked summary bar. You pass data rather than composing rows, so the component
handles the total, the shares and the empty state. A bucket with a value of zero still renders.

```tsx
'use client'

import { BreakdownList } from '@shining-technologies/ui'

<BreakdownList
  title="By status"
  showSummary
  showShare
  showPercent
  items={[
    { key: 'open', label: 'Open', value: 18, tone: 'info' },
    { key: 'blocked', label: 'Blocked', value: 0, tone: 'destructive', hint: 'Waiting on a part' },
    { key: 'done', label: 'Done', value: 31, tone: 'success' },
  ]}
  formatValue={(value) => value.toLocaleString('en-AU')}
/>
```

| Prop          | Type                              | Default                           | Description                                                                                         |
| ------------- | --------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `items`       | `BreakdownItem[]`                 | required                          | The buckets, in display order.                                                                      |
| `title`       | `ReactNode`                       |                                   | Heading above the rows. It also names the list through `aria-labelledby`.                           |
| `total`       | `number`                          | sum of `items` values             | The whole that shares are computed from.                                                            |
| `showShare`   | `boolean`                         | `false`                           | A thin bar under each row, sized by its share of the total.                                         |
| `showPercent` | `boolean`                         | `false`                           | The share as a rounded percentage beside each value.                                                |
| `showSummary` | `boolean`                         | `false`                           | A stacked `SegmentedBar` of the whole distribution above the rows. It is labelled with `title` when `title` is a string. |
| `formatValue` | `(value: number) => ReactNode`    | `value.toLocaleString()`          | Formats each figure.                                                                                |
| `empty`       | `ReactNode`                       | `'No records yet.'`               | Shown as an inline `Empty` instead of rows when `items` is empty.                                   |
| `loading`     | `boolean`                         | `false`                           | Three skeleton rows in a container with `aria-busy="true"`.                                         |

Also accepts all `<div>` props except `title`.

`BreakdownItem`:

| Field   | Type         | Description                                                                                  |
| ------- | ------------ | -------------------------------------------------------------------------------------------- |
| `key`   | `string`     | Stable identity. Falls back to the position, not the label, because two buckets may share a label. |
| `label` | `string`     | Required.                                                                                    |
| `value` | `number`     | Required.                                                                                    |
| `tone`  | `AccentTone` | Colour of the dot, share bar and summary segment. Defaults to neutral.                       |
| `hint`  | `ReactNode`  | A second line under the label.                                                               |

Behaviour: shares are clamped to 0–100%, so a `total` smaller than a bucket cannot push a bar
past its track. A total of `0` gives `0%` rather than dividing by zero. Rows with a value of zero
get `data-empty="true"`. Styling hooks: `data-slot="breakdown-list"`, and the classes
`sui-breakdown`, `sui-breakdown__title`, `sui-breakdown__item`, `sui-breakdown__value`,
`sui-breakdown__percent` and `sui-breakdown__share-fill`.

## SummaryCard

A common dashboard block in one component: a titled card, a row of headline figures and a count
for each status below them. It is assembled from `CardIcon`, `MetricTile` and `BreakdownList`,
which are all exported, so you can rebuild it from those parts when these props are not enough.

```tsx
import { Button, SummaryCard } from '@shining-technologies/ui'

<SummaryCard
  title="Support queue"
  titleAs="h2"
  description="Tickets opened this week"
  action={<Button variant="ghost" size="sm">View all</Button>}
  metrics={[
    { key: 'total', label: 'Total', value: 49, delta: '+4', trend: 'down' },
    { key: 'new', label: 'New', value: 12 },
  ]}
  breakdown={[
    { key: 'open', label: 'Open', value: 18, tone: 'info' },
    { key: 'pending', label: 'Pending', value: 6, tone: 'warning' },
    { key: 'solved', label: 'Solved', value: 25, tone: 'success' },
  ]}
  breakdownProps={{ showSummary: true }}
  footer="Updated hourly"
/>
```

| Prop              | Type                                                         | Default       | Description                                                                          |
| ----------------- | ------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------ |
| `title`           | `ReactNode`                                                  | required      |                                                                                      |
| `titleAs`         | `'div' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'`      | `'div'`       | The title element, as on `CardTitle`.                                                 |
| `description`     | `ReactNode`                                                  |               |                                                                                      |
| `icon`            | `ReactNode`                                                  |               | Rendered in a `CardIcon`.                                                             |
| `iconTone`        | `AccentTone`                                                 | `'primary'`   |                                                                                      |
| `action`          | `ReactNode`                                                  |               | Top right of the header: a menu, a link or a period badge.                           |
| `metrics`         | `SummaryMetric[]`                                            |               | `MetricTileData` (including `trendLabel`) plus an optional `key`. Rendered in a `MetricGrid`. |
| `metricColumns`   | `1 \| 2 \| 3 \| 4 \| 'auto'`                                 | `2`           | The grid's `columns`.                                                                 |
| `breakdown`       | `BreakdownItem[]`                                            |               | Rendered in a `BreakdownList`.                                                        |
| `breakdownTitle`  | `ReactNode`                                                  | `'By status'` |                                                                                      |
| `breakdownProps`  | `Omit<BreakdownListProps, 'items' \| 'title' \| 'loading'>`  |               | The rest of `BreakdownList`'s options.                                                |
| `loading`         | `boolean`                                                    | `false`       | Puts every tile and the breakdown into their loading states.                         |
| `footer`          | `ReactNode`                                                  |               | Rendered in a bordered `CardFooter`.                                                  |

Also accepts `Card` props except `title` and `asChild` (so `variant`, `interactive` and all `<div>`
props). `children` render inside the content area, after the breakdown. Styling hook:
`data-slot="summary-card"`.

## StepCard

One stage of a multi-step process, with the condition that ends it. A grid of these explains a
workflow. With `state` set, a card also tracks where a live record is. The condition footer is
pushed to the bottom, so the footers in a row of cards line up even when the descriptions differ
in length.

```tsx
import { StatusFlow, StepCard } from '@shining-technologies/ui'

<StepCard
  step={2}
  state="current"
  titleAs="h3"
  title="Quote"
  description="We price the work and send the quote."
  condition="The customer accepts the quote."
>
  <StatusFlow steps={['draft', 'sent', 'accepted']} label="Quote states" size="sm" />
</StepCard>
```

| Prop             | Type                                                     | Default            | Description                                                                                       |
| ---------------- | -------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `step`           | `ReactNode`                                              |                    | Position in the sequence, usually a number.                                                        |
| `title`          | `ReactNode`                                              | required           |                                                                                                   |
| `description`    | `ReactNode`                                              |                    |                                                                                                   |
| `condition`      | `ReactNode`                                              |                    | What must be true for the process to leave this step. Shown in a bordered footer.                 |
| `conditionLabel` | `ReactNode`                                              | `'Moves on when:'` | Label shown in bold before `condition`.                                                           |
| `state`          | `'upcoming' \| 'current' \| 'done'`                      |                    | Omit it for a card that documents a process. Set it to track a record.                            |
| `titleAs`        | `'div' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'`  | `'div'`            | The title element.                                                                                |

Also accepts `Card` props except `title` and `asChild`. `children` render in a `CardContent`.

How `step` renders: with no `state` it appears as "2."; with `upcoming` or `current` it appears as
"2"; with `done` it is replaced by a check icon and the visually hidden text "Step 2, done:". A
`current` card gets `aria-current="step"`. Styling hooks: `data-slot="step-card"`, `data-state`,
and the classes `sui-step-card` and `sui-step-card--<state>`.

## StatusFlow

Draws a lifecycle: the states a record moves through, in order. Step values are resolved with the
same vocabularies as [`StatusBadge`](./badge.md#statusbadge), so a status has the same label and
colour here as in a table. With `current` set, it also shows where the record is now.

```tsx
'use client'

import { StatusFlow } from '@shining-technologies/ui'

<StatusFlow
  label="Quote lifecycle"
  type="quote"
  steps={['draft', 'sent', 'seen', 'accepted']}
  alternates={['changes_requested', { status: 'rejected', tone: 'destructive' }]}
  alternatesListLabel="Other quote outcomes"
  current={quote.status}
/>
```

| Prop                  | Type                                    | Default                                  | Description                                                                                                      |
| --------------------- | --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `steps`               | `StatusFlowStep[]`                      | required                                 | The main path, in order.                                                                                         |
| `alternates`          | `StatusFlowStep[]`                      |                                          | States off the main path, such as failures and detours. They are listed after `alternatesLabel`.                 |
| `alternatesLabel`     | `ReactNode`                             | `'Or:'`                                  | Visible text before the alternates.                                                                              |
| `alternatesListLabel` | `string`                                | `'Other outcomes'`                       | Accessible name of the alternates list.                                                                          |
| `current`             | `number \| string`                      |                                          | Where the record is now: an index into `steps`, or a status value. A status is matched against `steps` first and then `alternates`, exactly and then ignoring case. Omit it, or give a value that matches nothing, to show the flow as a legend. |
| `reached`             | `number \| string`                      | `steps.length - 2`                       | Used only when `current` is an alternate: the last main-path step (an index or a status) the record reached before leaving the path. |
| `type`                | `string`                                |                                          | Registry vocabulary to resolve step values against.                                                              |
| `statuses`            | `StatusVocabulary`                      |                                          | A vocabulary for this flow only, as on `StatusBadge`.                                                             |
| `label`               | `string`                                |                                          | Accessible name of the steps list, for example `'Quote lifecycle'`.                                              |
| `size`                | `'sm' \| 'md' \| 'lg'`                  |                                          | Chip size.                                                                                                       |
| `stateLabels`         | `{ done?: string; upcoming?: string }`  | `{ done: 'done', upcoming: 'upcoming' }` | The visually hidden words read, in brackets, after done and upcoming chips.                                      |

Also accepts all `<div>` props except `children`.

`StatusFlowStep` is either a raw status string or `{ status: string; label?: ReactNode; tone?:
StatusTone }`, which overrides the resolved label and tone inline. `StatusFlowStepState` is
`'done' | 'current' | 'upcoming'`.

States:

- When `current` points at a main-path step, earlier steps are `done`, that step is `current` and
  later steps are `upcoming`.
- When `current` is an alternate, main-path steps up to `reached` are `done`, the rest are
  `upcoming`, and that alternate is `current`. Other alternates have no state.
- Each state has a cue that does not depend on colour. `done` chips show a check icon and the
  visually hidden text " (done)". `upcoming` chips have a dashed outline, the neutral tone and the
  visually hidden text " (upcoming)". The `current` item has `aria-current="step"`. Each `<li>`
  carries `data-state`.
- A status may appear more than once in `steps` (for example `draft`, `review`, `draft`). Every
  occurrence renders.

The main path is an `<ol>` and the alternates are a `<ul>`. The arrows between steps sit inside
each item, so a wrapped flow never starts a line with an arrow. Styling hooks:
`data-slot="status-flow"`, and the classes `sui-status-flow`, `sui-status-flow__step`,
`sui-status-flow__chip` and `sui-status-flow__chip--<state>`.

## Accessibility

- `CardTitle`, `SummaryCard` and `StepCard` render a `div` title by default. Pass `as` or `titleAs`
  with a heading level so screen-reader users can move between cards by heading.
- `CardIcon`, `StatsCard`'s `icon` and the trend arrows are `aria-hidden`. Whether a change is good
  or bad news is also given in visually hidden text (`trendLabel`) on `StatsCard` and `MetricTile`.
- A clickable `StatsCard` has a real `<button>`, named by its label and value. For a card that
  navigates, use `Card asChild` with a link.
- Loading states set `aria-busy`, and the skeletons are hidden from assistive technology.
- `BreakdownList` is a list named by its `title`. Its summary bar is a single image whose name
  spells out the counts. Share bars are `aria-hidden`.
- `StatusFlow` names both of its lists, marks the current step with `aria-current="step"`, and adds
  visually hidden "done" and "upcoming" text. `StepCard` marks the current step the same way and
  adds "done" text, so progress is not shown by colour alone.

## Related

- [Badge](./badge.md): `StatusBadge` and the status registry
- [Charts](../charts.md): `Sparkline` and other charts for `StatsCard`'s `chart`
- [Feedback](./feedback.md): `Skeleton`, `Empty` and `SegmentedBar`
- [Layout](./layout.md)
- [Theming](../theming.md): tone and chart tokens
- [Accessibility](../accessibility.md)

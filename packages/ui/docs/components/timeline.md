# Timeline

Events in order: what happened to a record, who did it and when. One component covers a record's
history, an activity feed (people as the markers, days as headings) and an audit log (the compact
variant, with the time in a column of its own).

```tsx
import { Timeline, TimelineHeading, TimelineItem } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/timeline'
```

**Server and client.** The module has no `'use client'` directive. All three components are markup
only and render as Server Components, so a feed fetched on the server ships no client JavaScript.

Exported types: `TimelineProps`, `TimelineItemProps`. `timelineVariants` returns the class string.

## Usage

```tsx
import { CheckIcon, MailIcon, Timeline, TimelineItem } from '@shining-technologies/ui'

export function InvoiceHistory() {
  return (
    <Timeline aria-label="Invoice history">
      <TimelineItem title="Invoice sent" time="Sep 10, 16:30" dateTime="2026-09-10T16:30" icon={<MailIcon />} />
      <TimelineItem title="Invoice paid" time="Sep 12, 10:04" dateTime="2026-09-12T10:04" tone="success" icon={<CheckIcon />}>
        $4,280.00 by card ending 4242.
      </TimelineItem>
      <TimelineItem title="Receipt emailed" time="Scheduled" pending />
    </Timeline>
  )
}
```

An activity feed puts a `UserAvatar` in `icon` and splits the list by day:

```tsx
<Timeline aria-label="Team activity">
  <TimelineHeading>Today</TimelineHeading>
  <TimelineItem
    icon={<UserAvatar name="Priya Raman" size="sm" />}
    title={<><strong>Priya Raman</strong> approved PO-311</>}
    time="12 minutes ago"
    dateTime="2026-09-24T09:18"
  />
</Timeline>
```

An audit log uses the compact variant:

```tsx
<Timeline variant="compact" aria-label="Audit log">
  {entries.map((entry) => (
    <TimelineItem key={entry.id} time={entry.at} dateTime={entry.iso} title={entry.summary} tone={entry.tone} />
  ))}
</Timeline>
```

## Timeline

| Prop      | Type                      | Default     | Description |
| --------- | ------------------------- | ----------- | ----------- |
| `variant` | `'default' \| 'compact'`  | `'default'` | `compact`: smaller markers, tighter rows, the time in a first column. Under 40rem the time moves under the title. |

Renders an `<ol>` and accepts all its props. Name it with `aria-label` when the page has several.
Classes: `.sui-timeline`, `.sui-timeline--compact`; `--sui-timeline-marker` sets the marker size.

## TimelineItem

| Prop       | Type          | Default     | Description |
| ---------- | ------------- | ----------- | ----------- |
| `title`    | `ReactNode`   | —           | Required. What happened. |
| `time`     | `ReactNode`   | —           | When, as it should read: `'2 hours ago'`. |
| `dateTime` | `string`      | —           | The machine-readable moment, put on the `<time>` element so the text can stay relative. |
| `icon`     | `ReactNode`   | a dot       | The marker: a glyph or an avatar. |
| `tone`     | `AccentTone`  | `'neutral'` | The marker's colour. |
| `pending`  | `boolean`     | `false`     | Not happened yet: a hollow, dashed marker and a muted title. |
| `children` | `ReactNode`   | —           | Details under the title. |

Renders an `<li>` and accepts all its props except `title`. The marker is `aria-hidden`; the tone is
never the only signal, so say in `title` what the event was. Classes: `.sui-timeline__item`
(`data-pending`), `__marker`, `__marker--icon`, `__body`, `__title`, `__time`, `__content`.

## TimelineHeading

A day or period label inside a `Timeline` ("Today", "Last week"). It renders an `<li>` so the list
stays one list; put a heading element inside it if it belongs in the page outline. Class:
`.sui-timeline__heading`.

## Related

- [Card](./card.md): `StatusFlow` for where a record is now, beside its history
- [Avatar](./avatar.md): `UserAvatar` markers
- [Data table](../data-table.md): an audit log that needs sorting and filtering

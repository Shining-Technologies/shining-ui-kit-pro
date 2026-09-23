# Feedback

Components that report state: messages about a page (`Alert`) or the whole application
(`Banner`), empty, loading, error, success and offline states (`Empty`), loading indicators
(`Spinner`, `Skeleton`, `Progress`, `CircularProgress`), small status markers (`StatusDot`,
`SegmentedBar`), keyboard keys (`Kbd`), and a toast stack (`ToastProvider`, `useToast`, `Toaster`).

```tsx
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Banner,
  CircularProgress,
  Empty,
  Kbd,
  Progress,
  SegmentedBar,
  Skeleton,
  Spinner,
  StatusDot,
  ToastProvider,
  Toaster,
  useToast,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/feedback'
```

**Server and client.**

| Module          | Exports                                                                                                   | Kind                                     |
| --------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `alert.tsx`     | `Alert`, `AlertTitle`, `AlertDescription`, `alertVariants`                                                | Server Component (no directive)          |
| `feedback.tsx`  | `Spinner`, `Empty`, `StatusDot`, `SegmentedBar`, `Kbd`, and `spinnerVariants`, `emptyVariants`, `statusDotVariants`, `segmentedBarVariants` | Server Component (no directive) |
| `skeleton.tsx`  | `Skeleton`                                                                                                | Server Component (no directive)          |
| `circular-progress.tsx` | `CircularProgress`, `circularProgressVariants`                                                   | Server Component (no directive)          |
| `banner.tsx`    | `Banner`                                                                                                  | Client (`'use client'`)                  |
| `progress-variants.ts` | `progressVariants`                                                                                 | Server-safe function (no directive)      |
| `progress.tsx`  | `Progress`                                                                                                | Client (`'use client'`, Radix Progress)  |
| `toast.tsx`     | `ToastProvider`, `useToast`, `Toaster`                                                                    | Client (`'use client'`)                  |

Server Components add no JavaScript to the page and also work inside client components. All seven
`*Variants` functions can be called on the server.

## Alert

A message about the page it appears on: an error, a warning, a confirmation or a tip. It has an
optional icon, a title and a description.

```tsx
import { Alert, AlertDescription, AlertTitle } from '@shining-technologies/ui'

export function LicenceWarning() {
  return (
    <Alert tone="warning">
      <AlertTitle>Licence expiring</AlertTitle>
      <AlertDescription>Renew before 14 March to keep scheduling jobs.</AlertDescription>
    </Alert>
  )
}
```

| Prop   | Type                                                                | Default          | Description                                                                                  |
| ------ | ------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `tone` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'destructive'`    | `'neutral'`      | Colour, default icon and role.                                                               |
| `icon` | `ReactNode \| null`                                                 | the tone's icon  | Replaces the default icon. Pass `null` for no icon.                                          |

Also accepts all `<div>` props. The ref goes to the root `div`.

- **Role.** `tone="destructive"` renders `role="alert"`, which screen readers announce immediately.
  Every other tone renders `role="note"`, which is not announced. Render a destructive alert when
  the error happens, not ahead of time, so the insertion is announced.
- **Default icons.** `info` uses `InfoIcon`, `success` uses `CheckCircleIcon`, and `warning` and
  `destructive` use `TriangleAlertIcon`. `neutral` has no icon. The icon wrapper is `aria-hidden`.
- **Styling hooks.** The root has `data-slot="alert"` and the classes `.sui-alert`,
  `.sui-alert--{tone}` and `.sui-alert--with-icon`. Other parts are `.sui-alert__icon`,
  `.sui-alert__title` and `.sui-alert__description`. Tones set `--sui-alert-color`, which colours
  the icon, the title, and a tint of the border and background. Override it on one alert to use a
  custom colour.

### AlertTitle

The heading line of an alert. It renders a `<div>` (`data-slot="alert-title"`, `.sui-alert__title`),
not a heading element. Put an `<h2>`–`<h6>` inside it if the alert should appear in the page's
heading outline. Accepts all `<div>` props.

### AlertDescription

The body text of an alert. It renders a `<div>` (`data-slot="alert-description"`,
`.sui-alert__description`). Accepts all `<div>` props.

### alertVariants

The `class-variance-authority` function behind `Alert`. `alertVariants({ tone: 'success' })`
returns the class string, for giving another element the alert styling.

## Banner

A message about the whole application rather than one part of a page: a trial ending, maintenance
tonight, a failed payment, a lost connection. It is a full-width strip, usually placed above the
header or at the top of the content, with room for an action and a close button. For a message about
one section of a page, use `Alert`.

```tsx
'use client'

import { Banner, Button } from '@shining-technologies/ui'

export function TrialBanner({ days }: { days: number }) {
  return (
    <Banner
      tone="info"
      title={`Your trial ends in ${days} days.`}
      action={<Button size="sm">Upgrade</Button>}
      dismissible
    >
      Choose a plan to keep your data.
    </Banner>
  )
}
```

| Prop           | Type                                                                          | Default          | Description |
| -------------- | ----------------------------------------------------------------------------- | ---------------- | ----------- |
| `tone`         | `'neutral' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | `'info'`         | Colour, default icon and role. |
| `title`        | `ReactNode`                                                                   | —                | A bold lead-in before the message. |
| `icon`         | `ReactNode \| null`                                                           | the tone's icon  | Replaces the default icon. `null` for none. `neutral` has no default icon. |
| `action`       | `ReactNode`                                                                   | —                | Buttons or links after the message. |
| `dismissible`  | `boolean`                                                                     | `false`          | Shows a close button. Without `onDismiss`, the banner hides itself. |
| `onDismiss`    | `() => void`                                                                  | —                | Called when the close button is pressed; implies `dismissible`. The banner stays until you stop rendering it, so you can remember the dismissal. |
| `dismissLabel` | `string`                                                                      | `'Dismiss'`      | The close button's accessible name. |

Also accepts all `<div>` props except `title`. The ref goes to the root `div`.

- **Role.** `tone="destructive"` renders `role="alert"`; every other tone renders `role="status"`,
  which is announced politely when the banner appears.
- **Styling hooks.** `data-slot="banner"`, `data-tone`, `.sui-banner` and `.sui-tone--{tone}` (which
  sets `--sui-tone`). Parts: `.sui-banner__icon`, `__message`, `__title`, `__action`, `__close`.
  Position it yourself, for example with `position: sticky`.

## Empty

The "nothing here yet" panel. It says what is missing and what to do about it.

```tsx
import { Button, Empty } from '@shining-technologies/ui'

export function NoJobs() {
  return (
    <Empty
      title="No jobs scheduled"
      description="Jobs you create appear here."
      actions={<Button>New job</Button>}
    />
  )
}
```

It is also the panel for every other state a view can be in: pass `status` and the panel takes that
state's glyph, tint and role.

```tsx
<Empty
  status="error"
  title="Could not load invoices"
  description="The server did not answer. Your filters are kept."
  actions={<Button onClick={retry}>Try again</Button>}
/>
<Empty status="loading" title="Loading invoices" />
<Empty status="success" title="All caught up" />
<Empty status="offline" title="You are offline" />
```

| Prop          | Type                     | Default   | Description                                                                                          |
| ------------- | ------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| `title`       | `ReactNode`              | —         | Required. Rendered in a `<p class="sui-empty__title">`.                                             |
| `status`      | `'empty' \| 'loading' \| 'error' \| 'success' \| 'offline'` | `'empty'` | What the panel reports. `error` is `role="alert"` with `AlertIcon` in the destructive tone; `loading` is `role="status"` with `aria-busy` and a `Spinner`; `success` (`CheckCircleIcon`) and `offline` (`WifiOffIcon`, warning tone) are `role="status"`. `empty` has no role and no default glyph, as before 2.2. |
| `description` | `ReactNode`              | —         | Rendered in a `<p class="sui-empty__description">`.                                                 |
| `icon`        | `ReactNode`              | the status's glyph | Rendered above the title in an `aria-hidden` `.sui-empty__media` wrapper. `null` removes a status's default glyph. |
| `actions`     | `ReactNode`              | —         | Rendered last, in `.sui-empty__actions`.                                                            |
| `variant`     | `'panel' \| 'inline'`    | `'panel'` | `panel` is a centred block for a page or card. `inline` is a single quiet line for an empty list inside a card with other content. |
| `children`    | `ReactNode`              | —         | Rendered between the description and the actions.                                                   |

Also accepts all `<div>` props except `title`, which is replaced by the prop above. The ref goes to
the root `div`, which has `data-slot="empty"`, `.sui-empty` and `.sui-empty--inline` for the inline
variant; a status adds `data-status` and `.sui-tone--{tone}`, which tints the glyph. The props type is
`EmptyStateProps` and the status type `EmptyStatus`. `emptyVariants({ variant })` returns the class
string.

A status panel is announced when it is inserted, so render it when the state begins: swap the
loading panel for the error panel, rather than keeping every panel mounted and hiding the others.

Because the title is a paragraph, add a heading inside `title` if it belongs in the page outline.

## Spinner

An activity indicator with no known progress. It uses `currentColor`, so it matches the text colour
of whatever it sits in, such as a primary button.

```tsx
import { Button, Spinner } from '@shining-technologies/ui'

export function SavingButton() {
  return (
    <Button disabled>
      <Spinner size="sm" label={null} />
      Saving
    </Button>
  )
}
```

| Prop    | Type                           | Default     | Description                                                                                       |
| ------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| `label` | `string \| null`               | `'Loading'` | With a label, the spinner has `role="status"` and `aria-label={label}`. With `null` or `''`, it is `aria-hidden` (decorative). |
| `size`  | `'sm' \| 'default' \| 'lg'`    | `'default'` | Size.                                                                                             |

Also accepts all `<span>` props. The ref goes to the `span` (`data-slot="spinner"`, `.sui-spinner`,
`.sui-spinner--sm` / `--lg`). Use `label={null}` when nearby text already says something is loading,
so the state is not announced twice. With `prefers-reduced-motion: reduce`, the spinner pulses
instead of rotating. `spinnerVariants({ size })` returns the class string.

## Skeleton

A shimmering placeholder block for content that has not loaded yet. It is always hidden from
assistive technology (`aria-hidden="true"`).

```tsx
import { Skeleton } from '@shining-technologies/ui'

export function ProfileLoading() {
  return (
    <div aria-busy="true" aria-label="Loading profile">
      <Skeleton style={{ width: '3rem', height: '3rem', borderRadius: '999px' }} />
      <Skeleton style={{ width: '12rem', height: '1rem' }} />
    </div>
  )
}
```

| Prop | Type               | Default | Description                                                                                                   |
| ---- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| `as` | `'div' \| 'span'`  | `'div'` | Use `'span'` inside elements that allow only phrasing content (`<button>`, `<a>`, `<label>`). It is displayed as a block either way. |

Also accepts all HTML attributes. The ref goes to the rendered element (`.sui-skeleton`). Set its
size with `className` or `style`. Because the skeleton is hidden, tell assistive technology that
the region is loading in some other way, for example `aria-busy` on the container or a visually
hidden status message. The animation stops under `prefers-reduced-motion: reduce`.

## Progress

A progress bar built on Radix Progress. It shows how far along a single task is, or shows
indeterminate activity when the amount is unknown.

```tsx
'use client'

import { Progress } from '@shining-technologies/ui'

export function UploadProgress({ sent, total }: { sent: number; total: number }) {
  return <Progress value={sent} max={total} aria-label="Upload" />
}

export function Syncing() {
  return <Progress value={null} aria-label="Syncing" tone="warning" size="sm" />
}
```

| Prop    | Type                                                     | Default     | Description                                                                          |
| ------- | -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `value` | `number \| null`                                         | `0`         | Current amount, clamped to `0`–`max`. `null` shows the indeterminate animation. `undefined` and non-finite numbers count as `0`. |
| `max`   | `number`                                                 | `100`       | Maximum value. A value that is not a positive finite number is treated as `100`.     |
| `size`  | `'sm' \| 'default' \| 'lg'`                              | `'default'` | Bar height.                                                                          |
| `tone`  | `'primary' \| 'success' \| 'warning' \| 'destructive'`   | `'primary'` | Indicator colour.                                                                    |

Also accepts Radix Progress `Root` props (for example `getValueLabel` and `asChild`) and `<div>`
attributes. The ref goes to the root.

- **Name it.** Pass `aria-label` or `aria-labelledby`. Radix renders `role="progressbar"` with
  `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext` (a rounded percentage by
  default; change it with `getValueLabel`). An indeterminate bar has no `aria-valuenow`.
- **Out-of-range input is clamped** before it reaches Radix. `value={150}` is announced and drawn as
  100 and `value={-5}` as 0, so what is announced always matches what is drawn, and Radix logs no
  errors.
- **Styling hooks.** Radix sets `data-state="loading" | "complete" | "indeterminate"`, `data-value`
  and `data-max`. The root has `data-slot="progress"` and the classes `.sui-progress`,
  `.sui-progress--sm` / `--lg`, `.sui-progress--{tone}` and `.sui-progress--indeterminate`. The
  indicator is `.sui-progress__indicator`, moved with `transform`. Tones set `--sui-progress-color`,
  which defaults to `--primary`. `progressVariants({ size, tone })` returns the class string.

## CircularProgress

Progress as a ring, for a tile, a card header or an avatar-sized slot where a bar has no room to be
read. It is markup and an SVG, so it renders as a Server Component.

```tsx
import { CircularProgress } from '@shining-technologies/ui'

<CircularProgress value={68} showValue size="lg" aria-label="Storage used" />
<CircularProgress value={22} max={25} tone="warning" aria-label="Seats used" />
<CircularProgress value={null} aria-label="Syncing" />
```

| Prop        | Type                                   | Default     | Description |
| ----------- | -------------------------------------- | ----------- | ----------- |
| `value`     | `number \| null`                       | `0`         | Clamped to `0`–`max`. `null` spins (indeterminate). |
| `max`       | `number`                               | `100`       | A value that is not a positive finite number is treated as `100`. |
| `size`      | `'sm' \| 'default' \| 'lg' \| 'xl'`    | `'default'` | 1.5rem, 2.5rem, 4rem or 6rem across. |
| `tone`      | `AccentTone`                           | `'primary'` | The ring's colour: a status tone or `chart-1`…`chart-5`. |
| `showValue` | `boolean`                              | `false`     | Prints the rounded percentage in the middle (not while indeterminate). |
| `children`  | `ReactNode`                            | —           | Anything else in the middle — a count, an icon. Replaces `showValue`. |

Also accepts all `<div>` props. The root is `role="progressbar"` with `aria-valuemin`,
`aria-valuemax`, `aria-valuenow` (absent while indeterminate) and `aria-valuetext` (the rounded
percentage); name it with `aria-label` or `aria-labelledby`. Styling hooks:
`data-slot="circular-progress"`, `data-state="loading" | "complete" | "indeterminate"`,
`.sui-circular-progress`, `.sui-circular-progress--{size}`, `__track`, `__indicator` and `__value`;
`--sui-ring-size` and `--sui-ring-width` set the geometry. `circularProgressVariants({ size })`
returns the class string.

## StatusDot

A small coloured dot, usually with a word next to it, such as "Online" or "Syncing". Colour is never
the only signal: without text, the dot is either named or hidden.

```tsx
import { StatusDot } from '@shining-technologies/ui'

export function ServiceStatus() {
  return (
    <>
      <StatusDot tone="success" label="Operational" />
      <StatusDot tone="info" label="Syncing" pulse />
      <StatusDot tone="warning" aria-label="Degraded" />
    </>
  )
}
```

| Prop    | Type                           | Default     | Description                                                                                    |
| ------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| `tone`  | `AccentTone`                   | `'neutral'` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'destructive' \| 'info' \| 'chart-1'` … `'chart-5'`. |
| `label` | `ReactNode`                    | —           | Visible text next to the dot.                                                                  |
| `size`  | `'sm' \| 'default' \| 'lg'`    | `'default'` | Dot size and text size.                                                                        |
| `pulse` | `boolean`                      | `false`     | Adds a ring that radiates from the dot, meaning "live". Under reduced motion, it becomes a steady halo. |

Also accepts all `<span>` props except `children`. The ref goes to the root `span`.

How the dot is exposed to assistive technology:

| You pass                        | Result                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| `label`                                          | The label text is read. The dot itself is hidden.               |
| `aria-label`, `aria-labelledby` or `title`, no `label` | `role="img"` with that name.                              |
| none of these                                    | `aria-hidden="true"`. Adjacent text must carry the meaning.     |

**Styling hooks.** The root has `data-slot="status-dot"`, `data-tone`, `.sui-status-dot`,
`.sui-status-dot--sm` / `--lg` / `--pulse` and `.sui-tone--{tone}`. The dot is
`.sui-status-dot__mark` and the text is `.sui-status-dot__label`. The tone class sets `--sui-tone`,
and the size classes set `--sui-status-dot-size`. `statusDotVariants({ size, pulse })` returns the
class string (without the tone class).

## SegmentedBar

A single horizontal bar split into segments by share, showing how a set of records is distributed
(for example, requests by status). Use `Progress` to show how far along one task is.

```tsx
import { SegmentedBar, type SegmentedBarSegment } from '@shining-technologies/ui'

const segments: SegmentedBarSegment[] = [
  { key: 'open', label: 'Open', value: 12, tone: 'info' },
  { key: 'blocked', label: 'Blocked', value: 3, tone: 'warning' },
  { key: 'done', label: 'Done', value: 41, tone: 'success' },
]

export function RequestsByStatus() {
  return <SegmentedBar label="Requests by status" segments={segments} />
}
```

| Prop       | Type                           | Default     | Description                                                             |
| ---------- | ------------------------------ | ----------- | ----------------------------------------------------------------------- |
| `segments` | `SegmentedBarSegment[]`        | —           | Required. Drawn in array order.                                         |
| `label`    | `string`                       | —           | What the bar measures. Added to the start of the spoken summary.        |
| `size`     | `'sm' \| 'default' \| 'lg'`    | `'default'` | Bar height.                                                             |

Also accepts all `<div>` props except `children`. The ref goes to the root `div`.

`SegmentedBarSegment`:

| Field   | Type         | Default     | Description                                                                          |
| ------- | ------------ | ----------- | ------------------------------------------------------------------------------------ |
| `label` | `string`     | —           | Required. Used in the spoken summary.                                                |
| `value` | `number`     | —           | Required. The raw count. Segment widths use `flex-grow: value`, so no percentages are computed. |
| `key`   | `string`     | array index | Stable React key.                                                                    |
| `tone`  | `AccentTone` | `'neutral'` | Segment colour.                                                                      |

- **Accessibility.** The bar is a single `role="img"`. Its `aria-label` is
  `"<label>: Open 12, Blocked 3, Done 41"`. Without `label`, it is just the summary. When `segments`
  is empty, the summary is `No data`, so the name is `"<label>: No data"` or `No data`. The bar does not show labels or counts on screen, so add a legend or a
  `BreakdownList` next to it for sighted users.
- **Zero values.** Segments with `value <= 0` are not drawn but are still included in the spoken
  summary.
- **Styling hooks.** The root has `data-slot="segmented-bar"`, `.sui-segmented-bar` and
  `.sui-segmented-bar--sm` / `--lg`. Each segment is `.sui-segmented-bar__segment` with
  `.sui-tone--{tone}` (`--sui-tone`). `segmentedBarVariants({ size })` returns the class string.

## Kbd

A keyboard key or shortcut. It renders a `<kbd>` element, which carries the right semantics.

```tsx
import { Kbd } from '@shining-technologies/ui'

export function SearchHint() {
  return (
    <p>
      Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search.
    </p>
  )
}
```

`Kbd` has no props of its own. It accepts all HTML attributes, and the ref goes to the `<kbd>`
(`data-slot="kbd"`, `.sui-kbd`).

## Toasts

Short notifications that appear in a corner and dismiss themselves. There are three parts:

- `ToastProvider` holds the stack.
- `useToast` raises and dismisses toasts from any component inside the provider.
- `Toaster` renders the stack.

All three are client code.

```tsx
// app/providers.tsx
'use client'

import type { ReactNode } from 'react'
import { ToastProvider, Toaster } from '@shining-technologies/ui'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider duration={6000}>
      {children}
      <Toaster position="top-right" />
    </ToastProvider>
  )
}
```

```tsx
// Any client component inside <Providers>
'use client'

import { Button, useToast } from '@shining-technologies/ui'

export function SaveButton({ save, undo }: { save: () => Promise<void>; undo: () => void }) {
  const { toast } = useToast()

  async function onClick() {
    const id = toast({ title: 'Saving…', duration: 0 })
    try {
      await save()
      // The same id replaces the toast in place.
      toast({ id, title: 'Saved', tone: 'success', action: { label: 'Undo', onClick: undo } })
    } catch {
      toast({ id, title: 'Could not save', description: 'Check your connection.', tone: 'destructive' })
    }
  }

  return <Button onClick={onClick}>Save</Button>
}
```

### ToastProvider

The toast store. Each provider has its own independent stack; there is no module-level singleton.

| Prop       | Type        | Default | Description                                                                    |
| ---------- | ----------- | ------- | ------------------------------------------------------------------------------ |
| `children` | `ReactNode` | —       | Required.                                                                      |
| `duration` | `number`    | `5000`  | Default lifetime of a toast, in milliseconds. `0` keeps toasts up until dismissed. |
| `limit`    | `number`    | `4`     | Maximum toasts in the stack. When a new toast would exceed it, the oldest is removed. |

Pending timers are cleared when the provider unmounts.

### useToast

`useToast(): ToastContextValue`. Throws `useToast must be used inside a <ToastProvider>` when called
outside a provider.

| Member       | Type                                    | Description                                                                                          |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `toast`      | `(options: ToastOptions) => string`     | Shows a toast and returns its id. Reusing an id replaces that toast in its current position and restarts its timer. |
| `dismiss`    | `(id: string) => void`                  | Removes one toast.                                                                                   |
| `dismissAll` | `() => void`                            | Removes every toast.                                                                                 |
| `toasts`     | `Toast[]`                               | The current stack, oldest first. `Toast` is `ToastOptions` with a required `id`.                     |
| `pause`      | `() => void`                            | Stops every auto-dismiss timer and keeps the time each toast has left. Toasts raised while paused wait too. |
| `resume`     | `() => void`                            | Restarts the timers that `pause` stopped, with their remaining time.                                |

`ToastOptions`:

| Field         | Type                                                               | Default             | Description                                                                         |
| ------------- | ------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------- |
| `title`       | `ReactNode`                                                        | —                   | Required.                                                                           |
| `description` | `ReactNode`                                                        | —                   | Second line.                                                                        |
| `tone`        | `ToastTone`: `'neutral' \| 'success' \| 'warning' \| 'destructive' \| 'info'` | `'neutral'` | Icon and colour.                                                                    |
| `duration`    | `number`                                                           | provider `duration` | Lifetime in ms. `0` or a negative number keeps it up. `undefined` uses the provider default. |
| `action`      | `ToastAction`: `{ label: string; onClick: () => void }`            | —                   | A button in the toast. Clicking it calls `onClick`, then dismisses the toast.       |
| `id`          | `string`                                                           | `sui-toast-<n>`     | Pass an existing id to replace that toast.                                          |

If you render your own stack instead of `Toaster`, read `toasts` and call `pause` while a toast is
hovered or focused and `resume` afterwards. Otherwise toasts can disappear while someone is reading
them.

### Toaster

Renders the stack. It must be inside a `ToastProvider`.

| Prop        | Type                                                                | Default          | Description                     |
| ----------- | ------------------------------------------------------------------- | ---------------- | ------------------------------- |
| `position`  | `'top-right' \| 'top-center' \| 'bottom-right' \| 'bottom-center'`  | `'bottom-right'` | Corner of the viewport.         |
| `className` | `string`                                                            | —                | Added to the region element.    |

- **Not portalled.** `Toaster` renders where you put it and uses `position: fixed` (`z-index: 100`).
  This keeps it inside the theme scope it is rendered in. Place it inside the same scoped provider
  as the rest of the app (see [Theming: scoped themes](../theming.md#6-scoped-themes)).
- **Stacking order.** In bottom positions, the newest toast is nearest the corner.
- **Pausing.** Hovering or focusing any toast pauses all timers. They resume, with their remaining
  time, when no toast is hovered or focused, including when the hovered toast is dismissed.
- **Each toast** shows the tone icon, the title, the optional description, the optional action
  button, and a **Dismiss** button.
- **Styling hooks.** The region is `.sui-toaster` with `.sui-toaster--{position}`. Each toast is
  `.sui-toast` with `.sui-toast--{tone}` and `data-tone`. The parts are `.sui-toast__icon`,
  `__text`, `__title`, `__description`, `__action` and `__close`. The entry animation is turned off
  under `prefers-reduced-motion: reduce`.

Exported types: `ToastTone`, `ToastAction`, `ToastOptions`, `Toast`, `ToastContextValue`,
`ToastProviderProps` and `ToasterProps`.

## Accessibility

- **Announcements.** `Alert tone="destructive"` is `role="alert"`, so it interrupts. Other alerts
  are `role="note"` and are not announced. `Spinner` with a label is `role="status"`. The `Toaster`
  region (`role="region"`, `aria-label="Notifications"`, `aria-live="polite"`) is always mounted, so
  toasts added to it are announced. All toast tones, including `destructive`, are announced
  politely.
- **Focus.** Toasts never take focus. A keyboard user reaches the action and Dismiss buttons by
  tabbing to where the `Toaster` sits in the DOM. Do not put the only copy of important information,
  or the only way to recover from an error, in a toast. Show it in the page as well, for example
  in an `Alert`.
- **Decorative elements.** `Skeleton`, the icons in `Alert`, `Empty` and toasts, and an unnamed
  `StatusDot` are `aria-hidden`. The meaning must come from text.
- **Status panels.** `Empty status="error"` is `role="alert"`; `loading`, `success` and `offline`
  are `role="status"`, and `loading` is `aria-busy`. `Banner` is `role="alert"` when destructive and
  `role="status"` otherwise.
- **Progress and summaries.** `Progress` and `CircularProgress` need an `aria-label` or
  `aria-labelledby`. `SegmentedBar`
  is one named image whose name lists every count.
- **Motion.** The spinner, skeleton, status-dot pulse and toast animation respect
  `prefers-reduced-motion: reduce`.
- **Fixed English strings.** The toast region label `Notifications`, the `Dismiss` button, the
  spinner default `Loading` (override it with `label`) and the `No data` bar summary are English.

See [Accessibility](../accessibility.md) for the package-wide approach.

## Related

- [Badge](badge.md): `StatusBadge` and `StatusRegistryProvider`
- [Card](card.md): `StatusFlow`, `StepCard` and `BreakdownList`, which pair with `SegmentedBar`
- [Button](button.md): buttons for `Empty` actions and loading states
- [Overlay](overlay.md): dialogs and confirmations for feedback that needs a response
- [Theming](../theming.md): tone tokens (`--success`, `--warning`, `--destructive`, `--info`, `--chart-*`)
- [Next.js](../nextjs.md#server-and-client-components): server and client components

# Button

Buttons for actions and links, plus a segmented group and two buttons with extra behaviour:
`CopyButton` writes a value to the clipboard and confirms, and `HoldButton` requires the person to
press and hold before a destructive action runs.

```tsx
import { Button, ButtonGroup, buttonVariants, CopyButton, HoldButton } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/button'
```

**Server and client.** `Button`, `ButtonGroup` and `buttonVariants` come from a module without
`'use client'`, so you can render them in Server Components. Event handlers such as `onClick` can
only be passed from a client component. `CopyButton` and `HoldButton` are client components
(`'use client'`).

Exported types: `ButtonProps`, `ButtonGroupProps`, `CopyButtonProps`, `HoldButtonProps`.

## Button

A `<button>` styled by variant and size. It defaults to `type="button"`, so a button inside a
`<form>` does not submit unless you pass `type="submit"`.

```tsx
import { Button, PlusIcon } from '@shining-technologies/ui'

export function Toolbar() {
  return (
    <>
      <Button type="submit">Save</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
      <Button size="icon" aria-label="Add job">
        <PlusIcon />
      </Button>
    </>
  )
}
```

| Prop        | Type                                                                                     | Default     | Description                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `variant`   | `'default' \| 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'link'` | `'default'` | Visual style. `default` and `primary` are the same style (`sui-btn--primary`). Names follow shadcn/ui.   |
| `size`      | `'default' \| 'sm' \| 'lg' \| 'icon' \| 'icon-sm' \| 'icon-lg'`                          | `'default'` | Height and padding. The `icon*` sizes are square, for icon-only buttons.                                  |
| `asChild`   | `boolean`                                                                                | `false`     | Render the single child element instead of a `<button>`, merging the button's classes and props onto it. |
| `type`      | `'button' \| 'submit' \| 'reset'`                                                        | `'button'`  | Not applied when `asChild` is set.                                                                        |
| `className` | `string`                                                                                 |             | Merged after the variant classes.                                                                         |

Also accepts all `<button>` props. The ref is forwarded to the rendered element.

An icon-only button has no text, so give it an `aria-label`. The icons exported by this package are
`aria-hidden`.

### As a link (`asChild`)

`asChild` gives a link a button's appearance without putting a `<button>` inside an `<a>`. The
child must be a single element that accepts a ref and spreads props. With Next.js:

```tsx
// app/jobs/page.tsx (a Server Component)
import Link from 'next/link'
import { Button } from '@shining-technologies/ui'

export default function JobsPage() {
  return (
    <Button asChild variant="outline">
      <Link href="/jobs/new">New job</Link>
    </Button>
  )
}
```

The rendered element is the `<a>`, so it keeps link semantics (announced as a link, opens in a new
tab with a modifier click). No `type` attribute is added.

### Styling hooks

- Classes: `sui-btn`, `sui-focusable`, `sui-btn--<variant>`, `sui-btn--<size>`.
- Attributes: `data-slot="button"`, `data-variant` and `data-size`. These hold the resolved value,
  so they read `default` when the prop is omitted.

## buttonVariants

The [class-variance-authority](https://cva.style) function behind `Button`. Use it to give button
styling to an element you cannot wrap in `Button`.

```tsx
import Link from 'next/link'
import { buttonVariants } from '@shining-technologies/ui'

<Link href="/settings" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
  Settings
</Link>
```

`buttonVariants({ variant?, size? })` returns a class string that always includes `sui-btn
sui-focusable`. Unlike `Button`, it does not add the `data-*` attributes.

## ButtonGroup

A `<div role="group">` that renders its buttons as one segmented control. The buttons stay
independent: Tab moves between them, and there is no toolbar-style arrow-key navigation.

```tsx
import { Button, ButtonGroup } from '@shining-technologies/ui'

<ButtonGroup aria-label="Text alignment">
  <Button variant="outline">Left</Button>
  <Button variant="outline">Centre</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>
```

| Prop         | Type     | Default | Description                                                      |
| ------------ | -------- | ------- | ---------------------------------------------------------------- |
| `aria-label` | `string` |         | Names the group for assistive technology. Recommended.          |

Also accepts all `<div>` props. Class: `sui-button-group`.

The group styles its direct children that have the class `sui-btn`: shared edges collapse, and only
the first and last buttons keep rounded outer corners. First and last are counted among those
buttons only, so other children (such as the hidden live region a `CopyButton` renders beside
itself) do not affect the corners.

## CopyButton

Copies `value` to the clipboard and shows a confirmation for `timeout` milliseconds. With no
children it renders as an icon-only button.

```tsx
'use client'

import { CopyButton } from '@shining-technologies/ui'

export function InvoiceNumber({ id }: { id: string }) {
  return (
    <>
      <code>{id}</code>
      <CopyButton value={id} label="Copy invoice number" onCopyError={(error) => console.error(error)} />
      <CopyButton value={id} label="Copy invoice number" copiedAnnouncement="Invoice number copied">
        Copy invoice number
      </CopyButton>
    </>
  )
}
```

| Prop                 | Type                                   | Default                                       | Description                                                                                                                   |
| -------------------- | -------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `value`              | `string`                               | required                                      | The text written to the clipboard.                                                                                            |
| `children`           | `ReactNode`                            |                                               | Visible label. Omit for an icon-only button.                                                                                  |
| `label`              | `string`                               | `children` when it is a string, else `'Copy'` | The button's accessible name (`aria-label`), with or without children. It stays the same while the confirmation shows. When you pass children, include their visible text in it. |
| `copiedLabel`        | `ReactNode`                            | `'Copied'`                                    | Replaces the visible `children` while the confirmation shows. Not used by the icon-only button.                              |
| `copiedAnnouncement` | `string`                               | `'Copied to clipboard'`                       | Announced to assistive technology when the copy succeeds.                                                                     |
| `timeout`            | `number`                               | `1200`                                        | How long the confirmation stays, in ms.                                                                                       |
| `onCopied`           | `(value: string) => void`              |                                               | Called after a successful copy.                                                                                               |
| `onCopyError`        | `(error: unknown) => void`             |                                               | Called when the copy fails. The button shows nothing on failure, so use this callback to tell the person.                    |
| `variant`            | `ButtonProps['variant']`               | `'ghost'`                                     | As on `Button`.                                                                                                               |
| `size`               | `ButtonProps['size']`                  | `'sm'` with children, `'icon-sm'` without     | As on `Button`.                                                                                                               |
| `onClick`            | `MouseEventHandler<HTMLButtonElement>` |                                               | Runs before the copy. The copy still happens unless the handler calls `event.preventDefault()`.                              |

Also accepts all `Button` props except `onCopy`. The ref goes to the `<button>`. An explicit
`aria-label` prop takes precedence over `label`.

**Clipboard.** It uses `navigator.clipboard.writeText` first. If that API is missing or rejects,
it falls back to `document.execCommand('copy')` on a temporary off-screen `<textarea>`, then returns
focus to the element that had it. The Clipboard API is missing on plain-HTTP origins and rejects
in iframes without `clipboard-write`; the fallback works in both. If both methods fail,
`onCopyError` receives the error.

**Confirmation.** While the confirmation is showing, the copy icon changes to a tick
(`sui-copy-btn__tick`), `copiedLabel` replaces the visible children, and the button gets a
`data-copied` attribute. The reset runs on a timer rather than on the next render, so a parent
re-render does not cut the confirmation short. Class: `sui-copy-btn`.

**Markup.** The component renders two elements: the `<button>`, followed by a visually hidden
`<span role="status">` that carries `copiedAnnouncement`. The live region sits beside the button
rather than inside it, because a button's content is presentational to assistive technology and a
live region there may never be announced.

## HoldButton

Runs `onHoldComplete` only after the button has been held down for `duration` milliseconds. It
is an alternative to a confirmation dialog for destructive actions that people perform often. A
fill grows across the button while it is held. If the person lets go early, the fill shrinks back
and nothing happens.

```tsx
'use client'

import { HoldButton } from '@shining-technologies/ui'

export function DeleteJob({ onDelete }: { onDelete: () => void }) {
  return (
    <HoldButton onHoldComplete={onDelete} holdingLabel="Keep holding…" confirmDescription="The job and its notes are removed.">
      Hold to delete
    </HoldButton>
  )
}
```

| Prop                 | Type         | Default                    | Description                                                                                                                                                   |
| -------------------- | ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onHoldComplete`     | `() => void` | required                   | Called once when a hold reaches `duration`, or when the fallback dialog is confirmed.                                                                         |
| `duration`           | `number`     | `1200`                     | How long the press must last, in ms.                                                                                                                           |
| `holdingLabel`       | `ReactNode`  |                            | Replaces the children while a press is in progress.                                                                                                          |
| `confirmOnClick`     | `boolean`    | `true`                     | A click with no press behind it opens a `ConfirmDialog` (see below). `false` ignores such clicks.                                                            |
| `confirmTitle`       | `ReactNode`  | derived                    | Title of the fallback dialog. By default it is the action taken from the label, as a question ("Hold to delete" gives "Delete?"). If no action can be derived, it is "Are you sure?". |
| `confirmDescription` | `ReactNode`  |                            | Description of the fallback dialog.                                                                                                                           |
| `confirmLabel`       | `ReactNode`  | derived                    | Confirm button of the fallback dialog. By default it is the derived action ("Delete"), or "Confirm" if none can be derived.                                 |
| `instructions`       | `string`     | see description            | Usage hint linked through `aria-describedby`. Default: "Press and hold to confirm, or activate to confirm in a dialog." With `confirmOnClick={false}`: "Press and hold to confirm." Pass `''` to omit it. |
| `variant`            | `ButtonProps['variant']` | `'destructive'` | As on `Button`. When `'destructive'`, the fallback dialog's confirm button is destructive too.                                                             |

Also accepts all `Button` props except `onClick`. Your `style`, `aria-describedby` and
pointer/keyboard/blur handlers are combined with the component's own, not replaced by them.

**Deriving the action.** The action comes from string `children`, or from `aria-label` when the
children are not a plain string. A leading "hold to", "hold down to" or "press and hold to" is
removed, along with trailing dots or an ellipsis, and the first letter is capitalised.

**Input.**

- Pointer: only the primary button starts a hold, so a right-click does not. Releasing the
  button, moving off it or a cancelled pointer stops the hold.
- Keyboard: holding Space or Enter counts as a hold. Key auto-repeat does not start a second hold,
  so the action fires once per press no matter how long the key stays down. Key-up or blur stops
  the hold.
- A short press, by pointer or key, does nothing.
- Screen readers in browse mode and voice control activate a button with a click that involves no
  press. With `confirmOnClick` (the default), that click opens a `ConfirmDialog`, and confirming
  calls `onHoldComplete`. Cancelling does nothing.

**Styling hooks.** Class `sui-hold-btn`, with the parts `sui-hold-btn__fill` and
`sui-hold-btn__label`. The `--sui-hold-progress` custom property on the button goes from `0%` to
`100%`, and `data-holding` is present while a press is in progress. The stylesheet sets
`touch-action: none` and `user-select: none` so a long press on a touch screen does not select
text or open a callout. In right-to-left pages the fill grows from the right.

## Accessibility

- `Button` renders a native `<button type="button">`, or the child element with `asChild`.
  Keyboard activation and focus come from the element itself. The focus ring comes from
  `sui-focusable`.
- Icon-only buttons need an `aria-label`. `CopyButton` always sets one from `label`, so its name
  does not change while "Copied" is shown.
- `ButtonGroup` is `role="group"`. Give it an `aria-label`.
- `CopyButton` announces success through a `role="status"` region placed beside the button. It
  shows nothing on failure; report failures through `onCopyError`.
- `HoldButton` explains how to use it through `aria-describedby`. It works with a keyboard (hold
  Space or Enter) and, through the confirmation dialog, with assistive technology that cannot
  hold a key.

## Related

- [Overlay](./overlay.md): the `ConfirmDialog` used by `HoldButton`
- [Badge](./badge.md): `asChild` on a badge link
- [Icons](./icons.md)
- [Feedback](./feedback.md): `Spinner` for busy buttons
- [Next.js](../nextjs.md)
- [Accessibility](../accessibility.md)

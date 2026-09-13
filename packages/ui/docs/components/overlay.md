# Overlay

Components that render in a layer above the page: dialogs, alert dialogs, sheets, a ready-made
confirmation dialog, popovers, hover cards, tooltips and dropdown menus. They are styled wrappers
around Radix UI primitives. Every overlay renders through a portal, which you can point at an
element inside a separately themed part of the page. The dialog-style panels also manage focus
return and, in development, warn when they have no accessible name.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  ConfirmDialog,
  DropdownMenu,
  Tooltip,
  PortalContainerProvider,
} from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/overlay'
```

**Server and client.** Every module in this family is `'use client'`. A Server Component can still
render an uncontrolled overlay that needs no handlers, for example a `Dialog` with a
`DialogTrigger`. Controlled state (`open` with `onOpenChange`), `ConfirmDialog`, and handlers such
as `onSelect` require a client component.

Exported types: `DialogContentProps`, `SheetContentProps`, `AlertDialogContentProps`,
`AlertDialogProps` (deprecated alias), `ConfirmAction`,
`ConfirmDialogProps`, `TooltipProps`, `TooltipProviderProps`, `PortalContainerProviderProps`.

## Dialog

A modal dialog. `DialogContent` renders the portal, a backdrop (`DialogOverlay`), the panel and a
close button in the corner.

```tsx
'use client'

import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shining-technologies/ui'

export function RenameJob() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Rename</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Rename job</DialogTitle>
          <DialogDescription>The reference appears on invoices.</DialogDescription>
        </DialogHeader>
        <DialogBody>{/* form fields */}</DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

| Export              | Built on                    | Notes                                                                                                         |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Dialog`            | Radix `Dialog.Root`         | `open`, `defaultOpen`, `onOpenChange`, `modal`. Controlled or uncontrolled.                                    |
| `DialogTrigger`     | Radix `Dialog.Trigger`      | Use `asChild` to make a `Button` the trigger.                                                                  |
| `DialogClose`       | Radix `Dialog.Close`        | Closes the dialog on click.                                                                                    |
| `DialogPortal`      | Radix `Dialog.Portal`       | Portals into the `PortalContainerProvider` container, or `<body>`. A `container` prop passed directly takes precedence. `DialogContent` already includes it. |
| `DialogOverlay`     | Radix `Dialog.Overlay`      | The backdrop. `data-slot="dialog-overlay"`, class `sui-overlay`. `DialogContent` already includes it.          |
| `DialogContent`     | Radix `Dialog.Content`      | The panel. See the props below.                                                                                |
| `DialogHeader`      | `div`                       | `data-slot="dialog-header"`, `sui-dialog__header`.                                                             |
| `DialogBody`        | `div`                       | `data-slot="dialog-body"`, `sui-dialog__body`.                                                                 |
| `DialogFooter`      | `div`                       | `data-slot="dialog-footer"`, `sui-dialog__footer`.                                                             |
| `DialogTitle`       | Radix `Dialog.Title`        | Gives the dialog its accessible name. `data-slot="dialog-title"`.                                              |
| `DialogDescription` | Radix `Dialog.Description`  | Gives the dialog its accessible description. `data-slot="dialog-description"`.                                 |

`DialogContent` props:

| Prop               | Type                                    | Default     | Description                                                                                  |
| ------------------ | --------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `size`             | `'sm' \| 'default' \| 'lg' \| 'xl'`     | `'default'` | Panel width (`sui-dialog--sm`, `--lg`, `--xl`).                                              |
| `hideClose`        | `boolean`                               | `false`     | Hide the close button in the corner (`aria-label="Close"`, class `sui-dialog__close`).       |
| `onCloseAutoFocus` | `(event: Event) => void`                |             | Runs before the built-in focus return. Call `event.preventDefault()` to move focus yourself. |

Also accepts all Radix `Dialog.Content` props (`onOpenAutoFocus`, `onEscapeKeyDown`,
`onPointerDownOutside`, `onInteractOutside`, `forceMount` and others). Styling hooks:
`data-slot="dialog-content"`, the class `sui-dialog`, and Radix's `data-state="open|closed"`.

`dialogVariants({ size? })` is the class-variance-authority function for the panel classes.

**Keyboard and behaviour** (from Radix): opening moves focus into the panel and keeps Tab inside
it. Escape and a click on the backdrop close the dialog. Content outside the dialog is hidden from
assistive technology while it is open.

### Focus return

When a dialog, alert dialog or sheet closes, focus goes to the first of these that can take it:

1. The element that had focus when the panel opened.
2. If that element was inside a menu (a `DropdownMenuItem`, which has unmounted by the time the
   dialog closes) or nothing had focus, the trigger of the most recent `DropdownMenu`, provided
   that menu closed less than one second before the dialog opened and its trigger is still in the
   document.
3. Otherwise Radix's default, which is the `DialogTrigger` if there is one.

Radix on its own returns focus only to a `DialogTrigger`. Without the steps above, a controlled
dialog, a `ConfirmDialog` or a dialog opened from a menu item would leave focus on `<body>`. Your
own `onCloseAutoFocus` runs first; if it calls `event.preventDefault()`, the component does not
move focus.

Opening a dialog from a menu item:

```tsx
'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shining-technologies/ui'

export function JobActions() {
  const [renaming, setRenaming] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Outside the menu, so it stays mounted after the menu closes. */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogTitle>Rename job</DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

When the dialog closes, focus returns to the "Actions" button.

### Accessible name warning

In development, `DialogContent`, `AlertDialogContent` and `SheetContent` check after mounting
whether the panel has an accessible name: a non-empty `aria-label`, or an `aria-labelledby` that
points at an element with text (which is what `DialogTitle` sets up). If not, they log once per
panel:

```
[shining-ui] <DialogContent> has no accessible name, so a screen reader announces only "dialog". Render a <DialogTitle> inside it (add className="sui-visually-hidden" to hide it visually) or pass aria-label to <DialogContent>.
```

The message names the matching title component: `AlertDialogTitle` for `AlertDialogContent` and
`SheetTitle` for `SheetContent`.

The check runs when `process.env.NODE_ENV !== 'production'`. Your bundler replaces that value, so
production builds do not include the check. Where `process` is not defined at all, such as an
unbundled browser import, the check is skipped. To fix the warning, render a title (the preferred
fix), hidden visually if the design has no room for it, or pass `aria-label` to the content:

```tsx
<DialogContent>
  <DialogTitle className="sui-visually-hidden">Photo preview</DialogTitle>
  …
</DialogContent>

<DialogContent aria-label="Photo preview">…</DialogContent>
```

Give the title the `sui-visually-hidden` class rather than wrapping it in `VisuallyHidden`:
`DialogTitle` renders a heading, and a heading inside that component's `<span>` is invalid HTML.

## AlertDialog

A dialog that requires an explicit answer. `AlertDialogContent` sets `role="alertdialog"`, has no
close button, defaults to `size="sm"`, and never closes on a click or focus outside it. Your own
`onPointerDownOutside` and `onInteractOutside` handlers still run, but they cannot re-enable
outside dismissal. Escape still closes it.

```tsx
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@shining-technologies/ui'

export function DeleteClient({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete client</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this client?</AlertDialogTitle>
          <AlertDialogDescription>Their jobs and invoices are removed too.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

| Export                                                                          | Is                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `AlertDialog`, `AlertDialogTrigger`                                             | Radix `Dialog.Root` and `Dialog.Trigger`                             |
| `AlertDialogContent`                                                            | `DialogContent` with the behaviour described above                   |
| `AlertDialogCancel`, `AlertDialogAction`                                        | Both Radix `Dialog.Close`: they close the dialog. Put your handler on the child's `onClick`. |
| `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription` | The same components as the `Dialog*` parts                    |

`AlertDialogContentProps` is the props type of `AlertDialogContent`: `DialogContentProps` with
`size` defaulting to `'sm'`. It still accepts `hideClose` and `role` so existing code type-checks,
but both are ignored and marked deprecated: the panel always has `role="alertdialog"` and never
shows the close button. `AlertDialogProps` is the same type under its earlier name, kept as a
deprecated alias.

Initial focus goes to the first focusable element in the panel, so put the Cancel button first in
the footer.

For async actions, a busy state and error handling, use `ConfirmDialog` instead.

## ConfirmDialog

A complete confirmation dialog built on `AlertDialog`. It is controlled only: you own `open`. Async
actions keep it open, and repeated clicks cannot run an action twice.

```tsx
'use client'

import { useState } from 'react'
import { Button, ConfirmDialog } from '@shining-technologies/ui'

export function ArchiveClient({ archive }: { archive: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Archive
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive this client?"
        description="You can restore it from Settings."
        confirmLabel="Archive"
        destructive
        onConfirm={archive}
        onError={() => setError('Archiving failed. Try again.')}
      >
        {error ? <p role="alert">{error}</p> : null}
      </ConfirmDialog>
    </>
  )
}
```

| Prop           | Type                                               | Default     | Description                                                                                                                |
| -------------- | -------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `open`         | `boolean`                                          | required    |                                                                                                                            |
| `onOpenChange` | `(open: boolean) => void`                          | required    | Not called while an action is pending.                                                                                     |
| `title`        | `ReactNode`                                        | required    | Rendered in a `DialogTitle`, so it names the dialog.                                                                       |
| `description`  | `ReactNode`                                        |             | Rendered in a `DialogDescription`.                                                                                         |
| `children`     | `ReactNode`                                        |             | Extra content between the header and the buttons (`sui-confirm__body`), such as a list of what will be deleted.          |
| `actions`      | `ConfirmAction[]`                                  |             | The buttons, in reading order. Omit it for the default Cancel and Confirm pair.                                            |
| `confirmLabel` | `ReactNode`                                        | `'Confirm'` | Label of the default confirm button.                                                                                       |
| `cancelLabel`  | `ReactNode`                                        | `'Cancel'`  | Label of the default cancel button.                                                                                        |
| `onConfirm`    | `() => void \| Promise<unknown>`                   |             | Called by the default confirm button. It may return a promise.                                                             |
| `destructive`  | `boolean`                                          | `false`     | Draws the default confirm button with the `destructive` variant.                                                           |
| `onError`      | `(error: unknown, action: ConfirmAction) => void`  |             | Called when an action throws or its promise rejects. Without it, the error is rethrown and surfaces as an unhandled rejection. |
| `className`    | `string`                                           |             | Added to the panel, which also has the class `sui-confirm`.                                                                |

`ConfirmAction`:

| Field      | Type                             | Description                                                              |
| ---------- | -------------------------------- | ------------------------------------------------------------------------ |
| `label`    | `ReactNode`                      | Required.                                                                |
| `onClick`  | `() => void \| Promise<unknown>` | Omit it for a button that only closes the dialog.                        |
| `variant`  | `ButtonProps['variant']`         | Defaults to `'outline'`.                                                 |
| `icon`     | `ReactNode`                      | Shown before the label; replaced by a spinner while the action is pending. |
| `disabled` | `boolean`                        |                                                                          |
| `keepOpen` | `boolean`                        | Leave the dialog open after the action succeeds.                         |

Behaviour:

- The default actions are Cancel (`outline`) followed by Confirm (`default`, or `destructive`).
- Clicking an action calls `onClick`. If the result is a thenable (any object with a `then`
  method, not only a native `Promise`), that button shows a spinner and `aria-busy="true"`, the
  other buttons are disabled, and Escape and `onOpenChange` are blocked until it settles.
- On success the dialog closes, unless `keepOpen` is set. On failure it stays open, every button
  is enabled again, and `onError` is called.
- A second click that arrives before the re-render is ignored, so a double-click runs the action
  once.
- It has no trigger. Focus returns to the element that opened it (see
  [Focus return](#focus-return)).

`HoldButton` uses `ConfirmDialog` as its fallback for assistive technology; see
[Button](./button.md#holdbutton).

## Sheet

A dialog that slides in from one edge of the viewport. It has the same semantics as `Dialog`:
modal, focus kept inside, and closes on Escape or a backdrop click.

```tsx
'use client'

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shining-technologies/ui'

export function Filters() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filters</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the job list.</SheetDescription>
        </SheetHeader>
        {/* filter fields */}
        <SheetFooter>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

| Export                                                         | Is                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| `Sheet`, `SheetTrigger`, `SheetClose`                          | Radix `Dialog.Root`, `Dialog.Trigger`, `Dialog.Close`   |
| `SheetContent`                                                 | The panel. See the props below.                         |
| `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` | The same components as `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` |

`SheetContent` props:

| Prop               | Type                                      | Default   | Description                                                                 |
| ------------------ | ----------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `side`             | `'top' \| 'right' \| 'bottom' \| 'left'`  | `'right'` | The edge the panel is attached to (`sui-sheet--<side>`).                    |
| `hideClose`        | `boolean`                                 | `false`   | Hide the close button in the corner.                                        |
| `onCloseAutoFocus` | `(event: Event) => void`                  |           | As on `DialogContent`.                                                      |

Also accepts all Radix `Dialog.Content` props. Styling hooks: `data-slot="sheet-content"`, the
class `sui-sheet`. Focus return and the accessible-name warning work as on `DialogContent`.

## Popover

Non-modal content anchored to a trigger, such as a filter form or a date picker.

```tsx
'use client'

import { Button, Popover, PopoverContent, PopoverTrigger } from '@shining-technologies/ui'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Assign</Button>
  </PopoverTrigger>
  <PopoverContent aria-label="Assign a crew">{/* picker */}</PopoverContent>
</Popover>
```

| Export           | Is                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Popover`        | Radix `Popover.Root` (`open`, `defaultOpen`, `onOpenChange`, `modal`)                                                     |
| `PopoverTrigger` | Radix `Popover.Trigger`                                                                                                  |
| `PopoverAnchor`  | Radix `Popover.Anchor`: positions the content against an element other than the trigger                                   |
| `PopoverContent` | Radix `Popover.Content`, portalled. Defaults: `align="start"`, `sideOffset={6}`. Classes `sui-surface sui-popover`.      |

`PopoverContent` accepts all Radix `Popover.Content` props. Radix handles the behaviour: Escape
and a click outside close the popover, and focus returns to the trigger.

## HoverCard

A preview shown when the pointer rests on a trigger, typically a link.

```tsx
'use client'

import Link from 'next/link'
import { HoverCard, HoverCardContent, HoverCardTrigger, UserAvatar } from '@shining-technologies/ui'

<HoverCard>
  <HoverCardTrigger asChild>
    <Link href="/people/ana">Ana Ortiz</Link>
  </HoverCardTrigger>
  <HoverCardContent>
    <UserAvatar name="Ana Ortiz" status="online" /> Crew lead, Sydney
  </HoverCardContent>
</HoverCard>
```

| Export             | Is                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `HoverCard`        | Radix `HoverCard.Root` (`openDelay`, `closeDelay`, `open`, `onOpenChange`, …)                                    |
| `HoverCardTrigger` | Radix `HoverCard.Trigger`                                                                                        |
| `HoverCardContent` | Radix `HoverCard.Content`, portalled. Default `sideOffset={6}`. `data-slot="hover-card"`, classes `sui-surface sui-hover-card`. |

Radix designs hover cards for sighted pointer users, so keyboard and screen-reader users may never
see the content. Anything important in a hover card must also be available elsewhere, for example
on the page the link opens.

## Tooltip

A short text hint for a control. The API is a single component: pass the text as `content` and
the trigger element as `children`.

```tsx
'use client'

import { Button, Tooltip, TrashIcon } from '@shining-technologies/ui'

<Tooltip content="Delete job">
  <Button variant="ghost" size="icon" aria-label="Delete job">
    <TrashIcon />
  </Button>
</Tooltip>
```

| Prop            | Type                                      | Default                                  | Description                                                                                 |
| --------------- | ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `content`       | `ReactNode`                               | required                                 | The tooltip text. When it is `null`, `undefined`, `false` or `''`, only the trigger renders. |
| `children`      | `ReactNode`                               | required                                 | The trigger: one element that accepts a ref and spreads props. Every kit control does.      |
| `side`          | `'top' \| 'right' \| 'bottom' \| 'left'`  | `'top'`                                  |                                                                                             |
| `align`         | `'start' \| 'center' \| 'end'`            | Radix default                            |                                                                                             |
| `sideOffset`    | `number`                                  | `6`                                      | Distance from the trigger, in px.                                                           |
| `delayDuration` | `number`                                  | the `TooltipProvider`'s delay, or `300`  | Hover time before the tooltip opens, in ms.                                                 |
| `open`          | `boolean`                                 |                                          | Controlled open state.                                                                      |
| `defaultOpen`   | `boolean`                                 |                                          | Initial open state when uncontrolled.                                                       |
| `onOpenChange`  | `(open: boolean) => void`                 |                                          |                                                                                             |
| `className`     | `string`                                  |                                          | Added to the tooltip content (`sui-tooltip`).                                               |

No provider is required. A `Tooltip` with no `TooltipProvider` above it creates its own, with a
300ms delay. Inside a `TooltipProvider` it uses that provider's settings instead, so the shared
delay and the reduced delay when moving between tooltips apply.

A disabled `<button>` receives no pointer events, so it cannot show a tooltip. To explain why a
control is disabled, wrap it in a focusable element:

```tsx
<Tooltip content="You need the Admin role">
  <span tabIndex={0}>
    <Button disabled>Delete</Button>
  </span>
</Tooltip>
```

### TooltipProvider

Shares tooltip settings across its subtree. Optional. Accepts all Radix `Tooltip.Provider` props
(`delayDuration`, `skipDelayDuration`, `disableHoverableContent`).

```tsx
<TooltipProvider delayDuration={150}>{children}</TooltipProvider>
```

Radix behaviour: the tooltip opens on hover and on keyboard focus and closes on Escape. The
content has `role="tooltip"` and describes the trigger while it is open. The tooltip text only
supplements the control: the trigger still needs its own accessible name, as in the `aria-label`
example above, and touch users never see the tooltip.

## DropdownMenu

A menu of actions or options that opens from a trigger.

```tsx
'use client'

import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  MoreIcon,
} from '@shining-technologies/ui'

export function RowMenu({ onDelete }: { onDelete: () => void }) {
  const [showArchived, setShowArchived] = useState(false)
  const [sort, setSort] = useState('newest')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Row actions">
          <MoreIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Job</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sydney</DropdownMenuItem>
              <DropdownMenuItem>Melbourne</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={(v) => setShowArchived(v === true)}>
          Show archived
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

| Export                     | Is                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `DropdownMenu`             | Radix `DropdownMenu.Root` (`open`, `defaultOpen`, `onOpenChange`, `modal`, `dir`)                                                      |
| `DropdownMenuTrigger`      | Radix `DropdownMenu.Trigger`                                                                                                          |
| `DropdownMenuContent`      | Radix `DropdownMenu.Content`, portalled. Defaults: `align="end"`, `sideOffset={6}`. Classes `sui-surface sui-menu`. It records its trigger for [focus return](#focus-return). |
| `DropdownMenuItem`         | Radix `DropdownMenu.Item`, plus `destructive?: boolean` (class `sui-menu__item--danger`). Use `onSelect` for the action.               |
| `DropdownMenuCheckboxItem` | Radix `DropdownMenu.CheckboxItem` (`checked`, `onCheckedChange`), with a check indicator                                               |
| `DropdownMenuRadioGroup`   | Radix `DropdownMenu.RadioGroup` (`value`, `onValueChange`)                                                                            |
| `DropdownMenuRadioItem`    | Radix `DropdownMenu.RadioItem` (`value`), with a dot indicator                                                                        |
| `DropdownMenuGroup`        | Radix `DropdownMenu.Group`                                                                                                            |
| `DropdownMenuLabel`        | Radix `DropdownMenu.Label` (`sui-menu__label`)                                                                                        |
| `DropdownMenuSeparator`    | Radix `DropdownMenu.Separator` (`sui-menu__separator`)                                                                                |
| `DropdownMenuSub`          | Radix `DropdownMenu.Sub`                                                                                                              |
| `DropdownMenuSubTrigger`   | Radix `DropdownMenu.SubTrigger`, with a trailing chevron icon (`sui-menu__chevron`)                                                   |
| `DropdownMenuSubContent`   | Radix `DropdownMenu.SubContent`, portalled. Default `sideOffset={4}`.                                                                 |

Each component accepts all props of the Radix part it wraps. Other classes: `sui-menu__item`,
`sui-menu__item--check`, `sui-menu__indicator`, `sui-menu__dot`.

**Keyboard** (from Radix): Enter, Space or ArrowDown on the trigger opens the menu. Arrow keys,
Home and End move between items, and typing a character jumps to a matching item. Enter or Space
selects an item. ArrowRight opens a submenu and ArrowLeft closes it. Escape closes the menu and
returns focus to the trigger.

## PortalContainerProvider

Sets where overlays in its subtree render. By default they render into `<body>`, which inherits
the theme from `:root` and `.dark`. An element with its own theme, such as
`<section data-theme="slate">`, is not an ancestor of `<body>`, so overlays opened inside it would
lose that theme. Wrap the subtree and pass an element inside it as the `container`:

```tsx
'use client'

import { useState } from 'react'
import { PortalContainerProvider } from '@shining-technologies/ui'

export function TenantPreview({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  return (
    <section data-theme="slate" ref={setContainer}>
      <PortalContainerProvider container={container}>{children}</PortalContainerProvider>
    </section>
  )
}
```

| Prop        | Type                               | Default  | Description                                                                         |
| ----------- | ---------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `container` | `HTMLElement \| null \| undefined` | required | The element to render into. `null` or `undefined` means `<body>`, which applies on the first render, before the ref callback has run. |
| `children`  | `ReactNode`                        |          |                                                                                     |

These components read the container: `DialogPortal`, and therefore `DialogContent`,
`AlertDialogContent`, `SheetContent` and `ConfirmDialog`; `PopoverContent`; `HoverCardContent`;
`DropdownMenuContent` and `DropdownMenuSubContent`; and `Tooltip`. No provider is needed for a
theme that applies to the whole application.

To send a single overlay somewhere else, wrap just that overlay in its own
`PortalContainerProvider`; the nearest provider wins. The content components do not take a
`container` prop themselves. Only `DialogPortal` does, and a `container` passed to it directly
takes precedence over the provider.

### usePortalContainer

`usePortalContainer(): HTMLElement | undefined` returns the nearest provider's container, or
`undefined` (meaning `<body>`). Use it to send your own portals to the same place:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainer } from '@shining-technologies/ui'

export function Banner({ children }: { children: React.ReactNode }) {
  const container = usePortalContainer()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Portal only after hydration: the server has no document to portal into.
  if (!mounted) return null
  return createPortal(children, container ?? document.body)
}
```

## Accessibility

- **Names.** Give every `DialogContent`, `AlertDialogContent` and `SheetContent` a `DialogTitle`,
  or an `aria-label` when no visible title fits. In development, a missing name produces a
  console warning. For `ConfirmDialog`, `title` is the name.
- **Focus.** Dialogs and sheets move focus inside and keep it there while open. On close, focus
  returns to the element that opened them, even without a trigger and even when they were opened
  from a menu item. See [Focus return](#focus-return).
- **Dismissal.** Dialogs and sheets close on Escape, a backdrop click and the close button (which
  has `aria-label="Close"`). Alert dialogs and `ConfirmDialog` do not close on an outside click,
  and `ConfirmDialog` ignores Escape while an action is pending.
- **Busy state.** A pending `ConfirmDialog` action has `aria-busy="true"` and the other choices
  are disabled.
- **Menus** follow the WAI-ARIA menu pattern through Radix. A `DropdownMenuItem` with
  `destructive` is marked only by colour, so its label should say what it does.
- **Tooltips and hover cards** only supplement the page. Their triggers need their own accessible
  names, and important content must also be available elsewhere.
- **Portals** keep the theme when you use `PortalContainerProvider`, so contrast inside a
  separately themed area stays as designed.

## Related

- [Button](./button.md): triggers, and `HoldButton`, which uses `ConfirmDialog`
- [Visually hidden](./visually-hidden.md): hiding a dialog title visually
- [Theming](../theming.md#6-scoped-themes): scoped themes and portals
- [Feedback](./feedback.md): toasts and spinners
- [Form](./form.md): fields inside dialogs and popovers
- [Next.js](../nextjs.md)
- [Accessibility](../accessibility.md)
- [Troubleshooting](../troubleshooting.md)

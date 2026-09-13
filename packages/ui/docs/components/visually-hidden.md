# Visually hidden

`VisuallyHidden` renders text that screen readers announce but that takes no space on screen. Use
it to name icon-only controls, to add context a sighted user gets from the layout, and for status
messages that need no visible text.

```tsx
import { VisuallyHidden } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/visually-hidden'
```

**Server and client.** The module has no `'use client'` directive. `VisuallyHidden` is a Server
Component and can also be used in client code.

## VisuallyHidden

```tsx
import { Button, TrashIcon, VisuallyHidden } from '@shining-technologies/ui'

export function DeleteRowButton({ name }: { name: string }) {
  return (
    <Button size="icon" variant="ghost">
      <TrashIcon />
      <VisuallyHidden>Delete {name}</VisuallyHidden>
    </Button>
  )
}
```

`VisuallyHidden` has no props of its own. It accepts native `HTMLAttributes<HTMLSpanElement>` and
forwards its `ref` to the `<span>`. `className` is merged with `sui-sr-only`.

The `sui-sr-only` class (in `styles.css`) keeps the element in the accessibility tree while
clipping it to a 1×1 px box:

```css
position: absolute;
width: 1px;
height: 1px;
padding: 0;
margin: -1px;
overflow: hidden;
clip: rect(0, 0, 0, 0);
white-space: nowrap;
border-width: 0;
```

The stylesheet must be loaded. Without `@shining-technologies/ui/styles.css`, the text is visible.

## Examples

Extra context for a link whose visible text is ambiguous out of context:

```tsx
<a href="/invoices/2041">
  View<VisuallyHidden> invoice INV-2041</VisuallyHidden>
</a>
```

A warning that a link opens a new tab:

```tsx
<a href="https://status.example.com" target="_blank" rel="noreferrer">
  Status page<VisuallyHidden> (opens in a new tab)</VisuallyHidden>
</a>
```

A polite announcement with no visible text:

```tsx
import { VisuallyHidden } from '@shining-technologies/ui'

export function SaveStatus({ saved }: { saved: boolean }) {
  return (
    <VisuallyHidden role="status" aria-live="polite">
      {saved ? 'Changes saved' : ''}
    </VisuallyHidden>
  )
}
```

Keep a live region mounted and change its text. A region inserted together with its message is
often not announced.

## Accessibility

- Screen readers, braille displays and voice-control software all read hidden text. Keep it short,
  and do not repeat what the visible label already says.
- Do not put focusable elements inside `VisuallyHidden`. The element stays clipped when focused, so
  a keyboard user would land on something invisible. A skip link needs styles that reveal it on
  focus.
- It renders a `<span>`, so use it where phrasing content is allowed (inside buttons, links,
  headings, table cells).
- An `aria-label` on a control is an alternative for naming it. `VisuallyHidden` text is also
  picked up by browser translation and can be mixed with visible text.

## Related

- [Icons](icons.md): icons are `aria-hidden` and rely on text like this
- [Button](button.md): icon-only buttons
- [Accessibility](../accessibility.md)

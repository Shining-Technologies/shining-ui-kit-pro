# Separator

`Separator` draws a 1px rule between pieces of content, horizontal or vertical. It renders a plain
`<div>` with the same attributes as Radix's Separator, without a Radix dependency.

```tsx
import { Separator } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/separator'
```

**Server and client.** The module has no `'use client'` directive. `Separator` is a Server
Component and can also be used in client code.

## Separator

```tsx
import { Separator } from '@shining-technologies/ui'

export function AccountSummary() {
  return (
    <div>
      <p>Signed in as ada@example.com</p>
      <Separator />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/settings">Settings</a>
        <Separator orientation="vertical" style={{ height: 16 }} />
        <a href="/billing">Billing</a>
      </nav>
    </div>
  )
}
```

| Prop          | Type                           | Default        | Description |
| ------------- | ------------------------------ | -------------- | ----------- |
| `orientation` | `'horizontal' \| 'vertical'`   | `'horizontal'` | Direction of the rule. |
| `decorative`  | `boolean`                      | `true`         | `true` hides the rule from assistive technology (`role="none"`). Set `false` when screen-reader users should know the content is divided (`role="separator"`). |

Other props are native `HTMLAttributes<HTMLDivElement>`. The `ref` is forwarded to the `<div>`.

Rendered attributes:

| Case                         | Attributes |
| ---------------------------- | ---------- |
| Always                       | `data-orientation="horizontal" \| "vertical"`, class `sui-separator sui-separator--<orientation>` |
| `decorative` (default)       | `role="none"` |
| `decorative={false}`         | `role="separator"`, plus `aria-orientation="vertical"` when vertical. Horizontal is the implicit ARIA default, so it is omitted. |

### Sizing

- **Horizontal.** `width: 100%`, `height: 1px`.
- **Vertical.** `width: 1px`, `align-self: stretch`. It takes the height of a flex row it sits in.
  Outside a flex container, or to make it shorter than the row, give it an explicit height.
- The colour is `var(--border)`. Override it with `className` or `style`
  (`style={{ background: 'var(--input)' }}`).
- The rule has no margin. Space it with the parent's `gap` or with margin utilities.

## Accessibility

- Leave `decorative` on for rules that are only visual (between a heading and a list, between
  toolbar groups whose buttons are already grouped). Most separators are decorative.
- Set `decorative={false}` when the division carries meaning that is not otherwise conveyed, such as
  between two unrelated groups of content in a menu or panel. Screen readers announce a separator.
- The separator is not focusable, and it is not a resizable splitter.

## Related

- [Layout](layout.md): stacks and page structure
- [Navigation](navigation.md)
- [Theming](../theming.md): `--border`

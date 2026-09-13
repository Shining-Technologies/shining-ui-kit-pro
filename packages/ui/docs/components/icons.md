# Icons

The package ships a small set of stroke icons, the glyphs its own components use, so it needs no
icon-library dependency. Each icon is an inline 24×24 `<svg>` drawn in `currentColor`, sized to
`1em` and hidden from assistive technology by default.

```tsx
import { CheckIcon, SearchIcon, TrashIcon } from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/icons'
```

**Server and client.** The icons module has no `'use client'` directive. Every icon is a Server
Component and can also be used in client code.

## Usage

```tsx
import { Button, TrashIcon } from '@shining-technologies/ui'

export function DeleteButton() {
  return (
    <Button variant="destructive">
      <TrashIcon />
      Delete
    </Button>
  )
}
```

Icons inherit the font size and text colour of their parent, so in most places they need no props.

## Props

Every icon accepts `IconProps`, exported as a type and equal to React's `SVGProps<SVGSVGElement>`
(the native `<svg>` attributes). Your props are applied after these defaults, so any of them can be
overridden:

```tsx
import { CheckIcon, type IconProps } from '@shining-technologies/ui'

export function DoneMark(props: IconProps) {
  return <CheckIcon strokeWidth={2.5} {...props} />
}
```

| Attribute         | Default         | Notes |
| ----------------- | --------------- | ----- |
| `viewBox`         | `'0 0 24 24'`   | |
| `width`, `height` | `'1em'`         | Scales with the surrounding `font-size`. |
| `fill`            | `'none'`        | |
| `stroke`          | `'currentColor'`| Follows the CSS `color` of the icon or its parent. |
| `strokeWidth`     | `2`             | |
| `strokeLinecap`   | `'round'`       | |
| `strokeLinejoin`  | `'round'`       | |
| `aria-hidden`     | `'true'`        | See [Accessibility](#accessibility). |
| `focusable`       | `'false'`       | |

`StarIcon` takes one extra prop:

| Prop     | Type      | Default | Description |
| -------- | --------- | ------- | ----------- |
| `filled` | `boolean` | —       | Sets `fill="currentColor"` to draw a solid star. An explicit `fill` prop takes precedence. |

The icons are plain function components, not `forwardRef` components. Under React 18 a `ref` is not
forwarded to the `<svg>`. Under React 19, where `ref` is an ordinary prop, it reaches the `<svg>`
with the other props.

### Size and colour

```tsx
<SearchIcon />                                      {/* 1em, currentColor */}
<SearchIcon width={20} height={20} />               {/* fixed pixels */}
<SearchIcon className="size-5 text-muted-foreground" /> {/* Tailwind utilities */}
<SearchIcon style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
```

Setting `color` (or a text-colour utility) changes the stroke, because the stroke is `currentColor`.
`MoreIcon`'s dots and `PaletteIcon`'s paint dots are filled with `currentColor` as well.

`SpinnerIcon` is a static arc. It does not animate and does not announce anything. For a loading
indicator, use `Spinner` from [Feedback](feedback.md).

## Available icons

54 icons, grouped by typical use. Every name ends in `Icon`.

| Group            | Icons |
| ---------------- | ----- |
| Direction        | `ChevronUpIcon`, `ChevronDownIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ChevronsLeftIcon`, `ChevronsRightIcon`, `ArrowLeftIcon`, `ArrowRightIcon`, `ArrowUpIcon` |
| Tables and lists | `SortIcon`, `FilterIcon`, `ColumnsIcon`, `ListIcon`, `SlidersIcon`, `PinIcon`, `MoreIcon` (vertical dots), `SearchIcon` |
| Actions          | `CheckIcon`, `MinusIcon`, `PlusIcon`, `CloseIcon`, `TrashIcon`, `PencilIcon`, `CopyIcon`, `UploadIcon`, `ExternalLinkIcon`, `LinkIcon` |
| Status           | `AlertIcon` (circle with exclamation), `InfoIcon`, `CheckCircleIcon`, `TriangleAlertIcon`, `SpinnerIcon`, `InboxIcon` (empty state) |
| Data             | `TrendUpIcon`, `TrendDownIcon`, `CalendarIcon`, `ClockIcon` |
| Appearance       | `SunIcon`, `MoonIcon`, `MonitorIcon`, `PaletteIcon`, `LayoutIcon`, `PanelLeftIcon`, `MenuIcon`, `EyeIcon`, `EyeOffIcon` |
| Objects          | `MailIcon`, `PhoneIcon`, `FileIcon`, `ImageIcon`, `TagIcon`, `GlobeIcon`, `CreditCardIcon`, `StarIcon` |

## Accessibility

Every icon renders `aria-hidden="true"` and `focusable="false"`. Icons are decorative by default,
and the text next to them, or the control's accessible name, carries the meaning.

- **Icon with visible text.** Nothing extra is needed.
- **Icon-only button.** Name the button, not the icon:

  ```tsx
  <Button size="icon" variant="ghost" aria-label="Delete invoice">
    <TrashIcon />
  </Button>
  ```

  or put hidden text inside it with [`VisuallyHidden`](visually-hidden.md).
- **Standalone meaningful icon** (a status glyph with no text beside it). Override the defaults:

  ```tsx
  <TriangleAlertIcon aria-hidden={false} role="img" aria-label="Overdue" />
  ```

  Visible text is usually clearer for everyone. Colour alone should not carry the meaning.

## Icons from other libraries

Components that accept an icon use one of two prop types.

**`ReactNode`: pass an element.** Any icon library works, as does any other element.

| Props type (family)                                          | Prop |
| ------------------------------------------------------------ | ---- |
| `AlertProps` ([Feedback](feedback.md))                       | `icon?: ReactNode \| null` |
| `EmptyStateProps` ([Feedback](feedback.md))                  | `icon?: ReactNode` |
| `StatsCardProps`, `SummaryCardProps` ([Card](card.md))       | `icon?: ReactNode` |
| `StatusDefinition` ([Badge](badge.md))                       | `icon?: ReactNode` |
| `ComboboxOption` ([Form](form.md))                           | `icon?: ReactNode` |
| `BottomNavItemProps` ([Layout](layout.md))                   | `icon: ReactNode` (required) |
| `SectionTab` ([Navigation](navigation.md))                   | `icon?: ReactNode` |
| `ConfirmAction` ([Overlay](overlay.md))                      | `icon?: ReactNode` |
| `SidebarSectionProps`, `SidebarMenuItemProps` ([Sidebar](sidebar.md)) | `icon?: ReactNode` |
| `RowActionItem` ([Data table](../data-table.md))             | `icon?: ReactNode` |

```tsx
import { Mail } from 'lucide-react'
import { MailIcon } from '@shining-technologies/ui'

const kitIcon = <MailIcon />
const lucideIcon = <Mail aria-hidden="true" />
```

Elements are serialisable, so a Server Component can pass them to a client component.

**Component type: pass the component itself.** `RowActionProps.icon`, and `RowActionSpec.icon`
through it, is typed `ComponentType<SVGProps<SVGSVGElement>>`. The row action renders the
component. Every icon on this page satisfies that type:

```tsx
'use client'
import { PencilIcon, RowAction } from '@shining-technologies/ui'

export function EditAction({ onEdit }: { onEdit: () => void }) {
  return <RowAction icon={PencilIcon} label="Edit" onClick={onEdit} />
}
```

The source names lucide-react icons as intended values. If your library's component type is not
assignable to `ComponentType<SVGProps<SVGSVGElement>>` under your TypeScript settings, wrap the icon
in a function component:

```tsx
'use client'
import type { SVGProps } from 'react'
import { Mail } from 'lucide-react'
import { RowAction } from '@shining-technologies/ui'

function MailGlyph(props: Omit<SVGProps<SVGSVGElement>, 'ref'>) {
  return <Mail {...props} />
}

<RowAction icon={MailGlyph} label="Email customer" href="mailto:ops@example.com" />
```

A component (a function) cannot be passed from a Server Component to a client component. Define
row actions in a client file.

`TimeInput`'s `icon` prop is a `boolean` switch, not an icon slot. See [Date and time](date-time.md).

## Related

- [Button](button.md): icon sizes `icon`, `icon-sm`, `icon-lg`
- [Visually hidden](visually-hidden.md): text for icon-only controls
- [Card](card.md): `CardIcon`, a tinted tile for a glyph
- [Accessibility](../accessibility.md)

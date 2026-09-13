# Badge

Small labels. `Badge` is a static label with a tone and variant you choose. `StatusBadge` takes a
raw status value from your data, such as `'in_progress'` or `'PAID'`, and looks up its label and
tone in a vocabulary that your application supplies.

```tsx
import {
  Badge,
  badgeVariants,
  StatusBadge,
  statusBadgeVariants,
  StatusRegistryProvider,
  useStatusRegistry,
  resolveStatus,
} from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/badge'
```

**Server and client.** `Badge` and `badgeVariants` come from a module without `'use client'` and
work in Server Components. `StatusBadge`, `StatusRegistryProvider`, `useStatusRegistry`,
`statusBadgeVariants` and `resolveStatus` come from a `'use client'` module. You can render the
components from a Server Component. Call the functions (`statusBadgeVariants`, `resolveStatus`)
only from client code: Next.js does not let a Server Component call a function exported from a
client module.

Exported types: `BadgeProps`, `StatusBadgeProps`, `StatusRegistryProviderProps`, `StatusTone`,
`StatusDefinition`, `StatusVocabulary`, `StatusRegistry`.

## Badge

A `<span>` with a tone and a variant. `tone` sets the meaning (the colour), and `variant` sets how
strongly it is drawn. Every tone uses a theme token.

```tsx
import { Badge } from '@shining-technologies/ui'

<Badge tone="success">Paid</Badge>
<Badge tone="warning" variant="outline">Due soon</Badge>
<Badge tone="destructive" variant="solid">Overdue</Badge>
```

| Prop        | Type                                                                          | Default     | Description                                                                 |
| ----------- | ----------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `tone`      | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'destructive' \| 'info'` | `'neutral'` | The colour, taken from the matching theme token.                            |
| `variant`   | `'soft' \| 'solid' \| 'outline'`                                              | `'soft'`    | Tinted background, filled, or bordered.                                     |
| `asChild`   | `boolean`                                                                     | `false`     | Render the single child element instead of a `<span>`, for a badge that links. |
| `className` | `string`                                                                      |             | Merged after the variant classes.                                           |

Also accepts all `<span>` props.

A badge that links:

```tsx
import Link from 'next/link'
import { Badge } from '@shining-technologies/ui'

<Badge asChild tone="info">
  <Link href="/jobs?status=open">12 open</Link>
</Badge>
```

Styling hooks: `data-slot="badge"`, classes `sui-badge`, `sui-badge--<tone>` and
`sui-badge--<variant>`.

## badgeVariants

The class-variance-authority function behind `Badge`. `badgeVariants({ tone?, variant? })` returns
the class string, for styling an element that is not a `Badge`.

## StatusBadge

Renders a status value as a badge with a label and tone. Lookup order:

1. The `statuses` prop, if you pass it. It replaces the registry vocabulary; the two are not
   merged.
2. Otherwise `registry[type]` from the nearest `StatusRegistryProvider`.
3. In the chosen vocabulary, the exact key, then the lowercased key.
4. If nothing matches, the badge stays neutral and the label is built from the raw value:
   underscores and hyphens become spaces, camelCase is split into words, and the result is
   sentence case. `in_progress` becomes "In progress" and `PAID` becomes "Paid".

A status value that nobody defined still renders, so a new value from the server does not break
the page.

```tsx
'use client'

import { StatusBadge, StatusRegistryProvider, type StatusRegistry } from '@shining-technologies/ui'

const statuses: StatusRegistry = {
  job: {
    scheduled: { label: 'Scheduled', tone: 'info' },
    in_progress: { label: 'In progress', tone: 'primary' },
    complete: { label: 'Complete', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'destructive' },
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <StatusRegistryProvider registry={statuses}>{children}</StatusRegistryProvider>
}

// Anywhere below the provider:
<StatusBadge type="job" status="in_progress" />
<StatusBadge type="job" status="escalated_to_legal" /> {/* "Escalated to legal", neutral */}
<StatusBadge status="draft" statuses={{ draft: { label: 'Not sent', tone: 'warning' } }} />
```

| Prop        | Type                                                                          | Default          | Description                                                                                         |
| ----------- | ----------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `status`    | `string`                                                                      | required         | The raw value from your data.                                                                       |
| `type`      | `string`                                                                      |                  | Name of the registry vocabulary to look `status` up in.                                             |
| `statuses`  | `StatusVocabulary`                                                            |                  | A vocabulary for this badge only. When set, the registry is not consulted.                          |
| `label`     | `ReactNode`                                                                   | resolved label   | Overrides the resolved label.                                                                       |
| `tone`      | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'destructive' \| 'info'` | resolved tone    | Overrides the resolved tone.                                                                        |
| `size`      | `'sm' \| 'md' \| 'lg'`                                                        | `'md'`           | Badge size.                                                                                         |
| `dot`       | `boolean`                                                                     | `true`           | Show the leading dot. A definition's `icon` is shown in place of the dot, whatever this prop says.  |

Also accepts all `<span>` props except `children`.

Styling hooks: `data-slot="status-badge"`, `data-status` (the raw value), `data-tone` (the
resolved tone). Classes: `sui-status-badge`, `sui-status-badge--<tone>`, `sui-status-badge--sm` or
`--lg`, `sui-status-badge--no-dot`, and the parts `sui-status-badge__dot` and
`sui-status-badge__icon`.

## StatusRegistryProvider

Supplies status vocabularies to `StatusBadge`, `StatusFlow` (see [Card](./card.md#statusflow)) and
anything else below it that reads the registry. Put it near the root of the app. Without a
provider the registry is `{}`, and only `statuses` props and the fallback labels apply.

| Prop       | Type             | Default  | Description                         |
| ---------- | ---------------- | -------- | ----------------------------------- |
| `registry` | `StatusRegistry` | required | Vocabularies by name.               |
| `children` | `ReactNode`      | required |                                     |

If a Server Component renders the provider, the registry must be serialisable: strings and JSX
elements work, functions do not.

### Types

```ts
type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'

interface StatusDefinition {
  label?: ReactNode // falls back to the prettified raw value
  tone?: StatusTone // falls back to 'neutral'
  icon?: ReactNode  // replaces the dot
}

type StatusVocabulary = Record<string, StatusDefinition> // keyed by raw status value
type StatusRegistry = Record<string, StatusVocabulary>   // keyed by vocabulary name
```

## useStatusRegistry

`useStatusRegistry(): StatusRegistry` returns the registry from the nearest
`StatusRegistryProvider`, or `{}` when there is none. It is a client hook.

## resolveStatus

```ts
resolveStatus(
  registry: StatusRegistry,
  status: string,
  options: { type?: string; statuses?: StatusVocabulary },
): { definition: StatusDefinition | undefined; label: ReactNode; tone: StatusTone }
```

The lookup that `StatusBadge` and `StatusFlow` use. Call it when you show a raw status in your own
component and want the same label and tone as the badge: it checks `statuses` first, then
`registry[type]`, then falls back to a neutral tone and a prettified label. `definition` is the
matched entry, or `undefined` when nothing matched.

```tsx
'use client'

import { resolveStatus, useStatusRegistry } from '@shining-technologies/ui'

export function StatusText({ status }: { status: string }) {
  const { label, tone } = resolveStatus(useStatusRegistry(), status, { type: 'job' })
  return <span data-tone={tone}>{label}</span>
}
```

## statusBadgeVariants

The class-variance-authority function behind `StatusBadge`:
`statusBadgeVariants({ tone?, size?, dot? })`. The defaults are `tone: 'neutral'`, `size: 'md'` and
`dot: true`.

## Accessibility

- Badges are plain `<span>`s with no role. The text is the content; colour, the dot and icons only
  add to it, and the dot and icon are `aria-hidden`. Make sure the label reads correctly on its
  own.
- A badge is not a live region. If its value changes while the page is open and people need to
  hear about it, announce the change some other way (see [Feedback](./feedback.md)).
- With `asChild`, the rendered element (for example a link) provides the semantics and focus
  behaviour.

## Related

- [Card](./card.md): `StatusFlow` uses the same vocabularies
- [Data table](../data-table.md) and [Table](./table.md): status columns
- [Button](./button.md)
- [Theming](../theming.md): the tone tokens
- [Accessibility](../accessibility.md)

# Quick start

## Install

```bash
npm install @shining-technologies/ui-kit-react react react-dom
```

Import the stylesheet once, anywhere in your app:

```tsx
import '@shining-technologies/ui-kit-react/styles.css'
```

It is plain CSS built from `--sui-*` custom properties. You do **not** need Tailwind
configured for components to look right — the defaults are generated from the `shining`
project, so the kit is finished-looking with no setup at all. If you do use Tailwind, your
`className` props are merged through `tailwind-merge`, so your utilities override the
defaults rather than fighting them.

## Mount the provider

Everything works without it, but the provider is what makes the appearance yours — and what
lets it change at runtime.

```tsx
import { UIKitProvider } from '@shining-technologies/ui-kit-react'

export function Root() {
  return (
    <UIKitProvider preset="shining" defaultMode="system" scope="global">
      <App />
    </UIKitProvider>
  )
}
```

`scope="global"` writes the tokens onto `<html>`, so the page background and anything of
your own outside the provider pick them up too. Dialogs, dropdowns and tooltips are themed in
either scope.

### Pick a preset

A preset is a complete design — colours, corner radius, density, shadows, type and table
style. Your editor autocompletes the ids:

```tsx
<UIKitProvider preset="darwind" scope="global">
```

| Preset     | Look                                                            |
| ---------- | --------------------------------------------------------------- |
| `shining`  | Pine green and orange on off-white. The default.                |
| `slate`    | Cool greys and a classic blue.                                  |
| `midnight` | Navy greys and electric cyan, made for dark mode.               |
| `violet`   | Violet and magenta. Modern SaaS.                                |
| `ember`    | Terracotta and amber on warm paper, spacious.                   |
| `forest`   | Deep green, compact rows, flat chrome.                          |
| `rose`     | Rose and coral, round and airy.                                 |
| `mono`     | Greyscale, square corners, no shadows.                          |
| `darwind`  | Indigo and amber, sharp corners, dense striped rows. Technical. |
| `unn`      | Teal and coral, very round corners, spacious, lifted. Friendly. |

### Put your brand on it

`brand` takes your colour — or a flat object of colour, shape and type tweaks — and applies it
on top of the preset. Anything you leave out keeps the preset's value:

```tsx
<UIKitProvider brand="#be123c" scope="global">                       {/* default preset, your colour */}
<UIKitProvider preset="unn" brand="#be123c" scope="global">          {/* Unn's shape, your colour */}
<UIKitProvider
  preset="darwind"
  brand={{ primary: '#be123c', accent: '#0ea5e9', radius: '0.5rem', density: 'comfortable' }}
  scope="global"
>
```

| `brand` field                                           | What it changes                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `primary` `accent` `neutral` `surface`                  | Brand colours, greys and page background                                  |
| `success` `warning` `destructive` `info`                | Status colours                                                            |
| `radius` `density` `elevation` `borderWidth` `variant`  | Corners, rhythm, shadows, table style                                     |
| `fontFamily` `fontSize` `titleFontWeight` `neutralTint` | Type, and how much brand hue the greys get                                |
| `overrides`                                             | Exact token values — see [Projects](./projects.md#escaping-the-generator) |

That is the whole theming step. The neutral ramp, hover and selected surfaces, borders, chart
series, dark mode and a contrast-checked foreground for every filled surface are all derived
from it — for your colours as much as for the presets'. Buttons, forms, cards, charts, tables,
dialogs and menus all follow; a table only needs its own `density` or `variant` prop if it
should differ from the rest of the app.

A mistyped preset id falls back to `shining` and logs a console warning naming the valid ids.

Need the full data model — a project stored per user, switched at runtime, edited in a form?
See [Projects](./projects.md).

## Your first components

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Field,
  Input,
  Button,
} from '@shining-technologies/ui-kit-react'

;<Card>
  <CardHeader>
    <CardTitle>Book a service</CardTitle>
  </CardHeader>
  <CardContent>
    <Field label="Address" description="Street and suburb." required>
      <Input placeholder="12 Rundle Street, Adelaide" />
    </Field>
    <Button>Request quote</Button>
  </CardContent>
</Card>
```

The `Input` is never told an id — it picks up `id`, `aria-describedby`, `aria-invalid` and
`required` from the surrounding `Field`. See [Components](../components/overview.md).

## Your first table

```tsx
import { DataTable, type ColumnDef } from '@shining-technologies/ui-kit-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
]

export function Users({ users }: { users: User[] }) {
  return <DataTable data={users} columns={columns} label="Users" />
}
```

You already have sorting, a search box, pagination, a column picker, an empty state and
keyboard-navigable headers.

## Two things worth doing straight away

**Give the table a name.** `label` becomes the table's accessible name. Use `caption`
instead if you want it visible.

**Keep `data` and `columns` referentially stable.** Define them outside the component, or
wrap them in `useMemo`. A new array on every render is treated as new data, which resets the
page — see [performance](./performance.md).

```tsx
const columns = useMemo<ColumnDef<User>[]>(() => [...], [])
```

If `data` is refetched or polled, a new array is unavoidable. Add `keepPageOnDataChange` so the
table stays on the page the user is reading; sorting, filtering and searching still go back to
the first page.

## Adding features

Everything is opt-in and independent:

```tsx
<DataTable
  data={users}
  columns={columns}
  label="Users"
  getRowId={(row) => row.id}        // stable identity for selection
  enableRowSelection                 // checkbox column
  pageSize={25}
  density="compact"
  variant="striped"
  onRowClick={(row) => open(row.original)}
  rowActions={(row) => [{ icon: EyeIcon, label: 'View', onClick: … }, …]}
  renderExpandedRow={(row) => <Detail user={row.original} />}
/>
```

## Where to go next

- [Next.js and server rendering](./nextjs.md) — the App Router setup, without a theme flash
- [Forms](./forms.md) — React Hook Form, native submission, what each input's value looks like
- [Columns](../data-table/columns.md) — typed accessors, computed values, grouped headers
- [Filtering](../data-table/filtering.md) — the part most tables get wrong
- [Customization](./customization.md) — slots and component overrides
- [Server-side](../data-table/server-side.md) — when the data lives in an API

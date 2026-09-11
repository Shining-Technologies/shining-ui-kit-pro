# Quick start

## Install

```bash
pnpm add @shining-ui-kit/react
pnpm add react react-dom     # peer dependencies
```

Import the stylesheet once, anywhere in your app:

```tsx
import '@shining-ui-kit/react/styles.css'
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
import { UIKitProvider } from '@shining-ui-kit/react'

export function Root() {
  return (
    <UIKitProvider defaultProject="shining" defaultMode="system" scope="global">
      <App />
    </UIKitProvider>
  )
}
```

`scope="global"` writes the tokens onto `<html>`, which is what an application wants —
portalled surfaces (dialogs, dropdowns, tooltips) then inherit them too.

Pick a different shipped palette by id — `shining`, `slate`, `midnight`, `violet`, `ember`,
`forest`, `rose`, `mono` — or build your own from a brand colour:

```tsx
import { createProject } from '@shining-ui-kit/react'

const acme = createProject({ name: 'Acme', seed: { primary: '#7c3aed' } })

<UIKitProvider project={acme} scope="global">
```

That is the whole theming step. The neutral ramp, hover and selected surfaces, borders, chart
series, dark mode and a contrast-checked foreground for every filled surface are all derived
from it. See [Projects](./projects.md).

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
} from '@shining-ui-kit/react'

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
import { DataTable, type ColumnDef } from '@shining-ui-kit/react'

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

- [Columns](../data-table/columns.md) — typed accessors, computed values, grouped headers
- [Filtering](../data-table/filtering.md) — the part most tables get wrong
- [Customization](./customization.md) — slots and component overrides
- [Server-side](../data-table/server-side.md) — when the data lives in an API

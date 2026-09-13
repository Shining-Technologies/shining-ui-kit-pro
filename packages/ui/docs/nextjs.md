# Next.js (App Router)

Works with the App Router and the Pages Router, in development and production, with Turbopack or
webpack, and with no provider. This guide covers the App Router.

## Setup

```bash
npm install @shining-technologies/ui
```

```tsx
// app/layout.tsx — a Server Component
import '@shining-technologies/ui/styles.css'
import './globals.css'
import { ColorModeScript } from '@shining-technologies/ui'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorModeScript defaultMode="system" />
      </head>
      <body className="sui-scope">{children}</body>
    </html>
  )
}
```

- `styles.css` once, in the root layout. Your `globals.css` can come before or after it: your
  rules win either way.
- `ColorModeScript` sets `.dark` on `<html>` before the first paint. `suppressHydrationWarning`
  covers exactly that attribute change. Leave both out if the app has no dark mode.
- `sui-scope` on `<body>` applies the page background, text colour, font and focus ring. Optional.

No `transpilePackages` or other Next.js configuration is needed.

With Tailwind CSS v4:

```css
/* app/globals.css */
@import 'tailwindcss';
@import '@shining-technologies/ui/tailwind.css';
```

## Server and client components

The package is not marked `'use client'` as a whole. Import from it anywhere:

```tsx
// app/page.tsx — a Server Component
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getPageNumbers,
} from '@shining-technologies/ui'

export default async function Page() {
  const pages = getPageNumbers(4, 20) // runs on the server

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge tone="success">Live</Badge>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Summary</TabsTrigger>
            <TabsTrigger value="b">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="a">…</TabsContent>
        </Tabs>
        <Button>Export</Button>
      </CardContent>
    </Card>
  )
}
```

- `Button`, `Badge`, `Card`, `Alert`, `Skeleton`, `Empty`, `Spinner`, `StatusDot`, `Kbd`,
  `Separator`, `Table`, `Breadcrumb`, the `AppShell` layout parts and the icons are Server
  Components: they add no JavaScript to the page. `AppShell` can go straight into a `layout.tsx`.
- Interactive components (`Tabs`, `Dialog`, `DataTable`, `Sidebar`, …) are client components with
  their own `'use client'`. Render them from a Server Component with serialisable props.
- Every function — `applyQuery`, `parseQuerySearchParams`, `createColumnHelper`,
  `createThemeCss` — can be called on the server.
- Props that are functions (`cell` renderers, `onClick`, `renderLink`, `onQueryChange`) must be
  passed from a client component, as React requires.

`Button asChild` works with `next/link` from a Server Component:

```tsx
<Button asChild>
  <Link href="/orders/new">New order</Link>
</Button>
```

## A data table driven by the URL

The query lives in the URL, the Server Component answers it, and the table only renders. Sharing
a link or pressing Back shows the same rows, and the first paint is already the right page.

### 1. Columns the server can read

```ts
// lib/order-columns.ts — no 'use client', no JSX
import type { ColumnBehavior } from '@shining-technologies/ui/core'
import type { Order } from './orders'

export const orderColumns = [
  { accessorKey: 'customer', filter: { type: 'text' } },
  {
    accessorKey: 'status',
    filter: {
      type: 'multiSelect',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paid', value: 'paid' },
      ],
    },
  },
  { accessorKey: 'total', sortingFn: 'number', filter: { type: 'number' } },
  { accessorKey: 'placedAt', sortingFn: 'datetime', filter: { type: 'date' } },
] satisfies ColumnBehavior<Order>[]
```

Use `satisfies`, not a type annotation (`const orderColumns: ColumnBehavior<Order>[]`). The
annotation widens every column's value type to `unknown`, and spreading those columns into
`ColumnDef<Order>` then fails to type-check.

### 2. The page

```tsx
// app/orders/page.tsx — a Server Component
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'
import { orderColumns } from '@/lib/order-columns'
import { getOrders } from '@/lib/orders'
import { OrdersTable } from './orders-table'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseQuerySearchParams(await searchParams, {
    columns: orderColumns,
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50],
  })
  const page = applyQuery(await getOrders(), query, {
    columns: orderColumns,
    timeZone: 'Australia/Sydney',
    locale: 'en-AU',
  })

  return (
    <OrdersTable
      rows={page.rows}
      total={page.total}
      query={{ ...query, pageIndex: page.pageIndex }}
    />
  )
}
```

With a database, translate `query` into your ORM's `where`, `orderBy`, `skip` and `take`
instead of calling `applyQuery`, and keep `applyQuery` in a test as the reference.

`parseQuerySearchParams` treats the URL as untrusted: with `columns`, only those columns can be
sorted or filtered, unknown operators are dropped, and page numbers and sizes are validated.

### 3. The table

```tsx
// app/orders/orders-table.tsx
'use client'

import {
  Badge,
  DataTable,
  serializeQuerySearchParams,
  useDataTableQueryState,
  type ColumnDef,
  type DataTableQuery,
} from '@shining-technologies/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { orderColumns } from '@/lib/order-columns'
import type { Order } from '@/lib/orders'

const columns: ColumnDef<Order>[] = [
  { ...orderColumns[0], header: 'Customer' },
  { ...orderColumns[1], header: 'Status', cell: ({ value }) => <Badge>{value}</Badge> },
  { ...orderColumns[2], header: 'Total' },
  { ...orderColumns[3], header: 'Placed' },
]

export function OrdersTable({
  rows,
  total,
  query,
}: {
  rows: Order[]
  total: number
  query: DataTableQuery
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const state = useDataTableQueryState(query, (next) => {
    const params = serializeQuerySearchParams(next, {
      columns: orderColumns,
      base: searchParams,
      defaultPageSize: 25,
    })
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }))
  })

  return (
    <DataTable
      {...state}
      mode="server"
      data={rows}
      rowCount={total}
      columns={columns}
      getRowId={(order) => order.id}
      loading={pending}
      timeZone="Australia/Sydney"
      locale="en-AU"
      label="Orders"
    />
  )
}
```

Why `useDataTableQueryState` rather than wiring `onSortingChange` to the router: a new sort also
resets the page, in the same tick. Two `router.replace` calls built from the same props would
overwrite each other and lose the sort. The hook merges them into one navigation, shows the change
immediately while the server responds, and follows the URL again when it changes on its own
(Back and Forward).

The search box keeps what the user types while earlier navigations are still arriving.

### Time zone and locale

Pass the same `timeZone` and `locale` to `applyQuery` and to `DataTable`. Without them, the server
(usually UTC, `en-US`) and the browser disagree about which day a timestamp falls on and how
numbers are formatted, and React reports a hydration mismatch.

## Client-side tables

For data that is already on the client, fetch in the Server Component and pass the rows down:

```tsx
// app/users/page.tsx
export default async function UsersPage() {
  return <UsersTable users={await getUsers()} />
}
```

```tsx
// app/users/users-table.tsx
'use client'
export function UsersTable({ users }: { users: User[] }) {
  return <DataTable data={users} columns={columns} getRowId={(u) => u.id} timeZone="UTC" locale="en-AU" />
}
```

A server re-render (`router.refresh()`, a Server Action) passes a new `data` array, which returns a
client-paginated table to page 1. Pass `keepPageOnDataChange` to stay on the current page.

## Theming per tenant

```tsx
// app/[tenant]/layout.tsx — a Server Component
import { createThemeCss } from '@shining-technologies/ui/theme'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const tenant = await getTenant((await params).tenant)
  const css = createThemeCss({ primary: tenant.brandColor, radius: tenant.radius })
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  )
}
```

`createThemeCss` validates every value, so the output is safe to inline even when the brand colour
comes from a database. The first paint is already themed: no client JavaScript is involved.

## Dark mode with next-themes

```tsx
// app/providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```tsx
'use client'
import { ColorModeToggle } from '@shining-technologies/ui'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // undefined until next-themes mounts; the toggle stays controlled and shows a neutral state
  const mode = resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : undefined
  return <ColorModeToggle mode={mode} onModeChange={setTheme} />
}
```

Use either `next-themes` or `ColorModeScript`, not both. Always pass the `mode` prop, even while
its value is `undefined`: without it the toggle manages the kit's own stored preference.

## Navigation

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarNav, type SidebarNavEntry } from '@shining-technologies/ui'

export function AppSidebar({ items }: { items: SidebarNavEntry[] }) {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarNav items={items} currentPath={pathname} renderLink={(props) => <Link {...props} />} />
    </Sidebar>
  )
}
```

`currentPath` is known during server rendering, so the active item and its open branch are in
the first HTML.

## Route handlers and Server Actions

`@shining-technologies/ui/core` and `@shining-technologies/ui/theme` import no React:

```ts
// app/api/orders/route.ts
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'

export async function GET(request: Request) {
  const query = parseQuerySearchParams(new URL(request.url).searchParams, { columns: orderColumns })
  return Response.json(applyQuery(await getOrders(), query, { columns: orderColumns }))
}
```

Selection helpers work in Server Actions on the table's `rowSelection` state:

```ts
'use server'
import { getSelectedRowIds, type RowSelectionState } from '@shining-technologies/ui/core'

export async function archiveSelected(selection: RowSelectionState) {
  await db.order.updateMany({ where: { id: { in: getSelectedRowIds(selection) } } })
}
```

## Content-Security-Policy

With a nonce-based policy, pass the nonce to the two components that render inline code:

```tsx
const nonce = (await headers()).get('x-nonce') ?? undefined

<ColorModeScript nonce={nonce} />
<Sidebar nonce={nonce} mobileBreakpoint="60rem" />
```

`Sidebar` only renders a `<style>` for a custom `mobileBreakpoint`. Column widths and chart sizes
use inline `style` attributes, governed by `style-src-attr`.

## Bundle size

Each component is its own module, so a page pays only for what it renders. Importing from the root
barrel is fine; `@shining-technologies/ui/<family>` entry points (`/button`, `/data-table`) are
available when you want the import to state its scope.

## Checklist

- [ ] `styles.css` imported once in the root layout
- [ ] `ColorModeScript` in `<head>` and `suppressHydrationWarning` on `<html>` (dark mode only)
- [ ] Column definitions with renderers in client files; a render-free copy in a shared module for the server
- [ ] The same `timeZone` and `locale` on `applyQuery` and `DataTable`
- [ ] `useDataTableQueryState` for URL-driven tables
- [ ] `nonce` on `ColorModeScript` and `Sidebar` under a strict CSP

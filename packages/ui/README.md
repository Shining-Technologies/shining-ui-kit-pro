# @shining-technologies/ui

React components, a data table whose filtering logic also runs on your server, and
shadcn-style CSS-variable theming. One package, built for the Next.js App Router and any other
React setup.

- **Server Components work.** Pure components (`Button`, `Badge`, `Card`, `Table`, icons) render on
  the server with no client JavaScript, and every function can be called from server code.
  Interactive components mark their own `'use client'` boundary.
- **The theme is CSS.** shadcn/ui tokens, light and dark, no provider. Paste a tweakcn theme and
  colours, radius, fonts, shadows and spacing all reach the components.
- **The data table's logic is framework-independent.** Filtering, sorting, pagination and URL state
  live in `@shining-technologies/ui/core` and give the same result in the browser and on a server.
- **Tree-shakeable.** One ES module per source file, `sideEffects` limited to CSS.

> Upgrading from `@shining-technologies/ui-kit-*`? Read [MIGRATION.md](./MIGRATION.md).

## Install

```bash
npm install @shining-technologies/ui
```

Peer dependencies: `react` and `react-dom` 18.3 or 19. Optional: `recharts` for
`@shining-technologies/ui/charts`, `@tanstack/react-virtual` for
`@shining-technologies/ui/virtualized`.

TypeScript needs `moduleResolution` set to `"bundler"`, `"node16"` or `"nodenext"`. The package is
ESM only.

## Quick start

### Next.js (App Router)

```tsx
// app/layout.tsx — a Server Component
import '@shining-technologies/ui/styles.css'
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

```tsx
// app/page.tsx — also a Server Component
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@shining-technologies/ui'

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge tone="success">Live</Badge> <Button>New order</Button>
      </CardContent>
    </Card>
  )
}
```

No provider is needed. See the [Next.js guide](./docs/nextjs.md) for data tables driven by the
URL, per-tenant themes and Content-Security-Policy.

### Vite

```tsx
// src/main.tsx
import '@shining-technologies/ui/styles.css'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

## Entry points

| Import                                   | Contents                                                             | React |
| ---------------------------------------- | -------------------------------------------------------------------- | ----- |
| `@shining-technologies/ui`               | All components, hooks and every `core` function                      | yes   |
| `@shining-technologies/ui/<family>`      | One component family: `button`, `data-table`, `sidebar`, `form`, …  | yes   |
| `@shining-technologies/ui/core`          | Filtering, sorting, pagination, selection, `applyQuery`, URL query   | no    |
| `@shining-technologies/ui/theme`         | `createThemeCss`, `createTheme`, presets, colour utilities           | no    |
| `@shining-technologies/ui/charts`        | Recharts-based charts (requires `recharts`)                          | yes   |
| `@shining-technologies/ui/virtualized`   | Virtualized table body (requires `@tanstack/react-virtual`)          | yes   |
| `@shining-technologies/ui/csv`           | CSV and TSV export                                                   | no    |
| `@shining-technologies/ui/styles.css`    | Theme, tokens and all component styles                               |       |
| `@shining-technologies/ui/theme.css`     | The default theme tokens only                                         |       |
| `@shining-technologies/ui/presets.css`   | Eleven named themes, applied with `data-theme`                          |       |
| `@shining-technologies/ui/tailwind.css`  | Tailwind CSS v4 mapping of the tokens                                |       |

Component families: `avatar`, `badge`, `button`, `card`, `color-mode`, `data-table`, `data-view`,
`date-time`, `feedback`, `form`, `icons`, `kanban`, `layout`, `navigation`, `overlay`, `separator`,
`sidebar`, `table`, `timeline`, `tree-view`, `visually-hidden`.

## Server and client

Nothing in this package is marked `'use client'` as a whole. Each module that needs the browser
(state, effects, context, event handlers, Radix primitives) declares it, and nothing else does.

| In a Server Component you can…                    | Examples                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| render pure components with no client JavaScript  | `Button`, `Badge`, `Card`, `Alert`, `Skeleton`, `Empty`, `Spinner`, `CircularProgress`, `StatusDot`, `Kbd`, `Separator`, `Table`, `Timeline`, `Stack`, `Grid`, `Container`, `Breadcrumb`, `VerticalNav`, `NavigationRail`, `AppShell` layout parts, icons |
| render interactive components with serialisable props | `Tabs`, `Accordion`, `Dialog`, `Tooltip`, `Sidebar`                  |
| call any function                                  | `applyQuery`, `parseQuerySearchParams`, `createColumnHelper`, `getPageNumbers`, `createThemeCss` |

Pass functions (a column's `cell` renderer, `onClick`, `renderLink`) only from a client component,
as React requires.

## Theming

```css
/* your globals.css */
:root {
  --primary: oklch(0.55 0.18 262);
  --radius: 0.5rem;
}
.dark {
  --primary: oklch(0.72 0.14 262);
}
```

Your definitions win over the defaults regardless of import order, and Tailwind utilities override
component styles. Dark mode is the `.dark` class. Generate a whole contrast-checked theme from a
brand colour with `createThemeCss({ primary: '#be123c' })`.

Full guide: [docs/theming.md](./docs/theming.md).

## Data table

```tsx
'use client'
import { DataTable, type ColumnDef } from '@shining-technologies/ui'

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'customer', header: 'Customer', filter: { type: 'text' } },
  { accessorKey: 'status', header: 'Status', filter: { type: 'multiSelect', options } },
  { accessorKey: 'total', header: 'Total', sortingFn: 'number', filter: { type: 'number' } },
  { accessorKey: 'placedAt', header: 'Placed', filter: { type: 'date' } },
]

export function Orders({ rows }: { rows: Order[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      timeZone="Australia/Sydney"
      locale="en-AU"
    />
  )
}
```

Server-side filtering with the same columns and the same results:

```ts
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'

const query = parseQuerySearchParams(await searchParams, { columns })
const { rows, total } = applyQuery(allOrders, query, { columns, timeZone: 'Australia/Sydney' })
```

Full guide, including URL-driven tables with `useDataTableQueryState`:
[docs/data-table.md](./docs/data-table.md).

## Documentation

| Guide                                           |                                                               |
| ----------------------------------------------- | ------------------------------------------------------------- |
| [Getting started](./docs/getting-started.md)    | Install, stylesheet, first page and table, TypeScript, tests  |
| [Theming](./docs/theming.md)                    | Tokens, dark mode, named themes, brand colours, Tailwind      |
| [Next.js](./docs/nextjs.md)                     | Server Components, URL-driven tables, per-tenant themes, CSP  |
| [Data table](./docs/data-table.md)              | Columns, filters, server mode, selection, customisation       |
| [Charts](./docs/charts.md)                      | Trend, bar, donut, gauge, scatter and sparkline charts        |
| [Accessibility](./docs/accessibility.md)        | What the components guarantee                                 |
| [Troubleshooting](./docs/troubleshooting.md)    | Common errors and their fixes                                 |

Every component family has its own page, and `/core`, `/theme`, `/csv` and the utility hooks
have API references: see the [documentation index](./docs/README.md).

## Browser support

Chrome and Edge 111+, Safari 16.4+, Firefox 113+. The styles use cascade layers, `:where()` and
`color-mix()`.

## Testing your application

Radix primitives and the responsive table use browser APIs that jsdom lacks (`ResizeObserver`,
`matchMedia`, pointer capture). `happy-dom` works without polyfills for most of them; otherwise
polyfill them in your test setup. CSS imports need a stub in Jest (`moduleNameMapper`).

## Licence

MIT

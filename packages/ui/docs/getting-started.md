# Getting started

From an empty React project to themed components and a working data table.

- [Requirements](#requirements)
- [Install](#install)
- [Add the stylesheet](#add-the-stylesheet)
- [Your first page](#your-first-page)
- [Your first data table](#your-first-data-table)
- [Dark mode](#dark-mode)
- [Tailwind CSS](#tailwind-css)
- [Importing](#importing)
- [TypeScript](#typescript)
- [Testing your application](#testing-your-application)
- [Next steps](#next-steps)

## Requirements

| Requirement | Version                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| React       | 18.3 or 19 (`react` and `react-dom` are peer dependencies)                             |
| Node.js     | 18.18 or later, for build tools and server rendering                                   |
| Bundler     | Anything that reads the `exports` field: Next.js, Vite, Remix / React Router, webpack 5, Rspack, esbuild |
| Browsers    | Chrome and Edge 111+, Safari 16.4+, Firefox 113+                                       |

The package is **ESM only**. There is no CommonJS build.

## Install

```bash
npm install @shining-technologies/ui
# or
pnpm add @shining-technologies/ui
# or
yarn add @shining-technologies/ui
```

Two features need an optional peer dependency. Install them only if you use the feature:

| You use                                 | Also install                  |
| --------------------------------------- | ----------------------------- |
| `@shining-technologies/ui/charts`       | `recharts` (2.15+ or 3)       |
| `@shining-technologies/ui/virtualized`  | `@tanstack/react-virtual` (3) |

Everything else, including the Radix primitives and TanStack Table, is a regular dependency and
installs with the package.

## Add the stylesheet

Import `styles.css` once, at the root of the application.

**Next.js (App Router)**

```tsx
// app/layout.tsx
import '@shining-technologies/ui/styles.css'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="sui-scope">{children}</body>
    </html>
  )
}
```

**Vite, Create React App or any client-rendered app**

```tsx
// src/main.tsx
import '@shining-technologies/ui/styles.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `styles.css` holds the default theme, the derived tokens and every component rule. It is
  about 22 kB gzipped.
- The rules are in CSS cascade layers, so your own CSS wins whether it is imported before or
  after `styles.css`.
- `sui-scope` on `<body>` applies the theme's background, text colour, font and focus ring to
  the whole page. It is optional; without it, only the components are styled.

No provider component is needed.

## Your first page

```tsx
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shining-technologies/ui'

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Everything placed in the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert tone="info">
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Three orders are waiting for payment.</AlertDescription>
        </Alert>
        <Badge tone="success">Live</Badge>
        <Button>New order</Button>
      </CardContent>
    </Card>
  )
}
```

In the Next.js App Router this file can stay a Server Component. `Button`, `Badge`, `Card` and
`Alert` add no client JavaScript. Interactive components (`Dialog`, `Tabs`, `DataTable`, …) carry
their own `'use client'` directive, so you can import them anywhere too. See
[Next.js](./nextjs.md#server-and-client-components).

Check each component's exact props on its page under [Components](./README.md#components).

## Your first data table

```tsx
'use client'

import { Badge, DataTable, type ColumnDef } from '@shining-technologies/ui'

interface Order {
  id: string
  customer: string
  status: 'open' | 'paid' | 'cancelled'
  total: number
  placedAt: string
}

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'customer', header: 'Customer', filter: { type: 'text' } },
  {
    accessorKey: 'status',
    header: 'Status',
    filter: {
      type: 'multiSelect',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    cell: ({ value }) => <Badge tone={value === 'paid' ? 'success' : 'neutral'}>{value}</Badge>,
  },
  { accessorKey: 'total', header: 'Total', sortingFn: 'number', filter: { type: 'number' } },
  { accessorKey: 'placedAt', header: 'Placed', sortingFn: 'datetime', filter: { type: 'date' } },
]

export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      label="Orders"
      data={orders}
      columns={columns}
      getRowId={(order) => order.id}
      timeZone="Australia/Sydney"
      locale="en-AU"
    />
  )
}
```

This gives search, sorting, per-column filters, pagination and a column picker. Define
`columns` outside the component (or memoise it) so the table does not rebuild on every render.

Filtering, sorting and pagination are also available on a server with the same columns and the
same results. See the [Data table guide](./data-table.md).

## Dark mode

Dark tokens apply under a `.dark` class on `<html>` (or any ancestor). The library never follows
the operating system on its own, so an application without dark mode never shows dark
components.

To offer dark mode without another library:

```tsx
// app/layout.tsx
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
// Anywhere in the UI
import { ColorModeToggle } from '@shining-technologies/ui'

<ColorModeToggle />
```

`ColorModeScript` sets the class before the first paint, so there is no flash of the wrong theme.
Using `next-themes` instead is covered in [Color mode](./components/color-mode.md) and
[Theming](./theming.md#3-dark-mode).

## Tailwind CSS

The components need no Tailwind configuration. If your application uses Tailwind CSS v4, add the
token mapping so utilities such as `bg-primary` and `text-muted-foreground` use the same theme:

```css
/* globals.css */
@import 'tailwindcss';
@import '@shining-technologies/ui/tailwind.css';
```

Utilities passed through `className` override component styles, whatever the import order:

```tsx
<Button className="rounded-full">Save</Button>
```

Skip `tailwind.css` if your project already has shadcn/ui's or tweakcn's `@theme inline` block. Its
token names are the same; add the kit's `--color-success`, `--color-warning` and `--color-info`
lines to your block. A tweakcn theme pasted into `globals.css` themes the components, fonts and
shadows included; see [Theming](./theming.md#use-a-tweakcn-or-shadcn-theme).

## Importing

| Import                                    | Contains                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `@shining-technologies/ui`                | Every component, hook and `core` function                               |
| `@shining-technologies/ui/<family>`       | One component family, for example `/button`, `/form`, `/data-table`     |
| `@shining-technologies/ui/core`           | Filtering, sorting, pagination, selection and URL query helpers. No React |
| `@shining-technologies/ui/theme`          | `createThemeCss`, `createTheme`, presets and colour utilities. No React |
| `@shining-technologies/ui/charts`         | Charts (needs `recharts`)                                               |
| `@shining-technologies/ui/virtualized`    | The virtualized data table (needs `@tanstack/react-virtual`)            |
| `@shining-technologies/ui/csv`            | CSV and TSV export                                                      |
| `@shining-technologies/ui/styles.css`     | The complete stylesheet                                                 |
| `@shining-technologies/ui/theme.css`      | The default theme tokens only                                           |
| `@shining-technologies/ui/presets.css`    | Eleven named themes, applied with `data-theme`                             |
| `@shining-technologies/ui/tailwind.css`   | Tailwind CSS v4 token mapping                                           |

Component families: `avatar`, `badge`, `button`, `card`, `color-mode`, `data-table`,
`date-time`, `feedback`, `form`, `icons`, `layout`, `navigation`, `overlay`, `separator`,
`sidebar`, `table`, `visually-hidden`.

Importing from the root is fine for bundle size: every source file is its own module and the
package declares no JavaScript side effects, so bundlers drop what you do not use. A page that
imports only `Button` does not ship the data table.

## TypeScript

Types are included. Your `tsconfig.json` must use a module resolution that reads `exports`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

`"node16"` and `"nodenext"` also work. The legacy `"node"` (`"node10"`) resolution cannot see
the subpath entry points and reports `Cannot find module '@shining-technologies/ui/core'`.

Column value types are inferred from `accessorKey`, so `cell: ({ value }) => …` is typed without
annotations. To add your own fields to column `meta`, augment `ColumnMeta`. See
[Data table](./data-table.md).

## Testing your application

Radix primitives and the responsive table use browser APIs that jsdom does not implement.

- **Vitest:** use `environment: 'happy-dom'`, which covers most of them, or polyfill as below.
- **Jest:** the package is ESM only. Use Jest's ESM mode or a transform for
  `@shining-technologies/ui`, and map CSS imports to a stub with `moduleNameMapper`.

A setup file that covers jsdom:

```ts
// test/setup.ts
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

window.IntersectionObserver ??= class {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
} as unknown as typeof IntersectionObserver

window.DOMRect ??= class {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}
  get top() {
    return this.y
  }
  get left() {
    return this.x
  }
  get right() {
    return this.x + this.width
  }
  get bottom() {
    return this.y + this.height
  }
  toJSON() {
    return { ...this }
  }
  static fromRect(rect?: DOMRectInit) {
    return new window.DOMRect(rect?.x, rect?.y, rect?.width, rect?.height)
  }
} as unknown as typeof DOMRect

Element.prototype.scrollIntoView ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
```

Without the pointer-capture stubs, opening a `Select` or `DropdownMenu` in a test hangs instead of
failing. Without `IntersectionObserver`, every popper (Popover, Select, Tooltip, DropdownMenu) throws
inside an effect, which also shows up as a hung render rather than a readable error.

## Next steps

- [Theming](./theming.md): your brand colours, dark mode, named themes, Tailwind
- [Next.js](./nextjs.md): Server Components, URL-driven tables, per-tenant themes, CSP
- [Data table](./data-table.md): columns, filters, server mode, selection, export
- [Components](./README.md#components): every component with its props
- [Troubleshooting](./troubleshooting.md): common errors and their fixes

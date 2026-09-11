# @shining-ui-kit/react

[![npm](https://img.shields.io/npm/v/@shining-ui-kit/react.svg)](https://www.npmjs.com/package/@shining-ui-kit/react)
[![license](https://img.shields.io/npm/l/@shining-ui-kit/react.svg)](../../LICENSE)

A React component library whose entire appearance comes from a **project** — a named set of
seed colours and shape decisions you can swap, edit or create at runtime.

Buttons, cards, forms, overlays, charts, an application shell and a production-grade data
table, all painted from one generated token set. Change the project and every component
follows; no component hardcodes a colour.

## Install

```bash
pnpm add @shining-ui-kit/react react react-dom
```

Optional peers, only if you use the matching entry point:

```bash
pnpm add recharts                  # for @shining-ui-kit/react/recharts
pnpm add @tanstack/react-virtual   # for @shining-ui-kit/react/virtualized
```

## Use

```tsx
import { UIKitProvider, Card, CardContent, Button, LineChart } from '@shining-ui-kit/react'
import '@shining-ui-kit/react/styles.css'

export function App() {
  return (
    <UIKitProvider defaultProject="shining" scope="global">
      <Card>
        <CardContent>
          <LineChart data={revenue} xKey="month" series={[{ key: 'total' }]} area />
          <Button>Export</Button>
        </CardContent>
      </Card>
    </UIKitProvider>
  )
}
```

The stylesheet is plain CSS built from `--sui-*` custom properties — you do **not** need
Tailwind configured for components to look right. If you do use Tailwind, every `className`
is merged through `tailwind-merge`, so your utilities win over the defaults.

### A project is four colours and a shape

```ts
import { createProject } from '@shining-ui-kit/react'

const acme = createProject({
  name: 'Acme',
  seed: { primary: '#7c3aed', accent: '#ec4899' },
  shape: { radius: '0.75rem', density: 'comfortable', elevation: 'soft' },
})
```

Everything else is derived in OKLab: the neutral ramp, hover and selected surfaces, borders,
the five chart series, the whole dark mode, and a contrast-checked foreground for every
filled surface.

### The table

```tsx
import { DataTable, type ColumnDef } from '@shining-ui-kit/react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

<DataTable data={users} columns={columns} label="Users" />
```

Sorting, search, pagination, a column picker, an empty state and keyboard-navigable headers
come with it. Selection, filtering, pinning, expansion, virtualisation and server-side mode
are opt-in.

## Entry points

| Import                              | Contains                                               |
| ----------------------------------- | ------------------------------------------------------ |
| `@shining-ui-kit/react`             | The whole kit: theming, components, charts, data table |
| `@shining-ui-kit/react/styles.css`  | The stylesheet (import once)                           |
| `@shining-ui-kit/react/recharts`    | Recharts-backed charts (needs `recharts`)              |
| `@shining-ui-kit/react/virtualized` | Row virtualisation (needs `@tanstack/react-virtual`)   |

## Requirements

- React 18 or 19
- Node 18.18+ to build
- Every component is client-side; the bundles carry a `'use client'` banner, so they work
  unchanged in the Next.js App Router.

## Documentation

- [Quick start](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/guide/quick-start.md)
- [Components](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/components/overview.md)
- [Data table](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/data-table/columns.md)
- [API reference](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/reference/api-reference.md)
- [All documentation](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/README.md)

## Related packages

| Package                      | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `@shining-ui-kit/core`       | Tokens, the OKLCH colour engine, the table engine |
| `@shining-ui-kit/themes`     | Shipped palettes and table chrome themes          |
| `@shining-ui-kit/export-csv` | Optional CSV/TSV export, zero dependencies        |

## License

MIT © Shining Technologies

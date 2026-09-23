# Data table

`DataTable` is a React component. Everything it decides — which rows match a filter, in what
order, on which page — comes from `@shining-technologies/ui/core`, which has no React and runs
anywhere. That split is what lets a server and a browser agree.

```text
@shining-technologies/ui/core           filtering · sorting · pagination · selection · URL query
      │                                   └─ used by applyQuery on your server
      ▼
DataTable (client component)            TanStack Table as the row engine, with core's filter
                                        functions, comparators and empty-last sorting
```

Everything on this page is exported from `@shining-technologies/ui` (the root entry also
re-exports `core`). The table alone is also available as `@shining-technologies/ui/data-table`.
Two features live in their own entry points: `@shining-technologies/ui/virtualized` and
`@shining-technologies/ui/csv`.

## Contents

- [Quick start](#quick-start)
- [Client mode](#client-mode)
- [Server mode](#server-mode)
- [The same answer on the server: `applyQuery`](#the-same-answer-on-the-server-applyquery)
- [Queries in the URL](#queries-in-the-url)
- [Columns](#columns)
- [Cells toolkit](#cells-toolkit)
- [`DataTable` props](#datatable-props)
- [Features](#features)
- [Filtering](#filtering)
- [Sorting](#sorting)
- [Pagination](#pagination)
- [Selection](#selection)
- [Expansion](#expansion)
- [Row actions](#row-actions)
- [Column visibility, resizing and pinning](#column-visibility-resizing-and-pinning)
  - [Remembering the layout](#remembering-the-layout)
- [Responsive layout](#responsive-layout)
- [Loading, error and empty states](#loading-error-and-empty-states)
- [Customisation](#customisation)
- [Keyboard and accessibility](#keyboard-and-accessibility)
- [Virtualization](#virtualization)
- [CSV export](#csv-export)
- [Time zones and locale](#time-zones-and-locale)
- [Performance](#performance)
- [Other exports](#other-exports)

## Quick start

Install the package and load its stylesheet as described in [Getting started](./getting-started.md).
The examples on this page use this row type:

```ts
interface Order {
  id: string
  customer: string
  status: 'open' | 'paid' | 'refunded'
  total: number
  placedAt: string // ISO timestamp with an offset
  owner: { name: string; email: string }
}
```

```tsx
'use client'
import { DataTable, type ColumnDef } from '@shining-technologies/ui'

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'Order', enableGlobalFilter: false },
  { accessorKey: 'customer', header: 'Customer', filter: { type: 'text' } },
  { accessorKey: 'total', header: 'Total', sortingFn: 'number', filter: { type: 'number' } },
]

export function OrdersTable({ orders }: { orders: Order[] }) {
  return <DataTable data={orders} columns={columns} getRowId={(o) => o.id} label="Orders" />
}
```

That renders a search box, a filter button, a column picker, sortable headers and a pagination
bar with 10 rows per page. Everything else is opt-in.

`DataTable` is a client component (its module carries `'use client'`). A Server Component can
render it and pass it serialisable props, but `columns` with `cell` functions must be defined in a
client file — see [Sharing columns with the server](#sharing-columns-with-the-server).

## Client mode

```tsx
'use client'
<DataTable data={orders} columns={columns} getRowId={(o) => o.id} label="Orders" />
```

The table filters, sorts and paginates in the browser. State is uncontrolled unless you pass it:
every slice has `x`, `defaultX` and `onXChange` (`sorting`, `columnFilters`, `globalFilter`,
`pagination`, `rowSelection`, `columnVisibility`, `columnSizing`, `columnPinning`, `expanded`).
A slice is controlled when its `x` prop is not `undefined`.

In client pagination, a new `data` array returns to the first page. Pass `keepPageOnDataChange`
to stay on the current page through refetches, polls and optimistic updates; sorting, filtering
and searching still return to page 1, and if the new data has fewer pages the table steps back to
the last one.

## Server mode

```tsx
<DataTable
  mode="server"
  data={page.rows}
  rowCount={page.total}
  columns={columns}
  onQueryChange={(query) => fetchPage(query)}
/>
```

The table renders what it is given and reports a `DataTableQuery`:

```ts
interface DataTableQuery {
  pageIndex: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  columnFilters: { id: string; value: unknown }[] // value: { operator, value } or a bare value
  globalFilter: string
}
```

Only filters that narrow the result are included; a filter whose value was cleared is not.
A new sort, filter or search returns to the first page in the same update, so `onQueryChange`
fires once. `onQueryChange` fires after mount with the initial query, and then only when the query
actually changes.

`mode` is the default for sorting, filtering and pagination; each can be set on its own through
`features` (for example client-side sorting of a server page). In server pagination:

- `rowCount` is required for the page count; without it the table counts the rows it holds.
- When a settled `rowCount` shrinks below the current page (the last row of the last page
  deleted), the table steps back to the last page. It waits while `loading` is `true`.
- A new `data` array never resets the page.

## The same answer on the server: `applyQuery`

```ts
import { applyQuery } from '@shining-technologies/ui/core'

const page = applyQuery(orders, query, {
  columns, // the table's columns, or a render-free copy
  timeZone: 'Australia/Sydney',
  locale: 'en-AU',
})
// { rows, total, pageCount, pageIndex, pageSize }
```

`applyQuery` uses the table's own predicates and comparators, so for the same query, columns,
time zone and locale it returns exactly the rows a client-mode table shows. Only columns listed in
`columns` can be filtered, searched or sorted, and a page past the end is moved back to the last
page.

Use it for data that fits in memory, and as the specification when you translate a query to SQL:
a test that compares your database query with `applyQuery` catches semantic drift (for example a
`date` filter decided in the database server's time zone). The full reference is in
[api/core.md](./api/core.md).

### Sharing columns with the server

Column definitions with `cell` renderers belong in client files. Keep the parts that decide
behaviour in a shared module with no JSX:

```ts
// lib/order-columns.ts — no 'use client', importable from anywhere
import type { ColumnBehavior } from '@shining-technologies/ui/core'

export const orderColumns = [
  { accessorKey: 'customer', filter: { type: 'text' } },
  { accessorKey: 'total', sortingFn: 'number', filter: { type: 'number' } },
  { accessorKey: 'placedAt', sortingFn: 'datetime', filter: { type: 'date' } },
] satisfies ColumnBehavior<Order>[]
```

```tsx
// orders-table.tsx
'use client'
import { CellNumber, type ColumnDef } from '@shining-technologies/ui'
import { orderColumns } from '@/lib/order-columns'

const labels = { customer: 'Customer', total: 'Total', placedAt: 'Placed' }

const columns: ColumnDef<Order>[] = orderColumns.map((column) =>
  column.accessorKey === 'total'
    ? {
        ...column,
        header: 'Total',
        cell: ({ value }) => (
          <CellNumber value={value as number} options={{ style: 'currency', currency: 'AUD' }} />
        ),
      }
    : { ...column, header: labels[column.accessorKey] },
)
```

A custom `filter.predicate` or `sortingFn` comparator is a plain function and can live in the
shared module too.

## Queries in the URL

`parseQuerySearchParams` and `serializeQuerySearchParams` keep a table's query in the address bar:

```text
?page=2&size=25&sort=-placedAt,customer&q=ann&f.status=includes:["open","paid"]&f.total=between:[10,200]
```

- `page` is 1-based; `sort` lists column ids, `-` for descending; `q` is the search box.
- `f.<id>` is `<operator>:<JSON value>`, or a bare value for the filter type's default operator.
- Defaults are omitted, so an untouched table has a clean URL.
- `prefix` namespaces keys for several tables on one page; `base` keeps unrelated keys.
- Parsing treats the URL as untrusted: with `columns`, only known columns can be sorted or
  filtered, and operators not valid for a column's filter type are dropped (text before `:` that is
  not an operator name is read as part of a bare value); page and size are validated (`pageSizeOptions`,
  `maxPageSize`, default `500`). `defaultPageSize` defaults to `10`.

Keep `pageSizeOptions` in step: the table reads it from `features.pagination.pageSizeOptions`,
and `parseQuerySearchParams` takes its own `pageSizeOptions`. Define the list once and pass it to
both.

### `useDataTableQueryState`

Driving a table from a URL (or any slow external source) has a trap: one action often changes two
state slices in the same tick — a new sort also resets the page — and two navigations built from
the same stale props overwrite each other. `useDataTableQueryState` merges them:

```tsx
'use client'
import { DataTable, serializeQuerySearchParams, useDataTableQueryState } from '@shining-technologies/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export function OrdersTable({ rows, total, query }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const state = useDataTableQueryState(query, (next) => {
    const params = serializeQuerySearchParams(next, { columns, base: searchParams })
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }))
  })

  return (
    <DataTable
      {...state}
      mode="server"
      data={rows}
      rowCount={total}
      columns={columns}
      loading={pending}
      timeZone="Australia/Sydney"
    />
  )
}
```

The hook shows each change immediately, emits one query per tick, and follows the source again
when it changes on its own (the Back button). It works the same with React Router, TanStack Router
or a store. The Next.js page that feeds it is in the [Next.js guide](./nextjs.md).

It returns `DataTableQueryState`: `sorting`, `columnFilters`, `globalFilter`, `pagination` and
their four `onXChange` handlers, ready to spread.

## Columns

```tsx
import type { ColumnDef } from '@shining-technologies/ui'

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'Order', enableGlobalFilter: false },
  { accessorKey: 'customer', header: 'Customer', filter: { type: 'text' } },
  {
    accessorKey: 'status',
    header: 'Status',
    filter: {
      type: 'multiSelect',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paid', value: 'paid' },
      ],
    },
    cell: ({ value }) => <Badge tone={value === 'paid' ? 'success' : 'neutral'}>{value}</Badge>,
  },
  { accessorKey: 'total', header: 'Total', sortingFn: 'number', filter: { type: 'number' } },
  { accessorKey: 'placedAt', header: 'Placed', sortingFn: 'datetime', filter: { type: 'date' } },
  { accessorPath: 'owner.name', id: 'owner', header: 'Owner' },
]
```

- `accessorKey` reads a property (typed); `accessorPath` reads a dotted path; `accessorFn` computes.
- `filter.type` is `text`, `number`, `date`, `select`, `multiSelect` or `boolean`. It decides the
  operators offered and how values compare. A column without `filter` still filters as text
  `contains` when a filter is set on it programmatically.
- `sortingFn` is `auto` (default), `text`, `number`, `datetime`, `boolean` or a comparator.

`ColumnDef<TData>` is a union of five shapes. `DataTableColumn` is an alias.

| Shape                        | Required keys                  | `value` in `cell`                    |
| ---------------------------- | ------------------------------ | ------------------------------------ |
| `AccessorKeyColumnDef`       | `accessorKey` (a key of `TData`) | `TData[K]`                         |
| `PathAccessorColumnDef`      | `id`, `accessorPath`           | `unknown`                            |
| `AccessorFnColumnDef`        | `id`, `accessorFn`             | `unknown` in an array literal; typed with `createColumnHelper` |
| `DisplayColumnDef`           | `id`                           | `undefined` (no accessor)            |
| `GroupColumnDef`             | `id`, `columns`                | no `cell`                            |

A column's id is `id`, else `accessorKey`. A column with neither throws an error ("A column needs an `id` when it
has no `accessorKey`") when the table builds its columns.

### Column definition fields

| Field                | Type                                              | Default          | Notes |
| -------------------- | ------------------------------------------------- | ---------------- | ----- |
| `id`                 | `string`                                          | `accessorKey`    | Required for path, computed, display and group columns. Used in state, URLs and CSS (`data-column-id`). |
| `accessorKey`        | `keyof TData & string`                            | —                | Reads `row[key]`. |
| `accessorPath`       | `string`                                          | —                | Reads a dotted path such as `'owner.address.city'` or `'items.0.id'`; missing segments give `undefined`. |
| `accessorFn`         | `(row: TData, index: number) => TValue`           | —                | Computes the value. Takes precedence over the other accessors. |
| `header`             | `ReactNode \| (ctx: HeaderRenderContext) => ReactNode` | the column id | A plain string is also the column's label in the column picker, filter UI, cards and CSV. |
| `cell`               | `(ctx: CellContext) => ReactNode`                  | see below        | |
| `footer`             | `ReactNode \| (ctx: HeaderRenderContext) => ReactNode` | —            | Any footer turns the footer row on. |
| `size`               | `number` (px)                                     | `160`            | Honoured when `tableLayout` is `'fixed'`. |
| `minSize`            | `number` (px)                                     | `56`             | Lower bound for resizing. |
| `maxSize`            | `number` (px)                                     | `900`            | Upper bound for resizing. |
| `enableSorting`      | `boolean`                                         | `true`           | `false` removes the sort button, `aria-sort` and the column's sort menu items. |
| `sortingFn`          | `'auto' \| 'text' \| 'number' \| 'datetime' \| 'boolean' \| (a, b) => number` | `'auto'` | See [Sorting](#sorting). |
| `sortDescFirst`      | `boolean`                                         | `false`          | Start this column's click cycle at descending. |
| `enableFiltering`    | `boolean`                                         | `true`           | `false` removes the column from the filter UI and ignores filters on it, in the table and in `applyQuery`. |
| `filter`             | `ColumnFilterConfig`                              | —                | Declares the filter; see below. |
| `enableGlobalFilter` | `boolean`                                         | `true`           | Include the column in the search box. |
| `enableHiding`       | `boolean`                                         | `true`           | `false` keeps the column out of the column picker and its header menu. |
| `defaultVisible`     | `boolean`                                         | `true`           | Initial visibility when `columnVisibility` is uncontrolled. |
| `enableResizing`     | `boolean`                                         | —                | `true` on any column turns resizing on for the table. |
| `enablePinning`      | `boolean`                                         | `true`           | `false` keeps the column out of the header menu's pinning items. |
| `defaultPinned`      | `'left' \| 'right' \| false`                      | —                | Initial pinned side when `columnPinning` is uncontrolled. A pinning the user chose and the table [remembered](#remembering-the-layout) takes precedence. |
| `meta`               | `ColumnMeta`                                      | —                | See [`meta`](#meta). |

The `filter` object (`ColumnFilterConfig`):

| Field             | Type                                                   | Default                        |
| ----------------- | ------------------------------------------------------ | ------------------------------ |
| `type`            | `'text' \| 'number' \| 'date' \| 'select' \| 'multiSelect' \| 'boolean'` | required |
| `options`         | `{ label: string; value: TValue; group?: string; disabled?: boolean }[]` | — (used by `select` and `multiSelect`) |
| `operators`       | `FilterOperator[]`                                     | every operator of `type`       |
| `defaultOperator` | `FilterOperator`                                       | `contains`, `equals`, `on`, `equals`, `includes`, `isTrue` by type. The operator a new filter starts on, in both layouts; a bare value (in code or a URL) uses the type's default |
| `placeholder`     | `string`                                               | `'Value'` or `'Any'` depending on the control; the inline text input uses the column label |
| `label`           | `string`                                               | the column label               |
| `hidden`          | `boolean`                                              | `false` — `true` hides the column from the filter UI but keeps programmatic filtering |
| `predicate`       | `(rowValue: unknown, filter: { operator, value }) => boolean` | built-in operators      |

### Cell, header and footer renderers

`cell` receives a `CellContext<TData, TValue>`:

| Key        | Type                         | Notes |
| ---------- | ---------------------------- | ----- |
| `value`    | `TValue`                     | The accessor's value, already extracted. |
| `row`      | `Row<TData>`                 | `row.original` is your object; `row.id` its id. |
| `rowIndex` | `number`                     | The row's position in `data` (`row.index`), not its position on the page. |
| `column`   | `Column<TData, TValue>`      | |
| `cell`     | `Cell<TData, TValue>`        | |
| `table`    | `Table<TData>`               | The live TanStack instance. |
| `meta`     | `ColumnMeta \| undefined`    | `column.columnDef.meta`. |

Without `cell`, the table renders `null` and `undefined` as nothing, `Date` objects as a medium
date in the table's `locale` and `timeZone`, booleans as `Yes`/`No`, and anything else with
`String(value)`. Date strings are shown as-is; use `CellDate` to format them.

`header` and `footer` are static content or a function of `HeaderRenderContext<TData>`:
`{ header, column, table, meta }`. It is not parameterised by the value type, which is what lets
columns of different value types share one `ColumnDef<TData>[]`.

```tsx
{
  accessorKey: 'total',
  header: 'Total',
  meta: { align: 'right' },
  cell: ({ value }) => <CellNumber value={value} options={{ style: 'currency', currency: 'AUD' }} />,
  footer: ({ table }) => {
    const sum = table.getFilteredRowModel().rows.reduce((acc, row) => acc + row.original.total, 0)
    return <CellNumber value={sum} options={{ style: 'currency', currency: 'AUD' }} />
  },
}
```

The footer row (`<tfoot>`) renders when any column declares `footer` (override with
`showFooter`), and only while there are rows on screen.

### `meta`

`ColumnMeta` is available to every renderer as `column.columnDef.meta` (and as `meta` in the
contexts above).

| Field              | Type                                  | Effect |
| ------------------ | ------------------------------------- | ------ |
| `align`            | `'left' \| 'center' \| 'right'`       | Alignment of header, body and footer cells. Default `'left'`. |
| `className`        | `string`                              | Extra classes on every body cell of the column. |
| `headerClassName`  | `string`                              | Extra classes on the column's header cell. |
| `label`            | `string`                              | Plain-text name for the column picker, filter UI, card labels, sort select and CSV header. Takes precedence over a string `header`. Set it whenever `header` is not a string. |
| `responsive`       | `{ hideBelow?, hideAbove?, priority? }` | `hideBelow`/`hideAbove` take `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'`; `priority` orders cells on a card, lower first. See [Responsive layout](#responsive-layout). |
| `wrap`             | `boolean`                             | Let the content wrap. Cells truncate by default. |
| `hideLabelInCards` | `boolean`                             | Show the value without its label in card layout (the label stays for screen readers). |
| `hideInCards`      | `boolean`                             | Leave the column, and its footer total, off cards. |

### Extending `ColumnMeta`

Add your own fields by augmenting the interface in `core`; the table's module augmentation of
TanStack Table picks them up, so `column.columnDef.meta` is typed everywhere:

```ts
// shining-ui.d.ts
import '@shining-technologies/ui/core'

declare module '@shining-technologies/ui/core' {
  interface ColumnMeta {
    currency?: string
  }
}
```

### Grouped headers

A `GroupColumnDef` spans its child columns with one header cell (`colSpan`, `scope="colgroup"`):

```tsx
const columns: ColumnDef<Order>[] = [
  {
    id: 'owner',
    header: 'Owner',
    columns: [
      { accessorPath: 'owner.name', id: 'ownerName', header: 'Name' },
      { accessorPath: 'owner.email', id: 'ownerEmail', header: 'Email' },
    ],
  },
  { accessorKey: 'total', header: 'Total' },
]
```

Groups take `id`, `header`, `footer`, `meta` and `columns`. Each header row is sticky below the one
above it. `applyQuery` and the URL helpers flatten groups to their leaf columns.

### `createColumnHelper`

Array literals already type `value` for `accessorKey` columns. The helper adds the same inference
for computed columns:

```tsx
import { createColumnHelper, type ColumnDef } from '@shining-technologies/ui'

const column = createColumnHelper<Order>()

const columns: ColumnDef<Order>[] = [
  column.accessor('customer', { header: 'Customer' }),
  column.computed('ageDays', (order) => (Date.now() - Date.parse(order.placedAt)) / 86_400_000, {
    header: 'Age',
    cell: ({ value }) => `${Math.floor(value)} d`, // value: number
  }),
  column.path('ownerEmail', 'owner.email', { header: 'Owner email' }),
  column.display({ id: 'avatar', cell: ({ row }) => <CellPerson name={row.original.owner.name} /> }),
  column.group({ id: 'money', header: 'Money', columns: [column.accessor('total', { header: 'Total' })] }),
]
```

| Method                                 | Returns a column that… |
| -------------------------------------- | ---------------------- |
| `accessor(key, column?)`               | reads `key`; `value` is `TData[K]` |
| `computed(id, accessorFn, column?)`    | computes its value; `value` is the function's return type |
| `path(id, accessorPath, column?)`      | reads a dotted path; `value` is `unknown` |
| `display(column)`                      | has no value |
| `group(column)`                        | spans child columns |

### Built-in columns

The table injects up to three columns of its own:

| Injected when                                     | Id (`export const`)                     | Position | Width |
| ------------------------------------------------- | --------------------------------------- | -------- | ----- |
| selection is enabled                              | `SELECTION_COLUMN_ID` = `'sui-select'`   | first    | 44 px |
| `renderExpandedRow` is given                      | `EXPANDER_COLUMN_ID` = `'sui-expander'`  | after selection | 44 px |
| `rowActions` (or `slots.rowActions`) is given     | `ACTIONS_COLUMN_ID` = `'sui-actions'`    | last, pinned right | `rowActionsWidth`, default 120 px |

They cannot be sorted, hidden, resized, searched or filtered, and they have no header menu. Ids
starting with `sui-` are skipped by CSV export. A column with the same id already in `columns`
suppresses the injection.

`createSelectionColumn(mode)`, `createExpanderColumn()` and
`createActionsColumn(render, { header?, width? })` build these columns as TanStack Table
`ColumnDef`s, for tables assembled directly on the engine (see `useTableInstance` in
[Other exports](#other-exports)).

## Cells toolkit

Ready-made renderers for common cells. None is required: a `cell` function can return any React.

| Component      | Props | Renders |
| -------------- | ----- | ------- |
| `CellText`     | `children`, `truncate?` (default `true`), `title?`, `className?` | One line with ellipsis. Pass `title` to expose the full text on hover. |
| `CellBadge`    | All `Badge` props (`tone`, `variant`, …) plus `children` | A [`Badge`](./components/badge.md). |
| `CellPerson`   | `name`, `description?`, `caption?`, `imageSrc?`, `initials?`, `seed?`, `avatar?` (default `true`), `className?` | Avatar plus up to three lines. Initials come from `name`; the avatar colour is derived from `seed`, else `name`. `avatar={false}` drops the avatar. |
| `CellStack`    | `children`, `secondary?`, `className?` | A primary value with a muted second line. |
| `CellEmpty`    | `children?` (default `'—'`) | A muted placeholder. |
| `CellProgress` | `value`, `label` (required, the accessible name), `max?` (default `100`), `showValue?` (default `true`), `tone?` (`'accent' \| 'success' \| 'warning' \| 'danger'`, default `'accent'`), `className?` | A `role="progressbar"` bar. `value` is clamped to `0…max`; `showValue` prints the rounded percentage. |
| `CellNumber`   | `value: number \| null \| undefined`, `options?: Intl.NumberFormatOptions`, `locale?`, `fallback?` (default `'—'`), `className?` | Tabular figures. `null`, `undefined` and `NaN` show `fallback`. |
| `CellDate`     | `value: Date \| string \| number \| null \| undefined`, `options?: Intl.DateTimeFormatOptions` (default `{ dateStyle: 'medium' }`), `locale?`, `timeZone?`, `fallback?` (default `'—'`), `className?` | A `<time dateTime>` element. Invalid and empty values show `fallback`. |
| `CellLink`     | `href`, `children`, `external?`, `className?` | An anchor that does not trigger `onRowClick`. `external` opens a new tab, adds an icon and the screen-reader text "(opens in a new tab)". |

`CellNumber` and `CellDate` use, in order: their own `locale`; the table's `locale`; `'en-US'`.
`CellDate` takes its zone from `timeZone`, then `options.timeZone`, then the table's `timeZone`.
A `yyyy-mm-dd` string is a calendar day and is shown as that day in every zone.

Row action helpers (`RowAction`, `RowActionGroup`, `RowActions`) are described under
[Row actions](#row-actions).

## `DataTable` props

`DataTableProps<TData>`, grouped by concern.

### Data and status

| Prop              | Type                                      | Default | Description |
| ----------------- | ----------------------------------------- | ------- | ----------- |
| `data`            | `readonly TData[]`                        | required | The rows. Never mutated. |
| `columns`         | `readonly ColumnDef<TData>[]`             | required | See [Columns](#columns). |
| `getRowId`        | `(row: TData, index: number) => string`   | the row's index | Stable row identity. Selection and expansion are keyed by it. |
| `loading`         | `boolean`                                 | `false` | Skeleton rows on first load; dims existing rows on a refetch. |
| `error`           | `unknown`                                 | —       | Anything truthy shows the error state. |
| `onRetry`         | `() => void`                              | —       | Adds a "Try again" button to the error state. |
| `loadingRowCount` | `number`                                  | the page size, capped at 8 | Skeleton rows drawn on first load. |

### Behaviour

| Prop                   | Type                        | Default    | Description |
| ---------------------- | --------------------------- | ---------- | ----------- |
| `mode`                 | `'client' \| 'server'`      | `'client'` | Default mode for sorting, filtering and pagination. |
| `features`             | `DataTableFeatures<TData>`  | —          | See [Features](#features). |
| `enableRowSelection`   | `boolean`                   | `false`    | Shorthand for `features.selection.enabled`; takes precedence. |
| `pageSize`             | `number`                    | `10`       | Shorthand for `features.pagination.pageSize`; takes precedence. Changing it resets the page to the first page (a controlled page gets `onPaginationChange` with `pageIndex: 0`). |
| `rowCount`             | `number`                    | —          | Total rows on the server. Shorthand for `features.pagination.rowCount`; takes precedence. |
| `keepPageOnDataChange` | `boolean`                   | `false`    | Client pagination only: stay on the current page when `data` changes identity. |
| `locale`               | `string`                    | `'en-US'`  | See [Time zones and locale](#time-zones-and-locale). |
| `timeZone`             | `string`                    | the runtime's zone | See [Time zones and locale](#time-zones-and-locale). |
| `onQueryChange`        | `(query: DataTableQuery) => void` | —    | Fires when the server-relevant state changes. |
| `persist`              | `boolean \| string \| DataTablePersistOptions` | on | Remember the user's pinned and hidden columns in the browser. See [Remembering the layout](#remembering-the-layout). |

### State

Each slice is independently controllable.

| Slice              | Controlled prop (type)                                    | Initial value prop       | Change handler             | Uncontrolled default |
| ------------------ | --------------------------------------------------------- | ------------------------ | -------------------------- | -------------------- |
| sorting            | `sorting`: `SortingState` or a `SortingFeature` object     | `defaultSorting`         | `onSortingChange`          | `[]` |
| column filters     | `columnFilters`: `ColumnFiltersState` or a `FilteringFeature` object | `defaultColumnFilters` | `onColumnFiltersChange` | `[]` |
| search             | `globalFilter`: `string`                                  | `defaultGlobalFilter`    | `onGlobalFilterChange`     | `''` |
| pagination         | `pagination`: `{ pageIndex, pageSize }`                   | `defaultPagination`      | `onPaginationChange`       | `{ pageIndex: 0, pageSize }` |
| selection          | `rowSelection`: `Record<string, boolean>`                 | `defaultRowSelection`    | `onRowSelectionChange`     | `{}` |
| column visibility  | `columnVisibility`: `Record<string, boolean>`             | `defaultColumnVisibility` | `onColumnVisibilityChange` | from `defaultVisible` |
| column sizes       | `columnSizing`: `Record<string, number>`                  | `defaultColumnSizing`    | `onColumnSizingChange`     | `{}` |
| column pinning     | `columnPinning`: `{ left?: string[]; right?: string[] }`   | `defaultColumnPinning`   | `onColumnPinningChange`    | from `defaultPinned` and the injected columns |
| expansion          | `expanded`: `true \| Record<string, boolean>`              | `defaultExpanded`        | `onExpandedChange`         | `{}` |

`sorting` and `columnFilters` also accept a config object instead of state — state is always an
array, a config always a plain object — so `sorting={{ mode: 'server' }}` is the same as
`features.sorting.mode`. Values given this way override `features.sorting` / `features.filtering`.

Handlers receive the next value, not an updater function. Pinning and visibility, and with
`persist` also sizes, can be restored from browser storage when the table mounts; the matching
handler fires with the restored value. A controlled slice is never restored.

### Rows

| Prop               | Type                                                        | Default     | Description |
| ------------------ | ----------------------------------------------------------- | ----------- | ----------- |
| `onRowClick`       | `(row: Row<TData>, event: MouseEvent \| KeyboardEvent) => void` | —       | Row click, or Enter on a focused row. Not called for disabled rows. |
| `onRowDoubleClick` | `(row: Row<TData>, event: MouseEvent) => void`              | —           | Not called for disabled rows. |
| `isRowDisabled`    | `(row: TData) => boolean`                                   | —           | Disabled rows are dimmed, unselectable, not clickable and skipped by keyboard navigation. |
| `renderExpandedRow`| `(row: Row<TData>) => ReactNode`                            | —           | Turns expansion on and injects the expander column. |
| `rowActions`       | `(row: Row<TData>) => ReactNode \| RowActionSpec[]`         | —           | Injects a trailing actions column, pinned right. |
| `rowActionsHeader` | `ReactNode \| false`                                        | `'Actions'` | Visible header of the actions column; `false` keeps "Actions" for screen readers only. |
| `rowActionsWidth`  | `number` (px)                                               | `120`       | Width of the actions column. |

### Heading

| Prop             | Type                              | Default | Description |
| ---------------- | --------------------------------- | ------- | ----------- |
| `title`          | `ReactNode`                       | —       | Rendered above the toolbar. Names the table for screen readers when `label` is not set. |
| `description`    | `ReactNode`                       | —       | One line under the title. |
| `icon`           | `ReactNode`                       | —       | A glyph before the title (hidden from screen readers). |
| `headingActions` | `ReactNode \| ({ table }) => ReactNode` | — | Right side of the heading block. Renders the heading on its own when no title, description or icon is set. |
| `titleAs`        | `'p' \| 'h2' \| 'h3' \| 'h4'`     | `'p'`   | Element for the title. Only the page knows its heading level. |

### Appearance and layout

| Prop               | Type                                | Default | Description |
| ------------------ | ----------------------------------- | ------- | ----------- |
| `variant`          | `'default' \| 'minimal' \| 'compact' \| 'borderless' \| 'striped' \| 'dashboard'` | `'default'` | Visual variant (`data-variant` on the root). |
| `density`          | `'compact' \| 'comfortable' \| 'spacious'` | `'comfortable'` | Row height and padding (`data-density`). |
| `surface`          | `'card' \| 'plain'`                 | `'card'` | One bordered card, or separate blocks. |
| `tableLayout`      | `'fixed' \| 'auto'`                 | `'fixed'` | `'fixed'` honours column `size`; `'auto'` sizes to content. |
| `responsiveMode`   | `'scroll' \| 'cards' \| 'auto'`     | `'scroll'` | See [Responsive layout](#responsive-layout). |
| `filterLayout`     | `'panel' \| 'inline'`               | `'panel'` | See [Filter UI](#filter-ui-panel-and-inline). |
| `maxHeight`        | `number \| string`                  | —       | Bounds the scroll container (`480`, `'60vh'`), so only the rows scroll. Required for sticky headers and footers to take effect, and for virtualization. |
| `stickyHeader`     | `boolean`                           | `true`  | Header sticks to the top of the scroll frame. |
| `stickyFooter`     | `boolean`                           | `true` when `maxHeight` is set | Footer sticks to the bottom of the scroll frame. |
| `showFooter`       | `boolean`                           | `true` when any column declares `footer` | |
| `showToolbar`      | `boolean`                           | `true`  | Also hides `slots.toolbar`. |
| `showPagination`   | `boolean`                           | `true`  | Only has an effect while pagination is enabled. |
| `showSelectionBar` | `boolean`                           | `true`  | The "N of M selected" bar, shown while selection is enabled and rows are selected. |
| `showToolbarCount` | `boolean`                           | `true` for `filterLayout="inline"`, else `false` | Row count in the toolbar ("1–10 of 48", or "48 rows" without pagination). |

### Structure and styling

| Prop             | Type                                                   | Description |
| ---------------- | ------------------------------------------------------ | ----------- |
| `components`     | `DataTableComponents<TData>`                           | Replace parts; see [Replacing parts](#replacing-parts-components). |
| `slots`          | `DataTableSlots<TData>`                                | Inject content; see [Slots](#slots). |
| `emptyState`     | `ReactNode`                                            | Shorthand for `slots.emptyState`; wins over it. |
| `loadingState`   | `ReactNode`                                            | Shorthand for `slots.loadingState`; wins over it. |
| `errorState`     | `ReactNode`                                            | Shorthand for `slots.errorState`; wins over it. |
| `className`      | `string`                                               | Root element (`.sui-root`). |
| `style`          | `CSSProperties`                                        | Root element; the place for `--sui-*` tokens (see [Theming](./theming.md)). |
| `tableClassName` | `string`                                               | `<table>`. |
| `headerClassName`| `string`                                               | `<thead>`. |
| `bodyClassName`  | `string`                                               | `<tbody>`. |
| `rowClassName`   | `string \| (row: Row<TData>) => string \| undefined`   | Every body row. |
| `cellClassName`  | `string \| (cell: Cell<TData, unknown>) => string \| undefined` | Every body cell. |
| `classNames`     | `DataTableClassNames`                                  | See [Class names](#class-names-and-data-attributes). |

### Accessibility

| Prop               | Type        | Description |
| ------------------ | ----------- | ----------- |
| `id`               | `string`    | Root id, and the base of generated ids (caption, title, detail rows). Generated with `useId` when omitted. |
| `label`            | `string`    | Accessible name, applied as `aria-label`. Not needed with `title` or `caption`. |
| `caption`          | `ReactNode` | Visible `<caption>`; names the table and takes precedence over `label` and `title`. |
| `aria-label`       | `string`    | Applied as given, replacing `label`. A `caption`, or a `title` without `label`, still sets `aria-labelledby`, which takes precedence over `aria-label`. |
| `aria-labelledby`  | `string`    | Applied as given. |
| `aria-describedby` | `string`    | Applied as given. |

There are no props for interface strings. The built-in controls use English text ("Search table",
"Filter", "Rows per page", "No results", …); the configurable ones are
`features.filtering.searchPlaceholder`, `filter.label`, `filter.placeholder`, `rowActionsHeader`
and the state slots. To translate the rest, replace the parts through `components`.

## Features

`features` holds all behavioural configuration. Every field is optional.

| Feature            | Option              | Type                        | Default |
| ------------------ | ------------------- | --------------------------- | ------- |
| `sorting`          | `enabled`           | `boolean`                   | `true` |
|                    | `mode`              | `'client' \| 'server'`      | `mode` prop |
|                    | `multi`             | `boolean \| 'always'`       | `true` (shift-click adds a column) |
|                    | `removable`         | `boolean`                   | `true` (the cycle includes "unsorted") |
| `filtering`        | `enabled`           | `boolean`                   | `true` (column filters and search) |
|                    | `mode`              | `'client' \| 'server'`      | `mode` prop |
|                    | `globalSearch`      | `boolean`                   | `true` |
|                    | `debounceMs`        | `number`                    | `250` |
|                    | `searchPlaceholder` | `string`                    | `'Search…'` |
| `pagination`       | `enabled`           | `boolean`                   | `true` |
|                    | `mode`              | `'client' \| 'server'`      | `mode` prop |
|                    | `pageSize`          | `number`                    | `10` |
|                    | `pageSizeOptions`   | `number[]`                  | `[10, 25, 50, 100]` |
|                    | `rowCount`          | `number`                    | — |
|                    | `showPageNumbers`   | `boolean`                   | `true` |
|                    | `siblingCount`      | `number`                    | `1` |
| `selection`        | `enabled`           | `boolean`                   | `false` |
|                    | `mode`              | `'single' \| 'multiple'`    | `'multiple'` |
|                    | `enableRow`         | `(row: TData) => boolean`   | every row |
| `columnVisibility` | `enabled`           | `boolean`                   | `true` |
| `resizing`         | `enabled`           | `boolean`                   | `true` if any column sets `enableResizing` |
|                    | `mode`              | `'onChange' \| 'onEnd'`     | `'onChange'` |
| `pinning`          | `enabled`           | `boolean`                   | `true` |
|                    | `actions`           | `'left' \| 'right' \| false` | `'right'` |
|                    | `selection`         | `'left' \| 'right' \| false` | `false` |
| `expanding`        | `enabled`           | `boolean`                   | `true` when `renderExpandedRow` is given |
|                    | `mode`              | `'single' \| 'multiple'`    | `'multiple'` |
| `virtualization`   | `enabled`           | `boolean`                   | `false` — set by `VirtualizedDataTable`; see [Virtualization](#virtualization) |
|                    | `estimateRowHeight` | `number` (px)               | `48` |
|                    | `overscan`          | `number`                    | `8` |

## Filtering

### Filter operators

| Type          | Operators                                                                         |
| ------------- | --------------------------------------------------------------------------------- |
| `text`        | contains, notContains, equals, notEquals, startsWith, endsWith, isEmpty, isNotEmpty (case- and accent-insensitive) |
| `number`      | equals, notEquals, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, between, isEmpty, isNotEmpty |
| `date`        | on, before, after, between, isEmpty, isNotEmpty                                   |
| `select`      | equals, notEquals, isEmpty, isNotEmpty                                            |
| `multiSelect` | includes, notIncludes, isEmpty, isNotEmpty                                        |
| `boolean`     | isTrue, isFalse                                                                   |

Restrict them with `filter.operators`, preselect one with `filter.defaultOperator`, or replace the
logic with `filter.predicate(rowValue, { operator, value })`. `between` accepts a reversed range
and an open end (`[10, null]`).

Other rules the predicates apply:

- `isEmpty` matches `null`, `undefined`, empty or whitespace-only strings and empty arrays.
- `select` compares as text, so the option `2` matches the URL value `"2"`.
- `multiSelect` matches when any selected value is in the row value (a single value or an array).
- `boolean` treats `true`, `'true'` and `1` as true.
- A filter without a usable value (an empty text box, `between` with both ends empty) matches
  every row and is not reported as active.

### Setting filters in code

A filter value is `{ operator, value }`, or a bare value that means the type's default operator:

```tsx
<DataTable
  data={orders}
  columns={columns}
  defaultColumnFilters={[
    { id: 'status', value: { operator: 'includes', value: ['open', 'paid'] } },
    { id: 'customer', value: 'ann' }, // customer contains "ann"
    { id: 'total', value: { operator: 'between', value: [10, 200] } },
  ]}
/>
```

`filterValue(operator, value)` from `core` builds the structured form.

### Filter UI: panel and inline

Only columns with a `filter` config appear in the filter UI, unless `filter.hidden` is `true` or
`enableFiltering` is `false`. Filters apply as they change; there is no Apply button.

`filterLayout="panel"` (default):

- A "Filter" button opens a popover with one row per filterable column: an operator picker (when
  more than one operator is allowed) and the inputs the operator needs — none, one, two (a range)
  or many (a searchable multi-select). The button shows the number of active filters.
- The popover has "Clear all" and "Done".
- Active filters are listed under the toolbar as chips (column, operator, value) with a remove
  button each and "Clear all".

`filterLayout="inline"`:

- Each filter is its own control in the toolbar, labelled with its column name
  (`Status: 2 selected`).
- The search box and the filters share one line. When they run out of room they wrap, one control
  at a time, onto the next line; "Clear filters" follows the last filter. The row count and the
  column picker stay at the top right, and below 640px take a line of their own.
- `select` and `boolean` use a select with an "Any" entry; `multiSelect` a searchable
  multi-select; `number` and `date` a popover with a range (`between`) unless
  `filter.defaultOperator` names a single-value operator. Date ranges offer presets.
- While the search box is on, a plain `text` filter on a column it already covers is not shown; set
  `operators` or `defaultOperator` to keep it.
- Every active control has its own clear button. No chips are shown.
- The toolbar row count is shown by default (`showToolbarCount`).

In both layouts the toolbar shows "Clear filters" once anything is filtered; its count covers the
search and the filters that narrow the result, and it clears both.

Options with a `group` are listed under a heading for that group, in both the select and the
multi-select controls. Each group is a `role="group"` labelled by its heading; options of a group
are collected where the group first appears, and ungrouped options stay in place:

```ts
filter: {
  type: 'multiSelect',
  options: [
    { label: 'Admin', value: 'admin', group: 'Staff' },
    { label: 'Editor', value: 'editor', group: 'Staff' },
    { label: 'Viewer', value: 'viewer', group: 'Guests' },
  ],
}
```

Chips and inline controls are labelled with `filter.label` when it is set, otherwise the column
label.

### Custom predicate

`predicate` replaces the built-in operators for one column. It runs only when the filter is
active, in the table and in `applyQuery`:

```ts
{
  accessorKey: 'owner',
  id: 'owner',
  header: 'Owner',
  filter: {
    type: 'text',
    operators: ['contains'],
    predicate: (rowValue, { value }) => {
      const owner = rowValue as Order['owner']
      const needle = String(value).toLowerCase()
      return owner.name.toLowerCase().includes(needle) || owner.email.toLowerCase().includes(needle)
    },
  },
}
```

The filter UI still renders from `type` and `operators`.

### Global search

The search box sets `globalFilter`. It searches every column that has an accessor and does not set
`enableGlobalFilter: false`, and tests each cell's value on its own — the same rule `applyQuery`
uses (`matchesSearchValue` in `core`):

- Strings and finite numbers match with case- and accent-insensitive "contains" on their text.
- A valid `Date` matches by its `yyyy-mm-dd` day in the table's `timeZone`, so `2024-03` finds
  every date in March 2024.
- Booleans, `null`, `undefined`, objects, arrays and `NaN` never match.
- An empty or blank search matches every row.

- The input keeps its own value and pushes it after `features.filtering.debounceMs` (250 ms). In
  server mode this is what stops every keystroke from becoming a request.
- `features.filtering.globalSearch: false` removes the box and turns search off.
- Control it with `globalFilter` and `onGlobalFilterChange`. The box follows external changes (a
  "Clear filters", the Back button) and ignores late echoes of its own value, so a URL-driven
  table does not overwrite what the user is still typing.

## Sorting

Multi-column (shift-click, or `features.sorting.multi: 'always'`). Empty values (`null`,
`undefined`, `''`) always sort last, in both directions. Text uses the `locale` collator with
numeric collation, so `item 9` sorts before `item 10`.

- A sortable header contains a button named after the column and the next click's effect
  (`Total, sort ascending`, `Total, sort descending` or `Total, clear sort`). The `<th>` carries
  `aria-sort`.
- The click cycle is ascending, descending, unsorted. `features.sorting.removable: false` drops the
  unsorted step; `sortDescFirst` on a column starts at descending.
- In a multi-column sort each header shows its position.
- Each header's menu has "Sort ascending", "Sort descending" and, while the column is sorted,
  "Clear sort".
- `features.sorting.enabled: false` or a column's `enableSorting: false` removes sorting.
- `features.sorting.multi: false` allows one sorted column at a time.

Comparators:

| `sortingFn`  | Compares |
| ------------ | -------- |
| `'auto'`     | Two numbers numerically, two booleans as `false < true`, a `Date` as a date, anything else as text. ISO date strings are text here — use `'datetime'`. `NaN` and invalid `Date`s sort as empty. |
| `'text'`     | `Intl.Collator(locale, { numeric: true, sensitivity: 'base' })`. |
| `'number'`   | Numerically. A value that cannot be read as a number (`'n/a'`) sorts as empty: last, in both directions. |
| `'datetime'` | By timestamp (`Date`, epoch number or date string). A value that cannot be read as a date sorts as empty. |
| `'boolean'`  | `false < true`. |
| a function   | `(a, b) => number` over values. Empty values never reach it. |

## Pagination

- Pagination is on by default with 10 rows per page. `pageSize` sets the size;
  `features.pagination.enabled: false` shows every row.
- The bar shows "Showing 21–30 of 245", a "Rows per page" select, first / previous / numbered /
  next / last buttons, and in selection tables "N of M selected".
- `pageSizeOptions` lists the sizes offered; the current `pageSize` is always included.
- `showPageNumbers: false` hides the numbered buttons. `siblingCount` sets how many pages appear on
  each side of the current one; longer runs collapse to an ellipsis.
- Page changes are announced to screen readers ("Page 3 of 25") without moving focus.
- In server pagination pass `rowCount`; see [Server mode](#server-mode).
- Replace the bar with `slots.pagination` or `components.Pagination`, or place
  `<DataTablePagination />` yourself.

## Selection

```tsx
'use client'
<DataTable
  data={orders}
  columns={columns}
  getRowId={(o) => o.id}
  enableRowSelection
  isRowDisabled={(o) => o.status === 'refunded'}
  onRowSelectionChange={setSelection}
  rowSelection={selection}
/>
```

- Selection adds a checkbox column. In `'multiple'` mode (default) the header checkbox selects or
  clears the rows on the current page; in `features.selection.mode: 'single'` there is no header
  checkbox and selecting a row clears the others.
- A row can be selected with its checkbox, or with Space when the row has focus. Clicking the row
  does not select it.
- `features.selection.enableRow(row)` and `isRowDisabled(row)` both make a row unselectable.
- Selection is `RowSelectionState` (`{ [rowId]: true }`) and survives page changes. Pass
  `getRowId` whenever data can change (refetches, server mode): selection is keyed by row id.
- While rows are selected, the selection bar reads "N of M selected" with "Clear selection"
  (`showSelectionBar`). The count comes from the state, so rows selected on other pages, or not
  loaded in server mode, are counted.

The pure helpers in `core` (`getSelectedRowIds`, `setRowsSelected`, `getSelectionStatus`,
`setRowSelected`, `toggleRowSelected`, `isRowSelected`) work on the same `RowSelectionState` in a
Server Action.

### Bulk actions

Pass the actions as `slots.selectionActions`. They appear in the selection bar, between the count
and "Clear selection", while rows are selected:

```tsx
<DataTable
  data={orders}
  columns={columns}
  getRowId={(order) => order.id}
  enableRowSelection
  slots={{
    selectionActions: ({ table }) => (
      <>
        <Button size="sm" variant="outline" onClick={() => exportOrders(table.getSelectedRowModel().rows)}>
          Export
        </Button>
        <Button size="sm" variant="destructive" onClick={() => confirmArchive(getSelectedRowIds(table.getState().rowSelection))}>
          Archive
        </Button>
      </>
    ),
  }}
/>
```

`table.getSelectedRowModel()` holds the loaded rows that are selected; in server mode, or for rows on
other pages, use the ids in `table.getState().rowSelection`. The bar is the package's
`BulkActionBar` (see [Data view](./components/data-view.md)); with actions, only its count is a live
region, so the buttons are not read out on every change.

To change the bar itself, replace it:

```tsx
'use client'
import {
  Button,
  DataTable,
  getSelectedRowIds,
  type DataTableComponents,
  type SelectionBarProps,
} from '@shining-technologies/ui'

function OrdersSelectionBar({ table, selectedCount, clearSelection }: SelectionBarProps<Order>) {
  const ids = getSelectedRowIds(table.getState().rowSelection)
  return (
    <div className="sui-selection-bar">
      <span role="status">{selectedCount} selected</span>
      <Button size="sm" onClick={() => archiveOrders(ids)}>
        Archive
      </Button>
      <Button size="sm" variant="ghost" onClick={clearSelection}>
        Clear selection
      </Button>
    </div>
  )
}

// Module scope, so the object keeps its identity between renders.
const components: DataTableComponents<Order> = { SelectionBar: OrdersSelectionBar }

export function Orders({ orders }: { orders: Order[] }) {
  return (
    <DataTable data={orders} columns={columns} getRowId={(o) => o.id} enableRowSelection components={components} />
  )
}
```

Use the ids rather than `table.getSelectedRowModel()` in server mode: the row model only contains
rows on the loaded page.

## Expansion

```tsx
<DataTable
  data={orders}
  columns={columns}
  getRowId={(o) => o.id}
  renderExpandedRow={(row) => <OrderLines order={row.original} />}
  features={{ expanding: { mode: 'single' } }}
/>
```

- `renderExpandedRow` turns expansion on and adds an expander column with a button per row
  ("Expand row details" / "Collapse row details", `aria-expanded`, `aria-controls`).
- The details render in a sibling row that spans every visible column, straight after the row
  (`id` `<tableId>-<rowId>-expanded`, class `sui-expanded`, `classNames.expandedRow`).
- `features.expanding.mode: 'single'` closes the open row when another opens.
- With a row focused, ArrowRight expands and ArrowLeft collapses.
- `expanded` / `defaultExpanded` / `onExpandedChange` control it; `true` expands every row.

## Row actions

```tsx
<DataTable
  data={orders}
  columns={columns}
  rowActions={(row) => [
    { icon: EyeIcon, label: 'View', href: `/orders/${row.original.id}` },
    { icon: PencilIcon, label: 'Edit', onClick: () => edit(row.original) },
    {
      icon: TrashIcon,
      label: 'Delete',
      destructive: true,
      hidden: row.original.status === 'paid',
      onClick: () => remove(row.original),
    },
  ]}
/>
```

`rowActions` adds an actions column, pinned right by default (`features.pinning.actions`), with a
visible "Actions" header (`rowActionsHeader`) and a width of 120 px (`rowActionsWidth`). Clicks
and double-clicks inside it never reach `onRowClick` / `onRowDoubleClick`.

Return either a list of `RowActionSpec` objects, which the table turns into icon buttons, or any
JSX.

`RowActionSpec` / `RowActionProps`:

| Field         | Type                                         | Description |
| ------------- | -------------------------------------------- | ----------- |
| `icon`        | `ComponentType<SVGProps<SVGSVGElement>>`     | The kit's icons or any SVG icon component. |
| `label`       | `string`                                     | Required. The accessible name and tooltip. Must be unique within a row (it is the React key). |
| `href`        | `string`                                     | Renders an anchor instead of a button. |
| `external`    | `boolean`                                    | Opens `href` in a new tab. |
| `onClick`     | `(event: MouseEvent<HTMLElement>) => void`   | |
| `destructive` | `boolean`                                    | Danger hover treatment. |
| `disabled`    | `boolean`                                    | A disabled button; a disabled link renders as a disabled button. |
| `hidden`      | `boolean`                                    | Spec only. Leaves a blank slot so the other icons keep their position. |
| `className`   | `string`                                     | `RowAction` only. |

The same parts as JSX:

```tsx
rowActions={(row) => (
  <RowActionGroup align="start">
    <RowAction icon={EyeIcon} label="View" href={`/orders/${row.original.id}`} />
    <RowAction icon={TrashIcon} label="Delete" destructive onClick={() => remove(row.original)} />
  </RowActionGroup>
)}
```

- `RowActionGroup`: `children`, `align?: 'start' | 'end'` (default `'start'`), `className?`.
- `RowActions` is an overflow menu for rows with more actions than fit on one line:
  `items: RowActionItem[]`, `label?` (trigger name, default `'Row actions'`), `heading?`. A
  `RowActionItem` has `label`, `onSelect`, `icon?`, `destructive?`, `disabled?` and
  `separatorBefore?`. It renders nothing for an empty list.

## Column visibility, resizing and pinning

Every table lets the user hide columns and pin them to either edge, and remembers both in the
browser. Nothing needs to be set up:

```tsx
<DataTable columns={columns} data={data} />
```

**Visibility.** `features.columnVisibility.enabled` (default `true`) adds a "Columns" picker to the
toolbar and "Hide column" to each header menu. The picker lists every column that can be hidden,
shows how many are hidden, and offers "Show all columns". Keep a column out of both with
`enableHiding: false`; start it hidden with `defaultVisible: false`. Hidden columns are
`columnVisibility` state, and the table remembers them — see [below](#remembering-the-layout).

**Resizing.** Turn it on with `features.resizing.enabled` or `enableResizing: true` on any column.
Once on, every column can be resized except those with `enableResizing: false`, within
`minSize`/`maxSize`. Each resizable header gets a grip (`role="separator"`) that can be dragged
with a mouse, pen or finger, double-clicked to reset, or focused and moved with
ArrowLeft/ArrowRight (8 px, 32 px with Shift); Enter or Backspace resets. Escape during a drag puts
the column back. Widths are `columnSizing` state.

A drag does not re-render the table. The grip captures the pointer and, once per animation frame,
rewrites the width and pinned-offset variables on the `<table>`; the result reaches `columnSizing`
(and `onColumnSizingChange`) once, when the grip is let go. A click on the grip without movement
changes nothing. With `features.resizing.mode: 'onEnd'` only the grip's guide line follows the
pointer, and the columns reflow on release — for tables so wide that even a CSS-only reflow on
every frame is too much.

A table narrower than its frame is stretched by the browser, which shares the spare width among all
columns. The first resize in that state takes the widths on screen as the starting point, so the
edge stays under the pointer, and hands any spare width to the last unpinned data column rather than
back to every column. Those widths are then `columnSizing` state.

**Pinning.** Pinned columns stick to the left or right edge while the table scrolls sideways, and
cast a shadow only while content is scrolled beneath them. Pinning is on by default
(`features.pinning.enabled`): each header menu offers "Pin to left" and "Pin to right" (except the
side it is already pinned to) and, while pinned, "Unpin". Keep a column out of the menu with
`enablePinning: false`; start it pinned with `defaultPinned`. The actions column is pinned to
`features.pinning.actions` (default `'right'`); the selection column to
`features.pinning.selection` (default not pinned). A column pinned from the menu joins its side
next to the columns already there: the selection column stays first on the left and the actions
column last on the right, and a column is only ever on one side. Positions are `columnPinning`
state, and the table remembers them — see below.

### Remembering the layout

A column the user pins or hides stays that way on the next visit, until they change it. Every
table does this by default, with nothing to set up: the layout is saved to `localStorage` after
each change and read back before the first paint.

Each table keeps one record. It is named by the table's `id` when it has one, and otherwise by a
fingerprint of its column ids — never by its title, headers or data, so renaming or translating a
header leaves the user's layout where it was. `id` is therefore optional; give one when two tables
have the same columns but should remember different layouts:

```tsx
<DataTable id="orders" columns={columns} data={orders} />
<DataTable id="archived-orders" columns={columns} data={archived} />
```

`persist` controls the rest:

| Value                  | Effect |
| ---------------------- | ------ |
| omitted or `true`      | Remember pinning and hidden columns. |
| `false`                | Remember nothing. |
| `'customers'`          | Remember under the key `customers` instead of the `id` or the fingerprint. |
| `{ key, state, storage }` | `key` as above; `state` lists what to remember — any of `'columnPinning'`, `'columnVisibility'`, `'columnSizing'` (default `['columnPinning', 'columnVisibility']`); `storage` is `'local'` (default) or `'session'`. |

```tsx
// Pinning, hidden columns and widths, kept for this browser tab only.
<DataTable
  data={orders}
  columns={columns}
  persist={{ state: ['columnPinning', 'columnVisibility', 'columnSizing'], storage: 'session' }}
/>
```

- The record is stored as JSON under `sui-data-table:<name>`, with a `version` for future
  migrations (the type is exported as `PersistedLayout`). Columns that no longer exist are dropped
  on load, a column added since keeps its own default, a column is never pinned to both sides, and
  a record that cannot be read — not JSON, an unknown version, the wrong shape — is ignored and
  overwritten by the next change.
- A slice the application controls (`columnPinning`, `columnVisibility`, `columnSizing`) is never
  read from or written to storage, and a slice whose feature is switched off is not restored.
- The injected selection and actions columns always follow the current `features.pinning`
  configuration, whatever was stored.
- A server-rendered table cannot know what the browser saved: it renders its defaults and switches
  to the stored layout right after hydration. Store the layout yourself (for example in a cookie)
  and control the slice if that one-frame change matters.
- Storage that is missing, full, blocked or unreadable is ignored; the table works from its
  defaults and simply forgets. Persistence is an enhancement, never a dependency.
- Layouts saved by 2.1 (one entry per slice, and tables without an `id` named by their column ids
  in full) are imported into the record on first load and the old entries removed.

## Responsive layout

**Scroll** (`responsiveMode="scroll"`, default): the grid keeps its columns and scrolls sideways.

**Cards** (`responsiveMode="cards"`): below a 768 px viewport each row becomes a stacked card,
with the column name printed in each cell. `responsiveMode="auto"` does the same based on the
table's own container width (a CSS container query) rather than the viewport. On cards:

- The header row is hidden, so the table renders a "Sort by" select, a direction button and, in
  multiple selection, "Select all".
- `meta.hideInCards` removes a column, `meta.hideLabelInCards` hides its visible label, and
  `meta.responsive.priority` orders cells (lower first; the rest follow in column order).
- Footer totals become a card of their own, labelled with their column names.

**Responsive columns.** `meta.responsive.hideBelow` hides a column below a breakpoint and
`hideAbove` at or above one (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 px). This is a
default, not a rule: the user can turn the column back on from the picker and it then stays on at
every width. Responsive defaults are not written into the `columnVisibility` state you receive.
CSS classes apply the same hiding on the server render and first paint.

## Loading, error and empty states

The body shows exactly one of: the error state, the first-load skeleton, the empty state, or rows.
Error wins over loading.

| State   | When | Default | Replace with |
| ------- | ---- | ------- | ------------ |
| Loading | `loading` and no rows | `loadingRowCount` skeleton rows (default: page size, at most 8), hidden from screen readers | `loadingState` / `slots.loadingState`, `components.LoadingState` |
| Refetch | `loading` and rows present | Existing rows stay, dimmed (`data-refetching` on `<tbody>`) | CSS |
| Error   | `error` is truthy | "Could not load data", the message of an `Error` or a string (otherwise a generic sentence), "Try again" when `onRetry` is set; `role="alert"` | `errorState` / `slots.errorState`, `components.ErrorState` |
| Empty   | no rows | "No results". When filters or search are active, it says so and offers "Clear filters" | `emptyState` / `slots.emptyState`, `components.EmptyState` |

While `loading`, the `<table>` has `aria-busy="true"` and the root `data-loading`. The toolbar,
pagination and footer stay in place; the footer is hidden while there are no rows.

A custom state component receives `DataTableEmptyStateProps` (`table`, `isFiltered`,
`clearFilters`, `colSpan`), `DataTableLoadingStateProps` (`table`, `columnCount`, `rowCount`,
`colSpan`) or `DataTableErrorStateProps` (`table`, `error`, `retry?`, `colSpan`), and must render table rows
(`<tr><td colSpan={colSpan}>…</td></tr>`), because it is placed inside `<tbody>`. Slot content is
wrapped in such a row for you.

Only an omitted slot (`undefined`) falls back to the default content. `emptyState={null}` or
`errorState=""` renders the state row with nothing in it, for tables that show their own message
elsewhere.

```tsx
<DataTable
  data={orders}
  columns={columns}
  loading={isFetching}
  error={fetchError}
  onRetry={refetch}
  emptyState={<p>No orders yet. New orders appear here as soon as they are placed.</p>}
/>
```

## Customisation

### Replacing parts: `components`

Every structural part can be replaced. Anything left out keeps its default, and every default is
exported so an override can wrap it.

| Key            | Props type                     | Default export          | Renders |
| -------------- | ------------------------------ | ----------------------- | ------- |
| `Root`         | `RootProps`                    | `DataTableRoot`         | Outer `<div>` (`rootProps`) |
| `Container`    | `ContainerProps`               | `DataTableContainer`    | Scroll container (`containerProps`, includes a `ref`) |
| `Table`        | `DataTableTableProps`          | `DataTableTable`        | `<table>` (`tableProps`) |
| `Header`       | `HeaderProps`                  | `DataTableHeader`       | `<thead>` (`headerProps`) |
| `HeaderRow`    | `HeaderRowProps`               | `DataTableHeaderRow`    | Header `<tr>` (`rowProps`, `headerGroup`) |
| `HeaderCell`   | `HeaderCellProps`              | `DataTableHeaderCell`   | `<th>`, sort button, column menu, resize grip |
| `Body`         | `BodyProps`                    | `DataTableBody`         | `<tbody>` (`bodyProps`, `rows`) |
| `Row`          | `RowProps`                     | `DataTableRow`          | Body `<tr>` (`rowProps`) |
| `Cell`         | `CellProps`                    | `DataTableCell`         | Body `<td>` (`cellProps`) |
| `ExpandedRow`  | `ExpandedRowProps`             | `DataTableExpandedRow`  | Detail `<tr>` (`rowProps`, `colSpan`) |
| `Footer`       | `FooterProps`                  | `DataTableFooter`       | `<tfoot>` (`footerProps`); footer rows inside are not replaceable |
| `Heading`      | `HeadingProps`                 | `DataTableHeading`      | Title block |
| `Toolbar`      | `ToolbarProps`                 | `DefaultToolbar`        | Toolbar |
| `Search`       | `SearchProps`                  | `DefaultSearch`         | Search box |
| `Filters`      | `FiltersProps`                 | `DefaultFilters`        | Panel or inline filters |
| `ClearFilters` | `ClearFiltersProps`            | `DefaultClearFilters`   | "Clear filters" button |
| `SelectionBar` | `SelectionBarProps`            | `DefaultSelectionBar`   | "N selected" bar (`selectedCount`, `clearSelection`, `actions` from `slots.selectionActions`) |
| `ViewOptions`  | `ViewOptionsProps`             | `DefaultViewOptions`    | Column picker |
| `Pagination`   | `DataTablePaginationProps`     | `DefaultPagination`     | Pagination bar |
| `EmptyState`   | `DataTableEmptyStateProps`     | `DataTableEmptyState`   | Empty row |
| `LoadingState` | `DataTableLoadingStateProps`   | `DataTableLoadingState` | Skeleton rows |
| `ErrorState`   | `DataTableErrorStateProps`     | `DataTableErrorState`   | Error row |

All props types take the row type (`RowProps<Order>`) and include `table`.

**Prop bags.** Each part receives a prop bag — `rootProps`, `containerProps`, `tableProps`,
`headerProps`, `rowProps`, `cellProps`, `bodyProps`, `footerProps`, `headingProps` — that already
holds the roles, ARIA attributes, data attributes, styles, `ref`s and event handlers the table
needs. A replacement spreads it and renders `children`:

```tsx
'use client'
import { cn, DataTable, type DataTableComponents, type RowProps } from '@shining-technologies/ui'

function OrderRow({ row, rowProps, children }: RowProps<Order>) {
  return (
    <tr
      {...rowProps}
      className={cn(rowProps.className, row.original.total > 1000 && 'is-large-order')}
    >
      {children}
    </tr>
  )
}

const components: DataTableComponents<Order> = { Row: OrderRow }
```

Spreading `rowProps` is what keeps selection, keyboard navigation (`data-sui-row`, `tabIndex`,
`onKeyDown`), `aria-selected` and `aria-rowindex` working. A custom `Container` must forward
`containerProps` including its `ref` and `data-sui-scroll`, or pinned-column shadows and
virtualization stop working. `HeaderCellProps` also carries `sortDirection`, `sortIndex`,
`canSort`, `canResize` and `isPinned`; `RowProps` carries `rowIndex`, `isSelected`, `isExpanded`
and `isDisabled`. A custom `HeaderCell` gets the default drag, keyboard and double-click resizing
by rendering `<DataTableColumnResizer header={header} table={table} label="Name" />` inside its
`<th>` when `canResize` is true.

A custom `Cell` receives the rendered content as `children`. To render it yourself, call
`renderCellContent(cell)`:

```tsx
function OrderCell({ cell, cellProps }: CellProps<Order>) {
  return <td {...cellProps}>{renderCellContent(cell)}</td>
}
```

### Slots

`slots` injects content without replacing a part. Each slot takes a node or a function
`({ table }) => ReactNode`, and renders inside the table's context.

| Slot             | Placement |
| ---------------- | --------- |
| `toolbar`        | Replaces the whole toolbar. |
| `toolbarActions` | Appended to the toolbar's right-hand cluster, before the column picker. |
| `beforeTable`    | After the heading, before the toolbar. |
| `afterTable`     | After the pagination bar. |
| `emptyState`     | Content of the empty state. |
| `loadingState`   | Content shown instead of skeleton rows. |
| `errorState`     | Content of the error state. |
| `pagination`     | Replaces the pagination bar. |
| `selectionActions` | Bulk actions in the selection bar, shown while rows are selected. See [Bulk actions](#bulk-actions). |
| `rowActions`     | Same as the `rowActions` prop, which wins if both are set. |

```tsx
<DataTable
  data={orders}
  columns={columns}
  slots={{
    toolbarActions: ({ table }) => (
      <Button onClick={() => downloadTableCsv(table, { filename: 'orders.csv' })}>Export CSV</Button>
    ),
  }}
/>
```

### Class names and data attributes

`classNames` covers parts without a dedicated prop:

| Key           | Element |
| ------------- | ------- |
| `container`   | Scroll container |
| `heading`     | Heading block |
| `toolbar`     | Toolbar |
| `headerRow`   | Each header `<tr>` |
| `headerCell`  | Each `<th>` |
| `footer`      | `<tfoot>` |
| `pagination`  | Default pagination bar |
| `expandedRow` | Each detail row |

For CSS, the root carries `data-density`, `data-variant`, `data-responsive`, `data-surface`,
`data-layout`, `data-filter-layout` and `data-loading`. Body rows carry `data-row-id`,
`data-index`, `data-state="selected"`, `data-expanded` and `data-disabled`; cells and headers
carry `data-column-id` and `data-pinned`; sorted headers `data-sorted`. The scroll container
carries `data-overflow-start`, `data-overflow-end` and `data-scrolled`. Colours, radii and
spacing are `--sui-*` tokens; see [Theming](./theming.md).

### `useDataTable()`

Inside any part, slot or cell, `useDataTable<TData>()` returns the table's context. It throws
outside `<DataTable />` or `<DataTableProvider />`; `useOptionalDataTable()` returns `null`
instead.

```tsx
'use client'
import { Button, useDataTable } from '@shining-technologies/ui'

function ShipSelected() {
  const { table } = useDataTable<Order>()
  const rows = table.getSelectedRowModel().rows
  return (
    <Button disabled={rows.length === 0} onClick={() => ship(rows.map((row) => row.original))}>
      Ship {rows.length}
    </Button>
  )
}
```

`DataTableContextValue<TData>` contains:

| Group      | Fields |
| ---------- | ------ |
| Engine     | `table`, `features` (resolved, every default filled in), `components` (resolved), `slots` |
| Filtering  | `filterConfigs` (`Map<id, ColumnFilterConfig>`), `columnLabels` (`Map<id, string>`), `isFiltered`, `clearFilters()` |
| Status     | `loading`, `error`, `retry`, `loadingRowCount` |
| Appearance | `density`, `variant`, `responsiveMode`, `surface`, `tableLayout`, `filterLayout`, `stickyHeader`, `stickyFooter`, `showToolbarCount`, `hasFooter` |
| Styling    | `classNames`, `tableClassName`, `headerClassName`, `bodyClassName`, `rowClassName`, `cellClassName` |
| Rows       | `onRowClick`, `onRowDoubleClick`, `isRowDisabled`, `renderExpandedRow`, `navigation`, `rowIndex` |
| Locale     | `tableId`, `locale`, `timeZone`, `numberFormat` (a shared `Intl.NumberFormat`) |

`useTableComponents()` returns just the resolved component map.

### Composing the toolbar

The connected parts render whatever is registered in `components`, so overrides still apply. Pass
children to `DataTableToolbar` to lay it out yourself:

```tsx
'use client'
import {
  DataTable,
  DataTableActions,
  DataTableFilters,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
} from '@shining-technologies/ui'

<DataTable
  data={orders}
  columns={columns}
  slots={{
    toolbar: (
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilters />
        <DataTableActions>
          <ShipSelected />
        </DataTableActions>
        <DataTableViewOptions />
      </DataTableToolbar>
    ),
  }}
/>
```

`DataTableToolbar`, `DataTableSearch`, `DataTableFilters`, `DataTableViewOptions` and
`DataTablePagination` take an optional `table` (defaulting to the context's).
`DataTableActions` is a labelled group for your own buttons. A toolbar with children does not
render the active filter chips; add `<ActiveFilters table={table} />` if you need them.

## Keyboard and accessibility

Rows take part in keyboard navigation when the table has `onRowClick`, selection or expansion.
Exactly one row is in the tab order (a roving tab stop); disabled rows are skipped.

| Key                     | On a focused row |
| ----------------------- | ---------------- |
| ArrowDown / ArrowUp     | Next / previous row |
| Home / End              | First / last row on the page |
| Enter                   | `onRowClick` |
| Space                   | Toggle selection |
| ArrowRight / ArrowLeft  | Expand / collapse |

Keys pressed inside a control in the row (a checkbox, link, menu) are left to that control.
Header sort buttons, column menus, resize grips, filters and pagination are ordinary focusable
controls.

Semantics the table provides:

- Explicit roles on every element (`table`, `rowgroup`, `row`, `columnheader`, `cell`), so the
  card layout keeps table semantics after restyling.
- An accessible name: `aria-labelledby` (yours, else the caption, else the title when `label` is
  not set) takes precedence over `aria-label` (yours, else `label`). Give every table one of these.
- `aria-sort` on sortable headers only; `scope="col"` or `scope="colgroup"`.
- `aria-rowcount` on the table and `aria-rowindex` on every rendered row, counting header, detail
  and footer rows and offset by the current page. In server pagination without `rowCount` the
  count is `-1` (unknown).
- `aria-selected` on rows when selection is enabled, `aria-disabled` on disabled rows,
  `aria-busy` on the table while loading.
- Checkboxes named "Select row N" (N is the position on screen) and "Select all rows on this page".
- Expander buttons with `aria-expanded` and `aria-controls` pointing at the detail row.
- Live regions for the page number, the number of applied filters (panel layout) and the selection count; the
  error state is `role="alert"`.
- On cards, each cell includes its column name as text.

See [Accessibility](./accessibility.md) for the library-wide guidance.

## Virtualization

For thousands of rows without pagination, use `@shining-technologies/ui/virtualized`. It needs the
optional peer dependency `@tanstack/react-virtual` (`^3.11.0`):

```bash
npm install @tanstack/react-virtual
```

```tsx
'use client'
import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'

<VirtualizedDataTable
  data={hundredThousandOrders}
  columns={columns}
  getRowId={(o) => o.id}
  maxHeight="70vh"
  label="Orders"
/>
```

- `VirtualizedDataTable` takes the same `DataTableProps`. It sets
  `features.virtualization.enabled: true`, registers `VirtualizedBody` as `components.Body` (an
  explicit `components.Body` still wins) and turns pagination off.
- A bounded height (`maxHeight`) is required: the scroll container is what the virtualizer
  measures.
- Options you pass in `features.pagination` are merged over `{ enabled: false }`: pagination stays
  off unless you set `enabled: true`.
- `features.virtualization.estimateRowHeight` (default `48`) is only the initial estimate; rendered
  rows are measured. `overscan` (default `8`) is the number of extra rows rendered above and below
  the window.
- Only rendered rows are in the DOM; spacer rows keep the scroll height. `aria-rowcount` and
  `aria-rowindex` still describe the whole table, and the tab stop moves to a rendered row when the
  focused one scrolls away.
- On a plain `DataTable` with the default body, `features.virtualization.enabled` is ignored and
  a development-only console warning points to this entry point. Use `VirtualizedDataTable`, or
  pass `VirtualizedBody` as `components.Body`.
- A custom `Container` must spread `containerProps` (which carries `data-sui-scroll`).
- The entry point also exports `VirtualizedBody` and re-exports `useVirtualizer`.

## CSV export

```ts
import { downloadTableCsv } from '@shining-technologies/ui/csv'

downloadTableCsv(table, { filename: 'orders.csv', rows: 'all' })
```

`table` is the live instance from `useDataTable()` or a slot function. Exports use column labels
(`meta.label`, else a string `header`, else the id) and skip the injected `sui-` columns.

| Option             | Default         | Description |
| ------------------ | --------------- | ----------- |
| `rows`             | `'all'`         | `'all'` (every row after filtering and sorting, ignoring pagination), `'page'` (what is on screen) or `'selected'`. |
| `data`             | —               | Rows to export instead of the table's, through the table's columns. |
| `columnIds`        | visible columns | Columns to export, in order. |
| `formatValue`      | —               | `(value, columnId, row) => string`. |
| `delimiter`        | `','`           | `'\t'` for TSV. |
| `includeHeader`    | `true`          | |
| `sanitizeFormulas` | `true`          | Prefixes values a spreadsheet would run as a formula with `'`. |
| `bom`              | `true`          | UTF-8 byte-order mark for Excel. |
| `filename`         | `'export.csv'`  | `downloadTableCsv` only. |

`tableToCsv` returns the text and `csvToBlob` wraps it; both run on a server. `downloadTableCsv`
does nothing outside a browser. `escapeCsvField(value, delimiter, sanitize)` quotes one field.

In server mode the table only holds the current page; pass the full result as `data`. The full
reference is in [api/csv.md](./api/csv.md).

## Time zones and locale

| Prop       | Default           | Affects                                                                     |
| ---------- | ----------------- | --------------------------------------------------------------------------- |
| `timeZone` | the runtime's zone | which calendar day a timestamp belongs to in `date` filters; default date cells and `CellDate` |
| `locale`   | `'en-US'`         | row counts, default date cells, `CellDate`, `CellNumber`, filter summaries, text sort order |

`CellDate` and `CellNumber` inside a table follow these props unless you pass their own. A
`yyyy-mm-dd` value in `CellDate` is a calendar day and shows that day in every zone.

`locale` defaults to `'en-US'` rather than the runtime's locale on purpose: a server and a browser
rarely agree on it, and server-rendered HTML would then fail to hydrate.

Set both whenever a table is server-rendered or its query is answered on a server. A timestamp at
20:00 UTC on 5 March is 6 March in Sydney; without an explicit zone, a server in UTC and a browser
in Sydney return different rows for "on 6 March".

`date` filter semantics:

- A `yyyy-mm-dd` value is a calendar day in every zone.
- A `Date`, epoch number or ISO timestamp is placed in `timeZone`. Store timestamps with an offset
  or in UTC; an offset-less `2024-03-05T09:00` is read in the runtime's own zone.
- `on`, `before`, `after` and inclusive `between` compare calendar days, so they are exact on
  daylight-saving days.

## Performance

- **Keep `columns` stable.** The table rebuilds its column model whenever the `columns` array, the
  `locale` or the `timeZone` changes identity. Define columns at module scope, or with `useMemo`
  when they depend on props.
- **Keep `data` stable.** In client pagination a new `data` array returns to page 1 (unless
  `keepPageOnDataChange`) and recomputes the row models. Do not build `data` inline with `map` or
  `filter` on every render.
- **Keep callbacks that create columns stable.** `rowActions` and `renderExpandedRow` are
  dependencies of the injected columns; wrap them in `useCallback` when the component re-renders
  often.
- **Keep `components` and `slots` stable.** They are memoised by identity; define override objects
  at module scope.
- **Memoise expensive cells.** A `React.memo` cell component whose props did not change is not
  re-rendered when another row is selected.
- **Only the current page renders.** For long unpaginated lists use
  [Virtualization](#virtualization).
- Column widths and pinned offsets are published as CSS variables on the `<table>`. A resize drag
  rewrites those variables directly and renders nothing until the grip is let go.
- The table instance stays the same across parent re-renders.

## Other exports

For custom layouts and engine-level work, the package also exports:

| Export | Purpose |
| ------ | ------- |
| `DataTableProvider`, `useOptionalDataTable`, `useTableComponents` | Context for hand-built layouts. |
| `DEFAULT_COMPONENTS`, `resolveComponents(overrides)` | The default part map, and the merge the table applies. |
| `FilterPanel`, `InlineFilters`, `ActiveFilters`, `SortIndicator`, `ColumnMenu`, `DataTableColumnResizer` | Individual toolbar and header pieces. |
| `useColumnFilter(column, config)` | Read and write one column's filter (`filter`, `operators`, `arity`, `isActive`, `setOperator`, `setValue`, `setRangeValue`, `clear`). |
| `filterableColumns(table, configs)` | The columns a filter UI should offer. |
| `isRowActionSpecs`, `renderRowActions` | The logic behind the `rowActions` array form. |
| `useTableInstance(props)`, `resolveFeatures`, `adaptColumns`, `getEmptyLastSortedRowModel` | The engine the component is built on. |
| `renderSlot(content, table)`, `DEFAULT_TABLE_LOCALE` | Helpers. |
| `Row`, `Column`, `Cell`, `Header`, `TableInstance` | TanStack Table types used in callback signatures. |
| `ColumnHelper<TData>` | The return type of `createColumnHelper<TData>()`. |
| `ColumnFilterHandle` | What `useColumnFilter` returns. |
| `FilterableColumn<TData>` | `{ column, config }`, an item of `filterableColumns(table, configs)`. |
| `RowClassName<TData>`, `CellClassName<TData>` | `string`, or a function of the `Row` / `Cell` returning a class name: the types of `rowClassName` and `cellClassName`. |
| `SlotContent<TData>` | `ReactNode`, or `({ table }) => ReactNode`: the type of every slot. |
| `RowActivationEvent` | The mouse or keyboard event passed to `onRowClick`. |
| `DataTablePersistOptions`, `PersistedTableState` | The object form of `persist`, and the slices it can remember. |
| `DataTableProps<TData>`, `DataTableEmptyStateProps`, `DataTableLoadingStateProps`, `DataTableErrorStateProps` | Props of the table and of its state components. |

## Related pages

- [Getting started](./getting-started.md)
- [Next.js guide](./nextjs.md)
- [Theming](./theming.md)
- [Accessibility](./accessibility.md)
- [Troubleshooting](./troubleshooting.md)
- [api/core.md](./api/core.md) — `applyQuery`, URL helpers, selection helpers, filter and sort functions
- [api/csv.md](./api/csv.md)
- [components/table.md](./components/table.md) — the static `Table` primitives

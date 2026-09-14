# API reference: `@shining-technologies/ui/csv`

CSV and TSV export for data tables. It is a separate entry point because most tables never export
anything, and it has no runtime dependencies.

```ts
import { downloadTableCsv } from '@shining-technologies/ui/csv'
```

The export functions take a TanStack Table instance (`Table<TData>` from `@tanstack/react-table`,
re-exported from the root entry as `TableInstance`). They read the engine's row models, so they
export what the user filtered and sorted without depending on any UI component.

For how export fits into a table, see [Data table](../data-table.md#csv-export).

## Contents

- [Where each function runs](#where-each-function-runs)
- [Getting the table instance](#getting-the-table-instance)
- [`CsvOptions`](#csvoptions)
- [`tableToCsv`](#tabletocsv)
- [`downloadTableCsv`](#downloadtablecsv)
- [`csvToBlob`](#csvtoblob)
- [`escapeCsvField`](#escapecsvfield)
- [TSV](#tsv)
- [Server-mode tables](#server-mode-tables)
- [Formula injection](#formula-injection)
- [Export index](#export-index)

---

## Where each function runs

| Export | Runs on | Notes |
| --- | --- | --- |
| `tableToCsv` | server and browser | Pure. Needs a TanStack `Table` instance. |
| `escapeCsvField` | server and browser | Pure string function; the building block for exports that do not use a table. |
| `csvToBlob` | server and browser | Needs a global `Blob` (browsers, Node 18 and later, edge runtimes). |
| `downloadTableCsv` | browser only | Defined in a `'use client'` module. Call it from a Client Component, typically in an event handler. Outside a browser it does nothing. |

---

## Getting the table instance

`DataTable` passes the instance to slot render functions, and `useDataTable().table` gives it to
any component rendered within the table.

```tsx
'use client'

import { Button, DataTable, type ColumnDef } from '@shining-technologies/ui'
import { downloadTableCsv } from '@shining-technologies/ui/csv'

interface Order {
  id: string
  customer: string
  total: number
  createdAt: string
}

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'createdAt', header: 'Created' },
]

export function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      data={orders}
      columns={columns}
      getRowId={(order) => order.id}
      slots={{
        toolbarActions: ({ table }) => (
          <Button onClick={() => downloadTableCsv(table, { filename: 'orders.csv' })}>Export CSV</Button>
        ),
      }}
    />
  )
}
```

---

## `CsvOptions`

```ts
interface CsvOptions<TData>
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `'all' \| 'page' \| 'selected'` | `'all'` | Which rows to export. See below. |
| `data` | `readonly TData[]` | none | Rows to export instead of the rows the table holds. See [Server-mode tables](#server-mode-tables). |
| `columnIds` | `readonly string[]` | visible data columns | Export only these column ids, in this order. |
| `includeHeader` | `boolean` | `true` | Write a header row. |
| `delimiter` | `string` | `','` | Field separator. Use `'\t'` for TSV. |
| `formatValue` | `(value: unknown, columnId: string, row: TData) => string` | built-in | Convert one cell to text. |
| `sanitizeFormulas` | `boolean` | `true` | Neutralise values a spreadsheet would run as a formula. See [Formula injection](#formula-injection). |
| `bom` | `boolean` | `true` | Prepend a UTF-8 byte order mark so Excel detects the encoding. Used by `downloadTableCsv` only; `tableToCsv` ignores it. |

### `rows`

| Value | Without `data` | With `data` |
| --- | --- | --- |
| `'all'` | Every row after filtering and sorting, ignoring pagination (the table's pre-pagination row model). | Every entry of `data`, in the order given. |
| `'page'` | The rows on the current page (the table's row model). | Same; `data` is ignored. |
| `'selected'` | The selected rows (the table's selected row model). TanStack builds this from the core row model, so it includes selected rows that the current filter hides, in data order rather than sorted order. | The entries of `data` whose row id is selected in the table's `rowSelection` state, including selections made on pages that are no longer loaded. |

The valid values are exactly those three; there is no `'filtered'` value (`'all'` already exports
the filtered rows).

### `columnIds`

When omitted, the table's visible leaf columns are exported in display order, except the built-in
structural columns (ids starting with `sui-`, such as the selection checkbox and row actions).
When given, the ids are used as is: hidden columns can be exported, and nothing is filtered out.
An id that is not a column produces empty cells, and its header is the id itself.

### Header labels

For each column: `meta.label` if set, otherwise the column's `header` when it is a string,
otherwise the column id. Headers go through the same escaping and formula sanitisation as values.

### `formatValue`

Receives the cell's accessor value (not the rendered cell), the column id and the original row.
Without it, values are converted as follows:

| Value | Text |
| --- | --- |
| `null`, `undefined` | empty |
| `Date` | `toISOString()` (UTC). An invalid `Date` throws `RangeError`. |
| other objects and arrays | `JSON.stringify` |
| anything else | `String(value)` |

The returned string is still escaped and sanitised.

---

## `tableToCsv`

```ts
function tableToCsv<TData>(table: Table<TData>, options?: CsvOptions<TData>): string
```

Serialises a table to CSV text.

- Lines are separated by `\r\n` (RFC 4180). There is no line break after the last row.
- No byte order mark is added, whatever `bom` is set to.
- Each field is passed through [`escapeCsvField`](#escapecsvfield) with the chosen delimiter and
  `sanitizeFormulas`.
- With `rows: 'selected'` and nothing selected, only the header row is returned (or an empty
  string when `includeHeader` is `false`).

```ts
import type { TableInstance } from '@shining-technologies/ui'
import { csvToBlob, tableToCsv } from '@shining-technologies/ui/csv'

async function uploadPage<TData>(table: TableInstance<TData>): Promise<void> {
  const csv = tableToCsv(table, { rows: 'page' })
  await fetch('/api/uploads', { method: 'POST', body: csvToBlob(csv) })
}
```

---

## `downloadTableCsv`

```ts
interface DownloadOptions<TData> extends CsvOptions<TData> {
  filename?: string
}

function downloadTableCsv<TData>(table: Table<TData>, options?: DownloadOptions<TData>): void
```

Serialises the table with `tableToCsv` and saves the result as a file in the browser.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filename` | `string` | `'export.csv'` | Name of the downloaded file. |
| `bom` | `boolean` | `true` | Prepend a UTF-8 byte order mark. |
| all other `CsvOptions` | | | Passed to `tableToCsv`. |

Behaviour:

- Returns immediately, without an error, when `document` is undefined or `URL.createObjectURL` is
  not available (a server, a worker, some test environments).
- Creates the file with `csvToBlob`, clicks a hidden `<a download>` element appended to
  `document.body`, removes it, and revokes the object URL on the next tick.
- Must run in response to a user action in browsers that block programmatic downloads otherwise.

---

## `csvToBlob`

```ts
function csvToBlob(csv: string, bom?: boolean): Blob
```

Wraps text in a `Blob` of type `text/csv;charset=utf-8;`. `bom` defaults to `true` and prepends
U+FEFF. The MIME type is the same when the text is TSV.

---

## `escapeCsvField`

```ts
function escapeCsvField(value: string, delimiter: string, sanitize: boolean): string
```

Prepares one field. All three parameters are required.

1. When `sanitize` is `true`, applies [formula sanitisation](#formula-injection).
2. When the result contains `delimiter`, a double quote, a carriage return or a line feed, it is
   wrapped in double quotes and each inner `"` is doubled.

```ts
import { escapeCsvField } from '@shining-technologies/ui/csv'

escapeCsvField('Smith, John', ',', true) // '"Smith, John"'
escapeCsvField('say "hi"', ',', true) // '"say ""hi"""'
escapeCsvField('=SUM(A1:A9)', ',', true) // "'=SUM(A1:A9)"
escapeCsvField('-42', ',', true) // '-42'
```

It is also the building block for exports that do not have a table instance, such as a route
handler:

```ts
// app/api/orders/export/route.ts
import { escapeCsvField } from '@shining-technologies/ui/csv'

interface Order {
  customer: string
  total: number
  createdAt: string
}

declare function getOrders(): Promise<Order[]>

const line = (fields: string[]) => fields.map((field) => escapeCsvField(field, ',', true)).join(',')

export async function GET(): Promise<Response> {
  const orders = await getOrders()
  const lines = [
    line(['Customer', 'Total', 'Created']),
    ...orders.map((order) => line([order.customer, String(order.total), order.createdAt])),
  ]
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders.csv"',
    },
  })
}
```

---

## TSV

There is no separate TSV function. Pass `delimiter: '\t'` and a `.tsv` file name:

```ts
import type { TableInstance } from '@shining-technologies/ui'
import { downloadTableCsv } from '@shining-technologies/ui/csv'

interface Order {
  id: string
  customer: string
  total: number
}

function exportSelectedAsTsv(table: TableInstance<Order>): void {
  downloadTableCsv(table, {
    filename: 'orders.tsv',
    delimiter: '\t',
    rows: 'selected',
    columnIds: ['customer', 'total'],
    formatValue: (value, columnId) =>
      columnId === 'total' && typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
  })
}
```

Fields containing a tab, quote or line break are quoted. The blob's MIME type stays `text/csv`.

---

## Server-mode tables

In server mode the table holds only the current page. Without `data`, `rows: 'all'` exports that
page and `rows: 'selected'` exports the selected rows on it.

To export more, fetch the rows yourself and pass them as `data`. They are serialised through the
table's own columns: the same header labels, accessors and `formatValue`.

- Values are read with each column's accessor. `DataTable` compiles `accessorKey`, `accessorPath`
  and `accessorFn` into an accessor, so all three work. Columns without an accessor export empty
  cells.
- `rows: 'selected'` matches entries by row id: the table's `getRowId(row, index)` when it has one,
  otherwise the entry's index in `data` as a string. Server-mode tables should set `getRowId`,
  since index-based ids from different pages collide.

```ts
import type { TableInstance } from '@shining-technologies/ui'
import { downloadTableCsv } from '@shining-technologies/ui/csv'

interface Order {
  id: string
  customer: string
  total: number
}

async function exportAllOrders(table: TableInstance<Order>): Promise<void> {
  const response = await fetch('/api/orders?all=1')
  const orders = (await response.json()) as Order[]
  downloadTableCsv(table, { filename: 'orders.csv', data: orders })
}
```

---

## Formula injection

Spreadsheet applications run a cell that starts with `=`, `+`, `-` or `@` as a formula, which an
attacker can use to exfiltrate data or run commands through a crafted value. With
`sanitizeFormulas` (the default), a field that starts with `=`, `+`, `-`, `@`, a tab or a carriage
return is prefixed with a single quote, which spreadsheets display as text.

A field that is a plain decimal number (optional sign, digits, optional decimal point and exponent,
for example `-42`, `+1.5e3`, `.5`) is left unchanged, so negative amounts stay numeric.

Sanitisation applies to every header and value, whether it comes from `formatValue` or the
built-in conversion. It changes the text in the
file: a value such as `-abc` is exported as `'-abc`. Set `sanitizeFormulas: false` only when the
file will never be opened in a spreadsheet application.

---

## Export index

| Export | Kind |
| --- | --- |
| [`tableToCsv`](#tabletocsv) | function |
| [`downloadTableCsv`](#downloadtablecsv) | function (client only) |
| [`csvToBlob`](#csvtoblob) | function |
| [`escapeCsvField`](#escapecsvfield) | function |
| [`CsvOptions`](#csvoptions) | type |
| [`DownloadOptions`](#downloadtablecsv) | type |

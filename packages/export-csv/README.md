# @shining-technologies/ui-kit-export-csv

[![npm](https://img.shields.io/npm/v/@shining-technologies/ui-kit-export-csv.svg)](https://www.npmjs.com/package/@shining-technologies/ui-kit-export-csv)
[![license](https://img.shields.io/npm/l/@shining-technologies/ui-kit-export-csv.svg)](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/LICENSE)

CSV and TSV export for the
[Shining UI Kit](https://www.npmjs.com/package/@shining-technologies/ui-kit-react) data table, or for any
TanStack Table instance.

It lives in its own package on purpose: most tables never export anything, and the main package
should not carry code they will not run. It has **no runtime dependencies**, and it is under 2 kB.

## Install

```bash
npm install @shining-technologies/ui-kit-export-csv
```

`@tanstack/table-core@^8` is a peer dependency. You already have it if you use
`@shining-technologies/ui-kit-react`.

## Use

Add an export button to a `DataTable`'s toolbar. The `toolbarActions` slot is handed the table
instance:

```tsx
import { downloadTableCsv } from '@shining-technologies/ui-kit-export-csv'
import { Button, DataTable } from '@shining-technologies/ui-kit-react'

;<DataTable
  data={users}
  columns={columns}
  slots={{
    toolbarActions: ({ table }) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}
      >
        Export CSV
      </Button>
    ),
  }}
/>
```

What you get is what the user sees: the current sort and filters, the visible columns in their
current order, and each column's `header` text as the heading row.

Anything that holds a TanStack `Table` works the same way. That includes `useTableInstance`,
`useDataTable()` inside a custom part, or a table you built with `@tanstack/react-table`
directly.

## API

| Export             | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `downloadTableCsv` | Serialise and trigger a browser download                      |
| `tableToCsv`       | Serialise to a string, for tests or for uploading somewhere   |
| `csvToBlob`        | Wrap a string in a `Blob`, with the UTF-8 BOM Excel expects   |
| `escapeCsvField`   | The quoting rule, exposed for callers building their own rows |

Options:

| Option             | Default         | Does                                                           |
| ------------------ | --------------- | -------------------------------------------------------------- |
| `filename`         | `'export.csv'`  | The downloaded file's name (`downloadTableCsv` only)           |
| `delimiter`        | `','`           | `'\t'` gives you TSV                                           |
| `includeHeader`    | `true`          | Write the heading row                                          |
| `rows`             | `'all'`         | `'all'` (filtered and sorted), `'page'` or `'selected'`        |
| `data`             | —               | `readonly TData[]` to export instead of the table's rows       |
| `columnIds`        | visible columns | `readonly string[]` of column ids to include, in this order    |
| `formatValue`      | —               | `(value, columnId, row) => string`, for dates, money and enums |
| `sanitizeFormulas` | `true`          | Neutralise values a spreadsheet would execute (see below)      |
| `bom`              | `true`          | Prepend a UTF-8 byte-order mark so Excel detects the encoding  |

`downloadTableCsv` does nothing outside a browser, so it is safe to reference from code that
also renders on a server.

### Rows are the rows the table holds, unless you pass `data`

Without `data`, `'all'` and `'selected'` mean every row **loaded** into the table. In server
mode that is the current page, and a selection made on other pages is not included.

To export beyond it, fetch the full result and pass it as `data`. The entries are serialised
through the table's own columns: the same header labels, accessors and `formatValue`, in the
order given.

```ts
downloadTableCsv(table, { data: allRows, filename: 'users.csv' })
```

- `rows: 'all'` (the default) exports every entry.
- `rows: 'selected'` exports the entries whose id is in the table's `rowSelection`, including
  selections made on pages that are no longer loaded. The id comes from the table's
  `getRowId` or, without one, from the entry's index in `data`.
- `rows: 'page'` ignores `data`: it is always what is on screen.

## Formula injection is handled

A cell that starts with `=`, `+`, `-` or `@` can run as a formula when the file is opened in
Excel or Sheets. Such values are prefixed with a single quote so they are read as text. Plain
numbers are left alone: `-42` and `+7` stay numeric, while `-2+3` and `=HYPERLINK(…)` are
neutralised. This is on by default. `sanitizeFormulas: false` turns it off if you trust what you
are exporting.

## License

MIT © Shining Technologies

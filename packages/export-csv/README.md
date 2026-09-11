# @shining-ui-kit/export-csv

[![npm](https://img.shields.io/npm/v/@shining-ui-kit/export-csv.svg)](https://www.npmjs.com/package/@shining-ui-kit/export-csv)
[![license](https://img.shields.io/npm/l/@shining-ui-kit/export-csv.svg)](../../LICENSE)

CSV and TSV export for the
[Shining UI Kit](https://github.com/ikramulSoHeL/shining-ui-kit-pro) data table — or for any
TanStack table instance.

It lives in its own package on purpose: most tables never export anything, and the main
package should not carry code they will not run. It has **no runtime dependencies**.

## Install

```bash
pnpm add @shining-ui-kit/export-csv
```

`@tanstack/table-core` is a peer dependency; you already have it if you use the kit's table.

## Use

```tsx
import { downloadTableCsv } from '@shining-ui-kit/export-csv'
import { Button, DataTable, useTableInstance } from '@shining-ui-kit/react'

const { table } = useTableInstance({ data, columns })

<Button onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}>Export</Button>
```

## API

| Export             | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `downloadTableCsv` | Serialise and trigger a browser download                      |
| `tableToCsv`       | Serialise to a string — for tests, or for uploading somewhere |
| `csvToBlob`        | Wrap a string in a `Blob`, with the UTF-8 BOM Excel wants     |
| `escapeCsvField`   | The quoting rule, exposed for callers building their own rows |

Options cover the delimiter (`'\t'` gives you TSV), whether to include a header row, which
rows to take (`'all'`, `'page'` or `'selected'`), which columns and in what order, and a
`formatValue` hook for stringifying one cell.

## Formula injection is handled

Values beginning `=`, `+`, `-` or `@` are prefixed with a single quote so a spreadsheet
treats them as text rather than executing them. This is on by default; `sanitizeFormulas:
false` turns it off if you know what you are exporting into.

## License

MIT © Shining Technologies

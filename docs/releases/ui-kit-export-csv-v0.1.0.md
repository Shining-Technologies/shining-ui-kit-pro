# @shining-technologies/ui-kit-export-csv v0.1.0

Released 2026-09-12 · Initial release · [Source at tag](https://github.com/Shining-Technologies/shining-ui-kit-pro/tree/%40shining-technologies%2Fui-kit-export-csv%400.1.0/packages/export-csv)

V1 CSV and TSV export for the data table or any TanStack Table instance, with no runtime
dependencies.

```text
"@shining-technologies/ui-kit-export-csv": "0.1.0"
```

## What changed

- First release.
- `downloadTableCsv` serialises a table and triggers a browser download; `tableToCsv` returns the
  string. Both export what the user sees: current sort and filters, visible columns in order,
  each column's `header` as the heading row.
- `escapeCsvField` and `csvToBlob`, and the `CsvOptions` and `DownloadOptions` types.

## Migrations

None.

## Settings

- Peer dependency: `@tanstack/table-core` `^8.20.5` (already present with
  `@shining-technologies/ui-kit-react`).

## Upgrading

- Add the pin.

## Compatibility

- Node `>=18.18`. No runtime dependencies.
- Superseded by `@shining-technologies/ui/csv` in
  [`@shining-technologies/ui` 2.0.0-rc.0](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/MIGRATION.md).
  This package is not released again.

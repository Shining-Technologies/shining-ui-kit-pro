# @shining-technologies/ui v2.1.2

Released 2026-09-22 · Patch · [CHANGELOG entry](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.1.2/packages/ui/CHANGELOG.md#212)

DataTable column pinning is on for every table, and pinned and hidden columns are remembered in
the browser without configuration.

```text
"@shining-technologies/ui": "2.1.2"
```

## What changed

- DataTable: every header menu offers "Pin to left" and "Pin to right" without
  `features.pinning.enabled`, `enablePinning`, `defaultPinned` or `rowActions` asking for it.
- DataTable: hidden columns are remembered alongside pinning.
- DataTable: the stored layout is one versioned record per table, typed as `PersistedLayout`
  (`{ version: 1, columnPinning, columnVisibility, columnSizing }` under
  `sui-data-table:<name>`). A table without an `id` is named by a hash of its column ids.
- A stored pinning that lists a column on both sides keeps it on the left only.

## Migrations

- Layouts stored by 2.1 are imported on first load and the old entries removed; nothing a user
  pinned is lost. Nothing for the application to do.

## Settings

- `persist` defaults to `{ state: ['columnPinning', 'columnVisibility'] }`; widths are still
  opt-in.
- `enablePinning: false` keeps a column out of the pin menu; `features.pinning.enabled: false`
  removes pinning from a table; `persist={false}` stops remembering.

## Upgrading

- Bump the pin.
- Opt out, per column or per table, where pinning or remembered visibility is not wanted.

## Compatibility

- Released as a patch, but it changes two defaults a user will see: pin options in every header
  menu, and hidden columns that stay hidden on the next visit.
- A stored record with a version the table does not know is ignored.

# @shining-technologies/ui-kit-react v0.1.0

Released 2026-09-12 · Initial release · [Source at tag](https://github.com/Shining-Technologies/shining-ui-kit-pro/tree/%40shining-technologies%2Fui-kit-react%400.1.0/packages/react)

The V1 React components, charts and data table, themed at runtime by `UIKitProvider` from one
palette.

```text
"@shining-technologies/ui-kit-react": "0.1.0"
```

## What changed

- First release: buttons, cards, forms, overlays, charts, an application shell, a dashboard
  sidebar and the `DataTable`, built on Radix UI.
- `UIKitProvider` derives the whole token set from a `preset` or a `brand` colour, light and
  dark.
- Date and time inputs: `Calendar`, `DateField`, `TimeField`, `DateTimeField`, `Clock`.
- Entry points `.`, `/virtualized`, `/recharts` and `/styles.css`; ESM and CommonJS.
- The whole package is marked `'use client'`.

## Migrations

None.

## Settings

- Import `@shining-technologies/ui-kit-react/styles.css` once and wrap the application in
  `UIKitProvider`.
- Peer dependencies: `react` and `react-dom` `^18.0.0 || ^19.0.0`; optional `recharts`
  `^2.15.0 || ^3.0.0` (for `/recharts`) and `@tanstack/react-virtual` `^3.11.0` (for
  `/virtualized`).

## Upgrading

- Add the pin, then the stylesheet import and the provider above.

## Compatibility

- Node `>=18.18`. Depends on `@shining-technologies/ui-kit-core` `0.1.0`.
- Superseded by `@shining-technologies/ui`
  ([MIGRATION.md](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/MIGRATION.md)).
  This package is not released again. Do not install it beside `@shining-technologies/ui`: both
  style the same `sui-*` classes.

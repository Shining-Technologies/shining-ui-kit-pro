# @shining-technologies/ui-kit-core v0.1.0

Released 2026-09-12 · Initial release · [Source at tag](https://github.com/Shining-Technologies/shining-ui-kit-pro/tree/%40shining-technologies%2Fui-kit-core%400.1.0/packages/core)

The V1 framework-agnostic core: design tokens, the OKLCH colour engine, the project system and
the data-table state helpers.

```text
"@shining-technologies/ui-kit-core": "0.1.0"
```

## What changed

- First release. No React import anywhere, so it runs in Node, a worker or a build step.
- The project system: `createProject`, `resolveProject`, `applyBrand`.
- The colour engine: `generateScale`, `readableForeground`, `contrastRatio`, `mix`.
- Table themes: `createTheme`, `createTableTheme`, `mergeThemes`, `themeToCssVars`.
- Pure sorting, filtering, pagination and query helpers behind the data table.
- ESM and CommonJS builds, with types for both.

## Migrations

None.

## Settings

None.

## Upgrading

- Add the pin. Applications using `@shining-technologies/ui-kit-react` do not need it directly;
  install it for code that runs outside React or on the server.

## Compatibility

- Node `>=18.18`. One runtime dependency, `@tanstack/table-core` `^8.20.5`.
- Superseded by `@shining-technologies/ui/core` in
  [`@shining-technologies/ui` 2.0.0-rc.0](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/MIGRATION.md).
  This package is not released again.

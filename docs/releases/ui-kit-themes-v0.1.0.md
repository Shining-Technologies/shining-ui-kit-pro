# @shining-technologies/ui-kit-themes v0.1.0

Released 2026-09-12 · Initial release · [Source at tag](https://github.com/Shining-Technologies/shining-ui-kit-pro/tree/%40shining-technologies%2Fui-kit-themes%400.1.0/packages/themes)

The V1 presets: ten project palettes and four DataTable chrome themes.

```text
"@shining-technologies/ui-kit-themes": "0.1.0"
```

## What changed

- First release.
- Palettes `shining` (the default), `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`,
  `mono`, `darwind` and `unn`, with `BUILT_IN_PALETTES` and `paletteById`.
- Chrome themes `defaultTheme`, `minimalTheme`, `dashboardTheme` and `midnightTheme`, and the
  `themes` record keyed by `ThemeName`.
- Re-exports `createTheme`, `createTableTheme`, `mergeThemes`, `themeToCssVars` and `applyBrand`
  from `@shining-technologies/ui-kit-core`.

## Migrations

None.

## Settings

None. A palette is named on `UIKitProvider` (`preset="darwind"`) without installing this package;
install it to read or extend a preset in code, or to pass a chrome theme to `DataTable theme`.

## Upgrading

- Add the pin.

## Compatibility

- Node `>=18.18`. Depends on `@shining-technologies/ui-kit-core` `0.1.0`.
- Superseded by `@shining-technologies/ui/presets.css` and `@shining-technologies/ui/theme` in
  [`@shining-technologies/ui` 2.0.0-rc.0](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/%40shining-technologies%2Fui%402.0.0-rc.0/packages/ui/MIGRATION.md).
  This package is not released again.

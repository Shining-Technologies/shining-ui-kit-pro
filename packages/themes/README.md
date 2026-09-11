# @shining-ui-kit/themes

[![npm](https://img.shields.io/npm/v/@shining-ui-kit/themes.svg)](https://www.npmjs.com/package/@shining-ui-kit/themes)
[![license](https://img.shields.io/npm/l/@shining-ui-kit/themes.svg)](../../LICENSE)

The shipped design presets for
[Shining UI Kit](https://github.com/ikramulSoHeL/shining-ui-kit-pro).

Two kinds of preset live here, and they work at different levels.

## Palettes are whole projects

They carry seed colours, geometry and density; resolving one produces the complete token set
every component reads. Pass one to `<UIKitProvider>`.

```tsx
import { violetPalette } from '@shining-ui-kit/themes'
import { UIKitProvider } from '@shining-ui-kit/react'

;<UIKitProvider project={violetPalette} scope="global">
  <App />
</UIKitProvider>
```

Shipped: `shining` (the default), `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`,
`mono` — plus `BUILT_IN_PALETTES` and `paletteById(id)` to look one up.

## Chrome themes dress the table only

They change the table's own chrome — header fill, container radius, header type — without
touching the project's colours.

```tsx
import { dashboardTheme } from '@shining-ui-kit/themes'

;<DataTable data={rows} columns={columns} theme={dashboardTheme} label="Orders" />
```

Shipped: `defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`, and the `themes`
record keyed by `ThemeName`.

## Install

```bash
pnpm add @shining-ui-kit/themes
```

Both kinds of preset are plain data, so the ones you never import disappear from your bundle,
and any of them can be serialised, diffed or stored per user.

## Documentation

- [Theming](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/guide/theming.md)
- [Projects](https://github.com/ikramulSoHeL/shining-ui-kit-pro/blob/master/docs/guide/projects.md)

## License

MIT © Shining Technologies

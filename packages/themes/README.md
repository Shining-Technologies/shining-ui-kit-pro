# @shining-technologies/ui-kit-themes

[![npm](https://img.shields.io/npm/v/@shining-technologies/ui-kit-themes.svg)](https://www.npmjs.com/package/@shining-technologies/ui-kit-themes)
[![license](https://img.shields.io/npm/l/@shining-technologies/ui-kit-themes.svg)](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/LICENSE)

The shipped design presets for
[Shining UI Kit](https://github.com/Shining-Technologies/shining-ui-kit-pro).

Two kinds of preset live here, and they work at different levels.

## Palettes are whole projects

They carry seed colours, geometry and density; resolving one produces the complete token set
every component reads. You don't need this package to use one — name it on the provider:

```tsx
import { UIKitProvider } from '@shining-technologies/ui-kit-react'

;<UIKitProvider preset="darwind" brand="#be123c" scope="global">
  <App />
</UIKitProvider>
```

Import the object when you want to read or extend it in code:

```ts
import { applyBrand, unnPalette } from '@shining-technologies/ui-kit-themes'

const ours = applyBrand(unnPalette, { primary: '#be123c', radius: '0.5rem' })
```

Shipped: `shining` (the default), `slate`, `midnight`, `violet`, `ember`, `forest`, `rose`,
`mono`, `darwind`, `unn` — plus `BUILT_IN_PALETTES` and `paletteById[id]` to look one up.

## Chrome themes dress the table only

They change the table's own chrome — header fill, container radius, header type — without
touching the project's colours.

```tsx
import { dashboardTheme } from '@shining-technologies/ui-kit-themes'

;<DataTable data={rows} columns={columns} theme={dashboardTheme} label="Orders" />
```

Shipped: `defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`, and the `themes`
record keyed by `ThemeName`.

## Install

```bash
npm install @shining-technologies/ui-kit-themes
```

Both kinds of preset are plain data, so the ones you never import disappear from your bundle,
and any of them can be serialised, diffed or stored per user.

## Documentation

- [Theming](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/theming.md)
- [Projects](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/projects.md)

## License

MIT © Shining Technologies

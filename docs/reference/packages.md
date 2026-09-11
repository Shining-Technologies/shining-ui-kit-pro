# Packages

Four packages are published to npm. They version together in one line except for the
optional CSV export, which changes on its own.

| Package                      | Install it when                                        |
| ---------------------------- | ------------------------------------------------------ |
| `@shining-ui-kit/react`      | Always. This is the library.                           |
| `@shining-ui-kit/core`       | You need the colour or project engine outside React    |
| `@shining-ui-kit/themes`     | You want the shipped palettes and table chrome presets |
| `@shining-ui-kit/export-csv` | You want CSV/TSV export from a table                   |

`@shining-ui-kit/react` already depends on `core` and re-exports the parts an application
reaches for, so most projects install exactly one package.

---

## `@shining-ui-kit/react`

The component library: theming, primitives, composites, form inputs, the application shell,
charts and the data table.

### Entry points

| Import                              | Contains                                                                                      | Extra peer needed         |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| `@shining-ui-kit/react`             | Everything except the two entries below                                                       | —                         |
| `@shining-ui-kit/react/styles.css`  | The stylesheet                                                                                | —                         |
| `@shining-ui-kit/react/recharts`    | `TrendChart`, `BarChart`, `DonutChart`, `GaugeChart`, `ScatterChart`, `Sparkline`, `StatTile` | `recharts`                |
| `@shining-ui-kit/react/virtualized` | `VirtualizedDataTable`, `VirtualizedBody`                                                     | `@tanstack/react-virtual` |

The two optional entries are split out precisely so their peers stay out of bundles that do
not use them. Importing the root package never pulls in `recharts`.

### Size

Whole-entry figures for the ESM build, before your bundler tree-shakes anything you did not
import:

| File             | Raw    | Gzipped |
| ---------------- | ------ | ------- |
| `index.js`       | 161 kB | 40 kB   |
| `recharts.js`    | 37 kB  | 10 kB   |
| `virtualized.js` | 1.9 kB | 0.8 kB  |
| `styles.css`     | 182 kB | 33 kB   |

The table is code-split into its own chunk, so an application that uses only cards, forms and
buttons does not pay for it.

### Dependencies

Radix UI primitives (the accessible behaviour under menus, dialogs, selects and the rest),
`@tanstack/react-table`, `clsx`, `tailwind-merge`, `class-variance-authority`, and
`@shining-ui-kit/core`. All ordinary dependencies — nothing to configure.

---

## `@shining-ui-kit/core`

Everything the kit knows that is not React: the token surface, the OKLCH colour engine, the
project system, and the pure state, filter and pagination helpers behind the table.
39 kB raw / 12 kB gzipped, no React import anywhere.

Install it directly when you need that engine **outside** a React tree:

- generating a stylesheet at build or deploy time
- validating or previewing a customer's brand colour on the server
- computing a table query in an API route, so client and server agree on it
- a design-token pipeline that feeds something other than this kit

```ts
import { createProject, resolveProject, contrastRatio } from '@shining-ui-kit/core'
```

If you are only writing React, you already have these through `@shining-ui-kit/react`.

---

## `@shining-ui-kit/themes`

The shipped presets, 1.8 kB raw. Two kinds, at different levels:

- **Palettes** are whole projects — seed colours, geometry, density. Pass one to
  `<UIKitProvider project={…}>`. Shipped: `shining`, `slate`, `midnight`, `violet`, `ember`,
  `forest`, `rose`, `mono`.
- **Chrome themes** dress the table only — header fill, container radius, header type —
  without touching the project's colours. Pass one to `<DataTable theme={…}>`. Shipped:
  `defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`.

Both are plain data, so the presets you never import disappear from your bundle, and any of
them can be serialised, diffed or stored per user.

Note that the palettes are also re-exported from `core` (and therefore from `react`) as
`BUILT_IN_PALETTES` and `paletteById`. This package exists for the chrome themes and for
importing one palette by name without reaching through the whole kit.

---

## `@shining-ui-kit/export-csv`

CSV and TSV export, 1.9 kB raw, **zero runtime dependencies**.

```tsx
import { downloadTableCsv } from '@shining-ui-kit/export-csv'

;<Button onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}>Export</Button>
```

Separate because most tables never export anything and the main package should not carry code
they will not run. Values that a spreadsheet would execute as a formula are quoted by
default — see the [package README](../../packages/export-csv/README.md).

`@tanstack/table-core` is a peer; you already have it if you use the kit's table.

---

## What is not published

`apps/gallery` and `examples/` are `private` workspaces. The gallery is the development
playground; the examples are compiled and asserted by the test suite but are meant to be read
and copied, not installed.

---

## Which package owns what

The split follows one rule: **`core` may not import React, `react` may not own design
decisions that belong to a project.** If you are adding code and cannot tell where it goes,
ask whether it would still make sense in a Node script. If yes, it belongs in `core`.

The reasoning behind the boundaries is in [ARCHITECTURE.md](../../ARCHITECTURE.md); the
release mechanics are in [Releasing](../contributing/releasing.md).

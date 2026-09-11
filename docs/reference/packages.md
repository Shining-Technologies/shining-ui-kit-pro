# Packages

Four packages are published to npm. They version together in one line except for the
optional CSV export, which changes on its own.

| Package                                   | Install it when                                        |
| ----------------------------------------- | ------------------------------------------------------ |
| `@shining-technologies/ui-kit-react`      | Always. This is the library.                           |
| `@shining-technologies/ui-kit-core`       | You need the colour or project engine outside React    |
| `@shining-technologies/ui-kit-themes`     | You want the shipped palettes and table chrome presets |
| `@shining-technologies/ui-kit-export-csv` | You want CSV/TSV export from a table                   |

`@shining-technologies/ui-kit-react` already depends on `core` and re-exports the parts an application
reaches for, so most projects install exactly one package.

---

## `@shining-technologies/ui-kit-react`

The component library: theming, primitives, composites, form inputs, the application shell,
charts and the data table.

### Entry points

| Import                                           | Contains                                                                                      | Extra peer needed          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------- |
| `@shining-technologies/ui-kit-react`             | Everything except the two entries below                                                       | —                          |
| `@shining-technologies/ui-kit-react/styles.css`  | The stylesheet                                                                                | —                          |
| `@shining-technologies/ui-kit-react/recharts`    | `TrendChart`, `BarChart`, `DonutChart`, `GaugeChart`, `ScatterChart`, `Sparkline`, `StatTile` | `recharts` `^2.15 \|\| ^3` |
| `@shining-technologies/ui-kit-react/virtualized` | `VirtualizedDataTable`, `VirtualizedBody`                                                     | `@tanstack/react-virtual`  |

The two optional entries are split out precisely so their peers stay out of bundles that do
not use them. Importing the root package never pulls in `recharts`.

### Size

Whole-entry figures for the ESM build, before your bundler tree-shakes anything you did not
import:

| File              | Raw    | Gzipped |
| ----------------- | ------ | ------- |
| `index.js`        | 218 kB | 55 kB   |
| `data-table-*.js` | 113 kB | 28 kB   |
| `recharts.js`     | 37 kB  | 10 kB   |
| `virtualized.js`  | 1.9 kB | 0.8 kB  |
| `styles.css`      | 224 kB | 41 kB   |

The table lives in a separate chunk, shared with `/virtualized`, which `index.js` imports
statically — so it is not lazy-loaded, and the root entry's full weight is the first two rows
together. What keeps it out of an application that uses only cards, forms and buttons is
tree-shaking: the package declares `sideEffects` only for its CSS, so a bundler drops the
table when nothing imports `DataTable`.

### Dependencies

Radix UI primitives (the accessible behaviour under menus, dialogs, selects and the rest),
`@tanstack/react-table`, `clsx`, `tailwind-merge`, `class-variance-authority`, and
`@shining-technologies/ui-kit-core`. All ordinary dependencies — nothing to configure.

---

## `@shining-technologies/ui-kit-core`

Everything the kit knows that is not React: the token surface, the OKLCH colour engine, the
project system, and the pure state, filter and pagination helpers behind the table.
43 kB raw / 13 kB gzipped, no React import anywhere.

Install it directly when you need that engine **outside** a React tree:

- generating a stylesheet at build or deploy time
- validating or previewing a customer's brand colour on the server
- computing a table query in an API route, so client and server agree on it
- a design-token pipeline that feeds something other than this kit

```ts
import { createProject, resolveProject, contrastRatio } from '@shining-technologies/ui-kit-core'
```

If you are only writing React, you already have these through `@shining-technologies/ui-kit-react`.

---

## `@shining-technologies/ui-kit-themes`

The shipped presets, 1.9 kB raw / 0.8 kB gzipped. Two kinds, at different levels:

- **Palettes** are whole projects — seed colours, geometry, density. Name one with
  `<UIKitProvider preset="…">` or pass the object to `project={…}`. Shipped: `shining`, `slate`,
  `midnight`, `violet`, `ember`, `forest`, `rose`, `mono`, `darwind`, `unn`.
- **Chrome themes** dress the table only — header fill, container radius, header type —
  without touching the project's colours. Pass one to `<DataTable theme={…}>`. Shipped:
  `defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`.

Both are plain data, so the presets you never import disappear from your bundle, and any of
them can be serialised, diffed or stored per user.

Note that the palettes are also re-exported from `core` (and therefore from `react`) as
`BUILT_IN_PALETTES` and `paletteById`. This package exists for the chrome themes and for
importing one palette by name without reaching through the whole kit.

---

## `@shining-technologies/ui-kit-export-csv`

CSV and TSV export, 1.9 kB raw / 1.0 kB gzipped, **zero runtime dependencies**.

```tsx
import { downloadTableCsv } from '@shining-technologies/ui-kit-export-csv'

;<Button onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}>Export</Button>
```

Separate because most tables never export anything and the main package should not carry code
they will not run. Values that a spreadsheet would execute as a formula are quoted by
default — see the [package README](../../packages/export-csv/README.md).

`@tanstack/table-core` (`^8.20.5`) is its only peer, and it does not depend on `core`; you
already have table-core if you use the kit's table.

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

# Architecture

> This document is the design contract for the library. It was written **before** the
> implementation and is the reference for every decision in the codebase.

## 1. The one rule

**Functionality is independent from appearance.**

Every layer below may depend only on the layers above it. Nothing depends downwards.

```
  COLOUR      OKLab engine — parse, mix, contrast, ramps
     |
  PROJECT     seeds -> generated token set, per colour mode
     |
  THEME       design tokens -> CSS variables -> `sui-*` classes
     |
  ENGINE      @tanstack/table-core — row models, algorithms
     |
  STATE       9 state slices, controlled/uncontrolled, client|server mode
     |
  RENDER MODEL prop bags: precomputed ARIA, data-attrs, handlers, geometry
     |
  COMPONENTS  primitives -> kit components -> table parts + overrides + slots
     |
  APPLICATION data, columns, business meaning
```

### 1a. The theming rule

**No component may hardcode a colour, radius or spacing value.** Every rule in every
stylesheet resolves to a `--sui-*` custom property.

This is what makes switching project a complete restyle rather than a partial one, and it is
easy to break by accident and invisible until someone changes theme — so it is enforced by
`tests/tokens.test.ts`, which scans every stylesheet for colour literals. The only permitted
literals are black and white at an alpha, for shadows and scrims: light is not a palette
colour, and tinting a drop shadow with the brand makes it read as a glow rather than depth.

A second rule follows from it: **a design decision is authored as a seed, not as a token
set.** A project is four colours and a shape; the neutral ramp, hover and selected surfaces,
borders, chart series, dark mode and every `*-foreground` are derived. Hand-authoring forty
tokens twice — once per mode — is both more work and impossible to keep contrast-safe.

Consequences that are enforced by the code, not by convention:

| Change                          | Must not affect                                   |
| ------------------------------- | ------------------------------------------------- |
| Swap the theme                  | table behaviour                                   |
| Replace `components.Row`        | sorting, selection, expansion, a11y, keyboard nav |
| Replace the filter UI           | the filtering engine                              |
| Move from client to server data | any component                                     |

The mechanism that makes this true is the **prop bag**. A part never re-derives
behaviour; it receives it. `DataTableRow` gets `rowProps` that already contains
`role`, `aria-selected`, `data-state`, `tabIndex`, `onClick`, `onKeyDown`. A custom
row spreads it and cannot break the table.

## 2. Packages

| Package                      | Depends on                           | Contains                                                                                                     |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `@shining-technologies/ui-kit-core`       | `@tanstack/table-core`               | design tokens, the OKLab colour engine, the project system, types, filter engine, state utils. **No React.** |
| `@shining-technologies/ui-kit-react`      | core, `@tanstack/react-table`, Radix | the provider and theming UI, primitives, the component kit, charts, the data table, styles                   |
| `@shining-technologies/ui-kit-themes`     | core                                 | shipped presets: project palettes and table chrome themes                                                    |
| `@shining-technologies/ui-kit-export-csv` | `@tanstack/table-core` (peer only)   | CSV export, kept out of the main package                                                                     |

`@shining-technologies/ui-kit-react/virtualized` and `@shining-technologies/ui-kit-react/recharts` are **subpath
exports**; `@tanstack/react-virtual` and `recharts` are _optional_ peer dependencies so the
base package stays lightweight (§41, §42, §53).

### Deviations from the brief, and why

1. **Themes are one package, not three.** A theme is a plain token object. Three npm
   packages for three objects is packaging overhead, not modularity. `@shining-technologies/ui-kit-themes`
   exports them individually so they tree-shake, and any one can be split out later without
   touching the engine (§4 explicitly allows this).
2. **`examples/` is a workspace _library_, not five apps.** The example tables are consumed
   by both the gallery app and Storybook. Five separate Vite apps would mean five copies of the
   same code drifting apart. Each use case still gets its own module.
3. **No `cmdk`, no `react-day-picker`.** §15 says "only include dependencies that are
   actually necessary". The multi-select filter is a Radix Popover plus a searchable listbox
   we own, and the date filter is a month grid we own — about 200 lines of date arithmetic
   and one ARIA grid, against a dependency larger than the table's own filter engine.
   The first version used a native `<input type="date">`, which is accessible for free but is
   also the one control in a themed table that cannot be themed: its layout, its placeholder
   and its picker belong to the browser, so a filter bar built entirely from tokens ended with
   one control ignoring every one of them. Both are replaceable through component overrides.
4. **Feature config lives in `features`.** See §3 below.
5. **Nested values use `accessorPath`, not a dotted `accessorKey`.** Overloading `accessorKey`
   with arbitrary strings destroys the inference that types `value` on every other column —
   TypeScript can no longer pick a union member for `{ accessorKey: 'price', cell }`. A distinct
   property keeps `accessorKey` strictly checked against the row's own keys (so typos there are
   still caught) and states plainly that a path column's `value` is `unknown`.
6. **The sort cycle is uniform.** The engine defaults numeric columns to descending-first, so
   the same click means different things on different columns. `sortDescFirst: false` is set at
   the table level; a column can still opt in.

## 3. Public API shape

### State: uniform, controlled _and_ uncontrolled

Nine slices, one naming rule, no exceptions:

```
sorting | columnFilters | globalFilter | pagination | rowSelection
columnVisibility | columnSizing | columnPinning | expanded
```

each with `x` (controlled), `defaultX` (uncontrolled initial), `onXChange` (always fires).

### Features: configuration, not state

Behavioural configuration is separated from state so that no prop means two things:

```tsx
<DataTable
  mode="server" // default mode for every feature
  features={{
    sorting: { mode: 'client', multi: true },
    pagination: { pageSize: 25, pageSizeOptions: [10, 25, 50] },
    selection: { enabled: true, mode: 'multiple' },
    resizing: { enabled: true },
  }}
/>
```

The brief shows both `sorting={{ mode: 'client' }}` (§13) and `sorting={sorting}` (§38).
Those conflict. Resolution: a `SortingState` is _always_ an array and a config is _always_
a plain object, so `sorting` and `columnFilters` accept either and normalise internally.
Where that test would be ambiguous (`pagination`, `rowSelection`) the state prop is state
only, and configuration goes in `features`. One predictable rule, both examples compile.

### Escape hatches, in order of power

1. `className` / `tableClassName` / `rowClassName` / `cellClassName` — cosmetics.
2. `theme` + CSS variables — the whole design language.
3. `slots` — inject content around the table.
4. `components` — replace any part outright.
5. `useDataTable()` — build your own layout from the primitives.

## 4. State ownership

The TanStack table instance is the **single source of truth**. No component keeps a
duplicate copy of sorting, filters or selection; they read the instance from context.
`useControllableState` resolves controlled vs uncontrolled once, at the top, and the
resolved value flows down through the instance only.

Server mode sets `manualSorting` / `manualFiltering` / `manualPagination` and emits a
consolidated `DataTableQuery` through `onQueryChange`, so the app can call REST, GraphQL,
React Query, SWR or a server action. The library knows nothing about any of them (§37).

## 5. Styling model

Three layers, each independently overridable:

1. **Tokens** — `--sui-*` CSS variables in `styles/tokens.css`, defined for light and dark,
   for three densities and for six variants. Nothing hardcodes a colour.
2. **Component classes** — `sui-table`, `sui-th`, `sui-td`, `sui-row`… plain CSS driven entirely
   by tokens. These work with **zero** Tailwind configuration in the consumer app.
   A class that names a table element belongs to the table and to nothing else: the generic
   flex helper that once also answered to `.sui-row` put `display: flex` on every `<tr>` and
   silently detached the body from the header's column widths. The helper is now
   `.sui-cluster`, and `tests/styles.test.ts` fails the build if any stylesheet outside
   `table.css` sets `display` on a table class.
3. **Tailwind utilities** — used for toolbar/pagination/primitive layout, merged safely with
   user classes through `cn()` (clsx + tailwind-merge).

`theme` prop -> resolved tokens -> inline `--sui-*` custom properties on the root element.
Dark mode is inherited from the app (`.dark` class or `prefers-color-scheme`), never
hardcoded independently (§33).

## 6. Column model

Our `ColumnDef` is a superset of the engine's, adapted at the boundary:

- `cell` receives `{ value, row, column, table, rowIndex }` — `value` is typed, not `getValue()`.
- `filter` declares the filter _type_ and options; the engine derives the filter function.
- `meta` carries `align`, `className`, `headerClassName`, `responsive`, `wrap`, `sticky`.
- Responsive hiding is CSS (`sui-hide-below-md`), so it works without consumer Tailwind.
- Column widths reach cells as a **custom property** (`--sui-cell-size`), never as an inline
  `width`. An inline width outranks every stylesheet, which is what forced the card layout to
  fight it with `!important`; as a variable, the single rule that reads it can be overridden
  normally by any layout that must ignore column widths.

## 6a. Appearance decisions with two right answers

Three switches exist because there is no single correct behaviour, only a correct behaviour
per table. None of them touches the engine.

| Prop             | Values                    | The trade-off being made                                                                                                                           |
| ---------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filterLayout`   | `panel` \| `inline`       | A panel scales to many filters and exposes every operator; inline makes the current query readable without opening anything, at one operator each. |
| `tableLayout`    | `fixed` \| `auto`         | Fixed widths make resizing and pinned offsets exact and keep rows one line tall; auto fits content you cannot measure in advance.                  |
| `responsiveMode` | `scroll`\|`cards`\|`auto` | `cards` switches on the viewport, `auto` on the table's own container — the only one that is right for a table inside a narrow panel.              |

Both filter layouts render from the same `filterableColumns()` list and write through the same
`useColumnFilter` handle, so switching layout can never change _what_ is filterable or _how_
a filter is stored. That is the §14 rule applied twice.

The chrome that signals overflow is measured, not assumed: `useScrollEdges` puts
`data-overflow-start` / `data-overflow-end` / `data-scrolled` on the scroll container, and the
sticky-header lift and pinned-column shadows are conditional on them. A table that fits its
container must look like one.

## 6b. What the chrome is for

Four details that look cosmetic and are not:

- **Header and cell text start at the same x.** Nothing may take space in a header cell that
  does not take the same space in the body, so the column menu and the resize grip are both
  positioned out of flow. The menu used to sit in the flow behind `margin-inline-start: auto`,
  which silently pushed every centred and right-aligned label out of line with its own column.
  `tests/styles.test.ts` keeps both the menu out of flow and the padding tokens equal.
- **A hairline between column heads, and nowhere else.** The head is where the eye needs to
  know which label owns which column; ruling the body as well turns a list of records into a
  spreadsheet, where every cell competes with its neighbours.
- **The sort arrow is visible at rest.** A sortable column that looks identical to a fixed one
  has to be discovered by trial — and on a touch screen there is no hover to discover it with.
- **The actions column has a real header.** A column of icons under a blank head reads as
  something that failed to render.

## 7. Things worth knowing

**`data` identity matters.** A new `data` array is treated as new data and resets the page
index. That is the engine's behaviour and it is correct — a genuinely new result set should
not leave the user on page 7 of 3 — but it surprises people who build the array inline. The
docs say so in three places; the alternative (suppressing the reset) trades a visible surprise
for an invisible one.

**Tests run on happy-dom, not jsdom.** Under jsdom every Radix popper interaction (Popover,
DropdownMenu, Select) hangs for ~45 seconds and never opens. happy-dom runs the same
interactions in ~70 ms. This is a test-environment choice only; nothing in the library depends
on it.

**Two real accessibility bugs were found by the axe suite** and are fixed: `aria-expanded` on
a `<tr>` (only valid in a `treegrid`), and the empty `<th>` of the injected expander column.
Both are now regression-tested.

## 8. File size discipline

No file over ~250 lines. No component doing two jobs. If a part needs more than that,
it is two parts.

---

## Appendix: the project system

Added when the library grew from a table into a component kit. The layering above still
holds; this is what sits at the top of it.

### Why generation, not authoring

A token file is forty-odd colours, then the same forty again for dark mode, then a chart
palette, then hover and selected states. Every one is a chance to ship an unreadable pair,
and nothing checks them.

`resolveProject()` derives all of it from a seed, in OKLab. Two properties follow that a
hand-authored file cannot have:

- **Every derivation is perceptual.** A "10% lighter" blue derived in sRGB reads as grey; a
  generated ramp bunches in the middle. OKLab is uniform enough that the naive arithmetic is
  right.
- **Contrast is a guarantee.** `harmonizeFill` picks the ink by what the mode wants, then
  moves the fill's _lightness_ — never its hue or chroma — until the pair clears 4.5:1. This
  is the case that defeats "pick the better of white and black": a mid-lightness rose, cyan
  or mustard clears 4.5:1 against neither.

### Where the defaults come from

The kit must look finished with no provider mounted, so the default palette exists twice —
once generated at runtime, once frozen into `tokens.generated.css`. Rather than maintain the
copy by hand, it is emitted by `scripts/generate-tokens.ts` from the same function, and
`tests/tokens.test.ts` fails if the committed file has drifted. `pnpm tokens` regenerates it.

### Why the registry lives outside React

`ProjectRegistry` is a small observable store subscribed to with `useSyncExternalStore`. It
has to be readable from outside React — a route loader deciding the initial theme, a server
rendering the first paint — and it has to survive a remount, so the source of truth is the
store and React subscribes to it.

Editing a built-in **forks** it rather than mutating the shipped preset, so the presets stay
a stable starting point and the user still gets their change.

### Why charts are dependency-free — and why there is a Recharts set anyway

A charting library is a large dependency whose palette, type scale and tooltips then have to
be dragged back to the design system one override at a time. The five chart types in
`src/charts` are a few hundred lines of SVG built on the same tokens as everything else, so a
chart follows a project switch with no adapter layer at all.

That argument is about what the _base package_ costs, not about what a chart can be, and it
loses to two things: hand-rolled SVG owns its own maths forever, and teams already standardised
on Recharts do not want a second chart API. So `src/recharts` is a second set — six forms on
Recharts — behind its own entry point, with `recharts` as an _optional_ peer dependency. An
app that imports the root package still pays nothing for it; an app that imports
`@shining-technologies/ui-kit-react/recharts` opts in with its eyes open. Both sets draw from
`--sui-chart-1..5`, so they are two implementations of one palette rather than two designs.

The override problem the original argument warns about is real, and the answer to it is that
the design lives in one module — `recharts/theme.ts` — rather than being scattered across the
call sites. Colours, mark specs, formatters and every responsive rule are decided there; a
chart component picks a form and spends the rest of its lines on that form's own layout. See
`docs/components/charts-recharts.md`.

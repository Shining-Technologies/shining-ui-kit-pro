# Shining UI V2 — Audit report and target architecture

> Audience: the engineers who maintain the Shining UI packages and the teams consuming them.
> Status: audit complete; V2 implementation lives in `packages/ui` (`@shining-technologies/ui`).
> The V1 packages have since been removed from the repository; their `0.1.0` releases remain on
> npm. File paths below that point into `packages/core`, `packages/react`, `packages/themes`,
> `packages/export-csv` or `examples/` refer to commit `7880f44`, the last one that contains them.

## 1. Scope and method

The four V1 packages audited:

| Package                                   | Role                                                                      | Size (src)          |
| ----------------------------------------- | ------------------------------------------------------------------------- | ------------------- |
| `@shining-technologies/ui-kit-core`       | Colour engine, project/palette system, theme tokens, filter engine, state | 37 files            |
| `@shining-technologies/ui-kit-react`      | Provider + theming UI, ~70 components, two chart sets, the DataTable, CSS | 150 files, 250 kB CSS |
| `@shining-technologies/ui-kit-themes`     | Re-exported palettes + three table "chrome" themes                         | 1 file              |
| `@shining-technologies/ui-kit-export-csv` | CSV/TSV export of a table instance                                         | 1 file              |

Method:

1. Read every package manifest, build config, entry point, the theme runtime, the DataTable state
   and filter pipeline, and the documentation that states the packages' guarantees.
2. Ran the baseline: `pnpm typecheck`, `pnpm test` and `pnpm build` all pass (**723 tests, 35
   files**). The problems below are therefore architectural or environment-dependent — the
   kind a green unit-test run does not catch.
3. Proved the suspected defects with probes rather than inference (outputs quoted below).
4. Classified every exported component (section 5).

The V1 code base is of good quality in places a merge usually is not: accessibility is
tested with axe, render paths are SSR-guarded, state is uniformly controlled/uncontrolled, and
table parts are replaceable through prop bags. **Most of it is reuse material.** The work in V2
is re-architecture — boundaries, packaging, theming and the data-table core — not a rewrite of
the components.

## 2. Executive summary

| #   | Finding                                                                                              | Severity |
| --- | ---------------------------------------------------------------------------------------------------- | -------- |
| 1   | The whole React package is one `'use client'` bundle; server-safe helpers cannot run in Server Components | Critical |
| 2   | Date filters return different rows depending on the server's time zone (proven)                     | High     |
| 3   | No server implementation of the filter semantics and no URL format — Next.js apps re-implement filtering, and the shipped example gets it wrong | High |
| 4   | Theme is a runtime JavaScript system (OKLab generation, provider, `localStorage`, hydration second pass) | High |
| 5   | Kit components turn dark on a dark-OS machine even in apps without dark mode                          | High     |
| 6   | Unlayered CSS: Tailwind v4 `className` overrides can never win                                        | High     |
| 7   | Locale-dependent formatting and sorting cause hydration mismatches                                    | Medium   |
| 8   | Filter UI reports active filters that filter nothing (proven); panel and inline filters write different value types | Medium |
| 9   | Duplicate components and three overlapping theming APIs                                               | Medium   |
| 10  | Coarse bundles and dual ESM/CJS builds (tree-shaking and dual-package hazard)                         | Medium   |

## 3. Findings

Severity: **Critical** blocks correct production use; **High** produces wrong results or
un-fixable styling for common setups; **Medium** is a real defect with a workaround;
**Low** is maintainability.

### 3.1 Next.js App Router and client/server boundaries

**B1 — Critical — Entire package marked `'use client'`.**
`packages/react/vite.config.ts:58` adds `banner: "'use client';"` to every output file. Every
export of `@shining-technologies/ui-kit-react` is therefore a client reference, including pure
functions it re-exports from core (`createColumnHelper`, `getPageNumbers`, `getPageRange`,
`normalizeFilterValue`, `createTheme`, `contrastRatio`, …). Calling any of them in a Server
Component throws. The V1 Next.js guide ("Server-only code") documented the workaround — import
from a different package — which is precisely the boundary problem, pushed to the consumer.

**B2 — Medium — Components that could be server-rendered with zero client JS are not.** Pure
markup components (`Card` parts without `asChild`, `Alert`, `Kbd`, `PageHeader` layout, table
cell helpers) ship as client components because of B1.

**B3 — Medium — Column definitions cannot be shared with the server.** Columns carry functions
(`cell`, `accessorFn`, `filter.predicate`), and the only thing that understands the filter
configuration is the client-side TanStack instance. There is no notion of a column *schema*
that a server could filter and sort by. (Design gap; see D3.)

### 3.2 DataTable: filtering, sorting, pagination

**D1 — High — Date filtering depends on the runtime's time zone.**
`packages/core/src/filters/predicates.ts:87-119` computes day boundaries with
`startOfDay()` in the *process* zone. Probe, using the built V1 core, same row and filter:

```text
row placedAt = 2024-03-05T20:00:00Z
UTC                    filter "on 2024-03-06" -> false | "on 2024-03-05" -> true
Australia/Sydney       filter "on 2024-03-06" -> true  | "on 2024-03-05" -> false
America/Los_Angeles    filter "on 2024-03-06" -> false | "on 2024-03-05" -> true
```

A Next.js server (UTC on most hosts) and a browser in Australia return different rows for the
same URL. With filter state in server-rendered HTML this is also a hydration mismatch.

**D2 — Medium — Off-by-one-hour on daylight-saving days.** The inclusive end of a day is
`startOfDay(to) + 86_400_000` (`predicates.ts:101,115`). On a 25-hour day the last hour is
excluded; on a 23-hour day an hour of the next day is included.

**D3 — High — No server-side equivalent of the filter engine, and no URL format.**
`DataTableQuery.columnFilters` carries structured `{ operator, value }` filters, but nothing
applies them outside the browser. The shipped server example
(`examples/src/server-side.tsx:33-41`) ignores the operator and treats every filter as
"contains" — so `between`, `notEquals`, `before`, `includes` silently behave differently in
server mode. Every App Router app also has to invent its own `searchParams` encoding, parsing
and validation.

**D4 — Medium — "Filters, 1 active" while nothing is filtered (proven).** Clearing a filter's
text writes `{ operator, value: undefined }` (`use-column-filter.ts:58`). The entry stays in
state and the panel counts entries, not active filters (`filter-panel.tsx:36`). Probe with that
state: trigger label `Filters, 1 active`, rows rendered `2 of 2`. The same stale entries also
leak into anything that serialises state.

**D5 — Medium — Panel and inline filters write different value types.** The panel's select
filter stores the option as a string (`filter-control.tsx:77`); the inline filter restores the
option's own type (`inline-filters.tsx:187`). The same user action yields different queries and
URLs depending on `filterLayout`.

**D6 — Medium — Locale-dependent rendering causes hydration mismatches.**
`new Intl.NumberFormat()` with the runtime default locale in `pagination.tsx:20`,
`toolbar.tsx:8`, `selection-bar.tsx:5`; `toLocaleDateString()` for default date cells
(`column-adapter.ts:43`); `Intl.DateTimeFormat(undefined)` in the inline filter summary
(`inline-filters.tsx:386`). A server whose locale is `en-US` renders `1,240`; a `de-DE` browser
hydrates `1.240`. Text sorting uses `new Intl.Collator(undefined)` (`core/utils/sorting.ts:17`),
so row *order* can also differ between server and client for accented text.

**D7 — Low — Empty values sort first when descending.** The comparators document "null and
undefined always sort last regardless of direction", but TanStack applies the descending flip
after the comparator, and its `sortUndefined` option only covers `undefined`. `null` and `''`
lead a descending sort.

**D8 — Low — Non-numeric values sort as zero** in `compareNumber` (`sorting.ts:25`) instead of
as empty.

Pagination arithmetic (`getPageRange`, `getPageNumbers`) is correct and is kept. The page-reset
behaviour on new `data`, on sort and on filter in server mode is correct and deliberate.

### 3.3 Theme architecture

**T1 — High — The theme is a runtime JavaScript system.** `UIKitProvider`
(`theme/provider.tsx`) resolves a project through the OKLab engine on render, writes ~90 custom
properties as an inline style on a wrapper, or claims `<html>` through a module-level registry
in an insertion effect (`theme/global-root.ts`). Persisted projects come from `localStorage`
and are applied in a second commit after hydration (`useHydrated`). Server rendering needs
three inline `<style>` elements and CSP-nonce plumbing. The theme is only correct when
JavaScript has run, the provider is mounted above every usage, and the registry agrees with the
server.

**T2 — High — Automatic OS dark mode.** `styles/tokens.generated.css` ends with
`@media (prefers-color-scheme: dark) { :root:not(.light) { … } }`. An app that supports only
light mode renders dark kit components on every dark-OS machine while its own pages stay light.
The application must control the mode.

**T3 — Medium — Inconsistent dark-mode selectors.** Tokens respond to `.dark` and
`[data-sui-mode="dark"]`; DataTable `theme.dark` overrides respond to `.dark` and
`[data-theme="dark"]` (`lib/use-table-theme.ts:15-18`). An app that sets one attribute gets
half a dark theme.

**T4 — Medium — Table dark overrides are client-only.** `useTableTheme` injects its dark
stylesheet in `useInsertionEffect`, which never runs on the server, so the first paint of a dark
page uses the light overrides.

**T5 — Medium — Three overlapping theming APIs.** Provider `preset`/`brand`/`project`; the
`theme` prop with `createTheme` (plus deprecated `createTableTheme`, `TableTheme`,
`TableThemeTokens`); and raw CSS variables. The themes package re-exports palettes that also
ship from core and react.

**T6 — Low — Token names do not match shadcn.** Docs say the names "mirror shadcn", but they are
prefixed (`--sui-primary`), so an app's existing shadcn `globals.css` does not theme the kit.

**T7 — Medium — Portalled overlays depend on the provider.** Dropdown, Popover, Select, Tooltip,
Dialog, Sheet and HoverCard read `usePortalContainer()` from the theme context so a local-scope
theme reaches portals.

### 3.4 CSS and Tailwind

**C1 — High — Kit CSS is unlayered.** No stylesheet uses `@layer`. Tailwind v4 emits utilities
inside `@layer utilities`, and an unlayered declaration beats every layered one regardless of
specificity or order. `<Button className="bg-red-500">` can never change the button's background
under Tailwind v4, and the troubleshooting advice ("import the kit's CSS before Tailwind") cannot
fix it.

**C2 — Medium — `tailwind-merge` does nothing useful.** `cn()` runs `twMerge` over class lists
that are almost entirely `sui-*` classes, which tailwind-merge does not know and never merges;
it resolves conflicts only *between Tailwind utilities*. It is a runtime dependency that
provides no override behaviour, at v2, which predates Tailwind v4 class syntax.

**C3 — Low — One unminified 250 kB stylesheet**, built by string concatenation.

### 3.5 Packaging, bundling and tree-shaking

**P1 — Medium — Coarse bundles.** The React build emits `index.js` (235 kB) plus a shared
`data-table` chunk (120 kB). An app importing `Button` hands its bundler a single module
containing every component; dead-code elimination inside one large module is weaker than
module-level `sideEffects` pruning, and Next.js compiles the whole module for every client
boundary in development.

**P2 — Medium — Dual ESM + CJS builds.** Separate module instances for `import` and `require`
risk the dual-package hazard for React contexts (`SidebarContext`, `DataTableContext`,
`ToastContext`, `UIKitContext`). CJS declarations are byte-copied `.d.ts` files
(`scripts/emit-cjs-types.mjs`).

**P3 — Low — Type roll-up needs a patch.** `vite-plugin-dts` `rollupTypes` drops the import used
by the `ColumnMeta` augmentation; `vite.config.ts:13-21` re-inserts it with a string replace.

**P4 — Medium — The same symbols ship from three packages.** `defaultPalette`, `createTheme`,
`applyBrand`, `themeToCssVars` and more are exported by core, react and themes: three import
paths for one thing, and room for version skew.

**P5 — Low — `export-csv` peers on `@tanstack/table-core`** while the React package depends on
`@tanstack/react-table`, which brings its own `table-core`; two copies are possible, with
incompatible `Table` types.

### 3.6 TypeScript

**S1 — Low — Global `JSX` namespace** (`theme/project-switcher.tsx:127`), which React 19's types
no longer declare globally.

**S2 — Low — React 19 is in the peer range but untested.** The workspace's types and tests are
React 18 only.

### 3.7 API and design consistency

**A1 — Medium — Deprecated aliases are still exported and used internally**: Button
`solid`/`danger`/`md`, Badge `danger`/`accent`, `createTableTheme`, `TableTheme`,
`TableThemeTokens`. The table's own pagination still uses `variant="solid"`
(`components/pagination/pagination.tsx:115`).

**A2 — Medium — Duplicates.** `Stat` / `StatTile` duplicate `MetricTile` / `StatsCard`;
`AppShellSidebar` / `SidebarGroup` / `SidebarItem` duplicate `Sidebar` / `SidebarSection` /
`SidebarMenuItem`; two complete chart sets export the same names (`BarChart`, `Sparkline`) from
two entry points with different `seriesColor` signatures; two page-number implementations
(`ui/navigation.tsx` re-implements core's `getPageNumbers`); `StatusBadge` re-implements
`Badge`'s tones in separate CSS.

**A3 — Low — Vocabulary drift.** `Table` density is `compact | default | spacious`, the table
engine's is `compact | comfortable | spacious`; trend values are `flat` in one component and
`neutral` in others.

### 3.8 Repository hygiene

No repository-level defects. The working copy contains a local `package-lock.json`, but it is
git-ignored and untracked; `pnpm-lock.yaml` is the only lockfile of record.

## 4. Reuse, refactor or rewrite

| Area                                                         | Decision     | Why                                                                                              |
| ------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| Component implementations (forms, overlays, navigation, shell, cards, feedback) | Reuse        | Accessible, SSR-guarded, tested. Change boundaries, portals and tokens only.                     |
| DataTable parts, prop bags, state model, keyboard navigation | Reuse        | Sound design; state stays in one engine instance.                                                |
| DataTable filter/sort/query logic                            | Rewrite core | Must be framework-independent, time-zone explicit, locale-deterministic and runnable on a server. |
| Theme runtime (provider, registry, editor, switcher)         | Remove       | Replaced by CSS variables the application owns.                                                  |
| OKLab colour engine and palette generation                   | Reuse, relocated | Useful as a *build-time / server-time* generator of theme CSS, not as a runtime.              |
| Component CSS                                                | Refactor     | Keep rules; move to cascade layers and shadcn-named semantic tokens.                              |
| Build and packaging                                          | Rewrite      | Per-module output, per-file directives, ESM-only, single package.                                |

## 5. Component classification

KEEP = unchanged apart from package-wide mechanics (import paths, `'use client'`, tokens);
REFACTOR = API or architecture change; REWRITE = new implementation; REMOVE = with replacement.

### Primitives and forms

| Component                                                                 | Verdict  | Change / replacement                                                   |
| ------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `Button`, `ButtonGroup`, `buttonVariants`                                  | REFACTOR | Remove `solid`, `danger`, `md` aliases                                  |
| `Badge`, `badgeVariants`                                                   | REFACTOR | Remove `danger`, `accent` tones                                         |
| `Checkbox`, `Input`, `Separator`, `Skeleton`, `VisuallyHidden`             | KEEP     |                                                                        |
| `Popover`, `Select`, `Tooltip`, `DropdownMenu*`                            | REFACTOR | Portal to `body`; optional `container` prop instead of theme context    |
| `Calendar`, `DateField`, `TimeField`, `DateTimeField`, `Clock`             | KEEP     |                                                                        |
| `Field`, `Fieldset`, `Label`, `useFieldControl`                            | KEEP     |                                                                        |
| `InputGroup`, `RadioGroup`, `Slider`, `Switch`, `Textarea`, `Toggle`, `ToggleGroup` | KEEP |                                                                  |
| `Combobox`, `MultiCombobox`                                                | KEEP     |                                                                        |
| `PasswordInput`, `PasswordStrengthIndicator`, `PhoneInput`, `NumberInput`, `OtpInput`, `TagsInput`, `ColorInput`, `RatingInput` | KEEP |                                     |
| `FileUpload`, `ImageUpload`, `FloatingFormActions`                         | KEEP     |                                                                        |

### Surfaces, feedback, overlays, navigation

| Component                                                        | Verdict  | Change / replacement                                                           |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardIcon`, `CardContent`, `CardFooter` | KEEP |                                     |
| `Stat`                                                           | REMOVE   | `MetricTile`                                                                   |
| `StatsCard`, `MetricTile`, `MetricGrid`, `SummaryCard`, `BreakdownList` | KEEP |                                                                           |
| `Alert`, `Empty`, `Kbd`, `Progress`, `SegmentedBar`, `Spinner`, `StatusDot` | KEEP |                                                                         |
| `ToastProvider`, `Toaster`, `useToast`                           | KEEP     |                                                                                |
| `Avatar`, `AvatarGroup`                                          | KEEP     |                                                                                |
| `UserAvatar`                                                     | REFACTOR | Align size scale with `Avatar`                                                 |
| `StatusBadge`, `StatusRegistryProvider`                          | REFACTOR | Render through `Badge` tones                                                   |
| `StatusFlow`, `StepCard`                                         | KEEP     |                                                                                |
| `Dialog*`, `Sheet*`, `HoverCard*`                                | REFACTOR | Portal container as prop                                                       |
| `AlertDialog*`                                                   | REFACTOR | Portal container as prop                                                       |
| `ConfirmDialog`                                                  | KEEP     |                                                                                |
| `Accordion`, `Breadcrumb*`, `Collapsible`, `Tabs`, `SectionTabs` | KEEP     |                                                                                |
| `Pagination` (standalone)                                        | REFACTOR | Use core `getPageNumbers`                                                       |
| `Table` (standalone) and parts                                   | REFACTOR | Density vocabulary `compact | comfortable | spacious`                          |
| `PageHeader`, `CopyButton`, `HoldButton`                         | KEEP     |                                                                                |

### Application shell

| Component                                                                  | Verdict  | Change / replacement                                           |
| -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `AppShell`, `AppShellHeader`, `AppShellContent`, `SkipToContent`, `ScrollToTop`, `AppShellBottomNav`, `BottomNavItem` | KEEP |                                     |
| `AppShellSidebar`                                                          | REMOVE   | `Sidebar`                                                      |
| `SidebarGroup`                                                             | REMOVE   | `SidebarSection`                                               |
| `SidebarItem`                                                              | REMOVE   | `SidebarMenuItem`                                              |
| `Sidebar`, `SidebarProvider`, `SidebarNav`, `SidebarSection`, `SidebarMenu`, `SidebarMenuItem`, `SidebarBrand`, `SidebarUser`, `SidebarTrigger`, `useSidebar` | REFACTOR | `nonce` prop replaces the theme context |

### Theming

| Component / API                                                               | Verdict | Change / replacement                                                     |
| ----------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `UIKitProvider`, `UIKitContext`, `useUIKit`, `useProject`, `usePortalContainer` | REMOVE  | CSS variables (`theme.css`) + `.dark` class                              |
| `ProjectEditor`, `ProjectSwitcher`, `PalettePreview`, `TokenSwatchGrid`, `ProjectRegistry` | REMOVE | `createThemeCss()` at build/server time; apps build their own editor |
| `ColorModeToggle`, `useColorMode`                                             | REWRITE | Class-based, provider-free, works with or without `next-themes`          |
| `createTheme`, `createTableTheme`, `mergeThemes`, `themeToCssVars`, `TableTheme` | REMOVE | CSS variables / component tokens                                     |
| Colour engine (`mix`, `contrastRatio`, `readableForeground`, `generateScale`), palettes | REFACTOR | Server-safe `@shining-technologies/ui/theme`, emitting CSS          |
| Chrome themes (`minimalTheme`, `dashboardTheme`, `midnightTheme`)             | REMOVE  | `variant` / `density` props and `--sui-table-*` tokens                    |

### Charts and data table

| Component / API                                                            | Verdict  | Change / replacement                                                             |
| -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| SVG charts `LineChart`, `BarChart`, `PieChart`, `Sparkline`, `ChartContainer` | REMOVE | `@shining-technologies/ui/charts`: `TrendChart`, `BarChart`, `DonutChart`, `Sparkline` |
| Recharts `TrendChart`, `BarChart`, `DonutChart`, `GaugeChart`, `ScatterChart`, `Sparkline` | KEEP | Moved to `/charts`                                            |
| `StatTile`                                                                 | REMOVE   | `StatsCard` with `chart={<Sparkline />}`                                          |
| `DataTable`, `useTableInstance`, column adapter                            | REFACTOR | Core-driven filtering/sorting, `timeZone`/`locale` props, no `theme` prop          |
| Filter panel, inline filters, search box                                   | REFACTOR | Active-filter counting, typed values, robust controlled search                    |
| Table parts, cells, row actions, states, toolbar, built-in columns         | KEEP     | Locale from the table                                                            |
| `useTableTheme`                                                            | REMOVE   | CSS tokens                                                                       |
| Virtualized table                                                          | KEEP     | `@shining-technologies/ui/virtualized`                                           |
| CSV export (`export-csv` package)                                          | KEEP     | `@shining-technologies/ui/csv`                                                   |
| Filter predicates, operators, pagination arithmetic                        | REFACTOR | `@shining-technologies/ui/core`, time-zone explicit dates                         |
| —                                                                          | NEW      | `applyQuery`, `parseQuerySearchParams`, `serializeQuerySearchParams`, selection helpers |

### Adjustments made during implementation

Decisions revisited once the code, the tests and the integration apps could be measured.

| Component / API                                                                  | Final verdict | Change                                                                          |
| -------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `Separator`                                                                      | REWRITE       | Plain element with Radix's ARIA contract: a Server Component, one dependency fewer, no `asChild` |
| `Spinner`, `Empty`, `StatusDot`, `SegmentedBar`, `Kbd`                           | REFACTOR      | Split from `Progress` (Radix) so they render as Server Components               |
| `Breadcrumb` and parts                                                           | REFACTOR      | Own module; Server Components                                                   |
| `AppShell`, `AppShellHeader`, `AppShellContent`, `AppShellBottomNav`, `BottomNavItem`, `SkipToContent` | REFACTOR | Split from `ScrollToTop`; Server Components usable in `layout.tsx`   |
| Table search box (`DefaultSearch`)                                               | REWRITE       | Ignores late echoes of its own input when `globalFilter` is controlled          |
| CSV export                                                                       | REFACTOR      | `downloadTableCsv` in its own client module; the serialiser runs on a server    |
| Focus ring and reduced motion (`base.css`)                                       | REFACTOR      | No longer depend on the provider's wrapper class                                |
| Derived tokens (`tokens.css`)                                                    | REFACTOR      | Inherited values (density, dark shadows) separated from values recomputed per theme scope, so nested scopes keep an ancestor's density and dark mode |
| —                                                                                | NEW           | `useDataTableQueryState`, `ColorModeScript`, `useColorMode`, `ColorModeToggle`, `PortalContainerProvider` |

## 6. Target architecture

### 6.1 One package, several entry points

```text
packages/ui/src
├── index.ts               @shining-technologies/ui          all components + server-safe utilities
├── core/                  @shining-technologies/ui/core     no React, no DOM, no dependencies
│   ├── types/             state, column, filter types
│   ├── filtering/         coercion, calendar dates, operators, predicates
│   ├── sorting/           deterministic comparators, stable multi-sort
│   ├── pagination/        page ranges, page numbers, slicing
│   ├── selection/         row-selection state helpers
│   ├── columns/           column id / accessor resolution
│   ├── query/             applyQuery, URL search params, query identity
│   └── utilities/
├── theme/                 @shining-technologies/ui/theme    server-safe theme generator
│   ├── tokens.css         derived + component tokens, base layer
│   └── themes.css         default light/dark theme values
├── components/            @shining-technologies/ui/<name>   one folder per component family
│   ├── button/ badge/ card/ data-table/ sidebar/ layout/ …
├── charts/                @shining-technologies/ui/charts   Recharts (optional peer)
├── csv/                   @shining-technologies/ui/csv
├── hooks/  lib/           internal React utilities
└── styles/                component CSS
```

CSS entry points: `styles.css` (everything), `theme.css` (default theme values only),
`presets.css` (extra named themes), `tailwind.css` (Tailwind v4 `@theme inline` mapping).

### 6.2 Client/server boundary rules

1. **No package-wide directive.** Each module that uses hooks, context, refs, effects, event
   handlers, browser APIs or Radix starts with `'use client'`; nothing else does.
2. The build preserves modules, so each directive lands on exactly its own output file.
3. `core/` and `theme/` import nothing — not React, not a package, not a browser global.
4. Barrels (`index.ts`) never carry a directive, so importing a server-safe function from the
   root never pulls in client code.
5. `scripts/check-dist.mjs` enforces 1–4 on the built output, and the Next.js integration app
   imports every server-safe API from a Server Component during `next build`.

### 6.3 Theme: semantic tokens → CSS variables → components

```text
application CSS  ─┐   :root { --primary: …; --radius: … }   .dark { --primary: … }
theme.css        ─┤   the same names, zero specificity, cascade layer "base" — any app rule wins
                  ▼
tokens.css            derived tokens recomputed per theme scope:
                      --sui-radius-control: calc(var(--radius) - 2px)
                      --sui-row-hover: color-mix(in oklab, var(--muted) 70%, transparent)
                  ▼
component CSS         @layer components { .sui-btn--primary { background: var(--primary) } }
                      component tokens with defaults: var(--sui-table-header-bg, …)
                  ▼
application utilities (Tailwind @layer utilities, or unlayered app CSS) — always win
```

- Global semantic tokens use **shadcn names** (`--background`, `--primary`, `--border`, `--ring`,
  `--radius`, `--chart-1..5`, `--sidebar-*`), plus `--success`, `--warning`, `--info`. An app's
  existing shadcn `globals.css` themes the kit with no changes.
- Tokens shadcn does not define are prefixed `--sui-` (typography, density rhythm, component
  tokens), so they never collide with Tailwind's own theme variables.
- Dark mode is the `.dark` class only. OS-following is an opt-in snippet or `next-themes`.
- Scoped themes: any element with `data-theme` or `.sui-theme` recomputes derived tokens, so
  `<section data-theme="ember">` themes a subtree.
- No provider is required. `createThemeCss({ primary: '#be123c' })` (server-safe) generates a
  complete, contrast-checked light/dark theme as CSS for a build step, a route handler or a
  per-tenant `<style>` in a Server Component.
- Declaring `@layer theme, base, components, utilities;` matches Tailwind v4's order, so the kit
  sits under application utilities whether or not Tailwind is used.

### 6.4 DataTable layering

```text
core (framework-independent)
  filtering  sorting  pagination  selection  columns  query(applyQuery, search params)
      │                        │
      ▼                        ▼
React engine adapter      Server Components / route handlers / Server Actions
  useTableInstance: TanStack Table v8 as the row-model engine,
  filter fns, comparators and empty-last sorting supplied by core
      ▼
React UI: DataTable, parts, filters, toolbar, pagination (replaceable via components/slots)
```

The same `columns` array (or a shared schema without render functions) drives the browser and
the server, and `timeZone` / `locale` are explicit props, so client mode, server mode and SSR
return the same rows in the same order with the same text.

### 6.5 Build, types and dependencies

- Vite library build, **ESM only**, `preserveModules`, directive-preserving plugin, `sideEffects`
  limited to CSS; declarations emitted per file by `tsc` (no roll-up patches).
- Peer dependencies: `react`, `react-dom` (18.3 or 19); optional `recharts`, `@tanstack/react-virtual`.
- Dependencies: Radix primitives, `@tanstack/react-table` 8, `class-variance-authority`, `clsx`.
  Removed: `tailwind-merge`, the three `@shining-technologies/ui-kit-*` internal packages.
- `exports` map with explicit subpaths plus `./*` for per-component imports.

### 6.6 Verification

| Level              | What                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Unit (Vitest)      | core filtering (incl. time zones and DST), sorting, pagination, selection, applyQuery, URL params |
| Component          | ported component suites, DataTable filtering/sorting/pagination, parity with `applyQuery`      |
| Theme              | token contract, dark class, no colour literals in component CSS, layer order                   |
| Boundaries         | built-output check of directives and server-safe modules; RSC import test                      |
| Types              | `tsc` on the package and on both integration apps                                              |
| Integration        | Next.js App Router app: `next build`, SSR, Server Component usage, URL-driven server table; Vite + React app: dev and production build |

### 6.7 Versioning

- V2 is `@shining-technologies/ui@2.x`, developed alongside the V1 packages, which stay
  published and unchanged.
- V1 packages receive a deprecation notice pointing to the migration guide only once V2 is
  stable.
- `packages/ui/MIGRATION.md` maps every V1 import, prop and removed API to its V2 equivalent.

## 7. Risks and deliberate trade-offs

- **ESM only.** Removes the dual-package hazard; CommonJS-only toolchains (old Jest configs) need
  ESM support or a transform.
- **One stylesheet.** JavaScript tree-shakes per module; CSS remains a single file in V2.0
  (layered, minified). Per-component CSS is possible later without API changes.
- **TanStack Table 9** is released; V2 stays on 8 to keep the engine stable during
  consolidation. The engine is isolated behind `useTableInstance`, so moving later is contained.
- **Runtime theme editing** (the V1 project editor) is gone from the library. Applications that
  need it can generate CSS with `createThemeCss` and store it themselves.

## 8. Validation of `2.0.0-rc.0`

### Results

| Gate | Result |
| ---- | ------ |
| V2 unit, component, SSR (Node) and theme suites | **805 tests, 33 files, all pass**: 509 ported from V1, 296 new (core logic, time zones, `applyQuery` parity, theme contract, SSR determinism, colour mode, client/server boundaries, fixed-defect regressions) |
| V1 suites (unchanged packages) | 723 tests pass; 72 chart tests against Recharts 3 pass |
| Typecheck | V2 package and tests; root project |
| ESLint | Whole repository |
| Build output (`scripts/check-dist.mjs`) | 176 ESM modules: 92 `'use client'`, 84 server-safe; `core/` and `theme/` import nothing outside themselves and no browser global |
| Publishing | Publish check passes for all five packages; `attw` (ESM-only profile) green for every V2 entry point; `publint` "All good" |
| Stylesheet | `styles.css` 135.0 kB, 21.0 kB gzip (V1: 250 kB unminified) |
| Next.js 16.3.5, React 19.3 (tarball install) | `next build`; **19 production Playwright checks pass** with the server, the browser and the tables in three different time zones: no hydration warnings on any page; Server Components calling core and theme functions; URL-driven server table (typing, sort with page reset in one navigation, filters, reload, Back); Sydney-day date filter; server HTML of a client-mode table; overlays; dark mode at first paint; Tailwind override; charts; route handler. Turbopack dev smoke 7/7 |
| Vite 8, React 19.3 (tarball install) | Typecheck, build, 15 preview checks (filters, sorting, selection, expansion, row actions, CSV, overlays, colour mode, Tailwind override, charts, virtualization), dev smoke |
| TypeScript consumers | `moduleResolution: bundler` and `nodenext`, `skipLibCheck: false`, TypeScript 7.0.2 and 5.9.3: all entry points, inferred cell value types, `ColumnMeta` augmentation |

Tree-shaking (Vite production build, minified):

| Import | JS gzip |
| ------ | ------- |
| React alone, for comparison | 67.8 kB |
| `Button` from `@shining-technologies/ui` | 69.8 kB (no other component, no TanStack, no Recharts) |
| `Button` from `@shining-technologies/ui/button` | 69.8 kB (identical to the root import) |
| `applyQuery` from `/core` | 3.5 kB |
| `DataTable` | 141.9 kB |

In Next.js, a page rendering only server components (`Button`, `Card`) loaded no page-specific
client JavaScript; the data table and Recharts were loaded only by the routes that render them.

### Defects found by validation, all fixed

| Found by | Defect | Fix |
| -------- | ------ | ---- |
| Style suite | A nested `data-theme` reset an ancestor's density and dark-mode derived tokens | Inherited tokens separated from per-scope computed tokens in `tokens.css` |
| Boundary suite | CSV download (browser code) lived in an entry barrel | Own `'use client'` module; the serialiser stays server-safe |
| Review of the provider removal | The shared focus ring and reduced-motion rule required the provider's wrapper class | Applied to kit elements directly |
| Next.js app | `CellDate` and `CellNumber` ignored the table's `timeZone` and `locale`; `yyyy-mm-dd` shifted a day west of UTC, causing hydration error #418 | Cells follow the table; calendar dates format as calendar dates; regression tests in both suites |
| Next.js app design | Wiring each `onXChange` to the router loses a sort when the page resets in the same tick | `useDataTableQueryState` |
| Component reference | Pure components (`Empty`, `Spinner`, `Breadcrumb`, `AppShell` parts, `Separator`) were client modules only because they shared a file with interactive ones | Split into server modules |

### Not verified, or known limitations

- `next dev --webpack` failed intermittently on the test machine with Next.js internal errors
  (invalid tokens, truncated JSON) on a filesystem Next itself flagged as slow. Production builds and
  Turbopack dev passed every time. Not reproduced as a package defect, but not ruled out.
- Unit suites run on React 18.3 and the integration apps on React 19.3; no single suite runs on both.
- No visual regression (screenshot) tests. The CSS contract is enforced structurally (tokens,
  layers, colour literals), not pixel by pixel.
- CSS ships as one stylesheet; JavaScript tree-shakes per module.
- ESM only; TanStack Table stays on version 8.

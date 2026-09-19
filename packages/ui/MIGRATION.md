# Migrating to `@shining-technologies/ui` V2

V2 replaces four V1 packages with one:

| V1 package                                | V2                                   |
| ----------------------------------------- | ------------------------------------ |
| `@shining-technologies/ui-kit-react`      | `@shining-technologies/ui`           |
| `@shining-technologies/ui-kit-core`       | `@shining-technologies/ui/core`      |
| `@shining-technologies/ui-kit-themes`     | CSS: `@shining-technologies/ui/presets.css`, generator: `@shining-technologies/ui/theme` |
| `@shining-technologies/ui-kit-export-csv` | `@shining-technologies/ui/csv`       |
| `…/ui-kit-react/recharts`                 | `@shining-technologies/ui/charts`    |
| `…/ui-kit-react/virtualized`              | `@shining-technologies/ui/virtualized` |
| `…/ui-kit-react/styles.css`               | `@shining-technologies/ui/styles.css` |

The V1 packages keep working and stay published (with no further releases), so you can migrate
one application at a time.
Do not install V1 and V2 in the same application: both style the same `sui-*` class names.

Most of an application's code does not change. Components keep their names, props and
markup. Three things do change: **theming** (runtime JavaScript becomes CSS variables),
**imports**, and a short list of **removed duplicates and aliases**.

---

## 1. Install

```bash
npm uninstall @shining-technologies/ui-kit-react @shining-technologies/ui-kit-core \
  @shining-technologies/ui-kit-themes @shining-technologies/ui-kit-export-csv
npm install @shining-technologies/ui
# only if you use the charts or the virtualized table
npm install recharts @tanstack/react-virtual
```

Requirements: React 18.3 or 19, and a bundler or TypeScript setting that reads `exports`
(`moduleResolution: "bundler"`, `"node16"` or `"nodenext"`). V2 is **ESM only**.

## 2. Imports

Search and replace, in this order:

| Find                                           | Replace                               |
| ---------------------------------------------- | ------------------------------------- |
| `@shining-technologies/ui-kit-react/recharts`  | `@shining-technologies/ui/charts`     |
| `@shining-technologies/ui-kit-react/virtualized` | `@shining-technologies/ui/virtualized` |
| `@shining-technologies/ui-kit-react/styles.css` | `@shining-technologies/ui/styles.css` |
| `@shining-technologies/ui-kit-react`           | `@shining-technologies/ui`            |
| `@shining-technologies/ui-kit-core`            | `@shining-technologies/ui/core`       |
| `@shining-technologies/ui-kit-export-csv`      | `@shining-technologies/ui/csv`        |

Colour utilities (`mix`, `contrastRatio`, `readableForeground`, `parseColor`, `generateScale`, …)
moved from the root to `@shining-technologies/ui/theme`.

## 3. Theming

### What changed

V1 generated the theme **in the browser**: `<UIKitProvider>` ran the colour engine, wrote
~90 inline custom properties, persisted projects in `localStorage` and re-rendered after
hydration. V2's theme **is CSS**: semantic tokens with shadcn/ui names, defined by
`styles.css` and overridden by your own stylesheet. No provider, no JavaScript.

### Remove the provider

Delete `<UIKitProvider>`. If a `'use client'` providers file existed only for it, delete that
file too. Then pick the replacement for each prop you used:

| V1 `UIKitProvider` prop     | V2                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------ |
| none (defaults)             | Nothing to do: `styles.css` ships the same default palette.                          |
| `preset="slate"`            | `import '@shining-technologies/ui/presets.css'` and `<html data-theme="slate">`      |
| `brand="#be123c"` / `brand={{ primary, radius }}` | Generate CSS: `createThemeCss({ primary: '#be123c', radius: '0.5rem' })` (see below) |
| `project={definition}`      | Generate CSS from the definition's `seed` with `createThemeCss`                      |
| `mode` / `defaultMode`      | `<ColorModeScript defaultMode="system" />` in `<head>` plus `<ColorModeToggle />`, or `next-themes` with `attribute="class"` |
| `scope="global"`            | The default. Tokens live on `:root` and `.dark`.                                     |
| `scope="local"`             | Put `data-theme="…"` or `class="sui-theme"` plus token overrides on the wrapper. Wrap it in `<PortalContainerProvider>` if its dialogs must keep the theme |
| `nonce`                     | `<ColorModeScript nonce>` and `<Sidebar nonce>`                                     |
| `registry` / project editor | Removed. Store a seed per user or tenant and render `createThemeCss(seed)`          |
| `className` / `style`       | Put them on your own `<html>` or wrapper                                              |

A brand colour, generated once and shipped as CSS:

```ts
// scripts/theme.mjs — or a Server Component, or a route handler
import { createThemeCss } from '@shining-technologies/ui/theme'
export const css = createThemeCss({ primary: '#be123c', accent: '#f59e0b', radius: '0.5rem' })
```

```tsx
// app/layout.tsx (Server Component)
<head>
  <style dangerouslySetInnerHTML={{ __html: css }} />
</head>
```

`createThemeCss` keeps V1's guarantees: every filled colour gets a foreground that clears
WCAG AA, and input borders clear 3:1. Its output is safe to inline even for user-supplied
seeds.

### Token names

Semantic colour tokens lost their `--sui-` prefix and now match shadcn/ui, so an existing
shadcn `globals.css` themes the components as-is.

| V1                                                          | V2                               |
| ----------------------------------------------------------- | -------------------------------- |
| `--sui-background`, `--sui-foreground`                       | `--background`, `--foreground`   |
| `--sui-card`, `--sui-card-foreground`                        | `--card`, `--card-foreground`    |
| `--sui-popover`, `--sui-popover-foreground`                  | `--popover`, `--popover-foreground` |
| `--sui-primary`, `--sui-secondary`, `--sui-muted`, `--sui-accent` (+ `-foreground`) | `--primary`, `--secondary`, `--muted`, `--accent` (+ `-foreground`) |
| `--sui-destructive`, `--sui-success`, `--sui-warning`, `--sui-info` (+ `-foreground`) | `--destructive`, `--success`, `--warning`, `--info` (+ `-foreground`) |
| `--sui-border`, `--sui-input`, `--sui-ring`                  | `--border`, `--input`, `--ring`  |
| `--sui-chart-1` … `--sui-chart-5`                            | `--chart-1` … `--chart-5`        |
| `--sui-sidebar*`                                            | `--sidebar*`                     |
| `--sui-radius`                                              | `--radius`                       |

Radius, fonts and shadows use shadcn's names too (since 2.1):

| V1                                                          | V2                               |
| ----------------------------------------------------------- | -------------------------------- |
| `--sui-radius-sm`, `--sui-radius-control`, `--sui-radius-surface`, `--sui-radius-lg` | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` |
| `--sui-font-family`, `--sui-font-family-mono`                | `--font-sans`, `--font-mono`     |
| `--sui-shadow-surface`, `--sui-shadow-overlay`, `--sui-shadow-modal` | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |

The old names still work in 2.x when set on `:root`, and are removed in 3.0.

Everything else keeps its `--sui-` name (`--sui-header-background`, `--sui-row-hover`,
`--sui-control-height`, …). Those are now **derived** from the semantic tokens by `tokens.css`,
so setting `--primary` also retints selected rows, setting `--radius` also resizes control
corners, and setting `--spacing` also resizes controls and rows.

Removed: `--sui-popover-border` as a separately generated colour (it is `var(--border)`), and
the `CSS_VAR_MAP` / `CSS_VAR_NAMES` exports (use `SEMANTIC_TOKENS` from `/theme`).

### Dark mode

- V2 applies dark tokens only under `.dark`. **V1 also switched on dark tokens automatically
  when the operating system was dark**, even in apps without a dark mode. If you relied on
  that, render `<ColorModeScript defaultMode="system" />`.
- `[data-sui-mode="dark"]` is no longer a dark-mode selector; use the `.dark` class.
- `useColorMode()` now returns `{ mode, resolvedMode, setMode }` (V1: `{ mode, colorMode,
  setMode }` from the provider). It works without a provider.

### Overriding styles

Kit rules are in the `components` cascade layer and theme defaults in `base`, so your CSS and
your Tailwind utilities always win, whatever the import order. V1's advice to import the kit
stylesheet before Tailwind no longer applies. `cn()` is now `clsx` only; if your own code relied
on `cn()` merging conflicting Tailwind classes, use `tailwind-merge` directly.

## 4. Data table

| V1                                                    | V2                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `theme={…}` prop, V1's table `createTheme`, `createTableTheme`, `mergeThemes`, `themeToCssVars` | Removed (`createTheme` from `/theme` is an unrelated V2 function that generates a colour theme). Use `variant`, `density`, `className`, or CSS variables in `style` (`style={{ '--sui-header-background': '…' }}`) |
| `minimalTheme`, `dashboardTheme` (themes package)      | `variant="minimal"`, `variant="dashboard" density="compact"`                         |
| `midnightTheme`                                       | `className="dark"` on a wrapper, or your own `--sui-*` overrides                     |
| Density/variant inherited from the active project      | Pass `density` / `variant` (defaults: `comfortable`, `default`)                      |
| `features.selection.getRowId`                         | `getRowId`                                                                           |
| Part prop types `PaginationProps`, `EmptyStateProps`, `ErrorStateProps`, `LoadingStateProps`, `DataTableTableProps` | `DataTablePaginationProps`, `DataTableEmptyStateProps`, `DataTableErrorStateProps`, `DataTableLoadingStateProps`, `DataTableTableProps`. The unprefixed names now belong to the standalone `Pagination` and `Empty` components |

New props: `locale` (default `'en-US'`) and `timeZone`.

### Behaviour changes

These are fixes. Each one changes output, so check tables that depended on the old behaviour.

1. **Date filters use an explicit time zone.** A timestamp's day is decided in `timeZone`
   (runtime zone when unset). V1 used whichever process ran the filter, so a UTC server and a
   browser in Australia disagreed. Pass `timeZone` for any server-rendered or server-filtered
   table. Inclusive ends are now exact on daylight-saving days.
2. **Formatting uses `locale`, default `en-US`.** V1 used the runtime's default locale for
   row counts and default date cells, which differs between server and browser and broke
   hydration. Pass `locale` to keep your users' formatting.
3. **Empty values sort last in both directions.** V1 put `null` and `''` first when
   descending.
4. **Text sorting uses `locale`'s collator** (numeric: `item 9` before `item 10`) instead of
   TanStack's default comparator, for columns without `sortingFn`.
5. **Columns without a `filter` config filter as text `contains`**, case- and
   accent-insensitive, instead of TanStack's auto filter.
6. **Only filters that narrow the result are counted.** The panel badge, the active-filter
   chips, `onQueryChange` and URL serialisation ignore an entry whose value was cleared. V1
   showed "Filters, 1 active" with nothing filtered.
7. **Panel filters store typed values.** A numeric select option is stored as `2`, not `"2"`,
   and number inputs store numbers, matching the inline filter layout.
8. **`between` accepts a reversed range** (`[200, 80]` means 80 to 200).
9. **The search box keeps what the user types** when `globalFilter` is controlled through a
   slow round trip (a URL), instead of reverting to an older value.

### New: the same logic on a server

Filtering, sorting and pagination live in `@shining-technologies/ui/core` and run anywhere:

```ts
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'

const query = parseQuerySearchParams(await searchParams, { columns })
const page = applyQuery(rows, query, { columns, timeZone: 'Australia/Sydney' })
```

V1's server example treated every filter as "contains". Replace hand-written query handling
with `applyQuery`, or use it as the reference to test your database query against.

## 5. Removed components and APIs

| Removed                                   | Use instead                                                        |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `Stat`                                    | `MetricTile`                                                        |
| `StatTile` (charts)                       | `StatsCard` with `chart={<Sparkline />}`                            |
| `AppShellSidebar`                         | `Sidebar`                                                           |
| `SidebarGroup`                            | `SidebarSection`                                                    |
| `SidebarItem`                             | `SidebarMenuItem` (`label` prop instead of children)               |
| `UIKitProvider`, `UIKitContext`, `useUIKit`, `useProject` | CSS variables; see section 3                           |
| `ProjectEditor`, `ProjectSwitcher`, `PalettePreview`, `TokenSwatchGrid` | Removed                              |
| `ProjectRegistry`, `globalProjectRegistry`, `createProject`, `updateProject`, `forkProject`, `resolveProject`, `applyBrand`, `generateColors` (root) | `createTheme` / `createThemeCss` / `generateColors` from `/theme` |
| `BUILT_IN_PALETTES`, `paletteById`, `defaultPalette`, `*Palette` | `THEME_PRESETS` from `/theme`, `presets.css`              |
| V1 `ColorModeToggle`                      | V2 `ColorModeToggle` (no provider; `mode`/`onModeChange` for `next-themes`) |
| `usePortalContainer` from the provider    | `PortalContainerProvider` + `usePortalContainer`                   |
| `useTableTheme`                           | Removed                                                             |
| Button `variant="solid"`, `variant="danger"`, `size="md"` | `variant="default"`, `variant="destructive"`, `size="default"` |
| `Separator` `asChild`                     | Render your own element with `role="separator"`; `Separator` is now a plain `div` |
| Badge `tone="danger"`, `tone="accent"`    | `tone="destructive"`, `tone="primary"`                              |

### Dependency-free SVG charts

`LineChart`, `BarChart`, `PieChart`, `Sparkline` and `ChartContainer` from the V1 root are removed.
The Recharts set (`@shining-technologies/ui/charts`, requires `recharts`) replaces them.

**`LineChart` → `TrendChart`**

| V1                                     | V2                                                  |
| -------------------------------------- | --------------------------------------------------- |
| `area`                                 | `variant="area"`                                    |
| `showPoints` (default `false`)         | `showPoints` (`true` \| `false` \| `'auto'`, default `'auto'`) |
| `showYAxis`                            | `showYAxis` (also `'auto'`)                         |
| `connectNulls`, `margin`               | No equivalent                                       |
| `ariaLabel`                            | `aria-label` or `title`                             |

**`BarChart` → `BarChart` from `/charts`**

| V1                     | V2                                          |
| ---------------------- | ------------------------------------------- |
| `horizontal` (ignored) | `orientation="bars"`                        |
| `showYAxis`            | `showValueAxis`                             |
| `stacked`              | `stacked` (also `'percent'`)                |
| `startAtZero`, `barRatio` | No equivalent (always from zero, fixed gaps) |

**`PieChart` → `DonutChart`**

| V1                     | V2                                                   |
| ---------------------- | ---------------------------------------------------- |
| `innerRadius`          | `variant="donut"` or `variant="pie"` (fixed ratio)   |
| `centerLabel`          | `centerValue`                                        |
| `centerCaption`        | `centerLabel` (note the swap)                        |
| `legend: boolean`      | `legend: 'auto' \| 'always' \| 'interactive' \| false` |

**`Sparkline` → `Sparkline` from `/charts`**: `area` becomes `variant` (default `'area'`);
`smooth` and `strokeWidth` have no equivalent; default `height` is 40 instead of 28.

Common to all charts: `showTableToggle` now defaults to `true` (the new `GaugeChart` defaults to
`false`); `title`, `description`,
`actions`, `loading` and `unit` are new.

## 6. Next.js

- Remove the `'use client'` providers file if it held only `UIKitProvider`.
- Import `createColumnHelper`, `getPageNumbers`, `applyQuery` and every other function from
  `@shining-technologies/ui` in Server Components. V1 marked its whole bundle as client code,
  so calling them on the server failed.
- `Button`, `Badge`, `Card`, `Alert`, `Table`, `Breadcrumb`, `Empty`, `Separator`, the `AppShell`
  layout parts and the icons render as Server Components with no
  client JavaScript.
- Column definitions with `cell` renderers still belong in a client file. To filter on the
  server with the same columns, keep a render-free column list in a shared module (see the
  Next.js guide).

## 7. Checklist

- [ ] Replace the four V1 packages with `@shining-technologies/ui`
- [ ] Rewrite imports (section 2)
- [ ] Delete `UIKitProvider`; replace presets, brand, mode and nonce (section 3)
- [ ] Rename `--sui-<semantic>` overrides in your CSS (section 3)
- [ ] Add `<ColorModeScript>` if you support dark mode
- [ ] Replace the DataTable `theme` prop; pass `locale` and `timeZone` (section 4)
- [ ] Replace removed components and aliases (section 5)
- [ ] Run your test suite; review tables affected by the behaviour changes (section 4)

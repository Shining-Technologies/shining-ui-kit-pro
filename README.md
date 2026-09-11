# Shining UI Kit

[![npm](https://img.shields.io/npm/v/@shining-technologies/ui-kit-react.svg)](https://www.npmjs.com/package/@shining-technologies/ui-kit-react)
[![CI](https://github.com/Shining-Technologies/shining-ui-kit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/Shining-Technologies/shining-ui-kit-pro/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@shining-technologies/ui-kit-react.svg)](LICENSE)
[![types](https://img.shields.io/badge/types-included-blue.svg)](docs/guide/installation.md#typescript)

A React component library whose entire appearance comes from a **project** — a named set of
seed colours and shape decisions that you can swap, edit or create at runtime.

Buttons, cards, forms, overlays, charts and a production-grade data table, all painted from
one generated token set. Switch project and every component follows.

```tsx
import {
  UIKitProvider,
  Button,
  Card,
  CardContent,
  LineChart,
} from '@shining-technologies/ui-kit-react'
import '@shining-technologies/ui-kit-react/styles.css'

export function App() {
  return (
    <UIKitProvider preset="shining" scope="global">
      <Card>
        <CardContent>
          <LineChart data={revenue} xKey="month" series={[{ key: 'total' }]} area />
          <Button>Export</Button>
        </CardContent>
      </Card>
    </UIKitProvider>
  )
}
```

## Why it exists

A design system usually asks you to author a token file: forty-odd colours, then the same
forty again for dark mode, then a chart palette, then the hover and selected states — and
every one of them is a chance to ship an unreadable pair.

This kit inverts that. A project is **four colours and a shape**:

```ts
createProject({
  name: 'Acme',
  seed: { primary: '#7c3aed', accent: '#ec4899' },
  shape: { radius: '0.75rem', density: 'comfortable', elevation: 'soft' },
})
```

Everything else is derived in OKLab: the neutral ramp, the hover and selected surfaces, the
border and input strokes, the five chart series, the whole dark mode, and a **readable
foreground for every filled surface**. A test asserts that every shipped palette — and any
seed you throw at it — clears WCAG AA on fourteen text/background pairs in both modes.

Two rules make it hold together:

- **No component hardcodes a colour.** Every rule resolves to a `--sui-*` custom property.
  This is enforced by a test that scans the stylesheets, not by review.
- **Behaviour and appearance are separate systems.** Changing project, density or variant
  cannot change what a component does.

## Projects

A project is plain data, so it round-trips through JSON — into localStorage, a database row,
or a config file in the app that consumes it.

```tsx
import { ProjectRegistry, UIKitProvider, ProjectSwitcher, ProjectEditor } from '@shining-technologies/ui-kit-react'

const registry = new ProjectRegistry() // persists to localStorage

<UIKitProvider registry={registry} scope="global">
  <ProjectSwitcher />   {/* switch between presets and your own projects */}
  <ProjectEditor />     {/* create or edit one: presets, colour pickers, shape */}
  <App />
</UIKitProvider>
```

Editing a shipped preset forks it rather than mutating it, so the presets stay a stable
starting point and the user still gets their change.

**Shipped presets:** `shining` (the Shining Services house style), `slate`, `midnight`,
`violet`, `ember`, `forest`, `rose`, `mono`, `darwind` (indigo, sharp, dense) and `unn`
(teal, round, airy).

Most apps only need a preset and, optionally, their brand on top of it:

```tsx
<UIKitProvider preset="darwind" scope="global">
<UIKitProvider preset="unn" brand="#be123c" scope="global">
<UIKitProvider preset="unn" brand={{ primary: '#be123c', radius: '0.5rem' }} scope="global">
```

`scope="global"` writes the tokens onto `<html>`, which is what an application wants. `scope="local"`
wraps the subtree instead, so several projects can be previewed side by side. Dialogs,
dropdowns and tooltips are themed in both.

## Install

```bash
npm install @shining-technologies/ui-kit-react react react-dom
```

```tsx
import '@shining-technologies/ui-kit-react/styles.css'
```

Optional peers, only for the entry point that needs them: `recharts` (2.15+ or 3) for
`@shining-technologies/ui-kit-react/recharts`, and
`@tanstack/react-virtual@^3` for `@shining-technologies/ui-kit-react/virtualized`.

The stylesheet is plain, framework-free CSS built from `--sui-*` custom properties, so
components look right with **no Tailwind configuration** in your app, and with no provider
mounted at all — the defaults are generated from the `shining` project. If you do use
Tailwind, it remains your styling layer: every `className` prop is merged through
`tailwind-merge`, so your utilities win.

Types are included; both ESM and CommonJS builds ship, and every entry point resolves under
`bundler`, `node16`, `nodenext` and legacy `node` resolution. The bundles carry a
`'use client'` banner, so they work unchanged in the Next.js App Router. Full notes:
[Installation](docs/guide/installation.md).

| Package                                          | For                                                           |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `@shining-technologies/ui-kit-react`             | Every component, the provider and the theming UI              |
| `@shining-technologies/ui-kit-core`              | Tokens, the colour engine, the project system, no React       |
| `@shining-technologies/ui-kit-themes`            | Shipped presets: project palettes and table chrome themes     |
| `@shining-technologies/ui-kit-export-csv`        | CSV/TSV export, kept out of the main bundle                   |
| `@shining-technologies/ui-kit-react/recharts`    | The Recharts chart set (optional peer: `recharts`)            |
| `@shining-technologies/ui-kit-react/virtualized` | Row virtualisation (optional peer: `@tanstack/react-virtual`) |

Most applications install only the first. See [Packages](docs/reference/packages.md) for what
belongs in each.

## What's in it

**Actions** — Button (6 variants × 6 sizes), ButtonGroup, Toggle, ToggleGroup, Badge
(6 tones × 3 variants), DropdownMenu, Tooltip.

**Surfaces** — Card and its parts (including a tinted CardIcon), Stat, Alert (5 tones), Avatar
and AvatarGroup, Separator, Skeleton, Spinner, Progress, SegmentedBar, StatusDot, Empty (panel or
inline), Kbd.

**Form inputs** — Field (label, control, help text and error, wired together), Fieldset,
Label, Input, InputGroup, Textarea (optional auto-grow and counter), Checkbox, RadioGroup,
Switch, Select, Slider — plus the typed fields: PasswordInput (reveal, strength, Caps Lock),
PhoneInput (240 countries, searchable, E.164 out), NumberInput (real steppers, precision,
clamping), OtpInput (one box per character, paste-aware), TagsInput, ColorInput, RatingInput,
DateField, TimeField and DateTimeField over the kit's own Calendar and Clock, ImageUpload
(thumbnail grid) and FileUpload.

**Navigation** — Tabs (pills, underline, vertical), Accordion, Collapsible, Breadcrumb,
Pagination.

**Overlays** — Dialog, AlertDialog, Sheet (4 sides), Popover, HoverCard.

**Composites** — Table (the plain one, for a fixed handful of rows), StatusBadge (registry-driven,
so the vocabulary stays in your app), StatsCard, MetricTile and MetricGrid, BreakdownList,
SummaryCard, StatusFlow (a lifecycle drawn in the badge vocabulary), StepCard, PageHeader, SectionTabs, Combobox and
MultiCombobox (local filtering until you pass `onSearch`), PasswordStrengthIndicator,
ConfirmDialog, CopyButton, HoldButton, UserAvatar, FloatingFormActions, and toasts
(`ToastProvider`, `useToast`, `Toaster`).

**Application shell** — AppShell with sidebar, header, content and bottom-nav slots,
SidebarGroup and SidebarItem, BottomNavItem, SkipToContent and ScrollToTop. One skeleton, filled
differently by a field app and an admin console; below 48rem the rail becomes a bottom bar
without switching components.

**Dashboard sidebar** — Sidebar, SidebarNav, SidebarSection and SidebarMenuItem: toned sections,
destinations nested to any depth, an icon rail with tooltips and flyouts, a filter, arrow-key
navigation, a phone drawer, SidebarBrand / SidebarUser menus and remembered state. Feed it a tree
or write it by hand.

**Charts** — two sets, one palette. `LineChart`, area, `BarChart` (grouped and stacked),
`PieChart`, donut and `Sparkline` are dependency-free SVG in the base package. For a richer
set, `@shining-technologies/ui-kit-react/recharts` adds `TrendChart`, `BarChart`, `DonutChart`,
`GaugeChart`, `ScatterChart` and `StatTile` on Recharts — a subpath export with `recharts` as
an optional peer dependency, so it costs nothing until you import it. Both draw from
`--sui-chart-1..5`, so a chart belongs to its project the same way a button does.

**Data table** — the full `<DataTable>`: sorting, search, per-column filters, pagination,
selection, expandable rows, column visibility, resizing and pinning, two filter layouts, a
container-aware card layout, virtualisation and full keyboard support. See the table
documentation below.

### Fields wire themselves

```tsx
<Field label="Email" description="We never share it." error={errors.email} required>
  <Input {...register('email')} />
</Field>
```

The control is never told the ids. It reads `id`, `aria-describedby`, `aria-invalid`,
`disabled` and `required` from the surrounding field, so the thing hand-written forms
usually get wrong is not something you can get wrong here.

### Charts follow the project

```tsx
<LineChart
  data={months}
  xKey="month"
  series={[
    { key: 'bookings', label: 'Bookings' },
    { key: 'completed', label: 'Completed' },
  ]}
  area
  smooth
/>
```

No colours passed. The series take `--sui-chart-1..5`, which the generator walks from your
primary hue to your accent hue so the family reads as one brand, with the lightness
zig-zagged so neighbouring series stay apart in greyscale.

## The data table

`<DataTable data={users} columns={columns} />` gives you a polished table with sorting,
search, per-column filters, pagination, a column picker, an empty state and full keyboard
support. Everything after that first line is opt-in — and everything is replaceable.

The switches most tables reach for first:

```tsx
<DataTable
  data={orders}
  columns={columns}
  title="Orders" // a title and a description, inside the component
  description="Cancelled orders stay in the list — they are still owed a reason."
  filterLayout="inline" // filters flat in the toolbar, or "panel" behind one button
  responsiveMode="auto" // cards when the table's own container is narrow
  tableLayout="fixed" // honour column sizes and truncate, or "auto" to fit content
  maxHeight="60vh" // a fixed frame: header and footer stay, rows scroll
  rowActions={(row) => (
    // As many icons as the row needs, under a real "Actions" header,
    // in a column frozen to the right edge.
    <RowActionGroup>
      <RowAction icon={Eye} label="View" href={`/orders/${row.original.id}`} />
      <RowAction icon={Trash2} label="Delete" destructive onClick={…} />
    </RowActionGroup>
  )}
/>
```

Every part receives a **prop bag** that already contains its ARIA attributes, data
attributes, geometry and event handlers, so a custom row inherits behaviour it never had to
know about:

```tsx
const MyRow = ({ rowProps, children }: RowProps<User>) => (
  <tr {...rowProps} className={cn(rowProps.className, 'my-row')}>
    {children}
  </tr>
)

<DataTable data={users} columns={columns} components={{ Row: MyRow }} />
```

## Repository

```text
packages/core         tokens, colour engine, project system, table engine (no React)
packages/react        provider, components, charts, data table, styles
  src/charts            dependency-free SVG charts (root export)
  src/recharts          the Recharts chart set (subpath export)
packages/themes       shipped presets
packages/export-csv   optional CSV export
apps/gallery          the component gallery and project editor
examples/             the real-world tables, shared by Storybook and the gallery
stories/              Storybook stories
tests/                integration, theming, accessibility and performance tests
docs/                 guide, components, data table, reference, contributing
scripts/              token generation, CSS bundling, publish and docs checks
.changeset/           pending version bumps
```

## Development

```bash
pnpm install
pnpm gallery      # the component gallery
pnpm storybook    # component workbench
pnpm check        # lint + typecheck + tests + docs links
pnpm build        # build all publishable packages
pnpm tokens       # regenerate the default token stylesheet
```

## Releasing

```bash
pnpm changeset          # describe a change and the bump it needs
pnpm version:packages   # consume the changesets, bump versions, write changelogs
pnpm publish:dry        # build, run the pre-publish preflight, pack without publishing
pnpm release            # build, preflight, publish to npm
```

The preflight refuses to publish an unbuilt or stale `dist`, a package missing its README or
metadata, or type declarations that fail to resolve under any of the four TypeScript module
resolutions. On CI, a push to `master` opens a **Version Packages** pull request; merging it
publishes. Details in [Releasing](docs/contributing/releasing.md).

## Documentation

Full index: **[docs/README.md](docs/README.md)**

| Guide                                            |                                                         |
| ------------------------------------------------ | ------------------------------------------------------- |
| [Installation](docs/guide/installation.md)       | Packages, peer dependencies, the stylesheet, frameworks |
| [Quick start](docs/guide/quick-start.md)         | The provider, your first components, your first table   |
| [Forms](docs/guide/forms.md)                     | React Hook Form, native submission, value formats       |
| [Next.js and SSR](docs/guide/nextjs.md)          | App Router setup, no theme flash, routing, CSP          |
| [Projects](docs/guide/projects.md)               | Seeds, palettes, the registry, custom colours           |
| [Theming](docs/guide/theming.md)                 | Tokens, variants, density, dark mode                    |
| [Customization](docs/guide/customization.md)     | Slots, component overrides, classes                     |
| [Accessibility](docs/guide/accessibility.md)     | What the kit guarantees, and what you owe it            |
| [Performance](docs/guide/performance.md)         | Stable references, memoisation, virtualisation          |
| [Troubleshooting](docs/guide/troubleshooting.md) | Install errors, styles, TypeScript, tests, the table    |

| Components                                               |                                                |
| -------------------------------------------------------- | ---------------------------------------------- |
| [Component overview](docs/components/overview.md)        | Every component, its props and its intent      |
| [Charts](docs/components/charts.md)                      | Series, scales, and the chart palette          |
| [Charts on Recharts](docs/components/charts-recharts.md) | Six forms, responsive rules, the palette audit |

| Data table                                            |                                                   |
| ----------------------------------------------------- | ------------------------------------------------- |
| [Columns](docs/data-table/columns.md)                 | Accessors, typing, meta, grouped headers          |
| [Cells](docs/data-table/cells.md)                     | Custom cells and the cell toolkit                 |
| [Sorting](docs/data-table/sorting.md)                 | Cycles, multi-sort, comparators, server mode      |
| [Filtering](docs/data-table/filtering.md)             | Types, operators, both filter layouts, predicates |
| [Pagination](docs/data-table/pagination.md)           | Client and server pagination                      |
| [Selection](docs/data-table/selection.md)             | Single, multiple, disabled rows, persistence      |
| [Column UI](docs/data-table/columns-ui.md)            | Visibility, resizing, pinning                     |
| [Expandable rows](docs/data-table/expandable-rows.md) | Detail rows and expansion state                   |
| [Responsive](docs/data-table/responsive.md)           | Scroll, cards, the fixed frame, column widths     |
| [Server-side](docs/data-table/server-side.md)         | Query state and data fetching                     |

| Reference and contributing                       |                                                 |
| ------------------------------------------------ | ----------------------------------------------- |
| [API reference](docs/reference/api-reference.md) | Every prop, type and export                     |
| [Packages](docs/reference/packages.md)           | The four published packages and what is in each |
| [Development](docs/contributing/development.md)  | Repo layout, scripts, tests, Storybook          |
| [Releasing](docs/contributing/releasing.md)      | Changesets, versioning, publishing to npm       |

## Licence

MIT

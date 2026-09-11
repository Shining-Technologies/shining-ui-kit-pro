# @shining-technologies/ui-kit-react

[![npm](https://img.shields.io/npm/v/@shining-technologies/ui-kit-react.svg)](https://www.npmjs.com/package/@shining-technologies/ui-kit-react)
[![bundle](https://img.shields.io/bundlephobia/minzip/@shining-technologies/ui-kit-react)](https://bundlephobia.com/package/@shining-technologies/ui-kit-react)
[![types](https://img.shields.io/npm/types/@shining-technologies/ui-kit-react.svg)](https://www.npmjs.com/package/@shining-technologies/ui-kit-react)
[![license](https://img.shields.io/npm/l/@shining-technologies/ui-kit-react.svg)](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/LICENSE)

A React component library whose entire appearance comes from **one swappable palette**.

Buttons, forms, overlays, charts, an application shell, a dashboard sidebar and a
production-grade data table, all painted from a single generated token set. Pick a preset or
give it your brand colour, and every component follows, including dark mode, hover states,
chart series and a contrast-checked text colour for every filled surface.

- **70+ components**, accessible by default (Radix UI underneath, axe-tested)
- **Themeable from one colour**: `brand="#be123c"` and the rest is derived in OKLCH, WCAG AA-checked
- **No Tailwind required.** Plain CSS custom properties, which your Tailwind classes still override
- **Server-rendered**: works in the Next.js App Router, with no flash of the wrong theme
- **Forms that submit**: every custom input works with `<form>`, Server Actions and React Hook Form
- **TypeScript-first**: ESM + CJS, types for every resolution mode, React 18 and 19

```tsx
import {
  UIKitProvider,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@shining-technologies/ui-kit-react'
import '@shining-technologies/ui-kit-react/styles.css'

export function App() {
  return (
    <UIKitProvider preset="shining" brand="#7c3aed" scope="global">
      <Card>
        <CardHeader>
          <CardTitle as="h2">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Get started</Button>
        </CardContent>
      </Card>
    </UIKitProvider>
  )
}
```

---

## Install

```bash
npm install @shining-technologies/ui-kit-react
# or
pnpm add @shining-technologies/ui-kit-react
# or
yarn add @shining-technologies/ui-kit-react
```

`react` and `react-dom` 18 or 19 are peer dependencies. Everything else (Radix UI, TanStack
Table and the class helpers) installs with the package.

Two entry points have optional peers, which you install only if you import them:

| Import                                           | Also install                 |
| ------------------------------------------------ | ---------------------------- |
| `@shining-technologies/ui-kit-react/recharts`    | `recharts` — 3.x, or 2.15+   |
| `@shining-technologies/ui-kit-react/virtualized` | `@tanstack/react-virtual@^3` |

---

## Set up in two steps

**1. Import the stylesheet once**, in your root layout or entry file:

```ts
import '@shining-technologies/ui-kit-react/styles.css'
```

**2. Wrap the app in `UIKitProvider`:**

```tsx
<UIKitProvider preset="shining" defaultMode="system" scope="global">
  <App />
</UIKitProvider>
```

- `preset` picks a complete design: `shining`, `slate`, `midnight`, `violet`, `ember`,
  `forest`, `rose`, `mono`, `darwind`, `unn`. Your editor autocompletes them.
- `brand` puts your colour (or `{ primary, accent, radius, density, fontFamily, … }`) on top.
- `defaultMode` is `'light'`, `'dark'` or `'system'`.
- `scope="global"` themes the whole page. Use it for applications.

Components also render without a provider, in the default `shining` design.

### Next.js App Router

The bundles carry `'use client'`, so they import cleanly from Server Components. Put the
provider in a client file:

```tsx
// app/providers.tsx
'use client'
import { UIKitProvider } from '@shining-technologies/ui-kit-react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIKitProvider preset="shining" defaultMode="system" scope="global">
      {children}
    </UIKitProvider>
  )
}
```

```tsx
// app/layout.tsx
import '@shining-technologies/ui-kit-react/styles.css'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

The theme is server-rendered, so the first paint is already in your colours. Full guide:
[Next.js and server rendering](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/nextjs.md).

**Vite, React Router, Remix, Astro:** import the stylesheet in your entry module and mount the
provider at the root. Nothing else is needed.

---

## Usage

### Forms

`Field` wires the label, help text and error to whatever control is inside it. You never pass
an id.

```tsx
import { Field, Input, PhoneInput, Button } from '@shining-technologies/ui-kit-react'

;<form action={saveContact}>
  <Field label="Email" description="We never share it." error={errors.email} required>
    <Input name="email" type="email" />
  </Field>

  <Field label="Mobile">
    <PhoneInput name="phone" defaultCountry="AU" /> {/* submits +61412345678 */}
  </Field>

  <Button type="submit">Save</Button>
</form>
```

The typed inputs: `PasswordInput`, `PhoneInput` (240 countries, E.164 out), `NumberInput`,
`OtpInput`, `TagsInput`, `ColorInput`, `RatingInput`, `DateField`, `TimeField`,
`DateTimeField`, `Combobox` / `MultiCombobox`, `FileUpload` and `ImageUpload`. Every one of them
works controlled (`value` + `onValueChange`), uncontrolled (`defaultValue`), and in a native form
(`name`).

With React Hook Form, `register` works on the text inputs, and a `Controller` works on the rest:

```tsx
<Controller
  name="phone"
  control={control}
  render={({ field, fieldState }) => (
    <Field label="Mobile" error={fieldState.error?.message}>
      <PhoneInput
        ref={field.ref}
        value={field.value}
        onValueChange={field.onChange}
        onBlur={field.onBlur}
      />
    </Field>
  )}
/>
```

→ [Forms guide](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/forms.md):
which control takes which, value formats and native submission.

### Data table

```tsx
import { DataTable, type ColumnDef } from '@shining-technologies/ui-kit-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', meta: { filter: { type: 'select' } } },
]

export function Users({ users }: { users: User[] }) {
  return (
    <DataTable
      data={users}
      columns={columns}
      label="Users"
      getRowId={(user) => user.id}
      enableRowSelection
    />
  )
}
```

Sorting, search, pagination, a column picker, empty and loading states and full keyboard
support come with the first line. Filtering, selection, expandable rows, resizing, pinning, a
responsive card layout, virtualisation and server-side mode are opt-in.

**Server-side** data: set `mode="server"`, pass `rowCount`, and fetch in `onQueryChange`:

```tsx
const [query, setQuery] = useState<DataTableQuery | null>(null)
const { data, isFetching, error, refetch } = useQuery({
  queryKey: ['users', query],
  queryFn: () => api.users(query!),
  enabled: !!query,
  placeholderData: keepPreviousData,
})

<DataTable
  mode="server"
  data={data?.rows ?? EMPTY}
  rowCount={data?.total}
  columns={columns}
  loading={isFetching}
  error={error}
  onRetry={refetch}
  getRowId={(row) => row.id}
  onQueryChange={setQuery}
/>
```

Keep `columns` stable (a module constant or `useMemo`). A new array on every render rebuilds the
table.

### Charts

Two chart sets share one palette, so a chart belongs to its theme the same way a button does.

```tsx
// Dependency-free SVG, in the root entry
import { LineChart, BarChart, PieChart, Sparkline } from '@shining-technologies/ui-kit-react'

;<LineChart
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

```tsx
// Richer, on Recharts (npm install recharts)
import { TrendChart, DonutChart, GaugeChart } from '@shining-technologies/ui-kit-react/recharts'
```

No colours to pass. Series take `--sui-chart-1` to `--sui-chart-5`, derived from your brand.

### Application shell and sidebar

```tsx
import {
  AppShell, AppShellContent, AppShellHeader, Sidebar, SidebarNav, SidebarProvider, SidebarTrigger,
  type SidebarNavEntry,
} from '@shining-technologies/ui-kit-react'

const NAV: SidebarNavEntry[] = [
  { id: 'home', label: 'Dashboard', href: '/' },
  {
    type: 'section',
    id: 'sales',
    label: 'Sales',
    items: [
      { id: 'orders', label: 'Orders', href: '/orders', badge: 3 },
      { id: 'customers', label: 'Customers', href: '/customers' },
    ],
  },
]

<SidebarProvider storageKey="app-nav">
  <AppShell>
    <Sidebar>
      <SidebarNav items={NAV} currentPath={pathname} renderLink={(props) => <Link {...props} />} />
    </Sidebar>
    <AppShellHeader start={<SidebarTrigger />} />
    <AppShellContent id="main">{children}</AppShellContent>
  </AppShell>
</SidebarProvider>
```

The sidebar collapses to an icon rail, becomes a drawer on phones, nests to any depth, and
supports search and arrow-key navigation.

### Feedback

```tsx
import { ToastProvider, Toaster, useToast, ConfirmDialog } from '@shining-technologies/ui-kit-react'

// once, near the root
;<ToastProvider>
  <App />
  <Toaster />
</ToastProvider>

// anywhere
const { toast } = useToast()
toast({ title: 'Saved', tone: 'success' })
```

---

## What's included

| Group          | Components                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actions**    | Button, ButtonGroup, Toggle, ToggleGroup, Badge, DropdownMenu (with submenus and radio items), Tooltip, CopyButton, HoldButton                                                                                                                                                                                                                  |
| **Surfaces**   | Card, Stat, StatsCard, MetricTile, MetricGrid, SummaryCard, BreakdownList, Alert, Avatar, AvatarGroup, UserAvatar, Separator, Skeleton, Spinner, Progress, SegmentedBar, StatusDot, Empty, Kbd                                                                                                                                                  |
| **Forms**      | Field, Fieldset, Label, Input, InputGroup, Textarea, Checkbox, RadioGroup, Switch, Select, Slider, PasswordInput, PasswordStrengthIndicator, PhoneInput, NumberInput, OtpInput, TagsInput, ColorInput, RatingInput, DateField, TimeField, DateTimeField, Calendar, Clock, Combobox, MultiCombobox, FileUpload, ImageUpload, FloatingFormActions |
| **Navigation** | Tabs, SectionTabs, Accordion, Collapsible, Breadcrumb, Pagination                                                                                                                                                                                                                                                                               |
| **Overlays**   | Dialog, AlertDialog, ConfirmDialog, Sheet, Popover, HoverCard, toasts                                                                                                                                                                                                                                                                           |
| **Status**     | StatusBadge (with a registry for your vocabulary), StatusFlow, StepCard, PageHeader                                                                                                                                                                                                                                                             |
| **Layout**     | AppShell, Sidebar, SidebarNav, SidebarBrand, SidebarUser, SkipToContent, ScrollToTop                                                                                                                                                                                                                                                            |
| **Charts**     | LineChart, BarChart, PieChart, Sparkline · on Recharts: TrendChart, BarChart, DonutChart, GaugeChart, ScatterChart, Sparkline, StatTile                                                                                                                                                                                                         |
| **Data**       | Table (plain), DataTable (full-featured), cell helpers, row actions                                                                                                                                                                                                                                                                             |
| **Theming**    | UIKitProvider, ProjectSwitcher, ProjectEditor, ColorModeToggle, `createProject`, `ProjectRegistry`                                                                                                                                                                                                                                              |

---

## Entry points

| Import                                           | Contains                                                     |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `@shining-technologies/ui-kit-react`             | Every component, the provider, the SVG charts, the table     |
| `@shining-technologies/ui-kit-react/styles.css`  | The stylesheet. Import once.                                 |
| `@shining-technologies/ui-kit-react/recharts`    | Recharts-based charts (optional peer `recharts` 2.15+ or 3)  |
| `@shining-technologies/ui-kit-react/virtualized` | Row virtualisation (optional peer `@tanstack/react-virtual`) |

The package is tree-shakeable (`sideEffects` covers only the CSS), so you only ship what you
import. Importing the root entry never pulls in Recharts.

## Compatibility

|               |                                                                                         |
| ------------- | --------------------------------------------------------------------------------------- |
| React         | 18 and 19                                                                               |
| Frameworks    | Next.js (App and Pages Router), Vite, React Router / Remix, Astro, TanStack Start       |
| Server render | Yes. No `window` access during render; the global theme is server-rendered              |
| TypeScript    | Types included; `bundler`, `node16`, `nodenext` and `node` resolution; ESM and CommonJS |
| Browsers      | Current evergreen browsers (uses CSS custom properties, `:has`, container queries)      |
| Bundlers      | Any that reads `exports` (Vite, Webpack 5, esbuild, Rollup, Parcel 2, Turbopack)        |

## Documentation

- [Quick start](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/quick-start.md)
- [Forms](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/forms.md) ·
  [Next.js and SSR](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/nextjs.md) ·
  [Theming](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/theming.md) ·
  [Projects](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/projects.md)
- [Every component](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/components/overview.md)
- [Data table](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/data-table/columns.md) ·
  [Server-side](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/data-table/server-side.md)
- [Charts](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/components/charts.md)
- [API reference](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/reference/api-reference.md)
- [Troubleshooting](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/guide/troubleshooting.md)
- [All documentation](https://github.com/Shining-Technologies/shining-ui-kit-pro/blob/master/docs/README.md)

## Related packages

| Package                                                                                                            | Purpose                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [`@shining-technologies/ui-kit-core`](https://www.npmjs.com/package/@shining-technologies/ui-kit-core)             | The colour engine, tokens and project system, with no React, for servers and build scripts |
| [`@shining-technologies/ui-kit-themes`](https://www.npmjs.com/package/@shining-technologies/ui-kit-themes)         | The shipped palettes and table chrome themes                                               |
| [`@shining-technologies/ui-kit-export-csv`](https://www.npmjs.com/package/@shining-technologies/ui-kit-export-csv) | CSV/TSV export for the data table, with zero dependencies                                  |

## License

MIT © Shining Technologies

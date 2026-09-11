# API reference

## `<DataTable />`

### Data

| Prop       | Type                     | Default     |                                                     |
| ---------- | ------------------------ | ----------- | --------------------------------------------------- |
| `data`     | `TData[]`                | —           | Required. Keep the reference stable.                |
| `columns`  | `ColumnDef<TData>[]`     | —           | Required. See [columns](../data-table/columns.md).  |
| `getRowId` | `(row, index) => string` | array index | Strongly recommended with selection or server data. |

### Status

| Prop              | Type         | Default            |                                              |
| ----------------- | ------------ | ------------------ | -------------------------------------------- |
| `loading`         | `boolean`    | `false`            | Renders the skeleton and sets `aria-busy`.   |
| `error`           | `unknown`    | —                  | Anything truthy switches to the error state. |
| `onRetry`         | `() => void` | —                  | Adds a retry button to the error state.      |
| `loadingRowCount` | `number`     | `min(pageSize, 8)` | Skeleton rows.                               |

### Behaviour

| Prop                 | Type                       | Default    |                                               |
| -------------------- | -------------------------- | ---------- | --------------------------------------------- |
| `mode`               | `'client' \| 'server'`     | `'client'` | Default mode for every feature.               |
| `features`           | `DataTableFeatures<TData>` | —          | All behavioural configuration.                |
| `enableRowSelection` | `boolean`                  | `false`    | Shorthand for `features.selection.enabled`.   |
| `pageSize`           | `number`                   | `10`       | Shorthand for `features.pagination.pageSize`. |
| `rowCount`           | `number`                   | —          | Total rows on the server.                     |

### State

Nine slices, one naming rule: `x`, `defaultX`, `onXChange`. `onXChange` fires in both
controlled and uncontrolled mode.

| Slice              | Type                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| `sorting`          | `SortingState` — `[{ id, desc }]` (also accepts a `{ mode }` config object)        |
| `columnFilters`    | `ColumnFiltersState` — `[{ id, value }]` (also accepts a `{ mode }` config object) |
| `globalFilter`     | `string`                                                                           |
| `pagination`       | `{ pageIndex, pageSize }`                                                          |
| `rowSelection`     | `Record<string, boolean>`                                                          |
| `columnVisibility` | `Record<string, boolean>`                                                          |
| `columnSizing`     | `Record<string, number>`                                                           |
| `columnPinning`    | `{ left?: string[], right?: string[] }`                                            |
| `expanded`         | `true \| Record<string, boolean>`                                                  |

Plus `onQueryChange: (query: DataTableQuery) => void`.

### Rows

| Prop                | Type                      |                                        |
| ------------------- | ------------------------- | -------------------------------------- |
| `onRowClick`        | `(row, event) => void`    | `event` is a mouse or keyboard event.  |
| `onRowDoubleClick`  | `(row, event) => void`    |                                        |
| `isRowDisabled`     | `(row: TData) => boolean` | Dims, blocks selection and activation. |
| `renderExpandedRow` | `(row) => ReactNode`      | Turns expansion on.                    |
| `rowActions`        | `(row) => ReactNode`      | Injects a trailing actions column.     |
| `rowActionsHeader`  | `ReactNode \| false`      | Defaults to `'Actions'`.               |
| `rowActionsWidth`   | `number`                  | Defaults to `96`.                      |

### Heading

| Prop             | Type                          | Notes                                          |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| `title`          | `ReactNode`                   | Also becomes the table's accessible name       |
| `description`    | `ReactNode`                   | One line on what is — and is not — in the list |
| `icon`           | `ReactNode`                   | Glyph before the title                         |
| `headingActions` | `SlotContent`                 | Rendered on the right of the title block       |
| `titleAs`        | `'p' \| 'h2' \| 'h3' \| 'h4'` | Defaults to `'p'`                              |

### Appearance

| Prop                             | Type                                                                              | Default                               |
| -------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- |
| `variant`                        | `'default' \| 'minimal' \| 'compact' \| 'borderless' \| 'striped' \| 'dashboard'` | `'default'`                           |
| `density`                        | `'compact' \| 'comfortable' \| 'spacious'`                                        | `'comfortable'`                       |
| `theme`                          | `TableTheme`                                                                      | —                                     |
| `responsiveMode`                 | `'scroll' \| 'cards' \| 'auto'`                                                   | `'scroll'`                            |
| `surface`                        | `'card' \| 'plain'`                                                               | `'card'`                              |
| `tableLayout`                    | `'fixed' \| 'auto'`                                                               | `'fixed'`                             |
| `filterLayout`                   | `'panel' \| 'inline'`                                                             | `'panel'`                             |
| `stickyHeader`                   | `boolean`                                                                         | `true`                                |
| `stickyFooter`                   | `boolean`                                                                         | `true` when `maxHeight` is set        |
| `showFooter`                     | `boolean`                                                                         | `true` when any column has a `footer` |
| `showToolbar` / `showPagination` | `boolean`                                                                         | `true`                                |
| `showSelectionBar`               | `boolean`                                                                         | `true` when selection is on           |
| `showToolbarCount`               | `boolean`                                                                         | `true` for `filterLayout="inline"`    |
| `maxHeight`                      | `number \| string`                                                                | —                                     |

### Structure and styling

`components`, `slots`, `emptyState`, `loadingState`, `errorState`, `className`, `style`,
`tableClassName`, `headerClassName`, `bodyClassName`, `rowClassName`, `cellClassName`,
`classNames`. See [customization](../guide/customization.md).

### Accessibility

`id`, `label`, `caption`, `aria-label`, `aria-labelledby`, `aria-describedby`.

## `features`

```ts
interface DataTableFeatures<TData> {
  sorting?: { enabled?; mode?; multi?: boolean | 'always'; removable? }
  filtering?: { enabled?; mode?; globalSearch?; debounceMs?; searchPlaceholder? }
  pagination?: {
    enabled?
    mode?
    pageSize?
    pageSizeOptions?
    rowCount?
    showPageNumbers?
    siblingCount?
  }
  selection?: { enabled?; mode?: 'single' | 'multiple'; enableRow?: (row: TData) => boolean }
  columnVisibility?: { enabled? }
  resizing?: { enabled?; mode?: 'onChange' | 'onEnd' }
  pinning?: {
    enabled?
    /** Where the injected actions column is frozen. Default `'right'`. */
    actions?: 'left' | 'right' | false
    /** Where the injected selection column is frozen. Default `false`. */
    selection?: 'left' | 'right' | false
  }
  expanding?: { enabled?; mode?: 'single' | 'multiple' }
  virtualization?: { enabled?; estimateRowHeight?; overscan? }
}
```

## Hooks

| Hook                              |                                                            |
| --------------------------------- | ---------------------------------------------------------- |
| `useDataTable<TData>()`           | The live table instance and the full render model.         |
| `useTableComponents<TData>()`     | The resolved component map.                                |
| `useTableInstance(props)`         | Builds an instance without rendering anything.             |
| `useColumnFilter(column, config)` | Read/write one column's filter.                            |
| `useControllableState(options)`   | The controlled/uncontrolled helper the table uses.         |
| `useDebouncedValue(value, ms)`    |                                                            |
| `useEventCallback(fn)`            | A stable callback that sees the latest scope.              |
| `useTableTheme(theme)`            | Turns a theme into inline variables and a dark-mode class. |

## Theming

Everything the provider exposes. Props for each are in [Theming](../guide/theming.md) and
[Projects](../guide/projects.md).

| Export            |                                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| `UIKitProvider`   | Resolves a project and writes its tokens. `scope="global"` targets `<html>`. |
| `UIKitContext`    | The raw context, for interoperating with your own provider.                  |
| `useUIKit()`      | The whole context value: project, tokens, mode, setters.                     |
| `useProject()`    | The active project and `setProject`.                                         |
| `useColorMode()`  | `'light'` / `'dark'` / `'system'`, and the resolved mode.                    |
| `ColorModeToggle` | The light/dark/system control.                                               |
| `ProjectSwitcher` | A picker over the registry.                                                  |
| `ProjectEditor`   | The runtime editor: seeds, shape, density.                                   |
| `PalettePreview`  | Swatches for one palette, for a picker of your own.                          |
| `TokenSwatchGrid` | Every resolved token, as a grid — the debugging view.                        |

## The component kit

Grouped as in [the component overview](../components/overview.md), which carries the props
and the intent behind each.

**Actions** — `Button`, `ButtonGroup`, `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `Badge`,
`DropdownMenu*`, `Tooltip`, `TooltipProvider`, plus `buttonVariants`, `badgeVariants`,
`toggleVariants`.

**Surfaces** — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
`CardFooter`, `CardAction`, `Stat`, `Alert`, `AlertTitle`, `AlertDescription`, `Avatar`,
`AvatarImage`, `AvatarFallback`, `AvatarGroup`, `Separator`, `Skeleton`, `Spinner`,
`Progress`, `Empty`, `Kbd`, plus `cardVariants`, `alertVariants`, `avatarVariants`,
`progressVariants`, `spinnerVariants`, and `initialsFrom`.

**Form structure** — `Field`, `Fieldset`, `Label`, `useFieldControl`, `InputGroup`.

**Controls** — `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `RadioGroupItem`, `Switch`,
`Slider`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`.

**Typed fields** — `PasswordInput`, `PhoneInput`, `NumberInput`, `OtpInput`, `TagsInput`,
`ColorInput`, `RatingInput`, `ImageUpload`, `FileUpload`, `Combobox`, `MultiCombobox`,
`PasswordStrengthIndicator`.

**Date and time** — `Calendar`, `Clock`, `DateField`, `TimeField`, `DateTimeField`, with
`toIso`, `fromIso`, `toTime`, `fromTime`, `formatTime`, `splitDateTime`, `joinDateTime` and
`DATE_RANGE_PRESETS`.

**Navigation** — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Accordion`,
`AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Collapsible`, `CollapsibleTrigger`,
`CollapsibleContent`, `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`,
`BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`, `Pagination`, `SectionTabs`.

**Overlays** — `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`,
`DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`,
`DialogClose`, `AlertDialog*`, `Sheet*`, `Popover`, `PopoverTrigger`, `PopoverContent`,
`HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `ConfirmDialog`, plus `dialogVariants`.

**Composites** — `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
`TableCell`, `TableCaption`, `StatusBadge`, `StatusRegistryProvider`, `useStatusRegistry`,
`StatsCard`, `PageHeader`, `CopyButton`, `HoldButton`, `UserAvatar`, `FloatingFormActions`,
plus `tableVariants`, `statusBadgeVariants`, `statsCardVariants`, `userAvatarVariants` and
`tintIndexFor`.

**Toasts** — `ToastProvider`, `Toaster`, `useToast`.

**Application shell** — `AppShell`, `AppShellHeader`, `AppShellSidebar`, `AppShellContent`,
`AppShellBottomNav`, `SidebarGroup`, `SidebarItem`, `BottomNavItem`, `SkipToContent`,
`ScrollToTop`.

**Utilities** — `cn` (the `clsx` + `tailwind-merge` merge every `className` goes through),
`renderSlot`, `adaptColumns`, `formatBytes`, `scorePassword`, `DEFAULT_PASSWORD_RULES`,
`normalizeHex`, `DEFAULT_SWATCHES`, `COUNTRIES`, `countryByCode`, `countryByDial`, `flagFor`.

## Data table components

**Table** — `DataTable`, `DataTableProvider`.

**Composable** — `DataTableToolbar`, `DataTableSearch`, `DataTableFilters`,
`DataTableViewOptions`, `DataTablePagination`, `DataTableActions`.

**Replaceable defaults** — `DataTableRoot`, `DataTableContainer`, `DataTableTable`,
`DataTableHeader`, `DataTableHeaderRow`, `DataTableHeaderCell`, `DataTableBody`,
`DataTableRow`, `DataTableCell`, `DataTableExpandedRow`, `DataTableFooter`,
`DataTableEmptyState`, `DataTableLoadingState`, `DataTableErrorState`, `SortIndicator`,
`ColumnMenu`, and the whole map as `DEFAULT_COMPONENTS`.

**Replaceable toolbar** — `DefaultToolbar`, `DefaultFilters`, `FilterPanel`, `InlineFilters`,
`ActiveFilters`, `DefaultClearFilters`, `DefaultSelectionBar`, `DataTableHeading`,
`filterableColumns`, `resolveComponents`, `resolveFeatures`.

**Cells** — `CellText`, `CellBadge`, `CellPerson`, `CellProgress`, `CellNumber`, `CellDate`,
`CellLink`, `CellEmpty`, `CellStack`, `RowAction`, `RowActionGroup`, `RowActions` (the
overflow menu), `renderRowActions`, `isRowActionSpecs`.

**Action icons** — `EyeIcon`, `PencilIcon`, `TrashIcon`, `CopyIcon`, `MailIcon`, `PlusIcon`,
`ExternalLinkIcon`, `EyeOffIcon`. `RowAction` takes any component that accepts SVG props, so
these are a default, not a fence.

**Primitives** — `Button`, `Input`, `Checkbox`, `Badge`, `Separator`, `Skeleton`, `Tooltip`,
`TooltipProvider`, `VisuallyHidden`, `Popover*`, `DropdownMenu*`, `Select*`, plus
`buttonVariants` and `badgeVariants`.

## Columns

`createColumnHelper<TData>()` → `.accessor(key, def)`, `.computed(id, fn, def)`,
`.path(id, path, def)`, `.display(def)`, `.group(def)`.

`SELECTION_COLUMN_ID`, `EXPANDER_COLUMN_ID`, `ACTIONS_COLUMN_ID`, `createSelectionColumn`,
`createExpanderColumn`, `createActionsColumn`.

## `@shining-ui-kit/core`

Framework-free. Types, the filter engine, design tokens and pure state helpers.

```ts
// Filters
;(FILTER_OPERATORS, DEFAULT_OPERATOR, getOperators, getOperator, getOperatorArity)
;(matchesFilter,
  textPredicate,
  numberPredicate,
  datePredicate,
  selectPredicate,
  multiSelectPredicate,
  booleanPredicate)
;(createColumnFilterFn, globalFilterFn, normalizeFilterValue, isFilterActive, filterValue)

// Theme
;(createTableTheme,
  mergeThemes,
  themeToCssVars,
  hasDarkOverrides,
  cssVarsToDeclarations,
  CSS_VAR_MAP,
  CSS_VAR_NAMES)

// State
;(buildQuery, isSameQuery, getPageNumbers, getPageRange, getPageCount)

// Utilities
;(getByPath, stableHash, resolveComparator, compareText, compareNumber, compareDate)
```

## `@shining-ui-kit/themes`

`defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`, `themes`.

## `@shining-ui-kit/export-csv`

`tableToCsv(table, options)`, `csvToBlob(csv, bom)`, `downloadTableCsv(table, options)`,
`escapeCsvField(value, delimiter, sanitize)`.

Options: `delimiter`, `includeHeader`, `rows` (`'all' | 'page' | 'selected'`), `columnIds`,
`formatValue`, `sanitizeFormulas` (on by default — formula injection is real), `bom`,
`filename`.

## `@shining-ui-kit/react/virtualized`

`VirtualizedDataTable`, `VirtualizedBody`, `useVirtualizer`. Optional peer:
`@tanstack/react-virtual`. See [performance](../guide/performance.md).

## `@shining-ui-kit/react/recharts`

The richer chart set, behind a subpath so `recharts` stays out of bundles that do not use it.
Optional peer: `recharts`. Full guide: [Charts on Recharts](../components/charts-recharts.md).

**Charts** — `TrendChart`, `BarChart`, `DonutChart`, `GaugeChart`, `ScatterChart`,
`Sparkline`, `StatTile`.

**Frame and tooltip** — the shared chart shell and its tooltip parts, plus
`ChartTooltipContent`.

**Axis and theme helpers** — `categoryAxisProps`, `valueAxisProps`, `gridProps`, and the
palette and formatter helpers behind them. Types: `ChartDatum`, `ChartSeries`,
`ResolvedSeries`, `BaseChartProps`, `ChartSize`, `Responsive`, `ValueFormatter`,
`LabelFormatter`.

The base package's own dependency-free charts — `LineChart`, `BarChart`, `PieChart`,
`Sparkline` — are on the root entry and documented in [Charts](../components/charts.md). Both
sets draw from `--sui-chart-1..5`.

## Packages

Which package owns what, and when to install each:
[Packages](packages.md).

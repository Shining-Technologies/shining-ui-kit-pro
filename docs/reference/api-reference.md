# API reference

## `<DataTable />`

### Data

| Prop       | Type                          | Default     |                                                     |
| ---------- | ----------------------------- | ----------- | --------------------------------------------------- |
| `data`     | `readonly TData[]`            | —           | Required. Keep the reference stable.                |
| `columns`  | `readonly ColumnDef<TData>[]` | —           | Required. See [columns](../data-table/columns.md).  |
| `getRowId` | `(row, index) => string`      | array index | Strongly recommended with selection or server data. |

### Status

| Prop              | Type         | Default            |                                                                                                   |
| ----------------- | ------------ | ------------------ | ------------------------------------------------------------------------------------------------- |
| `loading`         | `boolean`    | `false`            | Sets `aria-busy`. Skeleton rows only when there are no rows yet; rows already shown stay, dimmed. |
| `error`           | `unknown`    | —                  | Anything truthy switches to the error state.                                                      |
| `onRetry`         | `() => void` | —                  | Adds a retry button to the error state.                                                           |
| `loadingRowCount` | `number`     | `min(pageSize, 8)` | Skeleton rows.                                                                                    |

### Behaviour

| Prop                   | Type                       | Default    |                                                        |
| ---------------------- | -------------------------- | ---------- | ------------------------------------------------------ |
| `mode`                 | `'client' \| 'server'`     | `'client'` | Default mode for every feature.                        |
| `features`             | `DataTableFeatures<TData>` | —          | All behavioural configuration.                         |
| `enableRowSelection`   | `boolean`                  | `false`    | Shorthand for `features.selection.enabled`.            |
| `pageSize`             | `number`                   | `10`       | Shorthand for `features.pagination.pageSize`.          |
| `rowCount`             | `number`                   | —          | Total rows on the server.                              |
| `keepPageOnDataChange` | `boolean`                  | `false`    | Stay on the current page when `data` changes identity. |

By default, client pagination returns to the first page whenever `data` is a new array.
`keepPageOnDataChange` keeps the page through a refetch, a poll or an optimistic update; a
sort, filter or search still goes back to the first page, and if the new data has fewer pages
the table steps back to the last one. It is ignored in server pagination, which never resets on
new data.

In server mode a sort, filter or search change resets to the first page in the same update, so
`onQueryChange` fires once, with one query. `query.columnFilters` holds only filters that have a
value — a panel row with an operator but nothing typed is not sent. When `rowCount` shrinks
below the current page (the last row of the last page deleted) and `loading` is false, the table
steps back to the page that now ends the result; a `rowCount` that settles at `0` returns it to
the first page.

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

| Prop                | Type                                    |                                                                                         |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `onRowClick`        | `(row, event) => void`                  | `event` is a mouse or keyboard event.                                                   |
| `onRowDoubleClick`  | `(row, event) => void`                  |                                                                                         |
| `isRowDisabled`     | `(row: TData) => boolean`               | Dims, blocks selection and activation. Arrow keys skip it; it never holds the tab stop. |
| `renderExpandedRow` | `(row) => ReactNode`                    | Turns expansion on.                                                                     |
| `rowActions`        | `(row) => ReactNode \| RowActionSpec[]` | Injects a trailing actions column. Return JSX, or specs the table builds buttons from.  |
| `rowActionsHeader`  | `ReactNode \| false`                    | Defaults to `'Actions'`. `false` hides it visually and keeps the name.                  |
| `rowActionsWidth`   | `number`                                | Pixels. Defaults to `120`.                                                              |

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
| `variant`                        | `'default' \| 'minimal' \| 'compact' \| 'borderless' \| 'striped' \| 'dashboard'` | project's, else `'default'`           |
| `density`                        | `'compact' \| 'comfortable' \| 'spacious'`                                        | project's, else `'comfortable'`       |
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

Every part carries its role explicitly — `table`, `rowgroup`, `row`, `columnheader`, `cell` —
so the semantics survive the card layout, whose CSS would otherwise strip them. `aria-rowcount`
counts every row of the table: header, data, open detail rows and footer. It is `-1` in server
mode without `rowCount`, and absent in the empty, loading and error states. Each row carries a
1-based `aria-rowindex` offset by the page's start, so a screen reader can say "row 32 of 507".
The column resize grip reports the width in pixels: `aria-valuenow`, and `aria-valuemin` /
`aria-valuemax` from the column's `minSize` / `maxSize`.

Where the table can become cards (`responsiveMode` other than `'scroll'`), each data cell holds
its column's name as real text in a `.sui-td__label` — visually hidden for a column with
`meta.hideLabelInCards` — rather than a `::before` label, which screen readers announce
unevenly. `data-label` stays on the cell for styling only. A footer cell whose column has
`meta.hideInCards` is left off the cards too.

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
  selection?: {
    enabled?
    mode?: 'single' | 'multiple'
    enableRow?: (row: TData) => boolean
    /** Same as the top-level `getRowId`, which wins when both are given. */
    getRowId?: (row: TData, index: number) => string
  }
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

| Export                 |                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `UIKitProvider`        | Resolves a project and writes its tokens. `preset`, `brand`, `project`; `scope="global"` targets `<html>`.        |
| `usePortalContainer()` | Where portalled surfaces render: the themed wrapper in local scope, else `undefined`. For your own Radix portals. |
| `UIKitContext`         | The raw context, for interoperating with your own provider.                                                       |
| `useUIKit()`           | The whole context value — see below. Throws outside a provider.                                                   |
| `useProject()`         | The active project, or `undefined` outside a provider. Read-only: switch with `useUIKit().setProject`.            |
| `useColorMode()`       | `{ mode, colorMode, setMode }`: `'light'` / `'dark'` / `'system'`, the resolved mode, and a setter.               |
| `ColorModeToggle`      | The light/dark/system control.                                                                                    |
| `ProjectSwitcher`      | A picker over the registry.                                                                                       |
| `ProjectEditor`        | The runtime editor: seeds, shape, density.                                                                        |
| `PalettePreview`       | Swatches for one palette, for a picker of your own.                                                               |
| `TokenSwatchGrid`      | Every resolved token, as a grid — the debugging view.                                                             |

`UIKitProvider` also takes `nonce`, the Content-Security-Policy nonce for the `<style>`s a
server render uses: the tokens in `scope="global"`, both palettes scoped to the wrapper in
`local` scope with `mode="system"`, and the sidebar's custom-breakpoint rules. `className` and
`style` go on the wrapper in `local` scope. In `global` scope `className` is added to `<html>`
and `style` set on it property by property, both removed on unmount; classes the app set itself
are left alone, and the innermost global provider wins. `style` is included in the server
stylesheet; `className` applies at hydration.

The active project is the first of these that applies:

1. `project` (controlled)
2. a project picked in this session — through `ProjectSwitcher`, the editor, or `setProject`
3. with a registry, the project the user picked on an earlier visit, as persisted
4. `defaultProject`
5. `preset` and/or `brand`
6. with a registry, its initial project (`initialProjectId`, else its first built-in)
7. `shining`

`defaultProject`, `preset`, `brand` and `initialProjectId` decide where a first visit starts;
once the user picks a project, the pick survives reloads. Only `project` overrides it. A pick
restored from storage is applied one commit after hydration, so the first client render agrees
with the server's.

`useUIKit()` returns `UIKitContextValue`:

| Field                                                                        |                                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `project`, `resolved`                                                        | The active project and its generated tokens for both modes.                |
| `projects`                                                                   | Every project available to switch to.                                      |
| `mode`, `colorMode`, `density`                                               | The requested mode (may be `'system'`), the rendered one, and the density. |
| `setMode(mode)`, `setProject(id)`                                            | Setters. An unknown project id is ignored.                                 |
| `portalContainer`                                                            | What `usePortalContainer()` returns.                                       |
| `registry`, `createProject`, `updateProject`, `deleteProject`, `forkProject` | Present only when the provider was given a `registry`.                     |

`ProjectRegistry` (re-exported from core) is the store behind a registry: `list`, `get`,
`getActive`, `getActiveId`, `setActive`, `create`, `fork`, `update`, `remove`, `reset`,
`export`, `import`, `subscribe`, `getInitialActiveId()` and `getChosenActiveId()`.
`initialProjectId` is the first-load default only: `getInitialActiveId()` returns it (else the
first built-in), and `reset()`, or `remove()` of the active project, returns to it.
`getChosenActiveId()` is the active id when the user chose it — restored from storage or set
with `setActive` — and `undefined` while it is still the default. Only a chosen id is persisted,
so the default never hardens into a "pick" that outranks the app's configuration on the next
load. A server render has no storage, so it paints the initial project; the provider paints it
too while hydrating, then switches to the restored one, so the two agree.

## The component kit

Grouped as in [the component overview](../components/overview.md), which carries the props
and the intent behind each.

**Actions** — `Button`, `ButtonGroup`, `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `Badge`,
`Tooltip`, `TooltipProvider`, plus `buttonVariants`, `badgeVariants`, `toggleVariants`.

**Menus** — `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`,
`DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`,
`DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSub`,
`DropdownMenuSubTrigger`, `DropdownMenuSubContent`.

**Surfaces** — `Card`, `CardHeader`, `CardIcon`, `CardTitle`, `CardDescription`,
`CardContent`, `CardFooter`, `CardAction`, `Stat`, `Alert`, `AlertTitle`, `AlertDescription`,
`Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `Separator`, `Skeleton`, `Spinner`,
`Progress`, `Empty`, `Kbd`, `StatusDot`, `SegmentedBar`, plus `cardVariants`,
`cardIconVariants`, `alertVariants`, `avatarVariants`, `emptyVariants`, `progressVariants`,
`spinnerVariants`, `statusDotVariants`, `segmentedBarVariants`, and `initialsFrom`. The
`AccentTone` type names the colours a toned component accepts.

**Form structure** — `Field`, `Fieldset`, `Label`, `useFieldControl`, `InputGroup`. Types:
`FieldContextValue`, and `FieldControlProps` — what `useFieldControl()` returns, for a control of
your own. See [Forms](../guide/forms.md).

**Controls** — `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `RadioGroupItem`, `Switch`,
`Slider`, `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`,
`SelectGroup`, `SelectLabel`.

**Typed fields** — `PasswordInput`, `PhoneInput`, `NumberInput`, `OtpInput`, `TagsInput`,
`ColorInput`, `RatingInput`, `ImageUpload`, `FileUpload`, `Combobox`, `MultiCombobox`,
`PasswordStrengthIndicator`.

**Date and time** — `Calendar`, `Clock`, `DateField`, `TimeField`, `DateTimeField`, with
`toIso`, `fromIso`, `toTime`, `fromTime`, `formatTime`, `splitDateTime`, `joinDateTime` and
`DATE_RANGE_PRESETS`. The value types are `IsoDate` (`yyyy-mm-dd`), `IsoTime` (`HH:mm`) and
`IsoDateTime` (`yyyy-mm-ddTHH:mm`) — local strings, no timezone.

**Navigation** — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Accordion`,
`AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Collapsible`, `CollapsibleTrigger`,
`CollapsibleContent`, `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`,
`BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`, `Pagination`, `SectionTabs`.

**Overlays** — `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`,
`DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`,
`DialogClose`, `AlertDialog*`, `Sheet*`, `Popover`, `PopoverTrigger`, `PopoverAnchor`,
`PopoverContent`, `HoverCard`, `HoverCardTrigger`, `HoverCardContent`, `ConfirmDialog`, plus
`dialogVariants`.

**Composites** — `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
`TableCell`, `TableCaption`, `StatusBadge`, `StatusRegistryProvider`, `useStatusRegistry`,
`StatsCard`, `MetricGrid`, `MetricTile`, `BreakdownList`, `SummaryCard`, `StatusFlow`,
`StepCard`, `PageHeader`, `CopyButton`, `HoldButton`, `UserAvatar`, `FloatingFormActions`,
plus `tableVariants`, `statusBadgeVariants`, `statsCardVariants`, `userAvatarVariants` and
`tintIndexFor`.

**Toasts** — `ToastProvider`, `Toaster`, `useToast`.

**Application shell** — `AppShell`, `AppShellHeader`, `AppShellSidebar`, `AppShellContent`,
`AppShellBottomNav`, `SidebarGroup`, `SidebarItem`, `BottomNavItem`, `SkipToContent`,
`ScrollToTop`.

**Dashboard sidebar** — `Sidebar`, `SidebarProvider`, `useSidebar`, `SidebarTrigger`,
`SidebarBrand`, `SidebarUser`, `SidebarNav`, `SidebarSection`, `SidebarMenu`, `SidebarMenuItem`,
plus the tree helpers `getSidebarTrail` and `matchSidebarPath` and the `SidebarNavEntry` /
`SidebarNavItem` / `SidebarNavSection` / `SidebarNavSeparator` types.

**Utilities** — `cn` (the `clsx` + `tailwind-merge` merge every `className` goes through),
`renderSlot`, `adaptColumns`, `formatBytes`, `scorePassword`, `DEFAULT_PASSWORD_RULES`,
`normalizeHex`, `DEFAULT_SWATCHES`, `COUNTRIES`, `countryByCode`, `countryByDial`, `flagFor`.

**Prop types** — exported from the package root beside their components (`DialogContentProps`,
`FileUploadProps`, `ComboboxProps` …), the primitives' included: `ButtonProps`, `ButtonGroupProps`, `BadgeProps`, `CheckboxProps`,
`InputProps`, `TooltipProps`, `TooltipProviderProps` and `CardTitleProps`.

### Props easy to miss

| Component                           | Prop                                                                                   |                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `CardTitle`                         | `as?: 'div' \| 'h1' … 'h6'`                                                            | Defaults to `'div'`. Pick a heading level so cards appear in heading navigation.                                         |
| `SummaryCard`, `StepCard`           | `titleAs`                                                                              | The same choice for their title.                                                                                         |
| `AvatarGroup`                       | `max?: number`, `moreClassName?: string`                                               | Show `max` avatars and a `+n` chip, announced as "n more"; `moreClassName` styles the chip.                              |
| `Tooltip`                           | `open`, `defaultOpen`, `onOpenChange`, `align`, `sideOffset`                           | Alongside `content`, `side`, `delayDuration`. Inherits a `TooltipProvider`'s delays; works without one.                  |
| `CopyButton`                        | `onCopyError?: (error: unknown) => void`                                               | The copy was refused. Your `onClick` composes with the copy.                                                             |
| `ConfirmDialog`                     | `onError?: (error: unknown, action: ConfirmAction) => void`                            | An action threw or rejected; the dialog stays open. Without it the error is rethrown.                                    |
| `HoldButton`                        | `confirmOnClick`, `confirmTitle`, `confirmDescription`, `confirmLabel`, `instructions` | A click with no press behind it opens a `ConfirmDialog` (default `true`); `instructions` is the `aria-describedby` text. |
| `StatusFlow`                        | `current`, `reached`: `number \| string`                                               | An index or a status; `current` may name an alternate, and `reached` says how far the main path got.                     |
| `Table`                             | `containerClassName`, `containerProps`                                                 | For the scroll wrapper, `ref` included — `tabIndex={0}` and a name make it keyboard-reachable.                           |
| `Skeleton`                          | `as?: 'div' \| 'span'`                                                                 | `span` inside a button, link or label.                                                                                   |
| `Combobox`, `MultiCombobox`         | `selectedOption`, `selectedOptions`                                                    | Label values missing from `options`. An unknown value with no option shows as itself.                                    |
| `NumberInput`                       | `locale?: string`                                                                      | The decimal separator; the runtime's by default. Pass it when server rendering.                                          |
| `DateTimeField`                     | `defaultTime?: IsoTime`                                                                | `'09:00'` unless set. The time a day picked first is stored at, and where the clock opens.                               |
| `useToast()`                        | `pause()`, `resume()`                                                                  | Hold and restart every auto-dismiss clock — for a custom toast stack.                                                    |
| `LineChart`, `BarChart`, `PieChart` | `ariaLabel?: string`                                                                   | The chart's accessible name; generated from the data when omitted.                                                       |
| `useSidebar()`                      | `mobileBreakpoint?: string \| false`                                                   | The breakpoint in force, as given to the provider.                                                                       |

Uncontrolled use (`defaultValue`) and native form submission (`name`) are covered per control
in the [component overview](../components/overview.md#form-inputs) and [Forms](../guide/forms.md).

## Data table components

**Table** — `DataTable`, `DataTableProvider`.

**Composable** — `DataTableToolbar`, `DataTableSearch`, `DataTableFilters`,
`DataTableViewOptions`, `DataTablePagination`, `DataTableActions`.

**Replaceable defaults** — `DataTableRoot`, `DataTableContainer`, `DataTableTable`,
`DataTableHeader`, `DataTableHeaderRow`, `DataTableHeaderCell`, `DataTableBody`,
`DataTableRow`, `DataTableCell`, `DataTableExpandedRow`, `DataTableFooter`,
`DataTableEmptyState`, `DataTableLoadingState`, `DataTableErrorState`, `SortIndicator`,
`ColumnMenu`, and the whole map as `DEFAULT_COMPONENTS`. A replacement spreads the prop bag it
is given; a custom `Cell` must also render `children`, which carry the card label as well as the
value.

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

## `@shining-technologies/ui-kit-core`

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

## `@shining-technologies/ui-kit-themes`

`defaultTheme`, `minimalTheme`, `dashboardTheme`, `midnightTheme`, `themes`.

## `@shining-technologies/ui-kit-export-csv`

`tableToCsv(table, options)`, `csvToBlob(csv, bom)`, `downloadTableCsv(table, options)`,
`escapeCsvField(value, delimiter, sanitize)`.

Options: `delimiter`, `includeHeader`, `rows` (`'all' | 'page' | 'selected'`), `data`
(`readonly TData[]`), `columnIds` (a readonly array), `formatValue`, `sanitizeFormulas` (on by
default — formula injection is real), `bom`, `filename`.

`sanitizeFormulas` prefixes a `'` to a value a spreadsheet would execute — one starting `=`,
`+`, `-`, `@`, a tab or a carriage return — unless it is a plain number: `-42` and `1.5e3` stay
numbers, while `-2+3` and `=SUM(A1)` are prefixed. The export reads the rows the table has
loaded: `'all'` is every filtered row ignoring pagination, `'selected'` the selected ones among
them — and in server mode that is only the current page, since that is all the table holds.
Pass `data` to export beyond it, typically the full result fetched for the export. It is
serialised through the table's own columns — the same headers, accessors and `formatValue`:
with `rows: 'all'` every entry, with `rows: 'selected'` the entries whose id is in
`rowSelection`, selections on other pages included (ids from `getRowId`, else each entry's index
in `data`). `rows: 'page'` ignores `data`. Headers come from
`meta.label`, else the column's string `header`, and fall back to the id only when the header is
not a string.

## `@shining-technologies/ui-kit-react/virtualized`

`VirtualizedDataTable`, `VirtualizedBody`, `useVirtualizer`. Optional peer:
`@tanstack/react-virtual`. See [performance](../guide/performance.md).

## `@shining-technologies/ui-kit-react/recharts`

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

# API reference: `@shining-technologies/ui/core`

The framework-independent core: filtering, sorting, pagination, row selection, column
resolution, server-side query application and URL serialisation, plus the shared types.

```ts
import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'
```

- The core imports nothing: no React, no DOM globals, no third-party packages. The build fails if
  a module under `core/` does. It is safe in Server Components, route handlers, Server Actions,
  workers and tests.
- Every export on this page is also re-exported from the root entry, `@shining-technologies/ui`.
  Import from `/core` when you want to be sure no component code is pulled in, for example in a
  route handler or a shared schema module.
- The only globals used are `Intl.DateTimeFormat`, `Intl.Collator` and `URLSearchParams`.

For the guide to using these functions with `DataTable`, see [Data table](../data-table.md) and
[Next.js](../nextjs.md).

## Contents

- [Types: common](#types-common)
- [Types: columns](#types-columns)
- [Types: filters](#types-filters)
- [Types: state and features](#types-state-and-features)
- [Filtering: operators](#filtering-operators)
- [Filtering: evaluating filters](#filtering-evaluating-filters)
- [Filtering: predicates](#filtering-predicates)
- [Filtering: value coercion](#filtering-value-coercion)
- [Filtering: calendar dates](#filtering-calendar-dates)
- [Sorting](#sorting)
- [Pagination](#pagination)
- [Selection](#selection)
- [Columns](#columns)
- [Query: `applyQuery`](#query-applyquery)
- [Query: URL search params](#query-url-search-params)
- [Query: state helpers](#query-state-helpers)
- [Utilities](#utilities)
- [Export index](#export-index)

---

## Types: common

| Type | Definition | Notes |
| --- | --- | --- |
| `RowData` | `Record<string, unknown>` | Any object shape usable as a row. |
| `LooseKeyOf<T>` | `(keyof T & string) \| (string & Record<never, never>)` | Autocompletes known keys but accepts any string, such as a dotted path. |
| `CellAlign` | `'left' \| 'center' \| 'right'` | |
| `Density` | `'compact' \| 'comfortable' \| 'spacious'` | |
| `TableVariant` | `'default' \| 'minimal' \| 'compact' \| 'borderless' \| 'striped' \| 'dashboard'` | |
| `DataMode` | `'client' \| 'server'` | Where filtering, sorting or pagination runs. |
| `ResponsiveMode` | `'scroll' \| 'cards' \| 'auto'` | `'auto'` measures the table's own container, not the viewport. |
| `TableSurface` | `'card' \| 'plain'` | |
| `TableLayout` | `'fixed' \| 'auto'` | |
| `FilterLayout` | `'panel' \| 'inline'` | |
| `Breakpoint` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | Mirrors Tailwind's scale. |
| `PinnedSide` | `'left' \| 'right'` | |
| `SelectOption<TValue = string>` | `{ label: string; value: TValue; group?: string; disabled?: boolean }` | `group` is rendered as a section heading. |
| `Derivable<TValue, TArg>` | `TValue \| ((arg: TArg) => TValue)` | |

### `derive`

```ts
function derive<TValue, TArg>(value: Derivable<TValue, TArg>, arg: TArg): TValue
```

Returns `value(arg)` when `value` is a function, otherwise `value`. Note that this means a
`TValue` that is itself a function cannot be passed as a plain value.

---

## Types: columns

### `ColumnMeta`

Extra information on a column, read by renderers through `column.columnDef.meta`.

| Field | Type | Description |
| --- | --- | --- |
| `align` | `CellAlign` | Horizontal alignment for header and body cells. |
| `className` | `string` | Extra classes for every body cell. |
| `headerClassName` | `string` | Extra classes for the header cell. |
| `label` | `string` | Short label for the column picker, the mobile card layout and CSV headers. |
| `responsive` | `ColumnResponsive` | Viewport-dependent default visibility. |
| `wrap` | `boolean` | Allow the content to wrap. Cells truncate by default. |
| `hideLabelInCards` | `boolean` | Hide the label in card mode. |
| `hideInCards` | `boolean` | Skip the column in card mode. |

`ColumnMeta` is an interface, so applications can add fields with module augmentation:

```ts
declare module '@shining-technologies/ui/core' {
  interface ColumnMeta {
    currency?: string
  }
}
```

### `ColumnResponsive`

| Field | Type | Description |
| --- | --- | --- |
| `hideBelow` | `Breakpoint` | Hide the column below this breakpoint. |
| `hideAbove` | `Breakpoint` | Hide the column at or above this breakpoint. |
| `priority` | `number` | Ordering hint for the card layout; lower comes first. |

### Sorting option types

| Type | Definition |
| --- | --- |
| `BuiltInSortingFn` | `'auto' \| 'text' \| 'number' \| 'datetime' \| 'boolean'` |
| `ValueComparator<TValue>` | `(a: TValue, b: TValue) => number` — compares values, not rows. Empty values are handled before it is called. |
| `SortingFnOption<TValue>` | `BuiltInSortingFn \| ValueComparator<TValue>` |

### `ColumnBehavior<TData, TValue = unknown>`

The behavioural half of a column definition (everything except rendering). The React
`DataTable` and `applyQuery` both read these fields, so one column list gives identical
filtering and sorting in the browser and on the server.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Defaults to `accessorKey`, then `accessorPath`. Required for display-only columns. |
| `accessorKey` | `LooseKeyOf<TData>` | Read the value by key. A key containing `.` is read as a path. |
| `accessorPath` | `string` | Read the value by dotted path, e.g. `"customer.address.city"`. |
| `accessorFn` | `(row: TData, index: number) => TValue` | Compute the value. Takes precedence over the other accessors. |
| `enableSorting` | `boolean` | |
| `sortingFn` | `SortingFnOption<TValue>` | Defaults to `'auto'`. See [`resolveComparator`](#resolvecomparator). |
| `sortDescFirst` | `boolean` | Start the sort cycle at descending. |
| `enableFiltering` | `boolean` | |
| `filter` | `ColumnFilterConfig` | Drives the filter engine, the filter UI and `applyQuery`. Columns without it filter as `{ type: 'text' }`. |
| `enableGlobalFilter` | `boolean` | Include in the search box. Defaults to `true`. |
| `enableHiding` | `boolean` | |
| `defaultVisible` | `boolean` | Initial visibility (uncontrolled). |
| `enableResizing` | `boolean` | |
| `size`, `minSize`, `maxSize` | `number` | |
| `enablePinning` | `boolean` | |
| `defaultPinned` | `PinnedSide \| false` | Initial pinned side (uncontrolled). A pinning `DataTable` remembered in the browser takes precedence. |
| `meta` | `ColumnMeta` | |

### `QueryColumn<TData>`

The structural subset of a column that the query functions need. It is deliberately loose, so
any typed column array, including the React `ColumnDef<TData>[]`, is assignable to
`readonly QueryColumn<TData>[]`.

| Field | Type |
| --- | --- |
| `id` | `string` |
| `accessorKey` | `string` |
| `accessorPath` | `string` |
| `accessorFn` | `(row: TData, index: number) => unknown` |
| `enableSorting` | `boolean` |
| `sortingFn` | `BuiltInSortingFn \| ((a: never, b: never) => number)` |
| `enableFiltering` | `boolean` |
| `filter` | `ColumnFilterConfig` |
| `enableGlobalFilter` | `boolean` |
| `columns` | `readonly QueryColumn<TData>[]` — child columns of a header group. |

`createColumnHelper` is not part of the core; it is exported by the data-table component family
(`@shining-technologies/ui` and `@shining-technologies/ui/data-table`).

---

## Types: filters

### `FilterType`

`'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'boolean'`

### Operator unions

| Type | Members |
| --- | --- |
| `TextOperator` | `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty` |
| `NumberOperator` | `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `isEmpty`, `isNotEmpty` |
| `DateOperator` | `on`, `before`, `after`, `between`, `isEmpty`, `isNotEmpty` |
| `SelectOperator` | `equals`, `notEquals`, `isEmpty`, `isNotEmpty` |
| `MultiSelectOperator` | `includes`, `notIncludes`, `isEmpty`, `isNotEmpty` |
| `BooleanOperator` | `isTrue`, `isFalse` |
| `FilterOperator` | The union of all of the above. |

`OperatorsByType` maps each `FilterType` key to its operator union
(`{ text: TextOperator; number: NumberOperator; … }`).

### `OperatorArity`

`'none' | 'one' | 'two' | 'many'` — how many values an operator consumes.

### `FilterOperatorDef<TOperator extends FilterOperator = FilterOperator>`

| Field | Type | Description |
| --- | --- | --- |
| `operator` | `TOperator` | |
| `label` | `string` | Human label, e.g. `"is not"`. |
| `arity` | `OperatorArity` | |

### `FilterValue<TValue = unknown>`

```ts
interface FilterValue<TValue = unknown> {
  operator: FilterOperator
  value: TValue
}
```

The structured value stored in `columnFilters`. A bare value (for example `'john'`) is also
accepted everywhere and means the column type's default operator; see
[`normalizeFilterValue`](#normalizefiltervalue).

### `FilterOptions`

| Field | Type | Description |
| --- | --- | --- |
| `timeZone` | `string` | IANA time zone used to decide which calendar day a timestamp falls on for `date` filters, e.g. `"Australia/Sydney"`. When unset, the runtime's zone is used: the browser's on the client, the server process's (often UTC) on a server. Set it whenever the same filter runs in both places. |

### `ColumnFilterConfig<TValue = unknown>`

| Field | Type | Description |
| --- | --- | --- |
| `type` | `FilterType` | Required. |
| `options` | `SelectOption<TValue>[]` | Choices for `select` and `multiSelect`. |
| `defaultOperator` | `FilterOperator` | Operator preselected when the user adds the filter in the UI. |
| `operators` | `FilterOperator[]` | Restrict the operators offered. Defaults to every operator valid for `type`. |
| `placeholder` | `string` | Placeholder for the value input. |
| `label` | `string` | Label in the filter UI; defaults to the column header. |
| `hidden` | `boolean` | Hide from the filter UI; programmatic filtering still works. |
| `predicate` | `(rowValue: unknown, filterValue: FilterValue) => boolean` | Custom predicate. When set, the built-in operators are bypassed. |

`defaultOperator` and `operators` affect the filter UI only. The engine resolves bare values with
[`DEFAULT_OPERATOR`](#default_operator), and does not reject operators outside `operators`.

### `isFilterValue`

```ts
function isFilterValue(value: unknown): value is FilterValue
```

`true` for a non-null object with a string `operator` property. The operator is not checked
against the known operator names.

---

## Types: state and features

These shapes are structurally identical to TanStack Table's, so they pass straight through to the
engine, but they are declared here so the core has no dependencies.

| Type | Definition |
| --- | --- |
| `ColumnSort` | `{ id: string; desc: boolean }` |
| `SortingState` | `ColumnSort[]` — earlier entries take precedence. |
| `ColumnFilter` | `{ id: string; value: unknown }` — `value` is a `FilterValue` or a bare value. |
| `ColumnFiltersState` | `ColumnFilter[]` |
| `PaginationState` | `{ pageIndex: number; pageSize: number }` — `pageIndex` is zero-based. |
| `RowSelectionState` | `Record<string, boolean>` — keyed by row id. |
| `VisibilityState` | `Record<string, boolean>` |
| `ColumnSizingState` | `Record<string, number>` |
| `ColumnPinningState` | `{ left?: string[]; right?: string[] }` |
| `ExpandedState` | `true \| Record<string, boolean>` — `true` means every row is expanded. |

### `DataTableState`

The nine state slices a `DataTable` owns. Each is independently controllable with the prop trio
`x`, `defaultX`, `onXChange`.

| Field | Type |
| --- | --- |
| `sorting` | `SortingState` |
| `columnFilters` | `ColumnFiltersState` |
| `globalFilter` | `string` |
| `pagination` | `PaginationState` |
| `rowSelection` | `RowSelectionState` |
| `columnVisibility` | `VisibilityState` |
| `columnSizing` | `ColumnSizingState` |
| `columnPinning` | `ColumnPinningState` |
| `expanded` | `ExpandedState` |

### `DataTableQuery`

Everything a server needs to answer a page request. Emitted by the table's `onQueryChange`,
written to a URL with [`serializeQuerySearchParams`](#serializequerysearchparams) and answered by
[`applyQuery`](#applyquery) or your own database query.

| Field | Type | Description |
| --- | --- | --- |
| `pageIndex` | `number` | Zero-based. |
| `pageSize` | `number` | |
| `sorting` | `SortingState` | |
| `columnFilters` | `ColumnFiltersState` | |
| `globalFilter` | `string` | The search box text. |

### Feature configuration

`DataTableFeatures<TData>` groups the behavioural configuration of a table. Every field is
optional.

| Field | Type | Fields of that type |
| --- | --- | --- |
| `sorting` | `SortingFeature` | `enabled?: boolean`; `mode?: DataMode` (`'server'` reports state without sorting in the browser); `multi?: boolean \| 'always'` (shift-click, or always); `removable?: boolean` (include an unsorted step, default `true`) |
| `filtering` | `FilteringFeature` | `enabled?: boolean`; `mode?: DataMode`; `globalSearch?: boolean` (show the search box, default `true`); `debounceMs?: number`; `searchPlaceholder?: string` |
| `pagination` | `PaginationFeature` | `enabled?: boolean`; `mode?: DataMode`; `pageSize?: number`; `pageSizeOptions?: number[]`; `rowCount?: number` (required in server mode); `showPageNumbers?: boolean` (default `true`); `siblingCount?: number` |
| `selection` | `SelectionFeature<TData>` | `enabled?: boolean`; `mode?: 'single' \| 'multiple'`; `enableRow?: (row: TData) => boolean` |
| `columnVisibility` | `ColumnVisibilityFeature` | `enabled?: boolean` |
| `resizing` | `ResizingFeature` | `enabled?: boolean`; `mode?: 'onChange' \| 'onEnd'` (`'onEnd'` moves only a guide line during the drag and reflows on release) |
| `pinning` | `PinningFeature` | `enabled?: boolean`; `actions?: PinnedSide \| false` (default `'right'`); `selection?: PinnedSide \| false` (default `false`) |
| `expanding` | `ExpandingFeature` | `enabled?: boolean`; `mode?: 'single' \| 'multiple'` (`'single'` collapses the previously expanded row) |
| `virtualization` | `VirtualizationFeature` | `enabled?: boolean`; `estimateRowHeight?: number` (pixels, a hint); `overscan?: number` |

---

## Filtering: operators

### `FILTER_OPERATORS`

```ts
const FILTER_OPERATORS: Record<FilterType, FilterOperatorDef[]>
```

The operator registry, in the order the filter UI lists them. The filter UI renders from it, the
predicates implement it and the URL parser validates operator names against it.

| Type | Operator (label, arity) |
| --- | --- |
| `text` | `contains` ("contains", one), `notContains` ("does not contain", one), `equals` ("is", one), `notEquals` ("is not", one), `startsWith` ("starts with", one), `endsWith` ("ends with", one), `isEmpty` ("is empty", none), `isNotEmpty` ("is not empty", none) |
| `number` | `equals` ("=", one), `notEquals` ("≠", one), `greaterThan` (">", one), `greaterThanOrEqual` ("≥", one), `lessThan` ("<", one), `lessThanOrEqual` ("≤", one), `between` ("between", two), `isEmpty`, `isNotEmpty` |
| `date` | `on` ("on", one), `before` ("before", one), `after` ("after", one), `between` ("between", two), `isEmpty`, `isNotEmpty` |
| `select` | `equals` ("is", one), `notEquals` ("is not", one), `isEmpty`, `isNotEmpty` |
| `multiSelect` | `includes` ("includes", many), `notIncludes` ("does not include", many), `isEmpty`, `isNotEmpty` |
| `boolean` | `isTrue` ("is true", none), `isFalse` ("is false", none) |

### `DEFAULT_OPERATOR`

```ts
const DEFAULT_OPERATOR: Record<FilterType, FilterOperator>
```

The operator paired with a bare filter value: `text` → `contains`, `number` → `equals`,
`date` → `on`, `select` → `equals`, `multiSelect` → `includes`, `boolean` → `isTrue`.

### `ALL_FILTER_OPERATORS`

```ts
const ALL_FILTER_OPERATORS: ReadonlySet<FilterOperator>
```

Every operator name in the registry, for validating untrusted input.

### `getOperators`

```ts
function getOperators(type: FilterType, allowed?: FilterOperator[]): FilterOperatorDef[]
```

The definitions for `type`. When `allowed` is non-empty, only those operators are returned, in
registry order (not the order of `allowed`). An empty or missing `allowed` returns all of them.

### `getOperator`

```ts
function getOperator(type: FilterType, operator: FilterOperator): FilterOperatorDef | undefined
```

One definition, or `undefined` when `operator` is not valid for `type`.

### `getOperatorArity`

```ts
function getOperatorArity(type: FilterType, operator: FilterOperator): OperatorArity
```

The operator's arity. An operator that is not valid for `type` is treated as `'one'`.

---

## Filtering: evaluating filters

### `DEFAULT_FILTER_CONFIG`

```ts
const DEFAULT_FILTER_CONFIG: ColumnFilterConfig // { type: 'text' }
```

The configuration used for a column that has no `filter`.

### `normalizeFilterValue`

```ts
function normalizeFilterValue(raw: unknown, type: FilterType): FilterValue
```

Returns `raw` unchanged when it is a `FilterValue` (see [`isFilterValue`](#isfiltervalue));
otherwise wraps it as `{ operator: DEFAULT_OPERATOR[type], value: raw }`.

```ts
normalizeFilterValue('john', 'text') // { operator: 'contains', value: 'john' }
normalizeFilterValue({ operator: 'between', value: [1, 5] }, 'number') // returned as is
```

For `boolean` columns a bare `false`, `'false'` or `0` becomes `isFalse`; any other bare value
becomes `isTrue`.

### `isFilterActive`

```ts
function isFilterActive(raw: unknown, type: FilterType): boolean
```

`true` when the filter would narrow the result. Inactive filters are not evaluated, not counted by
the UI, not sent to a server and not written to a URL.

| Operator arity | Active when |
| --- | --- |
| (raw is `null` or `undefined`) | never |
| `none` (`isEmpty`, `isNotEmpty`, `isTrue`, `isFalse`) | always |
| `two` (`between`) | the value is an array and either element is non-empty, or the value is any other non-empty value (an object such as `{ from: '', to: '' }` counts as non-empty) |
| `one`, `many` | the value is non-empty per [`isEmptyValue`](#isemptyvalue) |

### `FilterConfigLookup`

```ts
type FilterConfigLookup =
  | ReadonlyMap<string, ColumnFilterConfig>
  | Readonly<Record<string, ColumnFilterConfig>>
```

### `getActiveFilters`

```ts
function getActiveFilters(filters: ColumnFiltersState, configs: FilterConfigLookup): ColumnFiltersState
```

The entries of `filters` that are active. Columns missing from `configs` are treated as `text`.
Returns the same array instance when every entry is active, which keeps memoised consumers
stable. [`getFilterConfigs`](#getfilterconfigs) builds a suitable lookup from columns.

### `matchesColumnFilter`

```ts
function matchesColumnFilter(
  rowValue: unknown,
  config: ColumnFilterConfig,
  rawFilter: unknown,
  options?: FilterOptions,
): boolean
```

Evaluates one column filter against one value:

1. an inactive filter matches everything;
2. the raw filter is normalised with `normalizeFilterValue`;
3. `config.predicate`, when present, decides alone;
4. otherwise [`matchesFilter`](#matchesfilter) dispatches on `config.type`.

Throws `RangeError` when `options.timeZone` is not a valid IANA zone and a date needs formatting.

### `createColumnFilterFn`

```ts
type EngineFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown,
) => boolean

function createColumnFilterFn(config: ColumnFilterConfig, options?: FilterOptions): EngineFilterFn
```

Wraps `matchesColumnFilter` in the filter-function shape TanStack Table expects. `DataTable` uses
this for every column.

### `matchesGlobalFilter`

```ts
function matchesGlobalFilter(value: unknown, query: unknown): boolean
```

Case- and accent-insensitive "contains" over any value with a text form. The query is converted with
[`toText`](#totext) and trimmed; an empty query matches everything. A value that `toText` cannot
convert (objects, arrays, `null`) never matches a non-empty query; booleans and dates are matched
by their text (`'true'`, the ISO timestamp). `applyQuery` uses
[`matchesSearchValue`](#matchessearchvalue) instead.

### `matchesSearchValue`

```ts
function matchesSearchValue(value: unknown, query: unknown, options?: FilterOptions): boolean
```

The search box's rule for one cell value: whether it is searchable and how it matches. It is
decided value by value, so a column whose values have mixed types is searched consistently.

| Value | Matches a non-empty query when |
| --- | --- |
| string | it contains the query, case- and accent-insensitively |
| finite number | its decimal text (`String(value)`) contains the query, so `30` finds `300` |
| valid `Date` | its calendar day, `yyyy-mm-dd`, in `options.timeZone`, contains the query (the day a date filter would put it on) |
| anything else: booleans, `null`, `undefined`, objects, arrays, `NaN`, `Infinity`, invalid dates | never |

- The query is converted with `toText` and trimmed; an empty query matches every value.
- Booleans are not searchable: they are usually rendered as icons or badges, and matching the words
  `true` and `false` would make short queries such as `t` match almost every row.
- A string that looks like a date is searched as text, not as a day.
- Throws `RangeError` for an invalid `timeZone` when a `Date` has to be placed in it.

```ts
import { matchesSearchValue } from '@shining-technologies/ui/core'

matchesSearchValue('Renée', 'renee') // true
matchesSearchValue(1250, '25') // true
matchesSearchValue(new Date('2024-03-05T20:00:00Z'), '2024-03-06', { timeZone: 'Australia/Sydney' }) // true
matchesSearchValue(true, 'true') // false
```

### `globalFilterFn`

```ts
const globalFilterFn: EngineFilterFn
```

`matchesGlobalFilter` in the engine's filter-function shape.

### `filterValue`

```ts
function filterValue<TValue>(operator: FilterOperator, value: TValue): FilterValue<TValue>
```

Convenience constructor.

```ts
import { filterValue, type ColumnFiltersState } from '@shining-technologies/ui/core'

const filters: ColumnFiltersState = [
  { id: 'status', value: filterValue('includes', ['active', 'paused']) },
  { id: 'total', value: filterValue('between', [100, 500]) },
  { id: 'name', value: 'ann' }, // bare value: text "contains"
]
```

---

## Filtering: predicates

One pure predicate per filter type. `applyQuery` and `DataTable` use exactly these, which is what
makes server and browser results agree. Each takes the row's value, the operator and the filter's
value. All return `boolean`.

All predicates except `booleanPredicate` handle `isEmpty` / `isNotEmpty` first, using
[`isEmptyValue`](#isemptyvalue) on the row value. An operator the predicate does not recognise
matches every row.

### `textPredicate`

```ts
function textPredicate(rowValue: unknown, operator: FilterOperator, needle: unknown): boolean
```

- An empty needle (not convertible by `toText`, or whitespace only) matches every row.
- The needle is trimmed, as in the search box. Both sides are compared after
  [`normalizeText`](#normalizetext) (case- and accent-insensitive).
- A row value that `toText` cannot convert is compared as `''`, so `notContains` and `notEquals`
  match rows with `null` values.
- `Date` row values are compared as their ISO string.

### `numberPredicate`

```ts
function numberPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean
```

- Values are read with [`toNumber`](#tonumber): numbers, numeric strings and booleans (`1`/`0`).
- For single-value operators, an input that is not a number matches every row; a row value that is
  not a number matches no row (including for `notEquals`).
- `between` reads its bounds with [`toRange`](#torange): `[from, to]`, `{ from, to }`,
  `{ min, max }` or `{ start, end }`. Bounds are inclusive; a reversed pair is swapped; either
  bound may be missing (open range). With both bounds missing, every row matches.

### `datePredicate`

```ts
function datePredicate(
  rowValue: unknown,
  operator: FilterOperator,
  input: unknown,
  options?: FilterOptions,
): boolean
```

- Row value and input are reduced to `yyyy-mm-dd` calendar days in `options.timeZone` with
  [`toCalendarDate`](#tocalendardate), and compared as strings. There is no millisecond
  arithmetic, so results are exact on daylight-saving days.
- `on` is the same day; `before` and `after` are exclusive; `between` is inclusive, swaps a
  reversed pair and accepts an open end (same range shapes as `numberPredicate`).
- An input that is not a date matches every row; a row value that is not a date matches no row.
- Throws `RangeError` for an invalid `timeZone` when a timestamp has to be placed in it.

```ts
import { datePredicate } from '@shining-technologies/ui/core'

// 20:00 UTC on 5 March is the morning of 6 March in Sydney.
datePredicate('2024-03-05T20:00:00Z', 'on', '2024-03-06', { timeZone: 'Australia/Sydney' }) // true
datePredicate('2024-03-05T20:00:00Z', 'on', '2024-03-06', { timeZone: 'UTC' }) // false
```

### `selectPredicate`

```ts
function selectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean
```

- An empty input matches every row.
- An input without a text form (an object or an array) cannot be an option, so the filter is
  ignored and every row matches, for `equals` and `notEquals` alike.
- Otherwise the row matches when its value converts to the same text as the input, so `2` and `"2"`
  are the same option (URLs and native `<select>` elements only produce strings). A row value
  without a text form (`null`, `undefined`, an object) never equals an option.
- `notEquals` negates; any other operator behaves as `equals`.

### `multiSelectPredicate`

```ts
function multiSelectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean
```

- Input and row value are both turned into arrays with [`toArray`](#toarray), so either may be a
  scalar or a list.
- Only entries with a text form (strings, numbers, booleans, valid dates) take part, on both sides.
  A selection with no such entries matches every row.
- `includes` matches when any selected value equals (by text) any row value; `notIncludes` negates
  that.

### `booleanPredicate`

```ts
function booleanPredicate(rowValue: unknown, operator: FilterOperator): boolean
```

The row is "true" only when its value is `true`, `'true'` or `1`. `isFalse` matches everything
else, including `null` and `undefined`. Any other operator behaves as `isTrue`.

### `matchesFilter`

```ts
function matchesFilter(
  rowValue: unknown,
  type: FilterType,
  filter: FilterValue,
  options?: FilterOptions,
): boolean
```

Dispatches to the predicate for `type`. An unknown type matches every row. It does not check
whether the filter is active and ignores `ColumnFilterConfig.predicate`; use
[`matchesColumnFilter`](#matchescolumnfilter) for that.

---

## Filtering: value coercion

All of these are total functions: they never throw.

### `toText`

```ts
function toText(value: unknown): string | null
```

Strings unchanged; numbers and booleans via `String()`; a valid `Date` as `toISOString()`.
Returns `null` for `null`, `undefined`, invalid dates, objects and arrays.

### `toNumber`

```ts
function toNumber(value: unknown): number | null
```

Finite numbers unchanged; `true`/`false` as `1`/`0`; non-blank strings through `Number()` when the
result is finite. Everything else, including `NaN` and `Infinity`, is `null`.

### `toTimestamp`

```ts
function toTimestamp(value: unknown): number | null
```

Epoch milliseconds, for ordering only. Valid `Date` and finite numbers are used as is. A
`yyyy-mm-dd` string is read as UTC midnight, so the order does not depend on the runtime's zone.
Other strings go through `Date.parse`.

### `isEmptyValue`

```ts
function isEmptyValue(value: unknown): boolean
```

`true` for `null`, `undefined`, whitespace-only strings and empty arrays. `0`, `false` and objects
are not empty.

### `normalizeText`

```ts
function normalizeText(value: string): string
```

NFKD normalisation, combining diacritical marks (U+0300 to U+036F) removed, then lower-cased.
`normalizeText('Émile')` is `'emile'`.

### `toRange`

```ts
function toRange(value: unknown): [unknown, unknown]
```

An array yields its first two elements. An object yields `[from ?? min ?? start, to ?? max ?? end]`.
Anything else yields `[value, undefined]`.

### `toArray`

```ts
function toArray(value: unknown): unknown[]
```

Arrays unchanged, `null`/`undefined` as `[]`, anything else as `[value]`.

---

## Filtering: calendar dates

### `CalendarDate`

```ts
type CalendarDate = string // 'yyyy-mm-dd'
```

### `isCalendarDate`

```ts
function isCalendarDate(value: string): boolean
```

`true` only for an exact `yyyy-mm-dd` string that names a real day, so `'2024-02-29'` is valid and
`'2024-02-30'` and `'2024-2-1'` are not. Leading or trailing whitespace makes it `false`.

### `toCalendarDate`

```ts
function toCalendarDate(value: unknown, timeZone?: string): CalendarDate | null
```

The calendar day a value falls on in `timeZone`, or `null` when it is not a date.

| Input | Result |
| --- | --- |
| `yyyy-mm-dd` string (trimmed) | Returned unchanged in every zone when it is a real day, otherwise `null`. |
| Other non-blank string | Parsed with `Date.parse`, then placed in `timeZone`. |
| `Date` | Placed in `timeZone`; an invalid date is `null`. |
| Finite number (epoch ms) | Placed in `timeZone`. |
| Anything else, blank strings | `null` |

- Without `timeZone`, the runtime's zone is used.
- An ISO timestamp without an offset (`"2024-03-05T09:00"`) is interpreted by the runtime as its
  own local time. Store timestamps with an offset or in UTC.
- Throws `RangeError('[shining-ui] "<zone>" is not a valid IANA time zone.')` for an invalid zone.
  A plain `yyyy-mm-dd` input never needs a zone and so never throws.
- Formatters are cached per zone.

---

## Sorting

### `SortOptions`

| Field | Type | Description |
| --- | --- | --- |
| `locale` | `string` | BCP 47 locale for text ordering, e.g. `"de"` or `"sv"`. Defaults to `"en"`, not the runtime locale, so a server and a browser with different default locales order rows the same way. |

### `DEFAULT_SORT_LOCALE`

```ts
const DEFAULT_SORT_LOCALE = 'en'
```

### `isEmptySortValue`

```ts
function isEmptySortValue(value: unknown): boolean
```

`true` for `null`, `undefined` and `''`. These always sort last, in both directions. Unlike
`isEmptyValue`, a whitespace-only string is not empty here. Comparators can add values of their
own; see [`getSortEmptyCheck`](#getsortemptycheck).

### Comparators

All comparators have the type `ValueComparator<unknown>` and receive non-empty values;
`sortRows` and `DataTable` place empty values before a comparator is consulted.

| Export | Signature | Behaviour |
| --- | --- | --- |
| `createTextComparator` | `(locale?: string) => ValueComparator<unknown>` | `Intl.Collator(locale, { numeric: true, sensitivity: 'base' })` over `String(a)` and `String(b)`: case- and accent-insensitive, `"item 2"` before `"item 10"`. Collators are cached per locale. An invalid locale throws `RangeError` (from `Intl`). |
| `compareText` | `ValueComparator<unknown>` | `createTextComparator()` in `"en"`. |
| `compareNumber` | `ValueComparator<unknown>` | Compares `toNumber` results. Values `toNumber` cannot read (for example `'n/a'`) sort as empty. |
| `compareDate` | `ValueComparator<unknown>` | Compares `toTimestamp` results. Values `toTimestamp` cannot read (for example `'someday'` or an invalid `Date`) sort as empty. |
| `compareBoolean` | `ValueComparator<unknown>` | `Number(Boolean(a)) - Number(Boolean(b))`: falsy before truthy. The string `'false'` is truthy. |
| `createAutoComparator` | `(locale?: string) => ValueComparator<unknown>` | Two numbers: numeric. Two booleans: `compareBoolean`. Either value a `Date`: `compareDate`. Otherwise the text comparator (whose numeric collation also orders numeric strings). `NaN` and invalid `Date`s sort as empty. |
| `compareAuto` | `ValueComparator<unknown>` | `createAutoComparator()` in `"en"`. |

"Sort as empty" means last in both directions, like `null`. `sortRows` and `applyQuery` apply this
automatically for the comparators above.

### `getSortEmptyCheck`

```ts
function getSortEmptyCheck(comparator: (a: never, b: never) => number): (value: unknown) => boolean
```

The rule for which values sort as empty (last, in both directions) with a comparator. The returned
function is `true` for `null`, `undefined` and `''`, and additionally:

| Comparator | Also empty |
| --- | --- |
| `compareNumber` (`sortingFn: 'number'`) | values `toNumber` returns `null` for |
| `compareDate` (`sortingFn: 'datetime'`) | values `toTimestamp` returns `null` for |
| any comparator from `createAutoComparator`, including `compareAuto` (`sortingFn: 'auto'` or unset) | `NaN` and invalid `Date`s |
| any other comparator, including your own | nothing |

The lookup is by comparator identity, so use the exported comparators or the ones
`resolveComparator` returns. For a custom comparator, pass the extra rule as
[`SortableColumn.isEmpty`](#sortablecolumntdata).

```ts
import { getSortEmptyCheck, resolveComparator } from '@shining-technologies/ui/core'

const isEmpty = getSortEmptyCheck(resolveComparator('number'))
isEmpty('n/a') // true
isEmpty('42') // false
```

### `resolveComparator`

```ts
function resolveComparator(
  option: BuiltInSortingFn | ((a: never, b: never) => number) | undefined,
  options?: SortOptions,
): ValueComparator<unknown>
```

Resolves a column's `sortingFn`:

| `option` | Comparator |
| --- | --- |
| a function | the function itself (`locale` is not applied) |
| `'text'` | `createTextComparator(locale)` |
| `'number'` | `compareNumber` |
| `'datetime'` | `compareDate` |
| `'boolean'` | `compareBoolean` |
| `'auto'`, `undefined`, anything else | `createAutoComparator(locale)` |

### `SortableColumn<TData>`

| Field | Type |
| --- | --- |
| `getValue` | `(row: TData, index: number) => unknown` — `index` is the row's position in the input array. |
| `compare` | `ValueComparator<unknown>` |
| `isEmpty` | `(value: unknown) => boolean` (optional) — values to sort as empty in addition to `null`, `undefined` and `''`. Defaults to [`getSortEmptyCheck(compare)`](#getsortemptycheck). |

### `sortRows`

```ts
function sortRows<TData>(
  rows: readonly TData[],
  sorting: SortingState,
  columns: ReadonlyMap<string, SortableColumn<TData>>,
): TData[]
```

Sorts by a multi-column sorting state and returns a new array; `rows` is not mutated.

- Stable: rows that compare equal keep their input order.
- Empty values sort last in both directions; a descending sort starts with the largest value, not a
  blank. Empty means `null`, `undefined` and `''`, plus the values flagged by the column's
  `isEmpty` or, by default, by its comparator's [`getSortEmptyCheck`](#getsortemptycheck) rule (with
  `compareNumber`, anything that is not a number).
- `desc` negates the comparator's result.
- Sorting entries whose id is not in `columns` are ignored. With no usable entries, a copy of
  `rows` is returned.
- Each value is read once per row per sort key.

```ts
import { compareNumber, compareText, sortRows, type SortableColumn } from '@shining-technologies/ui/core'

interface Product { name: string; price: number | null }

const columns = new Map<string, SortableColumn<Product>>([
  ['name', { getValue: (row) => row.name, compare: compareText }],
  ['price', { getValue: (row) => row.price, compare: compareNumber }],
])

const products: Product[] = [
  { name: 'Lamp', price: 40 },
  { name: 'Desk', price: null },
  { name: 'Chair', price: 120 },
]

sortRows(products, [{ id: 'price', desc: true }], columns)
// Chair (120), Lamp (40), Desk (null last)
```

---

## Pagination

### `PageItem`

```ts
type PageItem = number | 'ellipsis-start' | 'ellipsis-end'
```

### `PageRange`

| Field | Type | Description |
| --- | --- | --- |
| `from` | `number` | 1-based index of the first row on the page; `0` when there are no rows on it. |
| `to` | `number` | 1-based index of the last row on the page. |
| `total` | `number` | |

### `getPageRange`

```ts
function getPageRange(pageIndex: number, pageSize: number, total: number): PageRange
```

The numbers for "Showing 21–40 of 1,240". `pageIndex` is zero-based.

- `total <= 0` or `pageSize <= 0`: `{ from: 0, to: 0, total: Math.max(total, 0) }`.
- A page past the end: `{ from: 0, to: 0, total }`.
- Otherwise `to` is capped at `total`: `getPageRange(2, 10, 25)` is `{ from: 21, to: 25, total: 25 }`.

### `getPageNumbers`

```ts
function getPageNumbers(pageIndex: number, pageCount: number, siblingCount?: number): PageItem[]
```

The page-button list, with long runs collapsed into ellipses. Items are zero-based page indices
(add 1 for display). `siblingCount` defaults to `1` and is floored at `0`.

- `pageCount <= 0` returns `[]`.
- When `pageCount <= siblingCount * 2 + 5`, every page is listed.
- Otherwise the list always has a constant length of `siblingCount * 2 + 5` items: the first page,
  the last page, the current page with its siblings, and one or two ellipsis markers. `pageIndex`
  is clamped into range first.

```ts
getPageNumbers(30, 62, 1) // [0, 'ellipsis-start', 29, 30, 31, 'ellipsis-end', 61]
getPageNumbers(0, 62, 1)  // [0, 1, 2, 3, 4, 'ellipsis-end', 61]
getPageNumbers(3, 7, 1)   // [0, 1, 2, 3, 4, 5, 6]
```

The two ellipsis markers have distinct values so they can be used as React keys.

### `getPageCount`

```ts
function getPageCount(total: number, pageSize: number): number
```

`Math.ceil(total / pageSize)`, never less than `1`, so the UI always has a page. A negative `total`
counts as `0`; `pageSize <= 0` returns `1`.

### `clampPageIndex`

```ts
function clampPageIndex(pageIndex: number, pageCount: number): number
```

Truncates `pageIndex` to an integer and clamps it into `[0, pageCount - 1]`. A non-finite index
(`NaN`, `Infinity`) returns `0`.

### `paginateRows`

```ts
function paginateRows<TData>(rows: readonly TData[], pagination: PaginationState): TData[]
```

The rows of one page, as a new array. A page past the end is an empty array, not an error. A
negative `pageIndex` is treated as `0`. `pageSize <= 0` returns a copy of all rows.

---

## Selection

Pure helpers over `RowSelectionState` (`{ [rowId]: true }`). Useful in toolbars, in Server Actions
("delete the selected ids") and in custom tables. None of them mutate their input.

| Type | Definition |
| --- | --- |
| `SelectionMode` | `'single' \| 'multiple'` |
| `SelectionStatus` | `'none' \| 'some' \| 'all'` |

### `getSelectedRowIds`

```ts
function getSelectedRowIds(selection: RowSelectionState): string[]
```

The keys whose value is truthy, in object key order.

### `isRowSelected`

```ts
function isRowSelected(selection: RowSelectionState, id: string): boolean
```

`true` only when `selection[id] === true`.

### `setRowSelected`

```ts
function setRowSelected(
  selection: RowSelectionState,
  id: string,
  selected: boolean,
  mode?: SelectionMode, // default 'multiple'
): RowSelectionState
```

- Selecting in `'single'` mode returns `{ [id]: true }`, dropping every other selection.
- Selecting in `'multiple'` mode returns a copy with `id` set to `true`.
- Deselecting removes the key. When the row was not selected, the original object is returned
  unchanged (same reference).

### `toggleRowSelected`

```ts
function toggleRowSelected(
  selection: RowSelectionState,
  id: string,
  mode?: SelectionMode, // default 'multiple'
): RowSelectionState
```

`setRowSelected` with the opposite of `isRowSelected`.

### `setRowsSelected`

```ts
function setRowsSelected(
  selection: RowSelectionState,
  ids: readonly string[],
  selected: boolean,
): RowSelectionState
```

Selects (sets `true`) or deselects (removes) many rows at once, for "select all on this page".
Always returns a new object.

### `getSelectionStatus`

```ts
function getSelectionStatus(selection: RowSelectionState, ids: readonly string[]): SelectionStatus
```

The header checkbox state for `ids`: `'none'` when `ids` is empty or none are selected, `'all'`
when every id is selected, otherwise `'some'`.

```ts
import { getSelectionStatus, setRowsSelected } from '@shining-technologies/ui/core'

const pageIds = ['a', 'b', 'c']
let selection = setRowsSelected({}, ['a'], true)
getSelectionStatus(selection, pageIds) // 'some'
selection = setRowsSelected(selection, pageIds, true)
getSelectionStatus(selection, pageIds) // 'all'
```

---

## Columns

### `ResolvedColumn<TData>`

A leaf column reduced to what filtering, sorting and search need.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | |
| `getValue` | `(row: TData, index: number) => unknown` | |
| `filter` | `ColumnFilterConfig` | The column's `filter`, or `DEFAULT_FILTER_CONFIG`. |
| `canFilter` | `boolean` | `enableFiltering !== false` |
| `canSort` | `boolean` | `enableSorting !== false` |
| `canGlobalFilter` | `boolean` | `enableGlobalFilter !== false` |
| `sortingFn` | `QueryColumn<TData>['sortingFn']` | Unresolved; pass to `resolveComparator`. |

### `resolveColumnId`

```ts
function resolveColumnId(column: { id?: string; accessorKey?: string; accessorPath?: string }): string | undefined
```

`id`, else `accessorKey`, else `accessorPath`.

### `createAccessor`

```ts
function createAccessor<TData>(column: QueryColumn<TData>): ((row: TData, index: number) => unknown) | undefined
```

The column's value reader: `accessorFn` if it is a function; otherwise `accessorPath`, then
`accessorKey`, read with [`getByPath`](#getbypath) when the path contains `.` and as a plain
property otherwise. Returns `undefined` for display-only columns. A `null` or `undefined` row reads
as `undefined`.

### `resolveColumns`

```ts
function resolveColumns<TData>(columns: readonly QueryColumn<TData>[]): Map<string, ResolvedColumn<TData>>
```

Every leaf column that has both an id and an accessor, keyed by id. Header groups (columns with a
non-empty `columns` array) are flattened and their own accessors ignored. Columns without an id or
accessor are skipped. If two leaf columns share an id, the later one wins.

### `getFilterConfigs`

```ts
function getFilterConfigs<TData>(columns: readonly QueryColumn<TData>[]): Map<string, ColumnFilterConfig>
```

The filter configuration of each resolved column, keyed by id. Suitable as the
`FilterConfigLookup` for `getActiveFilters`.

---

## Query: `applyQuery`

### `ApplyQueryOptions<TData>`

Extends `FilterOptions` and `SortOptions`.

| Field | Type | Description |
| --- | --- | --- |
| `columns` | `readonly QueryColumn<TData>[]` | Required. The table's columns, or a shared schema without render functions. Only these columns can be filtered, searched or sorted, so a crafted query cannot reach other fields. |
| `timeZone` | `string` | Zone for `date` filters. See [`FilterOptions`](#filteroptions). |
| `locale` | `string` | Locale for text sorting. Defaults to `"en"`. |

### `QueryResult<TData>`

| Field | Type | Description |
| --- | --- | --- |
| `rows` | `TData[]` | The rows of the returned page. |
| `total` | `number` | Rows matching the filters and search, before pagination. |
| `pageCount` | `number` | At least `1`. |
| `pageIndex` | `number` | The page actually returned; a page past the end is moved back to the last page. |
| `pageSize` | `number` | The page size used. |

### `applyQuery`

```ts
function applyQuery<TData>(
  data: readonly TData[],
  query: Partial<DataTableQuery>,
  options: ApplyQueryOptions<TData>,
): QueryResult<TData>
```

Filters, searches, sorts and paginates an in-memory row set the way the client-side `DataTable`
does. Use it for server-rendered tables whose data fits in memory, in route handlers and Server
Actions, and as reference behaviour to test a database-backed implementation against.

Steps:

1. **Column filters.** Each entry of `query.columnFilters` whose id is a known column with
   `canFilter` is evaluated with `matchesColumnFilter` (bare values and inactive filters are
   handled there). Entries for unknown or non-filterable columns are ignored.
2. **Search.** `query.globalFilter` is trimmed. When non-empty, a row matches if any column with
   `canGlobalFilter` has a value that [`matchesSearchValue`](#matchessearchvalue) accepts in
   `options.timeZone`: strings and finite numbers as text, `Date` objects by calendar day.
   Booleans, `null` and objects are not searched.
3. **Sorting.** Entries of `query.sorting` for known columns with `canSort` are applied with
   `sortRows`, each column's `sortingFn` resolved in `options.locale`, so values a `number` or
   `datetime` column cannot read sort last. Other entries are ignored.
4. **Pagination.** When `query.pageSize` is missing or not positive, all matching rows are returned
   as one page and `pageSize` in the result equals `total`. Otherwise `pageIndex` (default `0`) is
   clamped with `clampPageIndex`.

`data` is not mutated. Throws `RangeError` for an invalid `timeZone` (when a date filter needs it)
or an invalid `locale` (as soon as a sort on an `auto` or `text` column is requested, even with no
rows).

```ts
// app/users/page.tsx (Server Component)
import { applyQuery, parseQuerySearchParams, type QueryColumn } from '@shining-technologies/ui/core'

interface User {
  id: string
  name: string
  status: 'active' | 'paused'
  createdAt: string
}

declare function getUsers(): Promise<User[]>

const columns: QueryColumn<User>[] = [
  { accessorKey: 'name' },
  {
    accessorKey: 'status',
    filter: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
  },
  { accessorKey: 'createdAt', filter: { type: 'date' }, sortingFn: 'datetime', enableGlobalFilter: false },
]

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseQuerySearchParams(await searchParams, { columns, pageSizeOptions: [10, 25, 50] })
  const page = applyQuery(await getUsers(), query, { columns, timeZone: 'Australia/Sydney' })
  // page.rows, page.total, page.pageCount, page.pageIndex
  return null
}
```

---

## Query: URL search params

A table query can live in the URL, which makes a table shareable, bookmarkable and renderable by a
Server Component.

### URL format

```
?page=2&size=25&sort=-createdAt,name&q=ann&f.status=includes:["active","paused"]
```

| Key | Meaning |
| --- | --- |
| `page` | 1-based page number. `page=2` is `pageIndex: 1`. |
| `size` | Page size. |
| `sort` | Comma-separated column ids, in precedence order. A leading `-` means descending. |
| `q` | Search box text. |
| `f.<columnId>` | One column filter: `<operator>:<JSON value>`, e.g. `f.total=between:[100,500]`, or `<operator>:` with nothing after the colon for operators without a value (`f.email=isEmpty:`). Anything else is a bare value meaning the column's default operator: read as JSON when it is valid JSON (`f.total=42` is the number 42, `f.name="42"` the string `"42"`), otherwise as text (`f.name=ann`). |

With `prefix: 'orders.'` every key is prefixed: `orders.page`, `orders.size`, `orders.sort`,
`orders.q`, `orders.f.status`. The values are percent-encoded in the real query string
(`serializeQuerySearchParams` produces `sort=-createdAt%2Cname`); both encoded and unencoded forms
are read.

### `SearchParamsInput`

```ts
type SearchParamsInput =
  | URLSearchParams
  | string
  | Readonly<Record<string, string | readonly string[] | undefined>>
```

A string may include or omit the leading `?`. The record form matches Next.js `searchParams`;
array values become repeated keys and `undefined` values are skipped. When a key is repeated, the
first value is used.

### `QuerySearchParamsOptions<TData = unknown>`

| Option | Type | Default | Used by | Description |
| --- | --- | --- | --- | --- |
| `prefix` | `string` | `''` | parse, serialize | Prepended to every key, for several tables on one page. |
| `defaultPageSize` | `number` | `10` | parse, serialize | Page size when the URL has none or an invalid one. `serialize` omits `size` when it equals this. |
| `pageSizeOptions` | `readonly number[]` | none | parse | Accept only these sizes from a URL; anything else falls back to `defaultPageSize`. |
| `maxPageSize` | `number` | `500` | parse | Larger sizes fall back to `defaultPageSize`. |
| `columns` | `readonly QueryColumn<TData>[]` | none | parse, serialize | When given, only sortable columns are sorted and only filterable columns filtered, a filter's operator must be valid for the column's filter type, and a filter is kept or written only while it is active. |

`serializeQuerySearchParams` also accepts `base` (see below).

### `parseQuerySearchParams`

```ts
function parseQuerySearchParams<TData = unknown>(
  input: SearchParamsInput,
  options?: QuerySearchParamsOptions<TData>,
): DataTableQuery
```

Reads a `DataTableQuery` from URL search params. Everything in a URL is untrusted, and parsing
never throws.

- **`page`**: must be an integer of at most 9 digits (surrounding whitespace allowed). Missing,
  invalid or `0` gives `pageIndex: 0`. There is no upper bound here, because the row count is not
  known; `applyQuery` clamps the page.
- **`size`**: parsed the same way. Missing or invalid, below `1`, above `maxPageSize`, or not in
  `pageSizeOptions` (when given) falls back to `defaultPageSize`. `defaultPageSize` itself is not
  checked against the other two options.
- **`sort`**: tokens are trimmed; empty tokens are skipped; a repeated id keeps its first
  occurrence. With `columns`, ids that are unknown or have `enableSorting: false` are dropped.
- **`f.<id>`**: read in URL order; a repeated id keeps its first occurrence. With `columns`, ids that
  are unknown or have `enableFiltering: false` are dropped. The value is decoded as follows:
  - `<letters>:<rest>` where `<letters>` is a name in `ALL_FILTER_OPERATORS` becomes
    `{ operator, value }`. An empty rest gives `value: undefined`; otherwise the rest is parsed as
    JSON, falling back to the raw text when it is not valid JSON (`f.name=contains:ann` gives
    `value: 'ann'`).
  - Otherwise the whole value is tried as JSON: numbers, booleans, `null`, quoted strings, arrays and
    objects are used as parsed, except an object with a string `operator` property, which is kept
    as the raw string. Invalid JSON is kept as the raw string. So `f.total=42` gives `42`,
    `f.name="42"` gives `'42'` and `f.name=ann` gives `'ann'`.
  - A prefix that is not a known operator is not an error: `f.name=foo:bar` is the bare text value
    `'foo:bar'`.
  - With `columns`, a structured filter whose operator is not valid for the column's filter type
    (for example `greaterThan` on a text column) is dropped.
  - With `columns`, a filter that is not active for the column's type (for example `f.name=` or
    `f.name=contains:`) is dropped. Without `columns`, every `f.` key is returned.
- **`q`**: returned as is (not trimmed); missing gives `''`.

```ts
import { parseQuerySearchParams } from '@shining-technologies/ui/core'

parseQuerySearchParams('?page=3&size=25&sort=-createdAt,name&f.status=includes:["active"]')
// {
//   pageIndex: 2,
//   pageSize: 25,
//   sorting: [{ id: 'createdAt', desc: true }, { id: 'name', desc: false }],
//   columnFilters: [{ id: 'status', value: { operator: 'includes', value: ['active'] } }],
//   globalFilter: '',
// }
```

### `serializeQuerySearchParams`

```ts
function serializeQuerySearchParams<TData = unknown>(
  query: Partial<DataTableQuery>,
  options?: QuerySearchParamsOptions<TData> & { base?: SearchParamsInput },
): URLSearchParams
```

Writes a query to a new `URLSearchParams`. Defaults are omitted, so an untouched table has a clean
URL.

- **`base`**: existing params to start from, so the page's other keys survive. `base` is copied, not
  mutated. Every key that belongs to this table (`page`, `size`, `sort`, `q` and every `f.*`, all
  with `prefix`) is removed from the copy first, so stale filters disappear.
- **`page`**: written as `pageIndex + 1` only when `pageIndex > 0`.
- **`size`**: written only when `pageSize` is given and differs from `defaultPageSize` (default `10`).
  `maxPageSize` and `pageSizeOptions` are not applied when writing.
- **`sort`**: the entries joined with `,`, `-` for descending. With `columns`, entries for unknown
  columns or columns with `enableSorting: false` are left out.
- **`q`**: written only when it is non-blank after trimming; the untrimmed text is written.
- **`f.<id>`**: for each entry of `columnFilters`:
  - a `null` or `undefined` value is skipped;
  - with `columns`, an entry is skipped when its column is unknown or has `enableFiltering: false`,
    when its operator is not valid for the column's filter type, or when it is inactive; a bare value
    is normalised to `operator:JSON` with the column type's default operator (`'ann'` becomes
    `contains:"ann"`, a bare `false` on a boolean column `isFalse:false`);
  - a `FilterValue` is written as `operator:` followed by `JSON.stringify(value)`, or nothing when
    `value` is `undefined`. Without `columns`, one whose operator is not a known operator name is
    skipped, because it could not be read back;
  - without `columns`, a bare string is written as is (`f.name=ann`) unless it would be misread: a
    string that is valid JSON (`'42'`, `'true'`, `'[1]'`) or starts with `<operator>:` is written as
    a JSON string (`f.name="42"`). Any other bare value is written as JSON.

`parseQuerySearchParams` reads back the values `serializeQuerySearchParams` writes, with or without
`columns`. The one type that does not survive JSON is `Date`: a bare `Date` is written, and read
back, as its ISO string.

```ts
import { serializeQuerySearchParams, type QueryColumn } from '@shining-technologies/ui/core'

interface Order { status: string; name: string; createdAt: string }

const columns: QueryColumn<Order>[] = [
  { accessorKey: 'status', filter: { type: 'multiSelect' } },
  { accessorKey: 'name' },
  { accessorKey: 'createdAt', filter: { type: 'date' } },
]

const params = serializeQuerySearchParams(
  {
    pageIndex: 2,
    pageSize: 25,
    sorting: [{ id: 'createdAt', desc: true }],
    globalFilter: 'ann',
    columnFilters: [
      { id: 'status', value: { operator: 'includes', value: ['active', 'paused'] } },
      { id: 'name', value: 'ann' },
    ],
  },
  { columns, base: 'tab=2&page=9' },
)

params.toString()
// tab=2&page=3&size=25&sort=-createdAt&q=ann
//   &f.status=includes%3A%5B%22active%22%2C%22paused%22%5D&f.name=contains%3A%22ann%22
```

---

## Query: state helpers

### `EMPTY_QUERY`

```ts
const EMPTY_QUERY: Readonly<DataTableQuery>
// { pageIndex: 0, pageSize: 10, sorting: [], columnFilters: [], globalFilter: '' }
```

The query every table starts from. The object is frozen; the arrays inside it are not, so do not
push into them.

### `buildQuery`

```ts
function buildQuery(state: DataTableState): DataTableQuery
```

Extracts the server-relevant slice of table state: `pagination.pageIndex`, `pagination.pageSize`,
`sorting`, `columnFilters` and `globalFilter`. Arrays are passed by reference, not copied.

### `isSameQuery`

```ts
function isSameQuery(a: DataTableQuery | undefined, b: DataTableQuery): boolean
```

Structural comparison used to decide whether `onQueryChange` should fire. `false` when `a` is
`undefined`. `sorting` and `columnFilters` are compared with [`stableStringify`](#stablestringify),
so object key order does not matter but array order does.

### `Normalized<TState, TConfig>`

```ts
interface Normalized<TState, TConfig> {
  state: TState | undefined
  config: TConfig | undefined
}
```

### `normalizeSortingProp`

```ts
function normalizeSortingProp(prop: SortingState | SortingFeature | undefined): Normalized<SortingState, SortingFeature>
```

### `normalizeFiltersProp`

```ts
function normalizeFiltersProp(prop: ColumnFiltersState | FilteringFeature | undefined): Normalized<ColumnFiltersState, FilteringFeature>
```

The `DataTable` `sorting` and `columnFilters` props accept either state or a feature configuration.
An array is state (`{ state: prop, config: undefined }`); anything else, including `undefined`, is
configuration (`{ state: undefined, config: prop }`).

---

## Utilities

### `getByPath`

```ts
function getByPath(source: unknown, path: string): unknown
```

Reads `"user.profile.name"` or `"items.0.id"` from an object. Returns `undefined` when `source` or
any intermediate value is `null` or `undefined`; never throws on missing segments. A path without
`.` is a single property read.

### `stableHash`

```ts
function stableHash(input: string): string
```

A deterministic 32-bit FNV-1a hash of the string's UTF-16 code units, as a base-36 string. For ids
and class names that must match between a server render and hydration. Not a cryptographic hash.

### `stableStringify`

```ts
function stableStringify(value: unknown): string
```

`JSON.stringify` with object keys sorted at every depth. Array order is preserved. Same limitations
as `JSON.stringify` (for example, `undefined` input produces `undefined`, and circular structures
throw).

---

## Export index

Every export of `@shining-technologies/ui/core`, alphabetically.

**Functions and constants:** [`ALL_FILTER_OPERATORS`](#all_filter_operators),
[`applyQuery`](#applyquery), [`booleanPredicate`](#booleanpredicate), [`buildQuery`](#buildquery),
[`clampPageIndex`](#clamppageindex), [`compareAuto`](#comparators),
[`compareBoolean`](#comparators), [`compareDate`](#comparators), [`compareNumber`](#comparators),
[`compareText`](#comparators), [`createAccessor`](#createaccessor),
[`createAutoComparator`](#comparators), [`createColumnFilterFn`](#createcolumnfilterfn),
[`createTextComparator`](#comparators), [`datePredicate`](#datepredicate),
[`DEFAULT_FILTER_CONFIG`](#default_filter_config), [`DEFAULT_OPERATOR`](#default_operator),
[`DEFAULT_SORT_LOCALE`](#default_sort_locale), [`derive`](#derive),
[`EMPTY_QUERY`](#empty_query), [`FILTER_OPERATORS`](#filter_operators),
[`filterValue`](#filtervalue), [`getActiveFilters`](#getactivefilters),
[`getByPath`](#getbypath), [`getFilterConfigs`](#getfilterconfigs),
[`getOperator`](#getoperator), [`getOperatorArity`](#getoperatorarity),
[`getOperators`](#getoperators), [`getPageCount`](#getpagecount),
[`getPageNumbers`](#getpagenumbers), [`getPageRange`](#getpagerange),
[`getSelectedRowIds`](#getselectedrowids), [`getSelectionStatus`](#getselectionstatus),
[`getSortEmptyCheck`](#getsortemptycheck),
[`globalFilterFn`](#globalfilterfn), [`isCalendarDate`](#iscalendardate),
[`isEmptySortValue`](#isemptysortvalue), [`isEmptyValue`](#isemptyvalue),
[`isFilterActive`](#isfilteractive), [`isFilterValue`](#isfiltervalue),
[`isRowSelected`](#isrowselected), [`isSameQuery`](#issamequery),
[`matchesColumnFilter`](#matchescolumnfilter), [`matchesFilter`](#matchesfilter),
[`matchesGlobalFilter`](#matchesglobalfilter), [`matchesSearchValue`](#matchessearchvalue),
[`multiSelectPredicate`](#multiselectpredicate),
[`normalizeFilterValue`](#normalizefiltervalue), [`normalizeFiltersProp`](#normalizefiltersprop),
[`normalizeSortingProp`](#normalizesortingprop), [`normalizeText`](#normalizetext),
[`numberPredicate`](#numberpredicate), [`paginateRows`](#paginaterows),
[`parseQuerySearchParams`](#parsequerysearchparams), [`resolveColumnId`](#resolvecolumnid),
[`resolveColumns`](#resolvecolumns), [`resolveComparator`](#resolvecomparator),
[`selectPredicate`](#selectpredicate), [`serializeQuerySearchParams`](#serializequerysearchparams),
[`setRowSelected`](#setrowselected), [`setRowsSelected`](#setrowsselected),
[`sortRows`](#sortrows), [`stableHash`](#stablehash), [`stableStringify`](#stablestringify),
[`textPredicate`](#textpredicate), [`toArray`](#toarray), [`toCalendarDate`](#tocalendardate),
[`toggleRowSelected`](#togglerowselected), [`toNumber`](#tonumber), [`toRange`](#torange),
[`toText`](#totext), [`toTimestamp`](#totimestamp).

**Types:** `ApplyQueryOptions`, `BooleanOperator`, `Breakpoint`, `BuiltInSortingFn`,
`CalendarDate`, `CellAlign`, `ColumnBehavior`, `ColumnFilter`, `ColumnFilterConfig`,
`ColumnFiltersState`, `ColumnMeta`, `ColumnPinningState`, `ColumnResponsive`, `ColumnSizingState`,
`ColumnSort`, `ColumnVisibilityFeature`, `DataMode`, `DataTableFeatures`, `DataTableQuery`,
`DataTableState`, `DateOperator`, `Density`, `Derivable`, `EngineFilterFn`, `ExpandedState`,
`ExpandingFeature`, `FilterConfigLookup`, `FilteringFeature`, `FilterLayout`, `FilterOperator`,
`FilterOperatorDef`, `FilterOptions`, `FilterType`, `FilterValue`, `LooseKeyOf`,
`MultiSelectOperator`, `Normalized`, `NumberOperator`, `OperatorArity`, `OperatorsByType`,
`PageItem`, `PageRange`, `PaginationFeature`, `PaginationState`, `PinnedSide`, `PinningFeature`,
`QueryColumn`, `QueryResult`, `QuerySearchParamsOptions`, `ResizingFeature`, `ResolvedColumn`,
`ResponsiveMode`, `RowData`, `RowSelectionState`, `SearchParamsInput`, `SelectionFeature`,
`SelectionMode`, `SelectionStatus`, `SelectOperator`, `SelectOption`, `SortableColumn`,
`SortingFeature`, `SortingFnOption`, `SortingState`, `SortOptions`, `TableLayout`, `TableSurface`,
`TableVariant`, `TextOperator`, `ValueComparator`, `VirtualizationFeature`, `VisibilityState`.

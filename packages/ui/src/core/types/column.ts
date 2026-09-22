import type { Breakpoint, CellAlign, LooseKeyOf, PinnedSide } from './common'
import type { ColumnFilterConfig } from './filter'

/**
 * Extra information attached to a column, available to every renderer through
 * `column.columnDef.meta`.
 *
 * Applications add their own fields by augmenting this interface:
 *
 * ```ts
 * declare module '@shining-technologies/ui/core' {
 *   interface ColumnMeta {
 *     currency?: string
 *   }
 * }
 * ```
 */
export interface ColumnMeta {
  /** Horizontal alignment for both the header and the body cells. */
  align?: CellAlign
  /** Extra classes for every body cell in this column. */
  className?: string
  /** Extra classes for this column's header cell. */
  headerClassName?: string
  /** Short label used by the column picker and the mobile card layout. */
  label?: string
  /** Viewport-dependent visibility, applied as a default the user can override. */
  responsive?: ColumnResponsive
  /** Let this column's content wrap onto several lines. Cells truncate by default. */
  wrap?: boolean
  /** Hide the column's label in card mode (useful for avatars and action columns). */
  hideLabelInCards?: boolean
  /** Skip this column entirely in card mode. */
  hideInCards?: boolean
}

export interface ColumnResponsive {
  /** Hide the column below this breakpoint. */
  hideBelow?: Breakpoint
  /** Hide the column at or above this breakpoint. */
  hideAbove?: Breakpoint
  /** Ordering hint for the mobile card layout; lower comes first. */
  priority?: number
}

/** Built-in comparators. Anything else should be a plain comparator function. */
export type BuiltInSortingFn = 'auto' | 'text' | 'number' | 'datetime' | 'boolean'

/** Comparator over *values*, not rows. Empty values are handled before it is called. */
export type ValueComparator<TValue> = (a: TValue, b: TValue) => number

export type SortingFnOption<TValue> = BuiltInSortingFn | ValueComparator<TValue>

/**
 * The behavioural half of a column definition — everything except rendering.
 *
 * It is plain data plus optional functions, and it is what both the React
 * `DataTable` and the server-side {@link applyQuery} read, so one list of
 * columns gives the browser and the server identical filtering and sorting.
 */
export interface ColumnBehavior<TData, TValue = unknown> {
  /** Defaults to `accessorKey` (or `accessorPath`). Required for display-only columns. */
  id?: string
  /** Read the value from a row by key. */
  accessorKey?: LooseKeyOf<TData>
  /** Read the value by a dotted path, e.g. `"customer.address.city"`. */
  accessorPath?: string
  /** Compute the value. Use for derived columns such as `firstName + lastName`. */
  accessorFn?: (row: TData, index: number) => TValue

  enableSorting?: boolean
  sortingFn?: SortingFnOption<TValue>
  /** Start this column's sort cycle at descending. */
  sortDescFirst?: boolean

  enableFiltering?: boolean
  /** Declarative filter config; drives the engine, the filter UI and `applyQuery`. */
  filter?: ColumnFilterConfig
  /** Include this column in the global search. Defaults to `true`. */
  enableGlobalFilter?: boolean

  enableHiding?: boolean
  /** Initial visibility. Use `columnVisibility` for controlled visibility. */
  defaultVisible?: boolean

  enableResizing?: boolean
  size?: number
  minSize?: number
  maxSize?: number

  /** `false` keeps this column out of the header menu's pinning items. Columns can be pinned by default. */
  enablePinning?: boolean
  /** Initial pinned side. Use `columnPinning` for controlled pinning. */
  defaultPinned?: PinnedSide | false

  meta?: ColumnMeta
}

/**
 * The structural subset of a column that query logic needs.
 *
 * Deliberately loose (`accessorKey: string`, comparators over `never`) so that
 * any typed column array — including the React `ColumnDef<TData>[]` with its
 * per-column value types and render functions — is assignable to it.
 */
export interface QueryColumn<TData> {
  id?: string
  accessorKey?: string
  accessorPath?: string
  accessorFn?: (row: TData, index: number) => unknown
  enableSorting?: boolean
  sortingFn?: BuiltInSortingFn | ((a: never, b: never) => number)
  enableFiltering?: boolean
  filter?: ColumnFilterConfig
  enableGlobalFilter?: boolean
  /** Child columns of a header group. */
  columns?: readonly QueryColumn<TData>[]
}

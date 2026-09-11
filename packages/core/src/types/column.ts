import type { Breakpoint, CellAlign, LooseKeyOf, PinnedSide } from './common'
import type { ColumnFilterConfig } from './filter'

/**
 * Extra information attached to a column, available to every renderer through
 * `column.columnDef.meta`.
 *
 * Applications add their own fields by augmenting this interface:
 *
 * ```ts
 * declare module '@shining-technologies/ui-kit-core' {
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
  /**
   * Viewport-dependent visibility. A default applied as table state (so the
   * column picker can bring the column back), with matching CSS classes so the
   * server render and first paint already agree with the viewport.
   */
  responsive?: ColumnResponsive
  /**
   * Let this column's content wrap onto several lines.
   *
   * Cells truncate by default: one row of a fixed-layout table that decides to
   * be three lines tall drags every other column's baseline with it.
   */
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

/** Comparator over *values*, not rows — simpler than the engine's row comparator. */
export type ValueComparator<TValue> = (a: TValue, b: TValue) => number

export type SortingFnOption<TValue> = BuiltInSortingFn | ValueComparator<TValue>

/**
 * The behavioural half of a column definition.
 *
 * Rendering (`header`, `cell`, `footer`) lives in `@shining-technologies/ui-kit-react` so that
 * this package stays framework-free.
 */
export interface ColumnBehavior<TData, TValue = unknown> {
  /** Defaults to `accessorKey`. Required for display-only columns. */
  id?: string
  /** Read the value from a row by key, including dotted paths. */
  accessorKey?: LooseKeyOf<TData>
  /** Compute the value. Use for derived columns such as `firstName + lastName`. */
  accessorFn?: (row: TData, index: number) => TValue

  enableSorting?: boolean
  sortingFn?: SortingFnOption<TValue>
  /** Start this column's sort cycle at descending. */
  sortDescFirst?: boolean

  enableFiltering?: boolean
  /** Declarative filter config; drives both the engine and the filter panel. */
  filter?: ColumnFilterConfig
  /** Include this column in the toolbar's global search. Defaults to `true`. */
  enableGlobalFilter?: boolean

  enableHiding?: boolean
  /** Initial visibility. Use `columnVisibility` for controlled visibility. */
  defaultVisible?: boolean

  enableResizing?: boolean
  size?: number
  minSize?: number
  maxSize?: number

  enablePinning?: boolean
  /** Initial pinned side. Use `columnPinning` for controlled pinning. */
  defaultPinned?: PinnedSide | false

  meta?: ColumnMeta
}

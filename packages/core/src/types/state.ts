import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/table-core'
import type { DataMode, PinnedSide } from './common'

export type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
}

/**
 * The nine state slices the table owns. Each one is independently controllable
 * and each one has exactly the same prop trio: `x`, `defaultX`, `onXChange`.
 */
export interface DataTableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
  rowSelection: RowSelectionState
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  columnPinning: ColumnPinningState
  expanded: ExpandedState
}

/**
 * Everything a server needs in order to answer a page request.
 *
 * Emitted by `onQueryChange` so the application can hand it to REST, GraphQL,
 * React Query, SWR or a server action. The table has no opinion about which.
 */
export interface DataTableQuery {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
}

export interface SortingFeature {
  enabled?: boolean
  /** `'server'` disables in-browser sorting and just reports the state. */
  mode?: DataMode
  /** Allow sorting by more than one column (shift-click, or always with `'always'`). */
  multi?: boolean | 'always'
  /** Include an "unsorted" step in the click cycle. Defaults to `true`. */
  removable?: boolean
}

export interface FilteringFeature {
  enabled?: boolean
  mode?: DataMode
  /** Show the toolbar search box. Defaults to `true`. */
  globalSearch?: boolean
  /** Debounce applied to the search box, in milliseconds. */
  debounceMs?: number
  /** Placeholder for the search box. */
  searchPlaceholder?: string
}

export interface PaginationFeature {
  enabled?: boolean
  mode?: DataMode
  pageSize?: number
  pageSizeOptions?: number[]
  /** Total row count. Required in server mode so page count can be derived. */
  rowCount?: number
  /** Render numbered page buttons in addition to prev/next. Defaults to `true`. */
  showPageNumbers?: boolean
  /** Page buttons shown either side of the current page. */
  siblingCount?: number
}

export interface SelectionFeature<TData> {
  enabled?: boolean
  mode?: 'single' | 'multiple'
  /** Decide per row whether it may be selected. */
  enableRow?: (row: TData) => boolean
  /** Stable identity for selection across pages and refetches. */
  getRowId?: (row: TData, index: number) => string
}

export interface ColumnVisibilityFeature {
  enabled?: boolean
}

export interface ResizingFeature {
  enabled?: boolean
  /** `'onEnd'` avoids re-layout during the drag on very wide tables. */
  mode?: 'onChange' | 'onEnd'
}

export interface PinningFeature {
  enabled?: boolean
  /**
   * Where the injected row-actions column is frozen. Defaults to `'right'`, so
   * actions stay reachable however far the table is scrolled sideways; `false`
   * lets the column scroll away with the rest.
   */
  actions?: PinnedSide | false
  /** Where the injected selection column is frozen. Defaults to `false`. */
  selection?: PinnedSide | false
}

export interface ExpandingFeature {
  enabled?: boolean
  /** `'single'` collapses the previously expanded row. */
  mode?: 'single' | 'multiple'
}

export interface VirtualizationFeature {
  enabled?: boolean
  /** Row height estimate in pixels; only a hint, measured rows win. */
  estimateRowHeight?: number
  overscan?: number
}

/** All behavioural configuration in one predictable place (§47). */
export interface DataTableFeatures<TData> {
  sorting?: SortingFeature
  filtering?: FilteringFeature
  pagination?: PaginationFeature
  selection?: SelectionFeature<TData>
  columnVisibility?: ColumnVisibilityFeature
  resizing?: ResizingFeature
  pinning?: PinningFeature
  expanding?: ExpandingFeature
  virtualization?: VirtualizationFeature
}

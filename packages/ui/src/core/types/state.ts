import type { DataMode, PinnedSide } from './common'

/*
 * State shapes. Structurally identical to TanStack Table's, so they pass
 * straight through to the engine, but declared here so `core/` has no
 * dependencies at all.
 */

export interface ColumnSort {
  id: string
  desc: boolean
}
export type SortingState = ColumnSort[]

export interface ColumnFilter {
  id: string
  value: unknown
}
export type ColumnFiltersState = ColumnFilter[]

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export type RowSelectionState = Record<string, boolean>
export type VisibilityState = Record<string, boolean>
export type ColumnSizingState = Record<string, number>

export interface ColumnPinningState {
  left?: string[]
  right?: string[]
}

export type ExpandedState = true | Record<string, boolean>

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
 * Emitted by `onQueryChange`, serialisable to a URL with
 * `serializeQuerySearchParams`, and answered with `applyQuery` — or by your
 * own database query.
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
}

export interface ColumnVisibilityFeature {
  enabled?: boolean
}

export interface ResizingFeature {
  enabled?: boolean
  /**
   * `'onChange'` (default) reflows the columns as the grip moves; `'onEnd'`
   * moves only a guide line and reflows once, on release, for tables too wide
   * to lay out on every frame. Either way, state changes once per drag.
   */
  mode?: 'onChange' | 'onEnd'
}

export interface PinningFeature {
  enabled?: boolean
  /** Where the injected row-actions column is frozen. Defaults to `'right'`. */
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

/** All behavioural configuration in one predictable place. */
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

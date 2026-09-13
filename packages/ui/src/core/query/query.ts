import type { ColumnFiltersState, DataTableQuery, DataTableState, SortingState } from '../types/state'
import type { FilteringFeature, SortingFeature } from '../types/state'
import { stableStringify } from '../utilities'

/** The query every table starts from. */
export const EMPTY_QUERY: Readonly<DataTableQuery> = Object.freeze({
  pageIndex: 0,
  pageSize: 10,
  sorting: [],
  columnFilters: [],
  globalFilter: '',
})

/** Extract the server-relevant slice of table state. */
export function buildQuery(state: DataTableState): DataTableQuery {
  return {
    pageIndex: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    sorting: state.sorting,
    columnFilters: state.columnFilters,
    globalFilter: state.globalFilter,
  }
}

/** Structural comparison used to decide whether `onQueryChange` should fire. */
export function isSameQuery(a: DataTableQuery | undefined, b: DataTableQuery): boolean {
  if (!a) return false
  return (
    a.pageIndex === b.pageIndex &&
    a.pageSize === b.pageSize &&
    a.globalFilter === b.globalFilter &&
    stableStringify(a.sorting) === stableStringify(b.sorting) &&
    stableStringify(a.columnFilters) === stableStringify(b.columnFilters)
  )
}

/**
 * `sorting` and `columnFilters` props accept either state or a feature config
 * object. State is *always* an array and a config is *always* a plain object,
 * so the two cannot be confused.
 */
export interface Normalized<TState, TConfig> {
  state: TState | undefined
  config: TConfig | undefined
}

export function normalizeSortingProp(
  prop: SortingState | SortingFeature | undefined,
): Normalized<SortingState, SortingFeature> {
  if (Array.isArray(prop)) return { state: prop, config: undefined }
  return { state: undefined, config: prop }
}

export function normalizeFiltersProp(
  prop: ColumnFiltersState | FilteringFeature | undefined,
): Normalized<ColumnFiltersState, FilteringFeature> {
  if (Array.isArray(prop)) return { state: prop, config: undefined }
  return { state: undefined, config: prop }
}

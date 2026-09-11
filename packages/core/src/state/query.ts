import type { DataTableQuery, DataTableState } from '../types/state'

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

/**
 * Structural comparison used to decide whether `onQueryChange` should fire.
 *
 * Filter values are arbitrary user data, so a stable stringify is the only
 * correct general answer; the object is small enough that this is cheap.
 */
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

/** `JSON.stringify` with deterministic key ordering. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const source = val as Record<string, unknown>
      const sorted: Record<string, unknown> = {}
      for (const key of Object.keys(source).sort()) sorted[key] = source[key]
      return sorted
    }
    return val
  })
}

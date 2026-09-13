import { resolveColumns } from '../columns'
import { matchesColumnFilter, matchesSearchValue } from '../filtering/filter-fn'
import { clampPageIndex, getPageCount } from '../pagination/pagination'
import { resolveComparator, type SortOptions } from '../sorting/comparators'
import { sortRows, type SortableColumn } from '../sorting/sort-rows'
import type { QueryColumn } from '../types/column'
import type { FilterOptions } from '../types/filter'
import type { DataTableQuery } from '../types/state'

export interface ApplyQueryOptions<TData> extends FilterOptions, SortOptions {
  /**
   * The table's columns — the same array the `DataTable` renders, or a shared
   * schema without the render functions. Only columns listed here can be
   * filtered, searched or sorted, so a crafted query cannot reach other fields.
   */
  columns: readonly QueryColumn<TData>[]
}

export interface QueryResult<TData> {
  /** The rows of the requested page. */
  rows: TData[]
  /** Rows matching the filters and search, before pagination. */
  total: number
  pageCount: number
  /**
   * The page actually returned. A page past the end of a shrunken result (a
   * stale link, a narrowed filter) is moved back to the last page.
   */
  pageIndex: number
  pageSize: number
}

/**
 * Filter, search, sort and paginate an in-memory row set exactly as the
 * client-side `DataTable` does.
 *
 * For server-rendered tables whose data fits in memory, for route handlers and
 * Server Actions, and as the reference behaviour to test a database-backed
 * implementation against.
 *
 * ```ts
 * // app/users/page.tsx — a Server Component
 * const query = parseQuerySearchParams(await searchParams, { columns })
 * const page = applyQuery(await getUsers(), query, { columns, timeZone: 'Australia/Sydney' })
 * ```
 */
export function applyQuery<TData>(
  data: readonly TData[],
  query: Partial<DataTableQuery>,
  options: ApplyQueryOptions<TData>,
): QueryResult<TData> {
  const columns = resolveColumns(options.columns)
  const filterOptions: FilterOptions = { timeZone: options.timeZone }

  const filters = (query.columnFilters ?? []).flatMap((entry) => {
    const column = columns.get(entry.id)
    return column?.canFilter ? [{ column, value: entry.value }] : []
  })
  const search = query.globalFilter?.trim() ?? ''
  const searchable = search
    ? [...columns.values()].filter((column) => column.canGlobalFilter)
    : []

  const matched: TData[] = []
  data.forEach((row, index) => {
    for (const { column, value } of filters) {
      if (!matchesColumnFilter(column.getValue(row, index), column.filter, value, filterOptions)) {
        return
      }
    }
    if (search) {
      // Value by value: strings, finite numbers and dates are searchable; see `matchesSearchValue`.
      const hit = searchable.some((column) =>
        matchesSearchValue(column.getValue(row, index), search, filterOptions),
      )
      if (!hit) return
    }
    matched.push(row)
  })

  const sortable = new Map<string, SortableColumn<TData>>()
  for (const sort of query.sorting ?? []) {
    const column = columns.get(sort.id)
    if (!column?.canSort) continue
    sortable.set(sort.id, {
      getValue: column.getValue,
      compare: resolveComparator(column.sortingFn, { locale: options.locale }),
    })
  }
  const sorted = sortable.size ? sortRows(matched, query.sorting ?? [], sortable) : matched

  const total = sorted.length
  const pageSize = query.pageSize !== undefined && query.pageSize > 0 ? query.pageSize : total
  const pageCount = getPageCount(total, pageSize)
  const pageIndex = clampPageIndex(query.pageIndex ?? 0, pageCount)
  const start = pageIndex * pageSize

  return {
    rows: pageSize > 0 ? sorted.slice(start, start + pageSize) : sorted,
    total,
    pageCount,
    pageIndex,
    pageSize,
  }
}

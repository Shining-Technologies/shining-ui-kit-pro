import { DEFAULT_FILTER_CONFIG } from '../filtering/filter-fn'
import type { ColumnFilterConfig } from '../types/filter'
import type { QueryColumn } from '../types/column'
import { getByPath } from '../utilities'

/** A leaf column reduced to what filtering, sorting and search need. */
export interface ResolvedColumn<TData> {
  id: string
  getValue: (row: TData, index: number) => unknown
  filter: ColumnFilterConfig
  canFilter: boolean
  canSort: boolean
  canGlobalFilter: boolean
  sortingFn: QueryColumn<TData>['sortingFn']
}

/** The id a column is addressed by: `id`, else `accessorKey`, else `accessorPath`. */
export function resolveColumnId(column: {
  id?: string
  accessorKey?: string
  accessorPath?: string
}): string | undefined {
  return column.id ?? column.accessorKey ?? column.accessorPath
}

/**
 * A column's value reader, or `undefined` for display-only columns.
 *
 * `accessorFn` wins, then `accessorPath`, then `accessorKey` (a dotted key is
 * read as a path, exactly as the table does).
 */
export function createAccessor<TData>(
  column: QueryColumn<TData>,
): ((row: TData, index: number) => unknown) | undefined {
  if (typeof column.accessorFn === 'function') return column.accessorFn
  const path = column.accessorPath ?? column.accessorKey
  if (!path) return undefined
  return path.includes('.')
    ? (row) => getByPath(row, path)
    : (row) => (row as Record<string, unknown> | null | undefined)?.[path]
}

/** Every leaf column with an accessor, groups flattened, keyed by id. */
export function resolveColumns<TData>(
  columns: readonly QueryColumn<TData>[],
): Map<string, ResolvedColumn<TData>> {
  const out = new Map<string, ResolvedColumn<TData>>()
  const visit = (list: readonly QueryColumn<TData>[]) => {
    for (const column of list) {
      if (column.columns?.length) {
        visit(column.columns)
        continue
      }
      const id = resolveColumnId(column)
      const getValue = createAccessor(column)
      if (!id || !getValue) continue
      out.set(id, {
        id,
        getValue,
        filter: column.filter ?? DEFAULT_FILTER_CONFIG,
        canFilter: column.enableFiltering !== false,
        canSort: column.enableSorting !== false,
        canGlobalFilter: column.enableGlobalFilter !== false,
        sortingFn: column.sortingFn,
      })
    }
  }
  visit(columns)
  return out
}

/** Filter configuration by column id, for the functions that take a lookup. */
export function getFilterConfigs<TData>(
  columns: readonly QueryColumn<TData>[],
): Map<string, ColumnFilterConfig> {
  const out = new Map<string, ColumnFilterConfig>()
  for (const [id, column] of resolveColumns(columns)) out.set(id, column.filter)
  return out
}

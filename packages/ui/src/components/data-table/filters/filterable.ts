import type { ColumnFilterConfig } from '../../../core'
import type { Column, Table } from '@tanstack/react-table'

export interface FilterableColumn<TData> {
  column: Column<TData, unknown>
  config: ColumnFilterConfig
}

/**
 * The columns a filter UI should offer, in column order.
 *
 * Shared by both filter layouts so that "which columns can be filtered" is
 * answered in one place: a column that shows up in the panel must also show up
 * inline, or moving between layouts would silently change what is filterable.
 */
export function filterableColumns<TData>(
  table: Table<TData>,
  configs: Map<string, ColumnFilterConfig>,
): FilterableColumn<TData>[] {
  const out: FilterableColumn<TData>[] = []
  for (const column of table.getAllLeafColumns()) {
    const config = configs.get(column.id)
    if (!config || config.hidden || !column.getCanFilter()) continue
    out.push({ column, config })
  }
  return out
}

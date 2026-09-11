import { useDataTable } from '../../context/table-context'
import { CloseIcon } from '../../lib/icons'
import type { ClearFiltersProps } from '../../types/components'

/**
 * "Clear filters", shown only once there is something to clear.
 *
 * Every filter control can be reset individually, but a table narrowed by four
 * of them needs one way back to the whole data set — otherwise "why am I seeing
 * three rows?" is answered by reloading the page. It counts what it will
 * remove, so pressing it is never a surprise.
 */
export function DefaultClearFilters<TData>({ table }: ClearFiltersProps<TData>) {
  const { isFiltered, clearFilters } = useDataTable<TData>()
  if (!isFiltered) return null

  const columnFilters = table.getState().columnFilters.length
  const search = String(table.getState().globalFilter ?? '').trim() ? 1 : 0
  const total = columnFilters + search

  return (
    <button
      type="button"
      className="sui-clear-filters"
      onClick={clearFilters}
      aria-label={`Clear ${total} ${total === 1 ? 'filter' : 'filters'}`}
    >
      <CloseIcon aria-hidden="true" />
      Clear filters
      <span className="sui-count">{total}</span>
    </button>
  )
}

import { getOperator, normalizeFilterValue, type ColumnFilterConfig } from '@shining-ui-kit/core'
import type { Table } from '@tanstack/react-table'
import { useDataTable } from '../../context/table-context'
import { CloseIcon } from '../../lib/icons'

/** Render a filter value the way a person would read it back. */
function describeValue(value: unknown, config: ColumnFilterConfig): string {
  if (Array.isArray(value)) {
    if (config.type === 'multiSelect') {
      const labels = value.map(
        (item) =>
          config.options?.find((option) => String(option.value) === String(item))?.label ??
          String(item),
      )
      return labels.join(', ')
    }
    const [from, to] = value
    if (from && to) return `${String(from)} – ${String(to)}`
    if (from) return `from ${String(from)}`
    if (to) return `to ${String(to)}`
    return ''
  }
  if (value === undefined || value === null || value === '') return ''
  const match = config.options?.find((option) => String(option.value) === String(value))
  return match?.label ?? String(value)
}

/**
 * Chips summarising the filters that are currently narrowing the table.
 *
 * Without these, a filter set in a popover is invisible once the popover closes,
 * and users are left wondering where their rows went.
 */
export function ActiveFilters<TData>({ table }: { table: Table<TData> }) {
  const { filterConfigs, columnLabels, clearFilters } = useDataTable<TData>()
  const filters = table.getState().columnFilters

  if (filters.length === 0) return null

  return (
    <div className="sui-active-filters">
      <span className="sui-sr-only" role="status">
        {filters.length} {filters.length === 1 ? 'filter' : 'filters'} applied
      </span>

      {filters.map((entry) => {
        const config = filterConfigs.get(entry.id)
        if (!config) return null
        const label = columnLabels.get(entry.id) ?? entry.id
        const filter = normalizeFilterValue(entry.value, config.type)
        const operator = getOperator(config.type, filter.operator)
        const described = describeValue(filter.value, config)

        return (
          <span key={entry.id} className="sui-chip">
            <span className="sui-chip__label">{label}</span>
            <span className="sui-chip__operator">{operator?.label ?? filter.operator}</span>
            {described ? <span className="sui-chip__value">{described}</span> : null}
            <button
              type="button"
              className="sui-chip__remove"
              aria-label={`Remove ${label} filter`}
              onClick={() => table.getColumn(entry.id)?.setFilterValue(undefined)}
            >
              <CloseIcon />
            </button>
          </span>
        )
      })}

      <button type="button" className="sui-link" onClick={clearFilters}>
        Clear all
      </button>
    </div>
  )
}

'use client'

import {
  getActiveFilters,
  getOperator,
  normalizeFilterValue,
  type ColumnFilterConfig,
} from '../../../core'
import type { Table } from '@tanstack/react-table'
import { useDataTable } from '../context'
import { CloseIcon } from '../../icons/icons'

/** An unset range end. `0` is a value, not a blank. */
function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

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
    if (!isBlank(from) && !isBlank(to)) return `${String(from)} – ${String(to)}`
    if (!isBlank(from)) return `from ${String(from)}`
    if (!isBlank(to)) return `to ${String(to)}`
    return ''
  }
  if (isBlank(value)) return ''
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
  // Only filters that narrow the result get a chip.
  const filters = getActiveFilters(table.getState().columnFilters, filterConfigs)

  if (filters.length === 0) return null

  return (
    <div className="sui-active-filters">
      <span className="sui-sr-only" role="status">
        {filters.length} {filters.length === 1 ? 'filter' : 'filters'} applied
      </span>

      {filters.map((entry) => {
        const config = filterConfigs.get(entry.id)
        if (!config) return null
        // `filter.label` first, as in the panel and the inline controls.
        const label = config.label ?? columnLabels.get(entry.id) ?? entry.id
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

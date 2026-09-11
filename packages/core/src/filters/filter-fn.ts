import type { ColumnFilterConfig, FilterOperator, FilterType, FilterValue } from '../types/filter'
import { isFilterValue } from '../types/filter'
import { isEmptyValue, normalizeText, toText } from './coerce'
import { DEFAULT_OPERATOR, getOperatorArity } from './operators'
import { matchesFilter } from './predicates'

/**
 * Turn whatever the application put in `columnFilters` into the structured form.
 *
 * `columnFilters={[{ id: 'name', value: 'john' }]}` is valid and means
 * "name contains john" — the raw value is paired with the type's default operator.
 */
export function normalizeFilterValue(raw: unknown, type: FilterType): FilterValue {
  if (isFilterValue(raw)) return raw
  return { operator: DEFAULT_OPERATOR[type], value: raw }
}

/**
 * `true` when a filter would actually narrow the result set.
 *
 * Used to count active filters, to decide whether "Clear filters" is offered, and
 * to drop no-op entries before they reach the engine.
 */
export function isFilterActive(raw: unknown, type: FilterType): boolean {
  const filter = normalizeFilterValue(raw, type)
  const arity = getOperatorArity(type, filter.operator)
  if (arity === 'none') return true
  if (arity === 'two') {
    const value = filter.value
    if (Array.isArray(value)) return !isEmptyValue(value[0]) || !isEmptyValue(value[1])
    return !isEmptyValue(value)
  }
  return !isEmptyValue(filter.value)
}

/** The shape TanStack Table expects from a filter function. */
type EngineFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown,
) => boolean

/**
 * Build the engine filter function for a column from its declarative config.
 *
 * The engine never learns about operators; it only ever calls this closure. That
 * is what keeps the filter *UI* replaceable without touching the filter *engine*.
 */
export function createColumnFilterFn(config: ColumnFilterConfig): EngineFilterFn {
  return (row, columnId, filterValue) => {
    if (!isFilterActive(filterValue, config.type)) return true
    const filter = normalizeFilterValue(filterValue, config.type)
    const rowValue = row.getValue(columnId)
    if (config.predicate) return config.predicate(rowValue, filter)
    return matchesFilter(rowValue, config.type, filter)
  }
}

/** Case- and accent-insensitive "contains" used by the toolbar search box. */
export const globalFilterFn: EngineFilterFn = (row, columnId, filterValue) => {
  const query = toText(filterValue)
  if (query === null || query.trim() === '') return true
  const haystack = toText(row.getValue(columnId))
  if (haystack === null) return false
  return normalizeText(haystack).includes(normalizeText(query))
}

/** Convenience constructor for a structured filter value. */
export function filterValue<TValue>(operator: FilterOperator, value: TValue): FilterValue<TValue> {
  return { operator, value }
}

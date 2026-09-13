import type { ColumnFilterConfig, FilterOperator, FilterOptions, FilterType, FilterValue } from '../types/filter'
import { isFilterValue } from '../types/filter'
import type { ColumnFiltersState } from '../types/state'
import { isEmptyValue, normalizeText, toText } from './coerce'
import { toCalendarDate } from './dates'
import { DEFAULT_OPERATOR, getOperatorArity } from './operators'
import { matchesFilter } from './predicates'

/** The filter a column without a `filter` config gets: text, `contains`. */
export const DEFAULT_FILTER_CONFIG: ColumnFilterConfig = { type: 'text' }

/**
 * Turn whatever the application put in `columnFilters` into the structured form.
 *
 * `columnFilters={[{ id: 'name', value: 'john' }]}` is valid and means
 * "name contains john" — the raw value is paired with the type's default operator.
 *
 * On a `boolean` column a bare `false` (or `'false'`, or `0`) means `isFalse`;
 * any other bare value means `isTrue`.
 */
export function normalizeFilterValue(raw: unknown, type: FilterType): FilterValue {
  if (isFilterValue(raw)) return raw
  if (type === 'boolean' && (raw === false || raw === 'false' || raw === 0)) {
    return { operator: 'isFalse', value: raw }
  }
  return { operator: DEFAULT_OPERATOR[type], value: raw }
}

/**
 * `true` when a filter would actually narrow the result set.
 *
 * A filter whose operator was chosen but whose value is still empty is *not*
 * active: it is not counted, not sent to the server and not written to a URL.
 */
export function isFilterActive(raw: unknown, type: FilterType): boolean {
  if (raw === undefined || raw === null) return false
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

/** Filter configuration looked up by column id. */
export type FilterConfigLookup =
  | ReadonlyMap<string, ColumnFilterConfig>
  | Readonly<Record<string, ColumnFilterConfig>>

function lookup(configs: FilterConfigLookup, id: string): ColumnFilterConfig | undefined {
  return configs instanceof Map
    ? configs.get(id)
    : (configs as Readonly<Record<string, ColumnFilterConfig>>)[id]
}

/** Only the entries of `filters` that narrow the result. Returns `filters` itself when all do. */
export function getActiveFilters(
  filters: ColumnFiltersState,
  configs: FilterConfigLookup,
): ColumnFiltersState {
  const active = filters.filter((entry) =>
    isFilterActive(entry.value, (lookup(configs, entry.id) ?? DEFAULT_FILTER_CONFIG).type),
  )
  return active.length === filters.length ? filters : active
}

/** Evaluate one column filter against one value. */
export function matchesColumnFilter(
  rowValue: unknown,
  config: ColumnFilterConfig,
  rawFilter: unknown,
  options?: FilterOptions,
): boolean {
  if (!isFilterActive(rawFilter, config.type)) return true
  const filter = normalizeFilterValue(rawFilter, config.type)
  if (config.predicate) return config.predicate(rowValue, filter)
  return matchesFilter(rowValue, config.type, filter, options)
}

/** The shape TanStack Table expects from a filter function. */
export type EngineFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown,
) => boolean

/**
 * Build the engine filter function for a column from its declarative config.
 *
 * The engine never learns about operators; it only calls this closure. That is
 * what keeps the filter UI replaceable without touching filtering itself.
 */
export function createColumnFilterFn(
  config: ColumnFilterConfig,
  options?: FilterOptions,
): EngineFilterFn {
  return (row, columnId, filterValue) =>
    matchesColumnFilter(row.getValue(columnId), config, filterValue, options)
}

/** Case- and accent-insensitive "contains" over any value with a text form. */
export function matchesGlobalFilter(value: unknown, query: unknown): boolean {
  const needle = toText(query)
  if (needle === null || needle.trim() === '') return true
  const haystack = toText(value)
  if (haystack === null) return false
  return normalizeText(haystack).includes(normalizeText(needle.trim()))
}

/**
 * The search box's rule for one cell value: whether it is searchable, and how
 * it matches. `applyQuery` uses it for every searchable column, value by value.
 *
 * - **Strings**: case- and accent-insensitive "contains".
 * - **Numbers**: finite numbers by their decimal text, so `30` finds `300`.
 * - **Dates**: a valid `Date` by its calendar day, `yyyy-mm-dd`, in
 *   `options.timeZone` — the day a date filter would put it on.
 * - **Everything else** — booleans, `null`, objects, arrays, `NaN`, invalid
 *   dates — never matches. (Booleans are rendered as icons or badges, not the
 *   words "true" and "false", and would otherwise match almost any query.)
 *
 * The query is trimmed; an empty query matches every value. Throws
 * `RangeError` for an invalid `timeZone` when a date has to be placed in it.
 */
export function matchesSearchValue(value: unknown, query: unknown, options?: FilterOptions): boolean {
  const needle = toText(query)?.trim() ?? ''
  if (needle === '') return true
  let haystack: string | null = null
  if (typeof value === 'string') haystack = value
  else if (typeof value === 'number') haystack = Number.isFinite(value) ? String(value) : null
  else if (value instanceof Date) haystack = toCalendarDate(value, options?.timeZone)
  if (haystack === null) return false
  return normalizeText(haystack).includes(normalizeText(needle))
}

export const globalFilterFn: EngineFilterFn = (row, columnId, filterValue) =>
  matchesGlobalFilter(row.getValue(columnId), filterValue)

/** Convenience constructor for a structured filter value. */
export function filterValue<TValue>(operator: FilterOperator, value: TValue): FilterValue<TValue> {
  return { operator, value }
}

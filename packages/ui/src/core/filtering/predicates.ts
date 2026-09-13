import type { FilterOperator, FilterOptions, FilterType, FilterValue } from '../types/filter'
import { isEmptyValue, normalizeText, toArray, toNumber, toRange, toText } from './coerce'
import { toCalendarDate } from './dates'

/**
 * One pure predicate per filter type.
 *
 * Exported individually so they can be unit-tested and reused anywhere —
 * `applyQuery` on a server uses exactly these functions, which is what makes
 * server results match the browser's.
 *
 * A filter value a predicate cannot use (text that is not a number for a
 * number filter, an object for a select filter) does not narrow anything: the
 * filter matches every row, the same way an unknown operator is ignored.
 */

export function textPredicate(rowValue: unknown, operator: FilterOperator, needle: unknown): boolean {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  // Trimmed, like the search box: `"ann "` and `"ann"` are the same filter.
  const needleText = toText(needle)?.trim() ?? ''
  if (needleText === '') return true
  const haystack = normalizeText(toText(rowValue) ?? '')
  const query = normalizeText(needleText)

  switch (operator) {
    case 'contains':
      return haystack.includes(query)
    case 'notContains':
      return !haystack.includes(query)
    case 'equals':
      return haystack === query
    case 'notEquals':
      return haystack !== query
    case 'startsWith':
      return haystack.startsWith(query)
    case 'endsWith':
      return haystack.endsWith(query)
    default:
      return true
  }
}

/** Order a range so a reversed pair (`[200, 80]`) still means "between 80 and 200". */
function ordered<T extends string | number>(from: T | null, to: T | null): [T | null, T | null] {
  return from !== null && to !== null && from > to ? [to, from] : [from, to]
}

export function numberPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const value = toNumber(rowValue)

  if (operator === 'between') {
    const [fromRaw, toRaw] = toRange(input)
    const [from, to] = ordered(toNumber(fromRaw), toNumber(toRaw))
    if (from === null && to === null) return true
    if (value === null) return false
    if (from !== null && value < from) return false
    if (to !== null && value > to) return false
    return true
  }

  const target = toNumber(input)
  if (target === null) return true
  if (value === null) return false

  switch (operator) {
    case 'equals':
      return value === target
    case 'notEquals':
      return value !== target
    case 'greaterThan':
      return value > target
    case 'greaterThanOrEqual':
      return value >= target
    case 'lessThan':
      return value < target
    case 'lessThanOrEqual':
      return value <= target
    default:
      return true
  }
}

/**
 * Days are compared as `yyyy-mm-dd` strings in `options.timeZone`, so `on`,
 * `before`, `after` and an inclusive `between` are exact on every day of the
 * year, including daylight-saving changes.
 */
export function datePredicate(
  rowValue: unknown,
  operator: FilterOperator,
  input: unknown,
  options: FilterOptions = {},
): boolean {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const { timeZone } = options
  const day = toCalendarDate(rowValue, timeZone)

  if (operator === 'between') {
    const [fromRaw, toRaw] = toRange(input)
    const [from, to] = ordered(toCalendarDate(fromRaw, timeZone), toCalendarDate(toRaw, timeZone))
    if (from === null && to === null) return true
    if (day === null) return false
    if (from !== null && day < from) return false
    if (to !== null && day > to) return false
    return true
  }

  const target = toCalendarDate(input, timeZone)
  if (target === null) return true
  if (day === null) return false

  switch (operator) {
    case 'on':
      return day === target
    case 'before':
      return day < target
    case 'after':
      return day > target
    default:
      return true
  }
}

export function selectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)
  if (isEmptyValue(input)) return true

  // An option is a string, number or boolean. Anything else (an object, an
  // array) cannot select a row, so the filter is ignored rather than matching
  // every row whose own value has no text form.
  const target = toText(input)
  if (target === null) return true

  // `2` and `"2"` are the same option: a URL or a native <select> only speaks strings.
  const equal = toText(rowValue) === target
  return operator === 'notEquals' ? !equal : equal
}

export function multiSelectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown): boolean {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  // Only entries with a text form take part, on either side (see `selectPredicate`).
  const selected = texts(toArray(input))
  if (selected.length === 0) return true

  const rowValues = texts(toArray(rowValue))
  const hit = selected.some((s) => rowValues.includes(s))
  return operator === 'notIncludes' ? !hit : hit
}

function texts(values: unknown[]): string[] {
  const out: string[] = []
  for (const value of values) {
    const text = toText(value)
    if (text !== null) out.push(text)
  }
  return out
}

export function booleanPredicate(rowValue: unknown, operator: FilterOperator): boolean {
  const truthy = rowValue === true || rowValue === 'true' || rowValue === 1
  return operator === 'isFalse' ? !truthy : truthy
}

/** Dispatch to the predicate for `type`. The one entry point the engines use. */
export function matchesFilter(
  rowValue: unknown,
  type: FilterType,
  filter: FilterValue,
  options?: FilterOptions,
): boolean {
  switch (type) {
    case 'text':
      return textPredicate(rowValue, filter.operator, filter.value)
    case 'number':
      return numberPredicate(rowValue, filter.operator, filter.value)
    case 'date':
      return datePredicate(rowValue, filter.operator, filter.value, options)
    case 'select':
      return selectPredicate(rowValue, filter.operator, filter.value)
    case 'multiSelect':
      return multiSelectPredicate(rowValue, filter.operator, filter.value)
    case 'boolean':
      return booleanPredicate(rowValue, filter.operator)
    default:
      return true
  }
}

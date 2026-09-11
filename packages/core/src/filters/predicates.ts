import type { FilterOperator, FilterType, FilterValue } from '../types/filter'
import {
  isEmptyValue,
  normalizeText,
  startOfDay,
  toArray,
  toNumber,
  toRange,
  toText,
  toTimestamp,
} from './coerce'

/**
 * One pure predicate per filter type.
 *
 * These are exported individually so they can be unit-tested and reused by
 * applications that need to filter outside the table (for example on a server).
 */

export function textPredicate(rowValue: unknown, operator: FilterOperator, needle: unknown) {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const haystackRaw = toText(rowValue)
  const needleRaw = toText(needle)
  if (needleRaw === null || needleRaw.trim() === '') return true
  const haystack = normalizeText(haystackRaw ?? '')
  const query = normalizeText(needleRaw)

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

export function numberPredicate(rowValue: unknown, operator: FilterOperator, input: unknown) {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const value = toNumber(rowValue)

  if (operator === 'between') {
    const [fromRaw, toRaw] = toRange(input)
    const from = toNumber(fromRaw)
    const to = toNumber(toRaw)
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

export function datePredicate(rowValue: unknown, operator: FilterOperator, input: unknown) {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const value = toTimestamp(rowValue)

  if (operator === 'between') {
    const [fromRaw, toRaw] = toRange(input)
    const from = toTimestamp(fromRaw)
    const to = toTimestamp(toRaw)
    if (from === null && to === null) return true
    if (value === null) return false
    if (from !== null && value < startOfDay(from)) return false
    // `to` is inclusive of the whole day the user picked.
    if (to !== null && value >= startOfDay(to) + DAY_MS) return false
    return true
  }

  const target = toTimestamp(input)
  if (target === null) return true
  if (value === null) return false

  switch (operator) {
    case 'on':
      return startOfDay(value) === startOfDay(target)
    case 'before':
      return value < startOfDay(target)
    case 'after':
      return value >= startOfDay(target) + DAY_MS
    default:
      return true
  }
}

const DAY_MS = 86_400_000

export function selectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown) {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)
  if (isEmptyValue(input)) return true

  const equal = Object.is(rowValue, input) || toText(rowValue) === toText(input)
  return operator === 'notEquals' ? !equal : equal
}

export function multiSelectPredicate(rowValue: unknown, operator: FilterOperator, input: unknown) {
  if (operator === 'isEmpty') return isEmptyValue(rowValue)
  if (operator === 'isNotEmpty') return !isEmptyValue(rowValue)

  const selected = toArray(input)
  if (selected.length === 0) return true

  const rowValues = toArray(rowValue).map((v) => toText(v))
  const hit = selected.some((s) => rowValues.includes(toText(s)))
  return operator === 'notIncludes' ? !hit : hit
}

export function booleanPredicate(rowValue: unknown, operator: FilterOperator) {
  const truthy = rowValue === true || rowValue === 'true' || rowValue === 1
  return operator === 'isFalse' ? !truthy : truthy
}

/** Dispatch to the predicate for `type`. The one entry point the engine uses. */
export function matchesFilter(rowValue: unknown, type: FilterType, filter: FilterValue): boolean {
  switch (type) {
    case 'text':
      return textPredicate(rowValue, filter.operator, filter.value)
    case 'number':
      return numberPredicate(rowValue, filter.operator, filter.value)
    case 'date':
      return datePredicate(rowValue, filter.operator, filter.value)
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

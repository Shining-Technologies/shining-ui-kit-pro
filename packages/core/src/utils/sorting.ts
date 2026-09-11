import type { BuiltInSortingFn, ValueComparator } from '../types/column'
import { toNumber, toTimestamp } from '../filters/coerce'

/**
 * Value comparators. `undefined` and `null` always sort last regardless of
 * direction, which is what users expect from a spreadsheet.
 */
const NULL_LAST = (a: unknown, b: unknown): number | null => {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  return null
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const compareText: ValueComparator<unknown> = (a, b) =>
  NULL_LAST(a, b) ?? collator.compare(String(a), String(b))

export const compareNumber: ValueComparator<unknown> = (a, b) => {
  const nulls = NULL_LAST(a, b)
  if (nulls !== null) return nulls
  return (toNumber(a) ?? 0) - (toNumber(b) ?? 0)
}

export const compareDate: ValueComparator<unknown> = (a, b) => {
  const nulls = NULL_LAST(a, b)
  if (nulls !== null) return nulls
  return (toTimestamp(a) ?? 0) - (toTimestamp(b) ?? 0)
}

export const compareBoolean: ValueComparator<unknown> = (a, b) => {
  const nulls = NULL_LAST(a, b)
  if (nulls !== null) return nulls
  return Number(Boolean(a)) - Number(Boolean(b))
}

/** Pick a comparator from the value's runtime type. */
export const compareAuto: ValueComparator<unknown> = (a, b) => {
  const nulls = NULL_LAST(a, b)
  if (nulls !== null) return nulls
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return compareBoolean(a, b)
  if (a instanceof Date || b instanceof Date) return compareDate(a, b)
  return compareText(a, b)
}

const BUILT_INS: Record<BuiltInSortingFn, ValueComparator<unknown>> = {
  auto: compareAuto,
  text: compareText,
  number: compareNumber,
  datetime: compareDate,
  boolean: compareBoolean,
}

/** Resolve a column's `sortingFn` option to a concrete comparator. */
export function resolveComparator<TValue>(
  option: BuiltInSortingFn | ValueComparator<TValue> | undefined,
): ValueComparator<TValue> {
  if (typeof option === 'function') return option
  return (BUILT_INS[option ?? 'auto'] ?? compareAuto) as ValueComparator<TValue>
}

import { toNumber, toTimestamp } from '../filtering/coerce'
import type { BuiltInSortingFn, ValueComparator } from '../types/column'

export interface SortOptions {
  /**
   * BCP 47 locale for text ordering, e.g. `"de"` or `"sv"`.
   *
   * Defaults to `"en"` rather than the runtime's locale: a server and a
   * browser with different default locales would otherwise order the same rows
   * differently, and a server-rendered table would not match its hydration.
   */
  locale?: string
}

export const DEFAULT_SORT_LOCALE = 'en'

/** `true` for the values that always sort last: `null`, `undefined` and `''`. */
export function isEmptySortValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/*
 * Comparators receive non-empty values; `sortRows` and the table engine place
 * empty values last, in both directions, before a comparator is consulted.
 *
 * What counts as empty depends on the comparator: a `number` comparator treats
 * a value it cannot read as a number as empty rather than as zero, a
 * `datetime` comparator a value it cannot read as a date. Each built-in
 * comparator registers its rule here; `getSortEmptyCheck` looks it up.
 */
const emptyChecks = new WeakMap<object, (value: unknown) => boolean>()

function withEmptyCheck(
  comparator: ValueComparator<unknown>,
  isEmpty: (value: unknown) => boolean,
): ValueComparator<unknown> {
  emptyChecks.set(comparator, isEmpty)
  return comparator
}

const isUnreadableNumber = (value: unknown) => isEmptySortValue(value) || toNumber(value) === null
const isUnreadableDate = (value: unknown) => isEmptySortValue(value) || toTimestamp(value) === null
const isUnreadableAuto = (value: unknown) =>
  isEmptySortValue(value) ||
  (typeof value === 'number' && Number.isNaN(value)) ||
  (value instanceof Date && Number.isNaN(value.getTime()))

/**
 * Which values sort as empty — last, in both directions — for a comparator.
 *
 * `null`, `undefined` and `''` always do. On top of that, `compareNumber`
 * treats any value `toNumber` cannot read as empty, `compareDate` any value
 * `toTimestamp` cannot read, and automatic comparators `NaN` and invalid
 * `Date`s. Any other comparator, including your own, gets the base rule.
 */
export function getSortEmptyCheck(
  comparator: (a: never, b: never) => number,
): (value: unknown) => boolean {
  return emptyChecks.get(comparator) ?? isEmptySortValue
}

const collators = new Map<string, Intl.Collator>()

function collatorFor(locale: string): Intl.Collator {
  let collator = collators.get(locale)
  if (!collator) {
    collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
    collators.set(locale, collator)
  }
  return collator
}

export function createTextComparator(locale = DEFAULT_SORT_LOCALE): ValueComparator<unknown> {
  const collator = collatorFor(locale)
  return (a, b) => collator.compare(String(a), String(b))
}

function compareNullable(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

export const compareNumber: ValueComparator<unknown> = withEmptyCheck(
  (a, b) => compareNullable(toNumber(a), toNumber(b)),
  isUnreadableNumber,
)

export const compareDate: ValueComparator<unknown> = withEmptyCheck(
  (a, b) => compareNullable(toTimestamp(a), toTimestamp(b)),
  isUnreadableDate,
)

export const compareBoolean: ValueComparator<unknown> = (a, b) =>
  Number(Boolean(a)) - Number(Boolean(b))

export function createAutoComparator(locale = DEFAULT_SORT_LOCALE): ValueComparator<unknown> {
  const text = createTextComparator(locale)
  return withEmptyCheck((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b
    if (typeof a === 'boolean' && typeof b === 'boolean') return compareBoolean(a, b)
    if (a instanceof Date || b instanceof Date) return compareDate(a, b)
    return text(a, b)
  }, isUnreadableAuto)
}

/** The text and automatic comparators in the default locale. */
export const compareText = createTextComparator()
export const compareAuto = createAutoComparator()

/** Resolve a column's `sortingFn` option to a concrete comparator. */
export function resolveComparator(
  option: BuiltInSortingFn | ((a: never, b: never) => number) | undefined,
  options: SortOptions = {},
): ValueComparator<unknown> {
  if (typeof option === 'function') return option as ValueComparator<unknown>
  const locale = options.locale ?? DEFAULT_SORT_LOCALE
  switch (option) {
    case 'text':
      return createTextComparator(locale)
    case 'number':
      return compareNumber
    case 'datetime':
      return compareDate
    case 'boolean':
      return compareBoolean
    default:
      return createAutoComparator(locale)
  }
}

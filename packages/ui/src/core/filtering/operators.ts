import type { FilterOperator, FilterOperatorDef, FilterType, OperatorArity } from '../types/filter'

const def = (operator: FilterOperator, label: string, arity: OperatorArity): FilterOperatorDef => ({
  operator,
  label,
  arity,
})

const EMPTINESS: FilterOperatorDef[] = [
  def('isEmpty', 'is empty', 'none'),
  def('isNotEmpty', 'is not empty', 'none'),
]

/**
 * The operators offered for each filter type, in the order the UI lists them.
 *
 * This registry is the single source of truth: the filter UI renders from it,
 * the predicates implement it and the URL parser validates against it.
 */
export const FILTER_OPERATORS: Record<FilterType, FilterOperatorDef[]> = {
  text: [
    def('contains', 'contains', 'one'),
    def('notContains', 'does not contain', 'one'),
    def('equals', 'is', 'one'),
    def('notEquals', 'is not', 'one'),
    def('startsWith', 'starts with', 'one'),
    def('endsWith', 'ends with', 'one'),
    ...EMPTINESS,
  ],
  number: [
    def('equals', '=', 'one'),
    def('notEquals', '≠', 'one'),
    def('greaterThan', '>', 'one'),
    def('greaterThanOrEqual', '≥', 'one'),
    def('lessThan', '<', 'one'),
    def('lessThanOrEqual', '≤', 'one'),
    def('between', 'between', 'two'),
    ...EMPTINESS,
  ],
  date: [
    def('on', 'on', 'one'),
    def('before', 'before', 'one'),
    def('after', 'after', 'one'),
    def('between', 'between', 'two'),
    ...EMPTINESS,
  ],
  select: [def('equals', 'is', 'one'), def('notEquals', 'is not', 'one'), ...EMPTINESS],
  multiSelect: [
    def('includes', 'includes', 'many'),
    def('notIncludes', 'does not include', 'many'),
    ...EMPTINESS,
  ],
  boolean: [def('isTrue', 'is true', 'none'), def('isFalse', 'is false', 'none')],
}

/** The operator preselected when a filter of `type` is first added. */
export const DEFAULT_OPERATOR: Record<FilterType, FilterOperator> = {
  text: 'contains',
  number: 'equals',
  date: 'on',
  select: 'equals',
  multiSelect: 'includes',
  boolean: 'isTrue',
}

/** Every operator name the engine knows, for validating untrusted input such as a URL. */
export const ALL_FILTER_OPERATORS: ReadonlySet<FilterOperator> = new Set(
  Object.values(FILTER_OPERATORS).flatMap((defs) => defs.map((d) => d.operator)),
)

/** Operator definitions for a type, optionally restricted to `allowed`. */
export function getOperators(type: FilterType, allowed?: FilterOperator[]): FilterOperatorDef[] {
  const all = FILTER_OPERATORS[type]
  if (!allowed?.length) return all
  const allowedSet = new Set(allowed)
  return all.filter((o) => allowedSet.has(o.operator))
}

/** Look up a single operator definition. Returns `undefined` for unknown pairs. */
export function getOperator(
  type: FilterType,
  operator: FilterOperator,
): FilterOperatorDef | undefined {
  return FILTER_OPERATORS[type].find((o) => o.operator === operator)
}

/** How many value inputs an operator needs; unknown operators are treated as `'one'`. */
export function getOperatorArity(type: FilterType, operator: FilterOperator): OperatorArity {
  return getOperator(type, operator)?.arity ?? 'one'
}

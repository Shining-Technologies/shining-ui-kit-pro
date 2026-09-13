import type { SelectOption } from './common'

/** The kind of value a column holds, which determines the operators offered. */
export type FilterType = 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'boolean'

export type TextOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'

export type NumberOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty'

export type DateOperator = 'on' | 'before' | 'after' | 'between' | 'isEmpty' | 'isNotEmpty'

export type SelectOperator = 'equals' | 'notEquals' | 'isEmpty' | 'isNotEmpty'

export type MultiSelectOperator = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'

export type BooleanOperator = 'isTrue' | 'isFalse'

/** Every operator the built-in filter engine understands. */
export type FilterOperator =
  | TextOperator
  | NumberOperator
  | DateOperator
  | SelectOperator
  | MultiSelectOperator
  | BooleanOperator

/** Maps a filter type to the operators that are valid for it. */
export interface OperatorsByType {
  text: TextOperator
  number: NumberOperator
  date: DateOperator
  select: SelectOperator
  multiSelect: MultiSelectOperator
  boolean: BooleanOperator
}

/** How many values an operator consumes, which is what the filter UI renders. */
export type OperatorArity = 'none' | 'one' | 'two' | 'many'

export interface FilterOperatorDef<TOperator extends FilterOperator = FilterOperator> {
  operator: TOperator
  /** Human label, e.g. `"is not"`. */
  label: string
  arity: OperatorArity
}

/**
 * The value stored in `columnFilters` for a column.
 *
 * A bare value (e.g. `"john"`) is also accepted and is treated as the column's
 * default operator, which keeps simple controlled usage terse.
 */
export interface FilterValue<TValue = unknown> {
  operator: FilterOperator
  value: TValue
}

/**
 * Settings that change what a filter *means* and so must be identical
 * wherever the filter runs — in the browser and on the server.
 */
export interface FilterOptions {
  /**
   * IANA time zone used to decide which calendar day a timestamp falls on for
   * `date` filters, e.g. `"Australia/Sydney"`.
   *
   * Leave it unset and the runtime's own zone is used — the browser's on the
   * client, the server process's (usually UTC) on a server. Set it whenever
   * the same filter runs in both places, or the two will disagree around
   * midnight.
   */
  timeZone?: string
}

/** Per-column filter configuration, declared alongside the column. */
export interface ColumnFilterConfig<TValue = unknown> {
  type: FilterType
  /** Options for `select` / `multiSelect`. */
  options?: SelectOption<TValue>[]
  /** Operator preselected when the user adds this filter. */
  defaultOperator?: FilterOperator
  /** Restrict the operator list; defaults to every operator valid for `type`. */
  operators?: FilterOperator[]
  /** Placeholder for the value input. */
  placeholder?: string
  /** Label shown in the filter UI; defaults to the column header. */
  label?: string
  /** Hide this column from the filter UI while keeping programmatic filtering. */
  hidden?: boolean
  /** Completely custom predicate. When set, the built-in operators are bypassed. */
  predicate?: (rowValue: unknown, filterValue: FilterValue) => boolean
}

/** Narrow a raw column-filter value into the structured form. */
export function isFilterValue(value: unknown): value is FilterValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'operator' in value &&
    typeof (value as FilterValue).operator === 'string'
  )
}

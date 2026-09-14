'use client'

import {
  DEFAULT_OPERATOR,
  getOperatorArity,
  getOperators,
  isFilterActive,
  normalizeFilterValue,
  type ColumnFilterConfig,
  type FilterOperator,
  type FilterValue,
} from '../../../core'
import type { Column } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

export interface ColumnFilterHandle {
  filter: FilterValue
  operators: ReturnType<typeof getOperators>
  arity: ReturnType<typeof getOperatorArity>
  isActive: boolean
  setOperator: (operator: FilterOperator) => void
  setValue: (value: unknown) => void
  /** Update one end of a two-value operator such as `between`. */
  setRangeValue: (index: 0 | 1, value: unknown) => void
  clear: () => void
}

/**
 * Read and write one column's filter.
 *
 * The UI never invents filter semantics: it asks the core for the legal
 * operators and their arity, and writes back a `{ operator, value }` pair. Swap
 * this entire UI out and the filtering engine is unchanged (§14, §57).
 */
export function useColumnFilter<TData>(
  column: Column<TData, unknown>,
  config: ColumnFilterConfig,
): ColumnFilterHandle {
  const raw = column.getFilterValue()
  const filter = useMemo(
    () =>
      // No filter yet: start on the column's own `defaultOperator`, so the
      // operator the panel shows is the one its first value is written with.
      raw === undefined || raw === null
        ? { operator: initialOperator(config), value: undefined }
        : normalizeFilterValue(raw, config.type),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only these two fields are read
    [raw, config.type, config.defaultOperator],
  )

  const operators = useMemo(
    () => getOperators(config.type, config.operators),
    [config.type, config.operators],
  )

  const setOperator = useCallback(
    (operator: FilterOperator) => {
      const nextArity = getOperatorArity(config.type, operator)
      const previousArity = getOperatorArity(config.type, filter.operator)
      // Carry the value across only when the new operator can still use it.
      const value = nextArity === previousArity ? filter.value : defaultValueFor(nextArity)
      column.setFilterValue({ operator, value })
    },
    [column, config.type, filter.operator, filter.value],
  )

  const setValue = useCallback(
    (value: unknown) => {
      column.setFilterValue({ operator: filter.operator, value })
    },
    [column, filter.operator],
  )

  const setRangeValue = useCallback(
    (index: 0 | 1, value: unknown) => {
      const current = Array.isArray(filter.value) ? [...filter.value] : [undefined, undefined]
      current[index] = value
      column.setFilterValue({ operator: filter.operator, value: current })
    },
    [column, filter.operator, filter.value],
  )

  const clear = useCallback(() => column.setFilterValue(undefined), [column])

  return {
    filter,
    operators,
    arity: getOperatorArity(config.type, filter.operator),
    isActive: isFilterActive(raw, config.type),
    setOperator,
    setValue,
    setRangeValue,
    clear,
  }
}

function defaultValueFor(arity: ReturnType<typeof getOperatorArity>): unknown {
  if (arity === 'two') return [undefined, undefined]
  if (arity === 'many') return []
  return undefined
}

/** The operator a freshly added filter starts on. */
export function initialOperator(config: ColumnFilterConfig): FilterOperator {
  return config.defaultOperator ?? DEFAULT_OPERATOR[config.type]
}

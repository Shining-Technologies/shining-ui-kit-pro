import type { ValueComparator } from '../types/column'
import type { SortingState } from '../types/state'
import { getSortEmptyCheck, isEmptySortValue } from './comparators'

/** What `sortRows` needs to know about one sortable column. */
export interface SortableColumn<TData> {
  getValue: (row: TData, index: number) => unknown
  compare: ValueComparator<unknown>
  /**
   * Extra values to sort as empty (last, in both directions), in addition to
   * `null`, `undefined` and `''`. Defaults to the comparator's own rule from
   * `getSortEmptyCheck`, so the built-in `number` and `datetime` comparators
   * already place unreadable values last.
   */
  isEmpty?: (value: unknown) => boolean
}

/**
 * Sort rows by a multi-column sorting state.
 *
 * - Stable: rows that compare equal keep their input order.
 * - Empty values sort last in *both* directions — a descending sort puts the
 *   largest value first, not a blank. Empty means `null`, `undefined`, `''`,
 *   plus whatever the column's comparator cannot read (see `getSortEmptyCheck`).
 * - Sorting entries for unknown columns are ignored.
 *
 * Returns a new array; `rows` is not mutated.
 */
export function sortRows<TData>(
  rows: readonly TData[],
  sorting: SortingState,
  columns: ReadonlyMap<string, SortableColumn<TData>>,
): TData[] {
  const keys = sorting.flatMap((sort) => {
    const column = columns.get(sort.id)
    if (!column) return []
    const custom = column.isEmpty
    const isEmpty = custom
      ? (value: unknown) => isEmptySortValue(value) || custom(value)
      : getSortEmptyCheck(column.compare)
    return [{ column, isEmpty, direction: sort.desc ? -1 : 1 }]
  })
  if (keys.length === 0) return rows.slice()

  const decorated = rows.map((row, index) => {
    const values = keys.map(({ column }) => column.getValue(row, index))
    return { row, index, values, empty: keys.map((key, k) => key.isEmpty(values[k])) }
  })

  decorated.sort((a, b) => {
    for (let k = 0; k < keys.length; k++) {
      const leftEmpty = a.empty[k]
      const rightEmpty = b.empty[k]
      if (leftEmpty || rightEmpty) {
        if (leftEmpty && rightEmpty) continue
        return leftEmpty ? 1 : -1
      }
      const key = keys[k]!
      const result = key.column.compare(a.values[k], b.values[k])
      if (result !== 0) return result * key.direction
    }
    return a.index - b.index
  })

  return decorated.map((entry) => entry.row)
}

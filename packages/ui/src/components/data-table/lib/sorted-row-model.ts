import {
  getMemoOptions,
  memo,
  type Row,
  type RowModel,
  type SortingFn,
  type Table,
} from '@tanstack/react-table'
import { isEmptySortValue } from '../../../core'

/**
 * The "sorts as empty" rule of each engine sorting function the column adapter
 * builds, taken from its value comparator with `getSortEmptyCheck`. A `number`
 * column's `'n/a'` is empty there, so it sorts last here too, as in `sortRows`.
 */
const sortEmptyChecks = new WeakMap<object, (value: unknown) => boolean>()

/** Record which values `sortingFn` sorts as empty. Used by the column adapter. */
export function registerSortEmptyCheck<TData>(
  sortingFn: SortingFn<TData>,
  isEmpty: (value: unknown) => boolean,
): SortingFn<TData> {
  sortEmptyChecks.set(sortingFn, isEmpty)
  return sortingFn
}

/** The empty rule for an engine sorting function; the base rule when none was registered. */
function emptyCheckFor(sortingFn: object): (value: unknown) => boolean {
  return sortEmptyChecks.get(sortingFn) ?? isEmptySortValue
}

/**
 * TanStack Table's sorted row model, with one rule changed: empty values
 * (`null`, `undefined`, `''`, plus whatever the column's comparator cannot
 * read — see `getSortEmptyCheck`) sort last in **both** directions.
 *
 * The engine applies the descending flip after the comparator, and its
 * `sortUndefined` option only covers `undefined`, so a descending sort led with
 * blanks. This model checks emptiness before the comparator and never flips
 * it — exactly what `sortRows` / `applyQuery` in `core` do, so a client-side
 * table and a server that uses `applyQuery` return rows in the same order.
 *
 * Otherwise identical to the engine's: stable, honours `invertSorting`, sorts
 * sub-rows, resets the page index through the same memo hook.
 */
export function getEmptyLastSortedRowModel<TData>(): (table: Table<TData>) => () => RowModel<TData> {
  return (table) =>
    memo(
      () => [table.getState().sorting, table.getPreSortedRowModel()],
      (sorting, rowModel) => {
        if (!rowModel.rows.length || !sorting?.length) return rowModel

        const available = sorting.flatMap((sort) => {
          const column = table.getColumn(sort.id)
          if (!column?.getCanSort()) return []
          const sortingFn = column.getSortingFn()
          return [
            {
              id: sort.id,
              desc: sort.desc,
              invert: Boolean(column.columnDef.invertSorting),
              sortingFn,
              isEmpty: emptyCheckFor(sortingFn),
            },
          ]
        })

        const flatRows: Row<TData>[] = []

        const sortData = (rows: Row<TData>[]): Row<TData>[] => {
          const sorted = rows.map((row) => ({ ...row }))
          sorted.sort((rowA, rowB) => {
            for (const sort of available) {
              const aEmpty = sort.isEmpty(rowA.getValue(sort.id))
              const bEmpty = sort.isEmpty(rowB.getValue(sort.id))
              if (aEmpty || bEmpty) {
                if (aEmpty && bEmpty) continue
                return aEmpty ? 1 : -1
              }
              let result = sort.sortingFn(rowA, rowB, sort.id)
              if (result !== 0) {
                if (sort.desc) result *= -1
                if (sort.invert) result *= -1
                return result
              }
            }
            return rowA.index - rowB.index
          })

          for (const row of sorted) {
            flatRows.push(row)
            if (row.subRows?.length) row.subRows = sortData(row.subRows)
          }
          return sorted
        }

        return { rows: sortData(rowModel.rows), flatRows, rowsById: rowModel.rowsById }
      },
      getMemoOptions(table.options, 'debugTable', 'getSortedRowModel', () =>
        table._autoResetPageIndex(),
      ),
    )
}

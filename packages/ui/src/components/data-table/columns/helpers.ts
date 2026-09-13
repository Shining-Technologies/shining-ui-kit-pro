import type {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  ColumnDef,
  DisplayColumnDef,
  GroupColumnDef,
  PathAccessorColumnDef,
} from '../types/column'

/**
 * A typed builder for column definitions.
 *
 * The plain array form already infers `value` for `accessorKey` columns:
 *
 * ```ts
 * const columns: ColumnDef<User>[] = [{ accessorKey: 'age', cell: ({ value }) => value + 1 }]
 * ```
 *
 * Use the helper when you want the same inference for *computed* columns, whose
 * value type TypeScript cannot recover from an array literal:
 *
 * ```ts
 * const column = createColumnHelper<Order>()
 * const columns = [
 *   column.accessor('customer', { header: 'Customer' }),
 *   column.computed('total', (order) => order.qty * order.price, {
 *     header: 'Total',
 *     cell: ({ value }) => value.toFixed(2), // value: number
 *   }),
 *   column.display({ id: 'actions', cell: ({ row }) => <RowMenu row={row} /> }),
 * ]
 * ```
 */
export function createColumnHelper<TData>() {
  return {
    /** A column that reads `key` off the row. `value` is typed as `TData[K]`. */
    accessor<K extends keyof TData & string>(
      accessorKey: K,
      column?: Omit<AccessorKeyColumnDef<TData, K>, 'accessorKey'>,
    ): ColumnDef<TData> {
      return { ...column, accessorKey } as ColumnDef<TData>
    },

    /** A column whose value is derived. `value` is typed as the function's return. */
    computed<TValue>(
      id: string,
      accessorFn: (row: TData, index: number) => TValue,
      column?: Omit<AccessorFnColumnDef<TData, TValue>, 'id' | 'accessorFn'>,
    ): ColumnDef<TData> {
      return { ...column, id, accessorFn } as ColumnDef<TData>
    },

    /** A column reading a nested path. `value` is `unknown`. */
    path(
      id: string,
      accessorPath: string,
      column?: Omit<PathAccessorColumnDef<TData>, 'id' | 'accessorPath'>,
    ): ColumnDef<TData> {
      return { ...column, id, accessorPath } as ColumnDef<TData>
    },

    /** A column with no value: actions, avatars, drag handles. */
    display(column: DisplayColumnDef<TData>): ColumnDef<TData> {
      return column
    },

    /** A header group spanning child columns. */
    group(column: GroupColumnDef<TData>): ColumnDef<TData> {
      return column
    },
  }
}

export type ColumnHelper<TData> = ReturnType<typeof createColumnHelper<TData>>

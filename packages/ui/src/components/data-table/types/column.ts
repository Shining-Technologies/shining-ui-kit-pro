import type { ColumnBehavior, ColumnMeta } from '../../../core'
import type { Cell, Column, Header, Row, Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'

/**
 * What a `cell` renderer receives.
 *
 * `value` is already extracted and correctly typed — the caller never has to
 * reach for `getValue()` or cast (§6, §11).
 */
export interface CellContext<TData, TValue = unknown> {
  /** The column's value for this row, typed from the accessor. */
  value: TValue
  row: Row<TData>
  /**
   * The row's position in `data` (`row.index`) — not its position on the
   * current page, which changes with sorting, filtering and paging.
   */
  rowIndex: number
  column: Column<TData, TValue>
  cell: Cell<TData, TValue>
  table: Table<TData>
  /** `column.columnDef.meta`, hoisted for convenience. */
  meta: ColumnMeta | undefined
}

/**
 * What `header` and `footer` renderers receive.
 *
 * Deliberately not parameterised by the value type: a header renders a label,
 * not a value, and keeping `TValue` out of it is what lets columns with
 * different value types live in one `ColumnDef<TData>[]`.
 */
export interface HeaderRenderContext<TData> {
  header: Header<TData, unknown>
  column: Column<TData, unknown>
  table: Table<TData>
  meta: ColumnMeta | undefined
}

/** A header/footer is either static content or a function of the header context. */
export type HeaderTemplate<TData> = ReactNode | ((context: HeaderRenderContext<TData>) => ReactNode)

interface RenderSlots<TData, TValue> {
  header?: HeaderTemplate<TData>
  // Method syntax on purpose: it makes `cell` bivariant in `TValue`, which is
  // what allows a `ColumnDef<User>[]` to hold columns of differing value types.
  cell?(context: CellContext<TData, TValue>): ReactNode
  footer?: HeaderTemplate<TData>
}

/** A column that reads a property off the row. Value type is inferred from `TData[K]`. */
export type AccessorKeyColumnDef<TData, K extends keyof TData & string> = ColumnBehavior<
  TData,
  TData[K]
> &
  RenderSlots<TData, TData[K]> & {
    accessorKey: K
    accessorFn?: never
    accessorPath?: never
    columns?: never
  }

/**
 * A column that computes its value.
 *
 * Inside a `ColumnDef<TData>[]` literal `TValue` widens to `unknown`; use
 * {@link createColumnHelper} when you want the computed type inferred.
 */
export type AccessorFnColumnDef<TData, TValue = unknown> = ColumnBehavior<TData, TValue> &
  RenderSlots<TData, TValue> & {
    id: string
    accessorFn: (row: TData, index: number) => TValue
    accessorKey?: never
    accessorPath?: never
    columns?: never
  }

/**
 * A column that reads a nested path, e.g. `"user.profile.city"`.
 *
 * A separate property rather than a dotted `accessorKey`: it keeps `accessorKey`
 * strictly typed against the row's own keys (so typos there are still caught),
 * and it tells you at a glance that this column's `value` is `unknown` —
 * TypeScript cannot resolve a dotted string to a property type. Reach for
 * `accessorFn` or `createColumnHelper().computed` when you want it typed.
 */
export type PathAccessorColumnDef<TData> = ColumnBehavior<TData, unknown> &
  RenderSlots<TData, unknown> & {
    id: string
    accessorPath: string
    accessorKey?: never
    accessorFn?: never
    columns?: never
  }

/** A column with no underlying value: selection, expander, row actions. */
export type DisplayColumnDef<TData> = ColumnBehavior<TData, unknown> &
  RenderSlots<TData, unknown> & {
    id: string
    accessorKey?: never
    accessorFn?: never
    accessorPath?: never
    columns?: never
  }

/** A header group that spans child columns. */
export interface GroupColumnDef<TData> {
  id: string
  header?: HeaderTemplate<TData>
  footer?: HeaderTemplate<TData>
  meta?: ColumnMeta
  columns: ColumnDef<TData>[]
  accessorKey?: never
  accessorFn?: never
  accessorPath?: never
  cell?: never
}

/** Distributes over the row's keys so `{ accessorKey: 'price' }` types `value` as the price. */
type AnyAccessorKeyColumnDef<TData> = {
  [K in keyof TData & string]: AccessorKeyColumnDef<TData, K>
}[keyof TData & string]

/**
 * The column definition users write.
 *
 * ```ts
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'price', header: 'Price', cell: ({ value }) => `$${value.toFixed(2)}` },
 * ]
 * ```
 */
export type ColumnDef<TData, TValue = unknown> =
  | AnyAccessorKeyColumnDef<TData>
  | PathAccessorColumnDef<TData>
  | AccessorFnColumnDef<TData, TValue>
  | DisplayColumnDef<TData>
  | GroupColumnDef<TData>

/** Alias for readers who prefer the fully-qualified name. */
export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>

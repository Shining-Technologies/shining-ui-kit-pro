import type {
  ColumnFilterConfig,
  Density,
  FilterLayout,
  ResponsiveMode,
  TableLayout,
  TableSurface,
  TableVariant,
} from '@shining-technologies/ui-kit-core'
import type { Row, Table } from '@tanstack/react-table'
import { createContext, useContext, type MouseEvent, type ReactNode } from 'react'
import type { ResolvedFeatures } from '../hooks/resolve-features'
import type { RowIndexModel } from '../hooks/row-index'
import type { RowNavigation } from '../hooks/use-row-navigation'
import type { ResolvedComponents } from '../types/components'
import type {
  CellClassName,
  DataTableClassNames,
  DataTableSlots,
  RowActivationEvent,
  RowClassName,
} from '../types/props'

/**
 * Everything the parts need, resolved exactly once.
 *
 * Components read from here instead of receiving twenty props each, which is
 * what keeps a replacement part a drop-in: it can pull anything the default
 * could, without the parent having to hand it over.
 */
export interface DataTableContextValue<TData> {
  table: Table<TData>
  features: ResolvedFeatures<TData>
  components: ResolvedComponents<TData>
  slots: DataTableSlots<TData>

  filterConfigs: Map<string, ColumnFilterConfig>
  columnLabels: Map<string, string>
  isFiltered: boolean
  clearFilters: () => void

  loading: boolean
  error: unknown
  retry: (() => void) | undefined
  loadingRowCount: number

  density: Density
  variant: TableVariant
  responsiveMode: ResponsiveMode
  surface: TableSurface
  tableLayout: TableLayout
  filterLayout: FilterLayout
  stickyHeader: boolean
  stickyFooter: boolean
  showToolbarCount: boolean
  hasFooter: boolean

  classNames: DataTableClassNames
  tableClassName: string | undefined
  headerClassName: string | undefined
  bodyClassName: string | undefined
  rowClassName: RowClassName<TData> | undefined
  cellClassName: CellClassName<TData> | undefined

  onRowClick: ((row: Row<TData>, event: RowActivationEvent) => void) | undefined
  onRowDoubleClick: ((row: Row<TData>, event: MouseEvent<HTMLTableRowElement>) => void) | undefined
  isRowDisabled: ((row: TData) => boolean) | undefined
  renderExpandedRow: ((row: Row<TData>) => ReactNode) | undefined

  navigation: RowNavigation
  /**
   * Each rendered row's position in the whole table, for `aria-rowindex`.
   * Optional so a hand-built provider keeps working; without it rows carry
   * no index.
   */
  rowIndex?: RowIndexModel
  /** Base id used to build stable ids for captions, descriptions and details rows. */
  tableId: string
}

// A single untyped context backs every generic instantiation; `useDataTable<T>()`
// restores the row type at the point of use.
const TableContext = createContext<DataTableContextValue<never> | null>(null)

export interface DataTableProviderProps<TData> {
  value: DataTableContextValue<TData>
  children: ReactNode
}

/**
 * Makes the table instance and render model available to descendants.
 *
 * Rendered for you by `<DataTable />`; render it yourself only when composing a
 * completely custom layout out of the exported parts.
 */
export function DataTableProvider<TData>({ value, children }: DataTableProviderProps<TData>) {
  return (
    <TableContext.Provider value={value as unknown as DataTableContextValue<never>}>
      {children}
    </TableContext.Provider>
  )
}

/**
 * Read the live table from inside any descendant.
 *
 * ```tsx
 * const { table } = useDataTable<User>()
 * const selected = table.getSelectedRowModel().rows.map((r) => r.original)
 * ```
 */
export function useDataTable<TData = unknown>(): DataTableContextValue<TData> {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error(
      '[shining-ui-kit] useDataTable() must be called inside <DataTable /> or <DataTableProvider />.',
    )
  }
  return context as unknown as DataTableContextValue<TData>
}

/**
 * The context when there is one, `null` otherwise. For parts that also work in
 * a bare engine table, such as the injected columns.
 */
export function useOptionalDataTable<TData = unknown>(): DataTableContextValue<TData> | null {
  return useContext(TableContext) as unknown as DataTableContextValue<TData> | null
}

/**
 * The id of a row's detail row. Scoped by the table's id: row ids repeat across
 * tables (`"0"`, `"1"`… without `getRowId`), and two expandable tables on one
 * page would otherwise point `aria-controls` at each other's rows.
 */
export function expandedRowId(tableId: string | undefined, rowId: string): string {
  const id = `${rowId}-expanded`
  return tableId ? `${tableId}-${id}` : id
}

/** The resolved component map: defaults merged with the user's overrides. */
export function useTableComponents<TData = unknown>(): ResolvedComponents<TData> {
  return useDataTable<TData>().components
}

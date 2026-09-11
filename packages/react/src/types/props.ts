import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  DataMode,
  DataTableFeatures,
  DataTableQuery,
  Density,
  ExpandedState,
  FilterLayout,
  FilteringFeature,
  PaginationState,
  ResponsiveMode,
  RowSelectionState,
  SortingFeature,
  SortingState,
  TableLayout,
  TableSurface,
  TableTheme,
  TableVariant,
  VisibilityState,
} from '@shining-ui-kit/core'
import type { Cell, Row, Table } from '@tanstack/react-table'
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import type { RowActionSpec } from '../components/cells/row-action'
import type { ColumnDef } from './column'
import type { DataTableComponents } from './components'

/** Slot content is either a node or a function of the live table instance. */
export type SlotContent<TData> = ReactNode | ((context: { table: Table<TData> }) => ReactNode)

/**
 * Injection points for application-specific UI, so nobody has to fork a
 * component just to add a button (§30).
 */
export interface DataTableSlots<TData> {
  /** Replaces the whole toolbar. */
  toolbar?: SlotContent<TData>
  /** Extra controls appended to the default toolbar's right-hand side. */
  toolbarActions?: SlotContent<TData>
  beforeTable?: SlotContent<TData>
  afterTable?: SlotContent<TData>
  emptyState?: SlotContent<TData>
  loadingState?: SlotContent<TData>
  errorState?: SlotContent<TData>
  pagination?: SlotContent<TData>
  /** Rendered in the auto-injected trailing actions column. */
  rowActions?: (row: Row<TData>) => ReactNode | RowActionSpec[]
}

/** Classes for the parts that do not have a dedicated top-level prop. */
export interface DataTableClassNames {
  container?: string
  heading?: string
  toolbar?: string
  headerRow?: string
  headerCell?: string
  footer?: string
  pagination?: string
  expandedRow?: string
}

/** Rows can be activated by click or by pressing Enter, so both events reach you. */
export type RowActivationEvent =
  MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>

export type RowClassName<TData> = string | ((row: Row<TData>) => string | undefined)
export type CellClassName<TData> = string | ((cell: Cell<TData, unknown>) => string | undefined)

export interface DataTableProps<TData> {
  // ---------------------------------------------------------------- data
  data: TData[]
  columns: ColumnDef<TData>[]
  /** Stable row identity. Strongly recommended for server data and selection. */
  getRowId?: (row: TData, index: number) => string

  // -------------------------------------------------------------- status
  loading?: boolean
  /** Anything truthy switches the table to its error state. */
  error?: unknown
  onRetry?: () => void
  /** Skeleton rows drawn while `loading`. Defaults to the page size. */
  loadingRowCount?: number

  // ------------------------------------------------------------ behaviour
  /** Default mode for every feature. `'server'` means "I will fetch the data." */
  mode?: DataMode
  features?: DataTableFeatures<TData>
  /** Shorthand for `features.selection.enabled`. */
  enableRowSelection?: boolean
  /** Shorthand for `features.pagination.pageSize`. */
  pageSize?: number
  /** Total rows on the server. Shorthand for `features.pagination.rowCount`. */
  rowCount?: number

  // ---------------------------------------------------------------- state
  /** Controlled sorting state, or a `{ mode }` config object. */
  sorting?: SortingState | SortingFeature
  defaultSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void

  /** Controlled column filters, or a `{ mode }` config object. */
  columnFilters?: ColumnFiltersState | FilteringFeature
  defaultColumnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void

  globalFilter?: string
  defaultGlobalFilter?: string
  onGlobalFilterChange?: (value: string) => void

  pagination?: PaginationState
  defaultPagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void

  rowSelection?: RowSelectionState
  defaultRowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void

  columnVisibility?: VisibilityState
  defaultColumnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void

  columnSizing?: ColumnSizingState
  defaultColumnSizing?: ColumnSizingState
  onColumnSizingChange?: (sizing: ColumnSizingState) => void

  columnPinning?: ColumnPinningState
  defaultColumnPinning?: ColumnPinningState
  onColumnPinningChange?: (pinning: ColumnPinningState) => void

  expanded?: ExpandedState
  defaultExpanded?: ExpandedState
  onExpandedChange?: (expanded: ExpandedState) => void

  /** Fires whenever the server-relevant state changes. The server-mode entry point. */
  onQueryChange?: (query: DataTableQuery) => void

  // ----------------------------------------------------------------- rows
  onRowClick?: (row: Row<TData>, event: RowActivationEvent) => void
  onRowDoubleClick?: (row: Row<TData>, event: MouseEvent<HTMLTableRowElement>) => void
  /** Disabled rows are dimmed, unselectable and skipped by keyboard navigation. */
  isRowDisabled?: (row: TData) => boolean
  /** Providing this turns on expansion and injects the expander column. */
  renderExpandedRow?: (row: Row<TData>) => ReactNode
  /**
   * Providing this injects a pinned trailing actions column.
   *
   * Return either the JSX for the cell, or a list of described actions — the
   * table builds the icon buttons, their tooltips and their accessible names
   * from the description:
   *
   * ```tsx
   * rowActions={(row) => [
   *   { icon: Eye, label: 'View', href: `/orders/${row.original.id}` },
   *   { icon: Trash2, label: 'Delete', destructive: true, onClick: … },
   * ]}
   * ```
   */
  rowActions?: (row: Row<TData>) => ReactNode | RowActionSpec[]
  /**
   * The actions column's header. Visible by default — a column of icons with a
   * blank head reads as a rendering accident. `false` keeps the name for screen
   * readers and hides it.
   */
  rowActionsHeader?: ReactNode | false
  /**
   * Width of the actions column, in pixels. Widen it for more than two icons;
   * the column is fixed-width because its content never wraps.
   */
  rowActionsWidth?: number

  // -------------------------------------------------------------- heading
  /**
   * A title for the table itself, rendered above the toolbar.
   *
   * Also becomes the table's accessible name, so `label` is not needed when a
   * title is given.
   */
  title?: ReactNode
  /**
   * One line under the title saying what is in the list — and, more usefully,
   * what is not.
   */
  description?: ReactNode
  /** A glyph before the title. */
  icon?: ReactNode
  /** Rendered on the right of the title block: page-level actions. */
  headingActions?: SlotContent<TData>
  /** The element the title renders as. Defaults to `'p'`; see `DataTableHeading`. */
  titleAs?: 'p' | 'h2' | 'h3' | 'h4'

  // ----------------------------------------------------------- appearance
  variant?: TableVariant
  density?: Density
  theme?: TableTheme
  responsiveMode?: ResponsiveMode
  /**
   * Whether the whole component is one bordered card (`'card'`, the default)
   * or a stack of separate blocks (`'plain'`).
   */
  surface?: TableSurface
  /**
   * Column sizing strategy. `'fixed'` (the default) honours each column's
   * declared `size`; `'auto'` lets the content decide.
   */
  tableLayout?: TableLayout
  /**
   * Where the filter controls live: behind one button (`'panel'`, the default)
   * or laid out flat across the toolbar (`'inline'`).
   */
  filterLayout?: FilterLayout
  /** Keep the header visible while the body scrolls. Defaults to `true`. */
  stickyHeader?: boolean
  /**
   * Keep the footer row pinned to the bottom of the scroll container.
   * Defaults to `true` whenever there is a footer and a `maxHeight`.
   */
  stickyFooter?: boolean
  /** Render the footer row. Defaults to `true` when any column declares `footer`. */
  showFooter?: boolean
  showToolbar?: boolean
  showPagination?: boolean
  /**
   * Maximum height of the scroll container, e.g. `'60vh'` or `480`.
   *
   * This is what turns the table into a fixed frame whose rows are the only
   * part that scrolls: the header (and footer) stay put while the body moves
   * underneath them.
   */
  maxHeight?: number | string
  /**
   * Show the "N selected" bar above the table. Defaults to `true` when
   * selection is enabled.
   */
  showSelectionBar?: boolean
  /**
   * Show the filtered row count in the toolbar. Defaults to `true` for the
   * inline filter layout, where the count reads as the result of the controls
   * beside it, and `false` otherwise — the pagination bar already states it.
   */
  showToolbarCount?: boolean

  // ------------------------------------------------------------ structure
  components?: DataTableComponents<TData>
  slots?: DataTableSlots<TData>
  /** Shorthand for `slots.emptyState`. */
  emptyState?: ReactNode
  /** Shorthand for `slots.loadingState`. */
  loadingState?: ReactNode
  /** Shorthand for `slots.errorState`. */
  errorState?: ReactNode

  // --------------------------------------------------------------- styling
  className?: string
  style?: CSSProperties
  tableClassName?: string
  headerClassName?: string
  bodyClassName?: string
  rowClassName?: RowClassName<TData>
  cellClassName?: CellClassName<TData>
  classNames?: DataTableClassNames

  // ------------------------------------------------------------------ a11y
  id?: string
  /** Accessible name for the table. Rendered as a visually hidden `<caption>`. */
  label?: string
  /** Visible caption. Takes precedence over `label`. */
  caption?: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

export type { ColumnDef }

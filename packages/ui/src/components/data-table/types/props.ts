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
  TableVariant,
  VisibilityState,
} from '../../../core'
import type { Cell, Row, Table } from '@tanstack/react-table'
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import type { RowActionSpec } from '../cells/row-action'
import type { ColumnDef } from './column'
import type { DataTableComponents } from './components'

/** The state slices `persist` can remember. */
export type PersistedTableState = 'columnPinning' | 'columnSizing' | 'columnVisibility'

/**
 * Where and what the table remembers between visits. See `DataTableProps.persist`.
 */
export interface DataTablePersistOptions {
  /**
   * Names this table in storage. Tables with the same key share what they
   * remember. Defaults to the table's `id`, or else to a fingerprint of its
   * column ids.
   */
  key?: string
  /** What to remember. Defaults to `['columnPinning', 'columnVisibility']`. */
  state?: readonly PersistedTableState[]
  /** `'local'` survives the browser closing; `'session'` lasts for the tab. Defaults to `'local'`. */
  storage?: 'local' | 'session'
}

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
  /**
   * Bulk actions shown in the selection bar while rows are selected — Export,
   * Assign, Delete. Read the rows from `table.getSelectedRowModel()`.
   */
  selectionActions?: SlotContent<TData>
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
  /**
   * The rows. Read-only arrays are accepted — the table never mutates them —
   * so a frozen or `as const` result set needs no copy.
   */
  data: readonly TData[]
  columns: readonly ColumnDef<TData>[]
  /** Stable row identity. Strongly recommended for server data and selection. */
  getRowId?: (row: TData, index: number) => string

  // -------------------------------------------------------------- status
  loading?: boolean
  /** Anything truthy switches the table to its error state. */
  error?: unknown
  onRetry?: () => void
  /** Skeleton rows drawn while `loading` with no rows. Defaults to the page size, capped at 8. */
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
  /**
   * Stay on the current page when `data` changes identity — a refetch, a poll,
   * an optimistic update. By default (client pagination) any new `data` array
   * returns to the first page. Sorting, filtering and searching still do; and
   * if the new data has fewer pages, the table steps back to the last one.
   * Ignored in server pagination, which never resets on new data.
   */
  keepPageOnDataChange?: boolean

  // -------------------------------------------------------------- locale
  /**
   * BCP 47 locale for what the table formats itself — row counts, default
   * date cells, filter summaries — and for text sorting. Defaults to `'en-US'`,
   * deliberately not the runtime's locale: a server and a browser rarely agree
   * on it, and server-rendered HTML would then fail to hydrate.
   */
  locale?: string
  /**
   * IANA time zone that date filters decide calendar days in, and that default
   * date cells are shown in, e.g. `'Australia/Sydney'`. Set it whenever the
   * table is server-rendered or its query is answered by `applyQuery` on a
   * server, so both sides put a timestamp on the same day.
   */
  timeZone?: string

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

  /**
   * Remember the user's column layout in the browser.
   *
   * On by default, with nothing to set up: a column pinned or hidden from the
   * table's menus stays that way on the next visit until the user changes it.
   * The table is named by `id` when it has one, else by its column ids, so
   * `id` is only needed to keep apart two tables with the same columns.
   * `false` turns it off; a string is shorthand for `{ key }`; an options
   * object also chooses what to remember (`columnPinning`, `columnVisibility`,
   * `columnSizing`) and in which storage. A slice the application controls is
   * never restored — it belongs to the application.
   */
  persist?: boolean | string | DataTablePersistOptions

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
  /**
   * Keep the header visible while the body scrolls. Defaults to `true`.
   *
   * The header sticks to the table's own scroll frame, so it takes effect with
   * `maxHeight`; without one the rows scroll with the page, header included.
   */
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
  /** Accessible name for the table, applied as `aria-label`. Not needed when `title` is set. */
  label?: string
  /** Visible caption. Takes precedence over `label`. */
  caption?: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

export type { ColumnDef }

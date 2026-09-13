/**
 * `@shining-technologies/ui/data-table`
 *
 * The React data table. Its filtering, sorting and pagination logic lives in
 * `@shining-technologies/ui/core`, which runs on a server as well.
 */
import './types/module-augmentation'

export { DataTable } from './data-table'
export {
  DataTableProvider,
  useDataTable,
  useOptionalDataTable,
  useTableComponents,
} from './context'
export type { DataTableContextValue, DataTableProviderProps } from './context'

// Composable toolbar API
export {
  DataTableActions,
  DataTableFilters,
  DataTablePagination,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
} from './connected'

// Replaceable parts
export { DEFAULT_COMPONENTS, resolveComponents } from './default-components'
export {
  DataTableBody,
  DataTableContainer,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableRoot,
  DataTableTable,
} from './parts/structure'
export { DataTableHeaderCell } from './parts/header-cell'
export { DataTableHeading } from './parts/heading'
export { DataTableCell, DataTableExpandedRow, DataTableRow, renderCellContent } from './parts/row'
export { SortIndicator } from './parts/sort-indicator'
export { ColumnMenu } from './parts/column-menu'
export { DataTableEmptyState, DataTableErrorState, DataTableLoadingState } from './states'
export { DefaultToolbar } from './toolbar/toolbar'
export { DefaultFilters, FilterPanel } from './toolbar/filter-panel'
export { InlineFilters } from './toolbar/inline-filters'
export { DefaultSearch } from './toolbar/search'
export { DefaultSelectionBar } from './toolbar/selection-bar'
export { DefaultClearFilters } from './toolbar/clear-filters'
export { DefaultViewOptions } from './toolbar/view-options'
export { ActiveFilters } from './toolbar/active-filters'
export { DefaultPagination } from './pagination/pagination'
export { filterableColumns } from './filters/filterable'
export type { FilterableColumn } from './filters/filterable'
export { useColumnFilter } from './filters/use-column-filter'
export type { ColumnFilterHandle } from './filters/use-column-filter'

// Columns
export { createColumnHelper } from './columns/helpers'
export type { ColumnHelper } from './columns/helpers'
export {
  ACTIONS_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  SELECTION_COLUMN_ID,
  createActionsColumn,
  createExpanderColumn,
  createSelectionColumn,
} from './columns/built-in'

// Cell toolkit
export {
  CellBadge,
  CellDate,
  CellEmpty,
  CellLink,
  CellNumber,
  CellPerson,
  CellProgress,
  CellStack,
  CellText,
} from './cells'
export type {
  CellBadgeProps,
  CellDateProps,
  CellLinkProps,
  CellNumberProps,
  CellPersonProps,
  CellProgressProps,
  CellStackProps,
  CellTextProps,
} from './cells'
export { RowActions } from './cells/row-actions'
export type { RowActionItem, RowActionsProps } from './cells/row-actions'
export { RowAction, RowActionGroup, isRowActionSpecs, renderRowActions } from './cells/row-action'
export type { RowActionGroupProps, RowActionProps, RowActionSpec } from './cells/row-action'

// Engine
export type { RowIndexModel } from './hooks/row-index'
export { useDataTableQueryState } from './hooks/use-query-state'
export type { DataTableQueryState } from './hooks/use-query-state'
export { useTableInstance } from './hooks/use-table-instance'
export type { TableInstanceResult } from './hooks/use-table-instance'
export { resolveFeatures } from './hooks/resolve-features'
export type { ResolvedFeatures } from './hooks/resolve-features'
export { adaptColumns } from './lib/column-adapter'
export type { AdaptOptions, AdaptedColumns } from './lib/column-adapter'
export { getEmptyLastSortedRowModel } from './lib/sorted-row-model'
export { DEFAULT_TABLE_LOCALE } from './lib/format'
export { renderSlot } from './lib/slots'

// Types
export type {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  CellContext,
  ColumnDef,
  DataTableColumn,
  DisplayColumnDef,
  GroupColumnDef,
  HeaderRenderContext,
  HeaderTemplate,
  PathAccessorColumnDef,
} from './types/column'
export type {
  BodyProps,
  CellProps,
  ClearFiltersProps,
  ContainerProps,
  DataAttributes,
  DataTableComponents,
  EmptyStateProps as DataTableEmptyStateProps,
  ErrorStateProps as DataTableErrorStateProps,
  ExpandedRowProps,
  FiltersProps,
  FooterProps,
  HeaderCellProps,
  HeaderProps,
  HeaderRowProps,
  HeadingProps,
  LoadingStateProps as DataTableLoadingStateProps,
  PaginationProps as DataTablePaginationProps,
  ResolvedComponents,
  RootProps,
  RowProps,
  SearchProps,
  SelectionBarProps,
  TableProps as DataTableTableProps,
  ToolbarProps,
  ViewOptionsProps,
} from './types/components'
export type {
  CellClassName,
  DataTableClassNames,
  DataTableProps,
  DataTableSlots,
  RowActivationEvent,
  RowClassName,
  SlotContent,
} from './types/props'

// The engine's row/table types appear in every callback signature.
export type { Cell, Column, Header, Row, Table as TableInstance } from '@tanstack/react-table'

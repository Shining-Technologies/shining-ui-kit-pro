import type { DataTableComponents, ResolvedComponents } from '../types/components'
import { DefaultPagination } from './pagination/pagination'
import { DataTableExpandedRow, DataTableCell, DataTableRow } from './parts/row'
import { DataTableHeaderCell } from './parts/header-cell'
import { DataTableHeading } from './parts/heading'
import {
  DataTableBody,
  DataTableContainer,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableRoot,
  DataTableTable,
} from './parts/structure'
import { DataTableEmptyState, DataTableErrorState, DataTableLoadingState } from './states'
import { DefaultClearFilters } from './toolbar/clear-filters'
import { DefaultFilters } from './toolbar/filter-panel'
import { DefaultSearch } from './toolbar/search'
import { DefaultSelectionBar } from './toolbar/selection-bar'
import { DefaultToolbar } from './toolbar/toolbar'
import { DefaultViewOptions } from './toolbar/view-options'

/**
 * The default implementation of every replaceable part.
 *
 * Exported so an override can wrap a default instead of reimplementing it:
 *
 * ```tsx
 * const Row = (props) => <DEFAULT_COMPONENTS.Row {...props} />
 * ```
 */
export const DEFAULT_COMPONENTS = {
  Root: DataTableRoot,
  Container: DataTableContainer,
  Table: DataTableTable,
  Header: DataTableHeader,
  HeaderRow: DataTableHeaderRow,
  HeaderCell: DataTableHeaderCell,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
  ExpandedRow: DataTableExpandedRow,
  Footer: DataTableFooter,
  Heading: DataTableHeading,
  Toolbar: DefaultToolbar,
  Search: DefaultSearch,
  Filters: DefaultFilters,
  ClearFilters: DefaultClearFilters,
  SelectionBar: DefaultSelectionBar,
  ViewOptions: DefaultViewOptions,
  Pagination: DefaultPagination,
  EmptyState: DataTableEmptyState,
  LoadingState: DataTableLoadingState,
  ErrorState: DataTableErrorState,
} as unknown as ResolvedComponents<never>

/** Merge user overrides over the defaults. Anything omitted keeps its default. */
export function resolveComponents<TData>(
  overrides: DataTableComponents<TData> | undefined,
): ResolvedComponents<TData> {
  const defaults = DEFAULT_COMPONENTS as unknown as ResolvedComponents<TData>
  if (!overrides) return defaults
  return { ...defaults, ...stripUndefined(overrides) }
}

function stripUndefined<T extends object>(value: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) out[key] = entry
  }
  return out as T
}

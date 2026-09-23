import type { Cell, Header, HeaderGroup, Row, Table } from '@tanstack/react-table'
import type {
  ComponentType,
  HTMLAttributes,
  ReactNode,
  Ref,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

/**
 * Every part receives a **prop bag** that already contains the ARIA attributes,
 * data attributes, geometry and event handlers the table needs.
 *
 * A replacement component only has to spread it:
 *
 * ```tsx
 * const MyRow = ({ rowProps, children }: RowProps<User>) => (
 *   <tr {...rowProps} className={cn(rowProps.className, 'my-class')}>{children}</tr>
 * )
 * ```
 *
 * That is the mechanism that makes "replacing a row cannot break sorting,
 * selection, expansion or keyboard navigation" a structural guarantee (§10, §57).
 */

/** `data-*` attributes carried by a prop bag, used for styling and for tests. */
export type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined
}

type RowBag = HTMLAttributes<HTMLTableRowElement> &
  DataAttributes & { ref?: Ref<HTMLTableRowElement> }
type ThBag = ThHTMLAttributes<HTMLTableCellElement> & DataAttributes
type TdBag = TdHTMLAttributes<HTMLTableCellElement> & DataAttributes
type SectionBag = HTMLAttributes<HTMLTableSectionElement> & DataAttributes

export interface RootProps<TData> {
  table: Table<TData>
  rootProps: HTMLAttributes<HTMLDivElement> & DataAttributes
  children: ReactNode
}

export interface ContainerProps<TData> {
  table: Table<TData>
  /**
   * Spread onto the scroll container. Carries the scroll/overflow behaviour,
   * the max-height frame and the `ref` that measures how far it has scrolled —
   * a replacement must forward it, or pinned shadows and the sticky-header
   * lift stop reacting.
   */
  containerProps: HTMLAttributes<HTMLDivElement> & DataAttributes & { ref?: Ref<HTMLDivElement> }
  children: ReactNode
}

export interface TableProps<TData> {
  table: Table<TData>
  tableProps: TableHTMLAttributes<HTMLTableElement> & DataAttributes
  children: ReactNode
}

export interface HeaderProps<TData> {
  table: Table<TData>
  headerProps: SectionBag
  children: ReactNode
}

export interface HeaderRowProps<TData> {
  table: Table<TData>
  headerGroup: HeaderGroup<TData>
  rowProps: RowBag
  children: ReactNode
}

export interface HeaderCellProps<TData> {
  table: Table<TData>
  header: Header<TData, unknown>
  /** Includes `scope`, `aria-sort`, `colSpan`, pinning styles and the sort handler. */
  cellProps: ThBag
  /** The rendered header label. Wrap it; do not re-render it from the column def. */
  children: ReactNode
  sortDirection: 'asc' | 'desc' | false
  sortIndex: number
  canSort: boolean
  canResize: boolean
  isPinned: false | 'left' | 'right'
}

export interface BodyProps<TData> {
  table: Table<TData>
  rows: Row<TData>[]
  bodyProps: SectionBag
  children: ReactNode
}

export interface RowProps<TData> {
  table: Table<TData>
  row: Row<TData>
  /* `rowProps` carries `aria-selected`, `aria-disabled`, the roving tab stop and
   * the click/key handlers. Expansion state is announced by the expander button,
   * not the row, because `aria-expanded` is invalid on a `table` row. */
  /** Index within the rendered page, not within the whole data set. */
  rowIndex: number
  rowProps: RowBag
  children: ReactNode
  isSelected: boolean
  isExpanded: boolean
  isDisabled: boolean
}

export interface CellProps<TData> {
  table: Table<TData>
  row: Row<TData>
  cell: Cell<TData, unknown>
  cellProps: TdBag
  children: ReactNode
}

export interface ExpandedRowProps<TData> {
  table: Table<TData>
  row: Row<TData>
  colSpan: number
  rowProps: RowBag
  children: ReactNode
}

export interface FooterProps<TData> {
  table: Table<TData>
  footerProps: SectionBag
  children: ReactNode
}

export interface ToolbarProps<TData> {
  table: Table<TData>
  children?: ReactNode
}

export interface HeadingProps<TData> {
  table: Table<TData>
  title: ReactNode
  description: ReactNode
  icon: ReactNode
  /** Rendered on the right of the title block — a "New order" button, say. */
  actions: ReactNode
  /** Id the table is labelled by, so the title names it for screen readers. */
  titleId: string
  /** The element the title renders as. `'p'` unless the table owns a section. */
  titleAs?: 'p' | 'h2' | 'h3' | 'h4'
  headingProps: HTMLAttributes<HTMLDivElement> & DataAttributes
}

export interface ClearFiltersProps<TData> {
  table: Table<TData>
}

export interface PaginationProps<TData> {
  table: Table<TData>
}

export interface EmptyStateProps<TData> {
  table: Table<TData>
  /** `true` when filters or a search term are narrowing the result set. */
  isFiltered: boolean
  clearFilters: () => void
  colSpan: number
}

export interface LoadingStateProps<TData> {
  table: Table<TData>
  columnCount: number
  /** How many skeleton rows to draw. */
  rowCount: number
  colSpan: number
}

export interface ErrorStateProps<TData> {
  table: Table<TData>
  error: unknown
  retry?: () => void
  colSpan: number
}

export interface SearchProps<TData> {
  table: Table<TData>
}

export interface FiltersProps<TData> {
  table: Table<TData>
}

export interface SelectionBarProps<TData> {
  table: Table<TData>
  selectedCount: number
  clearSelection: () => void
  /** Bulk actions from `slots.selectionActions`, shown between the count and Clear. */
  actions?: ReactNode
}

export interface ViewOptionsProps<TData> {
  table: Table<TData>
}

/**
 * Replace any structural part of the table.
 *
 * Anything you leave out keeps its default implementation, so overriding one
 * part never forces you to reimplement the rest (§29).
 */
export interface DataTableComponents<TData> {
  Root?: ComponentType<RootProps<TData>>
  Container?: ComponentType<ContainerProps<TData>>
  Table?: ComponentType<TableProps<TData>>
  Header?: ComponentType<HeaderProps<TData>>
  HeaderRow?: ComponentType<HeaderRowProps<TData>>
  HeaderCell?: ComponentType<HeaderCellProps<TData>>
  Body?: ComponentType<BodyProps<TData>>
  Row?: ComponentType<RowProps<TData>>
  Cell?: ComponentType<CellProps<TData>>
  ExpandedRow?: ComponentType<ExpandedRowProps<TData>>
  Footer?: ComponentType<FooterProps<TData>>
  Toolbar?: ComponentType<ToolbarProps<TData>>
  Heading?: ComponentType<HeadingProps<TData>>
  Search?: ComponentType<SearchProps<TData>>
  Filters?: ComponentType<FiltersProps<TData>>
  ClearFilters?: ComponentType<ClearFiltersProps<TData>>
  SelectionBar?: ComponentType<SelectionBarProps<TData>>
  ViewOptions?: ComponentType<ViewOptionsProps<TData>>
  Pagination?: ComponentType<PaginationProps<TData>>
  EmptyState?: ComponentType<EmptyStateProps<TData>>
  LoadingState?: ComponentType<LoadingStateProps<TData>>
  ErrorState?: ComponentType<ErrorStateProps<TData>>
}

/** Required version used internally once defaults have been merged in. */
export type ResolvedComponents<TData> = Required<DataTableComponents<TData>>

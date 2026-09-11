import {
  globalFilterFn,
  isSameQuery,
  type ColumnFilterConfig,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type DataTableQuery,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@shining-ui-kit/core'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef as EngineColumnDef,
  type FilterFn,
  type OnChangeFn,
  type Row,
  type Table,
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ACTIONS_COLUMN_ID,
  createActionsColumn,
  createExpanderColumn,
  createSelectionColumn,
  EXPANDER_COLUMN_ID,
  SELECTION_COLUMN_ID,
} from '../columns/built-in'
import { adaptColumns } from '../lib/column-adapter'
import { useControllableState, type Updater } from '../lib/use-controllable-state'
import { useEventCallback } from '../lib/use-event-callback'
import type { DataTableProps } from '../types/props'
import { resolveFeatures, type ResolvedFeatures } from './resolve-features'

const EMPTY_SORTING: SortingState = []
const EMPTY_FILTERS: ColumnFiltersState = []
const EMPTY_SELECTION: RowSelectionState = {}
const EMPTY_SIZING: ColumnSizingState = {}
const EMPTY_EXPANDED: ExpandedState = {}

export interface TableInstanceResult<TData> {
  table: Table<TData>
  features: ResolvedFeatures<TData>
  /** Filter configuration by column id, consumed by the filter panel. */
  filterConfigs: Map<string, ColumnFilterConfig>
  /** Plain-text column labels for the column picker and card layout. */
  columnLabels: Map<string, string>
  hasFooter: boolean
  isFiltered: boolean
  clearFilters: () => void
}

/**
 * Build the engine instance from props.
 *
 * Everything stateful lives here and nowhere else: the nine slices are resolved
 * once, handed to the engine, and every component downstream reads them back off
 * the instance. No component keeps a second copy of anything (§43).
 */
export function useTableInstance<TData>(props: DataTableProps<TData>): TableInstanceResult<TData> {
  const adapted = useMemo(() => adaptColumns(props.columns), [props.columns])
  const features = resolveFeatures(props, adapted.hints)

  // ------------------------------------------------------------------- state
  const [sorting, setSorting] = useControllableState<SortingState>({
    value: Array.isArray(props.sorting) ? props.sorting : undefined,
    defaultValue: props.defaultSorting ?? EMPTY_SORTING,
    onChange: props.onSortingChange,
  })
  const [columnFilters, setColumnFilters] = useControllableState<ColumnFiltersState>({
    value: Array.isArray(props.columnFilters) ? props.columnFilters : undefined,
    defaultValue: props.defaultColumnFilters ?? EMPTY_FILTERS,
    onChange: props.onColumnFiltersChange,
  })
  const [globalFilter, setGlobalFilter] = useControllableState<string>({
    value: props.globalFilter,
    defaultValue: props.defaultGlobalFilter ?? '',
    onChange: props.onGlobalFilterChange,
  })
  const [pagination, setPagination] = useControllableState<PaginationState>({
    value: props.pagination,
    defaultValue: props.defaultPagination ?? {
      pageIndex: 0,
      pageSize: features.pagination.pageSize,
    },
    onChange: props.onPaginationChange,
  })
  const [rowSelection, setRowSelection] = useControllableState<RowSelectionState>({
    value: props.rowSelection,
    defaultValue: props.defaultRowSelection ?? EMPTY_SELECTION,
    onChange: props.onRowSelectionChange,
  })
  const [columnVisibility, setColumnVisibility] = useControllableState<VisibilityState>({
    value: props.columnVisibility,
    defaultValue: props.defaultColumnVisibility ?? adapted.initialVisibility,
    onChange: props.onColumnVisibilityChange,
  })
  const [columnSizing, setColumnSizing] = useControllableState<ColumnSizingState>({
    value: props.columnSizing,
    defaultValue: props.defaultColumnSizing ?? EMPTY_SIZING,
    onChange: props.onColumnSizingChange,
  })
  // The injected selection and actions columns are pinned here rather than in
  // the column adapter: whether they exist at all is a feature decision, and
  // the adapter only ever sees the columns the application wrote.
  const pinnedActions = features.pinning.enabled ? features.pinning.actions : false
  const pinnedSelection =
    features.pinning.enabled && features.selection.enabled ? features.pinning.selection : false
  const initialPinning = useMemo(() => {
    const pinning: ColumnPinningState = {
      left: [...(adapted.initialPinning.left ?? [])],
      right: [...(adapted.initialPinning.right ?? [])],
    }
    const pin = (id: string, side: 'left' | 'right') => {
      if (!pinning.left?.includes(id) && !pinning.right?.includes(id)) pinning[side]?.push(id)
    }
    if (pinnedSelection) pin(SELECTION_COLUMN_ID, pinnedSelection)
    if (pinnedActions) pin(ACTIONS_COLUMN_ID, pinnedActions)
    return pinning
  }, [adapted.initialPinning, pinnedActions, pinnedSelection])

  const [columnPinning, setColumnPinning] = useControllableState<ColumnPinningState>({
    value: props.columnPinning,
    defaultValue: props.defaultColumnPinning ?? initialPinning,
    onChange: props.onColumnPinningChange,
  })
  const [expanded, setExpandedState] = useControllableState<ExpandedState>({
    value: props.expanded,
    defaultValue: props.defaultExpanded ?? EMPTY_EXPANDED,
    onChange: props.onExpandedChange,
  })

  // In single-expand mode, opening a row closes whichever one was open.
  const singleExpand = features.expanding.mode === 'single'
  const setExpanded = useCallback(
    (updater: Updater<ExpandedState>) => {
      setExpandedState((previous) => {
        const next = typeof updater === 'function' ? updater(previous) : updater
        if (!singleExpand || typeof next !== 'object' || typeof previous !== 'object') return next
        const opened = Object.keys(next).filter((key) => next[key] && !previous[key])
        const last = opened[opened.length - 1]
        return last ? { [last]: true } : next
      })
    },
    [setExpandedState, singleExpand],
  )

  // Keep an uncontrolled page size in step with a changing `pageSize` prop,
  // without fighting the page-size picker (which never changes the prop).
  const declaredPageSize = features.pagination.pageSize
  const lastDeclaredPageSize = useRef(declaredPageSize)
  useEffect(() => {
    if (lastDeclaredPageSize.current === declaredPageSize) return
    lastDeclaredPageSize.current = declaredPageSize
    setPagination({ pageIndex: 0, pageSize: declaredPageSize })
  }, [declaredPageSize, setPagination])

  // ----------------------------------------------------------------- columns
  const rowActions = props.rowActions ?? props.slots?.rowActions
  const renderExpandedRow = props.renderExpandedRow
  const selectionEnabled = features.selection.enabled
  const selectionMode = features.selection.mode
  const expandingEnabled = features.expanding.enabled

  const engineColumns = useMemo(() => {
    const columns = [...adapted.columns]
    const has = (id: string) => columns.some((column) => column.id === id)

    if (expandingEnabled && renderExpandedRow && !has(EXPANDER_COLUMN_ID)) {
      columns.unshift(createExpanderColumn<TData>())
    }
    if (selectionEnabled && !has(SELECTION_COLUMN_ID)) {
      columns.unshift(createSelectionColumn<TData>(selectionMode))
    }
    if (rowActions && !has(ACTIONS_COLUMN_ID)) {
      columns.push(
        createActionsColumn<TData>(rowActions, {
          header: props.rowActionsHeader,
          width: props.rowActionsWidth,
        }),
      )
    }
    return columns as EngineColumnDef<TData, unknown>[]
  }, [
    adapted.columns,
    expandingEnabled,
    renderExpandedRow,
    rowActions,
    props.rowActionsHeader,
    props.rowActionsWidth,
    selectionEnabled,
    selectionMode,
  ])

  // -------------------------------------------------------------- row models
  const clientSorting = features.sorting.mode === 'client'
  const clientFiltering = features.filtering.mode === 'client'
  const clientPagination = features.pagination.enabled && features.pagination.mode === 'client'

  const coreRowModel = useMemo(() => getCoreRowModel<TData>(), [])
  const sortedRowModel = useMemo(
    () => (clientSorting ? getSortedRowModel<TData>() : undefined),
    [clientSorting],
  )
  const filteredRowModel = useMemo(
    () => (clientFiltering ? getFilteredRowModel<TData>() : undefined),
    [clientFiltering],
  )
  const paginationRowModel = useMemo(
    () => (clientPagination ? getPaginationRowModel<TData>() : undefined),
    [clientPagination],
  )
  const expandedRowModel = useMemo(
    () => (expandingEnabled ? getExpandedRowModel<TData>() : undefined),
    [expandingEnabled],
  )

  // --------------------------------------------------------------- selection
  const isRowDisabled = props.isRowDisabled
  const enableRow = features.selection.enableRow
  const canSelectRow = useCallback(
    (row: Row<TData>) => {
      if (isRowDisabled?.(row.original)) return false
      return enableRow ? enableRow(row.original) : true
    },
    [enableRow, isRowDisabled],
  )

  const multiSort = features.sorting.multi
  const isMultiSortEvent = useCallback(
    (event: unknown) =>
      multiSort === 'always' ? true : Boolean((event as { shiftKey?: boolean })?.shiftKey),
    [multiSort],
  )

  const table = useReactTable<TData>({
    data: props.data,
    columns: engineColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
      columnVisibility,
      columnSizing,
      columnPinning,
      expanded,
    },
    getRowId: props.getRowId,

    onSortingChange: setSorting as OnChangeFn<SortingState>,
    onColumnFiltersChange: setColumnFilters as OnChangeFn<ColumnFiltersState>,
    onGlobalFilterChange: setGlobalFilter as OnChangeFn<string>,
    onPaginationChange: setPagination as OnChangeFn<PaginationState>,
    onRowSelectionChange: setRowSelection as OnChangeFn<RowSelectionState>,
    onColumnVisibilityChange: setColumnVisibility as OnChangeFn<VisibilityState>,
    onColumnSizingChange: setColumnSizing as OnChangeFn<ColumnSizingState>,
    onColumnPinningChange: setColumnPinning as OnChangeFn<ColumnPinningState>,
    onExpandedChange: setExpanded as OnChangeFn<ExpandedState>,

    enableSorting: features.sorting.enabled,
    // The engine defaults numeric columns to descending-first, which makes the
    // click cycle depend on the data type. One predictable cycle everywhere;
    // a column can still opt in with `sortDescFirst: true` (§47).
    sortDescFirst: false,
    enableMultiSort: features.sorting.multi !== false,
    enableSortingRemoval: features.sorting.removable,
    isMultiSortEvent,
    manualSorting: !clientSorting,

    enableFilters: features.filtering.enabled,
    enableGlobalFilter: features.filtering.globalSearch,
    globalFilterFn: globalFilterFn as FilterFn<TData>,
    manualFiltering: !clientFiltering,

    manualPagination: features.pagination.mode === 'server',
    ...(features.pagination.rowCount !== undefined
      ? { rowCount: features.pagination.rowCount }
      : {}),

    enableRowSelection: selectionEnabled ? canSelectRow : false,
    enableMultiRowSelection: selectionMode === 'multiple',

    enableHiding: features.columnVisibility.enabled,
    enableColumnResizing: features.resizing.enabled,
    columnResizeMode: features.resizing.mode,
    enableColumnPinning: features.pinning.enabled,

    getRowCanExpand: renderExpandedRow ? () => true : undefined,

    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: paginationRowModel,
    getExpandedRowModel: expandedRowModel,

    defaultColumn: { size: 160, minSize: 56, maxSize: 900 },
  })

  // ------------------------------------------------------------------ server
  const emitQuery = useEventCallback(props.onQueryChange)
  const lastQuery = useRef<DataTableQuery | undefined>(undefined)
  const query = useMemo<DataTableQuery>(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
    }),
    [columnFilters, globalFilter, pagination.pageIndex, pagination.pageSize, sorting],
  )

  const hasQueryListener = Boolean(props.onQueryChange)
  useEffect(() => {
    if (!hasQueryListener) return
    if (isSameQuery(lastQuery.current, query)) return
    lastQuery.current = query
    emitQuery(query)
  }, [emitQuery, hasQueryListener, query])

  // ----------------------------------------------------------------- derived
  const isFiltered = columnFilters.length > 0 || globalFilter.trim().length > 0
  const clearFilters = useCallback(() => {
    setColumnFilters(EMPTY_FILTERS)
    setGlobalFilter('')
  }, [setColumnFilters, setGlobalFilter])

  return {
    table,
    features,
    filterConfigs: adapted.filters,
    columnLabels: adapted.labels,
    hasFooter: props.showFooter ?? adapted.hints.anyFooter,
    isFiltered,
    clearFilters,
  }
}

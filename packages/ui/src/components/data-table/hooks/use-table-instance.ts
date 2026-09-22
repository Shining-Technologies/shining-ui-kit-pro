'use client'

import {
  getActiveFilters,
  isSameQuery,
  matchesSearchValue,
  stableStringify,
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
} from '../../../core'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Column,
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
import { DEFAULT_TABLE_LOCALE } from '../lib/format'
import { getEmptyLastSortedRowModel } from '../lib/sorted-row-model'
import { applyUpdater, useControllableState, type Updater } from '../../../hooks/use-controllable-state'
import { useEventCallback } from '../../../hooks/use-event-callback'
import type { DataTableProps } from '../types/props'
import { resolveFeatures, type ResolvedFeatures } from './resolve-features'
import {
  parsePinning,
  parseSizing,
  parseVisibility,
  resolvePersistence,
  usePersistedLayout,
} from './use-persisted-state'
import { useResponsiveHidden } from './use-responsive-hidden'

const EMPTY_SORTING: SortingState = []
const EMPTY_FILTERS: ColumnFiltersState = []
const EMPTY_SELECTION: RowSelectionState = {}
const EMPTY_SIZING: ColumnSizingState = {}
const EMPTY_EXPANDED: ExpandedState = {}
const STRUCTURAL_COLUMNS: ReadonlySet<string> = new Set([
  SELECTION_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  ACTIONS_COLUMN_ID,
])

/** Hide `hidden` columns unless the state already says something about them. */
function withResponsiveDefaults(state: VisibilityState, hidden: string[]): VisibilityState {
  if (hidden.length === 0) return state
  let merged: VisibilityState | undefined
  for (const id of hidden) {
    if (id in state) continue
    merged ??= { ...state }
    merged[id] = false
  }
  return merged ?? state
}

/**
 * The filters that actually narrow the result.
 *
 * A panel row whose operator was picked but whose value is still empty is kept
 * in state — it holds the operator choice — but it is not a filter yet, so it
 * is neither sent to the server nor counted as "filtered".
 */
function activeFilters(
  filters: ColumnFiltersState,
  configs: Map<string, ColumnFilterConfig>,
): ColumnFiltersState {
  return getActiveFilters(filters, configs)
}

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
  const locale = props.locale ?? DEFAULT_TABLE_LOCALE
  const timeZone = props.timeZone
  const adapted = useMemo(
    () => adaptColumns(props.columns, { locale, timeZone }),
    [props.columns, locale, timeZone],
  )
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
  // Columns `meta.responsive` hides at this viewport are hidden by default, but
  // only by default: an explicit entry in the visibility state — the user
  // ticking the column back on — wins. The defaults are merged in for the
  // engine and kept out of the stored state, so they never outlive a resize.
  const responsiveHidden = useResponsiveHidden(adapted.responsive)
  const effectiveVisibility = useMemo(
    () => withResponsiveDefaults(columnVisibility, responsiveHidden),
    [columnVisibility, responsiveHidden],
  )
  const handleVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      setColumnVisibility((previous) => {
        const merged = withResponsiveDefaults(previous, responsiveHidden)
        const next = typeof updater === 'function' ? updater(merged) : updater
        if (responsiveHidden.length === 0) return next
        const stored = { ...next }
        for (const id of responsiveHidden) {
          if (!(id in previous) && stored[id] === false) delete stored[id]
        }
        return stored
      })
    },
    [responsiveHidden, setColumnVisibility],
  )

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
  // The engine appends a newly pinned column to its side, which on the right
  // lands it after the actions column — outside the column that ends every
  // row. The injected columns keep their places: leading on the left,
  // trailing on the right. A column is on one side only: the left wins.
  const handlePinningChange = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      setColumnPinning((previous) => {
        const next = applyUpdater(updater, previous)
        const order = (ids: string[] | undefined, structuralFirst: boolean) => {
          const list = ids ?? []
          const structural = list.filter((id) => STRUCTURAL_COLUMNS.has(id))
          if (structural.length === 0) return list
          const rest = list.filter((id) => !STRUCTURAL_COLUMNS.has(id))
          return structuralFirst ? [...structural, ...rest] : [...rest, ...structural]
        }
        const left = order(next.left, true)
        const right = order(next.right, false).filter((id) => !left.includes(id))
        const same = (a: string[], b: string[] | undefined) =>
          a.length === (b?.length ?? 0) && a.every((id, index) => id === b?.[index])
        return same(left, next.left) && same(right, next.right) ? next : { left, right }
      })
    },
    [setColumnPinning],
  )
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

  // The engine hands over every pagination change as a fresh object — even a
  // "reset to page 0" issued on page 0. Passed through, that re-renders a
  // controlled parent, whose inline `data` array is then new data, which
  // resets the page again: a render loop. A change that changes nothing stops
  // here.
  const setPaginationIfChanged = useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination((previous) => {
        const next = applyUpdater(updater, previous)
        return next.pageIndex === previous.pageIndex && next.pageSize === previous.pageSize
          ? previous
          : next
      })
    },
    [setPagination],
  )

  // Keep an uncontrolled page size in step with a changing `pageSize` prop,
  // without fighting the page-size picker (which never changes the prop).
  const declaredPageSize = features.pagination.pageSize
  const lastDeclaredPageSize = useRef(declaredPageSize)
  useEffect(() => {
    if (lastDeclaredPageSize.current === declaredPageSize) return
    lastDeclaredPageSize.current = declaredPageSize
    setPaginationIfChanged({ pageIndex: 0, pageSize: declaredPageSize })
  }, [declaredPageSize, setPaginationIfChanged])

  // The engine only resets pages it paginates itself. In server pagination a
  // new sort, filter or search would otherwise ask for page 5 of a different
  // result — often past its end. Going back to the first page happens in the
  // same update as the change, so `onQueryChange` fires once, not twice.
  const serverPagination = features.pagination.enabled && features.pagination.mode === 'server'
  // With `keepPageOnDataChange` the engine's own reset is switched off (it
  // cannot tell a refetch from a re-sort), so sort, filter and search take
  // over the job here exactly as they do for server pagination.
  const keepPage =
    features.pagination.enabled && !serverPagination && props.keepPageOnDataChange === true
  const resetsOnSort = (serverPagination && features.sorting.mode === 'server') || keepPage
  const resetsOnFilter = (serverPagination && features.filtering.mode === 'server') || keepPage
  const toFirstPage = useCallback(
    () => setPaginationIfChanged((previous) => ({ ...previous, pageIndex: 0 })),
    [setPaginationIfChanged],
  )

  // …and when the server's total shrinks under the current page — the last
  // row of the last page deleted — step back to the page that now ends the
  // result instead of showing an empty one. Only against a settled answer:
  // while loading, or before the first total arrives, `rowCount` is stale.
  // A settled total of 0 is an answer too — the last row deleted, or a result
  // emptied under page 4 — and its only page is the first. A negative total
  // is the engine's "unknown", which says nothing about where the end is.
  const rowCount = features.pagination.rowCount
  const loading = props.loading ?? false
  useEffect(() => {
    if (!serverPagination || loading || rowCount === undefined || rowCount < 0) return
    const lastPage = Math.max(0, Math.ceil(rowCount / pagination.pageSize) - 1)
    if (pagination.pageIndex <= lastPage) return
    setPaginationIfChanged((previous) => ({ ...previous, pageIndex: lastPage }))
  }, [
    loading,
    pagination.pageIndex,
    pagination.pageSize,
    rowCount,
    serverPagination,
    setPaginationIfChanged,
  ])

  const sortingRef = useRef(sorting)
  sortingRef.current = sorting
  const columnFiltersRef = useRef(columnFilters)
  columnFiltersRef.current = columnFilters
  const globalFilterRef = useRef(globalFilter)
  globalFilterRef.current = globalFilter
  const filterConfigs = adapted.filters

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const previous = sortingRef.current
      const next = applyUpdater(updater, previous)
      sortingRef.current = next
      setSorting(next)
      if (resetsOnSort && stableStringify(next) !== stableStringify(previous)) toFirstPage()
    },
    [resetsOnSort, setSorting, toFirstPage],
  )
  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const previous = columnFiltersRef.current
      const next = applyUpdater(updater, previous)
      columnFiltersRef.current = next
      setColumnFilters(next)
      // Only a change to what is actually filtered: picking an operator for an
      // empty filter changes nothing on the server.
      if (
        resetsOnFilter &&
        stableStringify(activeFilters(next, filterConfigs)) !==
          stableStringify(activeFilters(previous, filterConfigs))
      ) {
        toFirstPage()
      }
    },
    [filterConfigs, resetsOnFilter, setColumnFilters, toFirstPage],
  )
  const handleGlobalFilterChange = useCallback(
    (updater: Updater<string>) => {
      const previous = globalFilterRef.current
      const next = applyUpdater(updater, previous)
      globalFilterRef.current = next
      setGlobalFilter(next)
      if (resetsOnFilter && next !== previous) toFirstPage()
    },
    [resetsOnFilter, setGlobalFilter, toFirstPage],
  )

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
    () => (clientSorting ? getEmptyLastSortedRowModel<TData>() : undefined),
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

  // The search box covers every column with a value (the engine still honours
  // `enableGlobalFilter: false`), and decides cell by cell what can match —
  // the rule `applyQuery` uses on a server. Deciding per column from a sample
  // value, as the engine does by default, skipped a column whose first value
  // happened to be a boolean or a blank.
  const getColumnCanGlobalFilter = useCallback(
    (column: Column<TData, unknown>) => Boolean(column.accessorFn),
    [],
  )
  const searchFilterFn = useMemo<FilterFn<TData>>(
    () => (row, columnId, filterValue) =>
      matchesSearchValue(row.getValue(columnId), filterValue, { timeZone }),
    [timeZone],
  )

  const multiSort = features.sorting.multi
  const isMultiSortEvent = useCallback(
    (event: unknown) =>
      multiSort === 'always' ? true : Boolean((event as { shiftKey?: boolean })?.shiftKey),
    [multiSort],
  )

  const table = useReactTable<TData>({
    // The engine types `data` as mutable but only ever reads it; the cast is
    // what lets the prop accept a read-only array.
    data: props.data as TData[],
    columns: engineColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
      columnVisibility: effectiveVisibility,
      columnSizing,
      columnPinning,
      expanded,
    },
    getRowId: props.getRowId,

    onSortingChange: handleSortingChange as OnChangeFn<SortingState>,
    onColumnFiltersChange: handleColumnFiltersChange as OnChangeFn<ColumnFiltersState>,
    onGlobalFilterChange: handleGlobalFilterChange as OnChangeFn<string>,
    onPaginationChange: setPaginationIfChanged as OnChangeFn<PaginationState>,
    onRowSelectionChange: setRowSelection as OnChangeFn<RowSelectionState>,
    onColumnVisibilityChange: handleVisibilityChange as OnChangeFn<VisibilityState>,
    onColumnSizingChange: setColumnSizing as OnChangeFn<ColumnSizingState>,
    onColumnPinningChange: handlePinningChange as OnChangeFn<ColumnPinningState>,
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
    globalFilterFn: searchFilterFn,
    getColumnCanGlobalFilter,
    manualFiltering: !clientFiltering,

    manualPagination: features.pagination.mode === 'server',
    ...(keepPage ? { autoResetPageIndex: false } : {}),
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

  // ------------------------------------------------------------- persistence
  // The user's column layout, remembered in the browser (`persist`). Keyed by
  // the columns as a string, so a new `columns` array with the same ids is the
  // same table.
  const leafIds = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .join('|')
  const columnSets = useMemo(() => {
    const all = leafIds ? leafIds.split('|') : []
    const data = all.filter((id) => !STRUCTURAL_COLUMNS.has(id))
    return { all: new Set(all), data: new Set(data), key: data.join(',') }
  }, [leafIds])
  const persistence = useMemo(
    () => resolvePersistence(props.persist, props.id, columnSets.key),
    [columnSets.key, props.id, props.persist],
  )
  const initialVisibility = adapted.initialVisibility
  usePersistedLayout(persistence, {
    columnPinning: {
      controlled: props.columnPinning !== undefined,
      available: features.pinning.enabled,
      value: columnPinning,
      setValue: setColumnPinning,
      parse: (stored) => parsePinning(stored, columnSets.data, STRUCTURAL_COLUMNS, initialPinning),
    },
    columnSizing: {
      controlled: props.columnSizing !== undefined,
      available: features.resizing.enabled,
      value: columnSizing,
      setValue: setColumnSizing,
      parse: (stored) => parseSizing(stored, columnSets.all),
    },
    columnVisibility: {
      controlled: props.columnVisibility !== undefined,
      available: features.columnVisibility.enabled,
      value: columnVisibility,
      setValue: setColumnVisibility,
      parse: (stored) => {
        const visibility = parseVisibility(stored, columnSets.data)
        // A column added since the visit keeps its own default.
        return visibility && { ...initialVisibility, ...visibility }
      },
    },
  })

  // ------------------------------------------------------------------ server
  const emitQuery = useEventCallback(props.onQueryChange)
  const lastQuery = useRef<DataTableQuery | undefined>(undefined)
  const appliedFilters = useMemo(
    () => activeFilters(columnFilters, filterConfigs),
    [columnFilters, filterConfigs],
  )
  const query = useMemo<DataTableQuery>(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      columnFilters: appliedFilters,
      globalFilter,
    }),
    [appliedFilters, globalFilter, pagination.pageIndex, pagination.pageSize, sorting],
  )

  const hasQueryListener = Boolean(props.onQueryChange)
  useEffect(() => {
    if (!hasQueryListener) return
    if (isSameQuery(lastQuery.current, query)) return
    lastQuery.current = query
    emitQuery(query)
  }, [emitQuery, hasQueryListener, query])

  // A refetch that returns fewer rows can leave a kept page past the end; step
  // back to the page that now ends the result rather than show an empty one.
  const clientPageCount = keepPage ? table.getPageCount() : 0
  useEffect(() => {
    if (!keepPage) return
    const lastPage = Math.max(0, clientPageCount - 1)
    if (pagination.pageIndex <= lastPage) return
    setPaginationIfChanged((previous) => ({ ...previous, pageIndex: lastPage }))
  }, [clientPageCount, keepPage, pagination.pageIndex, setPaginationIfChanged])

  // ----------------------------------------------------------------- derived
  const isFiltered = appliedFilters.length > 0 || globalFilter.trim().length > 0
  const clearFilters = useCallback(() => {
    handleColumnFiltersChange(EMPTY_FILTERS)
    handleGlobalFilterChange('')
  }, [handleColumnFiltersChange, handleGlobalFilterChange])

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

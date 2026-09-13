'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  isSameQuery,
  type ColumnFiltersState,
  type DataTableQuery,
  type PaginationState,
  type SortingState,
} from '../../../core'
import { useEventCallback } from '../../../hooks/use-event-callback'

/** Controlled state props for a `DataTable`, ready to spread. */
export interface DataTableQueryState {
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
}

/**
 * Drive a `DataTable` from a query kept somewhere else — the URL, a router, a
 * store — without losing changes on the way.
 *
 * ```tsx
 * const state = useDataTableQueryState(queryFromUrl, (next) =>
 *   router.replace(`?${serializeQuerySearchParams(next, { columns })}`),
 * )
 * <DataTable mode="server" {...state} data={rows} rowCount={total} columns={columns} />
 * ```
 *
 * Wiring each `onXChange` to the router yourself loses updates. One user
 * action often changes two slices in the same tick — a new sort also returns
 * to page 1 — and each handler would build its URL from the props it rendered
 * with, so the second navigation overwrites the first. This hook:
 *
 * - merges every change made in one tick into a single `onQueryChange`;
 * - shows the new state immediately, before the source has caught up, so the
 *   sort arrow and the search box respond at once;
 * - lets the source win again as soon as it changes — including to something
 *   else entirely, such as the browser's Back button.
 */
export function useDataTableQueryState(
  query: DataTableQuery,
  onQueryChange: (query: DataTableQuery) => void,
): DataTableQueryState {
  const [optimistic, setOptimistic] = useState<DataTableQuery | null>(null)
  const current = optimistic ?? query
  const currentRef = useRef(current)
  currentRef.current = current

  const emit = useEventCallback(onQueryChange)
  const pending = useRef<DataTableQuery | null>(null)
  const scheduled = useRef(false)

  // The source moved — it caught up with us, or went somewhere else. Either
  // way it is the truth again.
  const lastSource = useRef(query)
  useEffect(() => {
    if (isSameQuery(lastSource.current, query)) return
    lastSource.current = query
    setOptimistic(null)
  }, [query])

  const update = useCallback(
    (patch: Partial<DataTableQuery>) => {
      pending.current = { ...(pending.current ?? currentRef.current), ...patch }
      if (scheduled.current) return
      scheduled.current = true
      queueMicrotask(() => {
        scheduled.current = false
        const next = pending.current
        pending.current = null
        if (!next || isSameQuery(currentRef.current, next)) return
        setOptimistic(next)
        emit(next)
      })
    },
    [emit],
  )

  const onSortingChange = useCallback((sorting: SortingState) => update({ sorting }), [update])
  const onColumnFiltersChange = useCallback(
    (columnFilters: ColumnFiltersState) => update({ columnFilters }),
    [update],
  )
  const onGlobalFilterChange = useCallback(
    (globalFilter: string) => update({ globalFilter }),
    [update],
  )
  const onPaginationChange = useCallback(
    (pagination: PaginationState) =>
      update({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }),
    [update],
  )
  const pagination = useMemo(
    () => ({ pageIndex: current.pageIndex, pageSize: current.pageSize }),
    [current.pageIndex, current.pageSize],
  )

  return {
    sorting: current.sorting,
    onSortingChange,
    columnFilters: current.columnFilters,
    onColumnFiltersChange,
    globalFilter: current.globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
  }
}

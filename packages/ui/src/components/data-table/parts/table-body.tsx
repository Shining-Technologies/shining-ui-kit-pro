'use client'

import { useDataTable } from '../context'
import { cn } from '../../../lib/cn'
import { BodyRow } from './body-row'

/**
 * Renders the body, and decides between the four things a body can be:
 * an error, a loading skeleton, an empty state, or rows.
 */
export function TableBody<TData>() {
  const context = useDataTable<TData>()
  const { table, components, bodyClassName, loading, error } = context
  const { Body, EmptyState, LoadingState, ErrorState } = components

  const rows = table.getRowModel().rows
  const colSpan = table.getVisibleLeafColumns().length || 1
  // Rows already on screen are kept through a refetch and dimmed, rather than
  // replaced by skeletons: a skeleton cell is one line where a real one is
  // often two, so swapping them resizes every row and column on each page
  // change. Skeletons are for the first load, when there is nothing to keep.
  const refetching = loading && rows.length > 0
  const bodyProps = {
    role: 'rowgroup',
    className: cn('sui-tbody', refetching && 'sui-tbody--refetching', bodyClassName),
    'data-refetching': refetching || undefined,
  }
  // A virtualized body renders from `rows` itself; building elements for every
  // row here would undo the point of virtualizing.
  const virtualized = context.features.virtualization.enabled
  const { isRowDisabled, navigation } = context

  if (error) {
    return (
      <Body table={table} rows={rows} bodyProps={bodyProps}>
        <ErrorState table={table} error={error} retry={context.retry} colSpan={colSpan} />
      </Body>
    )
  }

  if (loading && rows.length === 0) {
    return (
      <Body table={table} rows={rows} bodyProps={bodyProps}>
        <LoadingState
          table={table}
          columnCount={colSpan}
          rowCount={context.loadingRowCount}
          colSpan={colSpan}
        />
      </Body>
    )
  }

  if (rows.length === 0) {
    return (
      <Body table={table} rows={rows} bodyProps={bodyProps}>
        <EmptyState
          table={table}
          isFiltered={context.isFiltered}
          clearFilters={context.clearFilters}
          colSpan={colSpan}
        />
      </Body>
    )
  }

  // One tab stop for the rows, and never on a row that cannot take focus.
  const tabStop = virtualized
    ? -1
    : navigation.resolveTabStop(
        (index) => !isRowDisabled?.(rows[index]!.original),
        0,
        rows.length - 1,
      )

  return (
    <Body table={table} rows={rows} bodyProps={bodyProps}>
      {virtualized
        ? null
        : rows.map((row, index) => (
            <BodyRow
              key={row.id}
              row={row}
              index={index}
              rowCount={rows.length}
              tabStop={tabStop}
            />
          ))}
    </Body>
  )
}

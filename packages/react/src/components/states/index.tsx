import { Fragment } from 'react'
import { useDataTable } from '../../context/table-context'
import { AlertIcon, InboxIcon } from '../../lib/icons'
import { renderSlot } from '../../lib/slots'
import { Button } from '../../primitives/button'
import { Skeleton } from '../../primitives/skeleton'
import type { EmptyStateProps, ErrorStateProps, LoadingStateProps } from '../../types/components'

/**
 * The three "not a list of rows" states.
 *
 * Each one checks its slot first, so `slots.emptyState` customises the content
 * while the surrounding table structure — and therefore the column grid and the
 * table semantics — stays intact (§34, §35, §36).
 */

export function DataTableEmptyState<TData>({
  isFiltered,
  clearFilters,
  colSpan,
}: EmptyStateProps<TData>) {
  const { slots, table } = useDataTable<TData>()
  const custom = renderSlot(slots.emptyState, table)

  return (
    <tr className="sui-state-row">
      <td colSpan={colSpan} className="sui-state-cell">
        {custom ?? (
          <div className="sui-state">
            <InboxIcon className="sui-state__icon" />
            <p className="sui-state__title">No results</p>
            <p className="sui-state__description">
              {isFiltered
                ? 'No rows match the current filters.'
                : 'There is nothing to show here yet.'}
            </p>
            {isFiltered ? (
              <Button onClick={clearFilters} className="sui-state__action">
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  )
}

/** Deterministic widths so the skeleton looks like text, not like a bar chart. */
const SKELETON_WIDTHS = ['62%', '84%', '48%', '73%', '55%', '90%', '67%']

export function DataTableLoadingState<TData>({ table, rowCount }: LoadingStateProps<TData>) {
  const { slots } = useDataTable<TData>()
  const custom = renderSlot(slots.loadingState, table)
  const columns = table.getVisibleLeafColumns()

  if (custom !== undefined) {
    return (
      <tr className="sui-state-row">
        <td colSpan={columns.length || 1} className="sui-state-cell">
          {custom}
        </td>
      </tr>
    )
  }

  return (
    <Fragment>
      {Array.from({ length: Math.max(rowCount, 1) }, (_, rowIndex) => (
        <tr key={rowIndex} className="sui-tr sui-row sui-row--skeleton" aria-hidden="true">
          {columns.map((column, columnIndex) => (
            <td key={column.id} className="sui-td">
              <Skeleton
                style={{
                  width: SKELETON_WIDTHS[(rowIndex + columnIndex) % SKELETON_WIDTHS.length],
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </Fragment>
  )
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong while loading this table.'
}

export function DataTableErrorState<TData>({ error, retry, colSpan }: ErrorStateProps<TData>) {
  const { slots, table } = useDataTable<TData>()
  const custom = renderSlot(slots.errorState, table)

  return (
    <tr className="sui-state-row">
      <td colSpan={colSpan} className="sui-state-cell">
        {custom ?? (
          <div className="sui-state sui-state--error" role="alert">
            <AlertIcon className="sui-state__icon sui-state__icon--error" />
            <p className="sui-state__title">Could not load data</p>
            <p className="sui-state__description">{errorMessage(error)}</p>
            {retry ? (
              <Button onClick={retry} className="sui-state__action">
                Try again
              </Button>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  )
}

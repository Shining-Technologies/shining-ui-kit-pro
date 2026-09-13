'use client'

import { Fragment, type ReactNode } from 'react'
import { useDataTable } from '../context'
import { AlertIcon, CloseIcon, InboxIcon, SearchIcon } from '../../icons/icons'
import { renderSlot } from '../lib/slots'
import { Button } from '../../button/button'
import { Skeleton } from '../../feedback/skeleton'
import type { EmptyStateProps, ErrorStateProps, LoadingStateProps } from '../types/components'

/**
 * The three "not a list of rows" states.
 *
 * Each one checks its slot first, so `slots.emptyState` customises the content
 * while the surrounding table structure — and therefore the column grid and the
 * table semantics — stays intact (§34, §35, §36).
 *
 * Empty and error are panels, not a line of text: the icon on a soft tile, a
 * title that says what is missing, a sentence on why, and the way forward,
 * centred in the space the rows would take so the frame does not collapse to a
 * sliver. Custom slot content is centred in the same frame.
 */

function StateRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr role="row" className="sui-state-row">
      <td role="cell" colSpan={colSpan} className="sui-state-cell">
        {children}
      </td>
    </tr>
  )
}

export function DataTableEmptyState<TData>({
  isFiltered,
  clearFilters,
  colSpan,
}: EmptyStateProps<TData>) {
  const { slots, table } = useDataTable<TData>()
  const custom = renderSlot(slots.emptyState, table)

  // `undefined` means "no slot"; `null` or `''` is a deliberate blank.
  return (
    <StateRow colSpan={colSpan}>
      {custom !== undefined ? (
        <div className="sui-state sui-state--custom">{custom}</div>
      ) : (
        <div className="sui-state">
          <span className="sui-state__media" aria-hidden="true">
            {isFiltered ? (
              <SearchIcon className="sui-state__icon" />
            ) : (
              <InboxIcon className="sui-state__icon" />
            )}
          </span>
          <p className="sui-state__title">No results</p>
          <p className="sui-state__description">
            {isFiltered
              ? 'No rows match the current search and filters. Try a different term, or clear them.'
              : 'There is nothing to show here yet.'}
          </p>
          {isFiltered ? (
            <Button variant="outline" size="sm" onClick={clearFilters} className="sui-state__action">
              <CloseIcon aria-hidden="true" />
              Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </StateRow>
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
      <StateRow colSpan={columns.length || 1}>
        <div className="sui-state sui-state--custom">{custom}</div>
      </StateRow>
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
    <StateRow colSpan={colSpan}>
      {custom !== undefined ? (
        <div className="sui-state sui-state--custom" role="alert">
          {custom}
        </div>
      ) : (
        <div className="sui-state sui-state--error" role="alert">
          <span className="sui-state__media" aria-hidden="true">
            <AlertIcon className="sui-state__icon" />
          </span>
          <p className="sui-state__title">Could not load data</p>
          <p className="sui-state__description">{errorMessage(error)}</p>
          {retry ? (
            <Button variant="outline" size="sm" onClick={retry} className="sui-state__action">
              Try again
            </Button>
          ) : null}
        </div>
      )}
    </StateRow>
  )
}

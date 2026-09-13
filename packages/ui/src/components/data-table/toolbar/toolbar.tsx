'use client'

import { getPageRange } from '../../../core'
import { useDataTable } from '../context'
import { cn } from '../../../lib/cn'
import { renderSlot } from '../lib/slots'
import type { ToolbarProps } from '../types/components'
import { ActiveFilters } from './active-filters'

/**
 * The default toolbar.
 *
 * Two regions, and the split is what keeps it stable as filters are added:
 *
 *   - The search box and the filters share one flow. They wrap together onto a
 *     second and third line as the table runs out of width, in the order they
 *     were declared.
 *   - The row count, your actions and the column picker sit in a fixed cluster
 *     at the top right. They are what people navigate by, so they do not move
 *     when the flow beside them grows a line.
 *
 * One wrapping row for all of it is what made the column picker drift down and
 * to the left as filters were added.
 *
 * Passing children turns the whole thing into a layout shell, which is what
 * makes the composable form from §46 work:
 *
 * ```tsx
 * <DataTableToolbar>
 *   <DataTableSearch />
 *   <DataTableFilters />
 *   <DataTableViewOptions />
 * </DataTableToolbar>
 * ```
 */
export function DefaultToolbar<TData>({ table, children }: ToolbarProps<TData>) {
  const {
    components,
    features,
    slots,
    classNames,
    filterLayout,
    showToolbarCount,
    numberFormat: nf,
  } = useDataTable<TData>()
  const { Search, Filters, ClearFilters, ViewOptions } = components

  if (children !== undefined) {
    return (
      <div
        className={cn('sui-toolbar', classNames.toolbar)}
        data-filter-layout={filterLayout}
        role="group"
        aria-label="Table tools"
      >
        <div className="sui-toolbar__row">{children}</div>
      </div>
    )
  }

  const showSearch = features.filtering.enabled && features.filtering.globalSearch
  const showFilters = features.filtering.enabled
  const showColumns = features.columnVisibility.enabled
  const actions = renderSlot(slots.toolbarActions, table)
  const inline = filterLayout === 'inline'

  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getRowCount()
  // Without pagination every row is on screen, so a "1–10 of 48" would be a
  // lie: the count is then simply how many rows the filters left.
  const range = features.pagination.enabled
    ? getPageRange(pageIndex, pageSize, total)
    : { from: 1, to: total, total }

  const filters = showFilters ? <Filters table={table} /> : null
  // Only renders once a filter is actually applied.
  const clear = showFilters ? <ClearFilters table={table} /> : null

  return (
    <div
      className={cn('sui-toolbar', classNames.toolbar)}
      data-filter-layout={filterLayout}
      role="group"
      aria-label="Table tools"
    >
      <div className="sui-toolbar__row">
        <div className="sui-toolbar__start">
          {showSearch ? <Search table={table} /> : null}
          {filters}
          {clear}
        </div>
        <div className="sui-toolbar__end">
          {showToolbarCount ? (
            <span className="sui-toolbar__count">
              {range.total === 0 ? (
                'No rows'
              ) : features.pagination.enabled ? (
                <>
                  <strong>
                    {nf.format(range.from)}–{nf.format(range.to)}
                  </strong>{' '}
                  of <strong>{nf.format(range.total)}</strong>
                </>
              ) : (
                <>
                  <strong>{nf.format(range.total)}</strong> {range.total === 1 ? 'row' : 'rows'}
                </>
              )}
            </span>
          ) : null}
          {actions}
          {showColumns ? <ViewOptions table={table} /> : null}
        </div>
      </div>

      {/* The panel layout hides its filters behind a button, so the chips are
          the only trace of what is applied. Inline controls show themselves. */}
      {inline ? null : <ActiveFilters table={table} />}
    </div>
  )
}

'use client'

import { getPageNumbers, getPageRange } from '../../../core'
import { useDataTable } from '../context'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from '../../icons/icons'
import { cn } from '../../../lib/cn'
import { Button } from '../../button/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../form/select'
import type { PaginationProps } from '../types/components'

/**
 * The default pagination bar.
 *
 * Identical in client and server mode: the engine already reports the right
 * page count from `rowCount`, so nothing here knows where the data came from
 * (§17, §37).
 */
export function DefaultPagination<TData>({ table }: PaginationProps<TData>) {
  const { features, classNames, numberFormat: nf } = useDataTable<TData>()
  const { pageIndex, pageSize } = table.getState().pagination

  const total = table.getRowCount()
  const pageCount = table.getPageCount()
  const range = getPageRange(pageIndex, pageSize, total)
  const pages = features.pagination.showPageNumbers
    ? getPageNumbers(pageIndex, pageCount, features.pagination.siblingCount)
    : []
  // A page size the picker does not offer (`pageSize={20}` with the default
  // options) would leave the select showing nothing; it is always listed.
  const { pageSizeOptions } = features.pagination
  const sizeOptions = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b)

  // From the state rather than the row model, so a selection made on another
  // page — or on a row the server has not sent — is still counted.
  const selectedCount = features.selection.enabled
    ? Object.values(table.getState().rowSelection).filter(Boolean).length
    : 0

  return (
    <nav className={cn('sui-pagination', classNames.pagination)} aria-label="Table pagination">
      <div className="sui-pagination__status">
        {features.selection.enabled ? (
          <span className="sui-pagination__selection">
            {nf.format(selectedCount)} of {nf.format(total)} selected
          </span>
        ) : null}
        <span className="sui-pagination__range">
          {range.total === 0
            ? 'No rows'
            : `Showing ${nf.format(range.from)}–${nf.format(range.to)} of ${nf.format(range.total)}`}
        </span>
        {/* Announced on every page change, without moving focus. */}
        <span role="status" aria-live="polite" className="sui-sr-only">
          Page {pageIndex + 1} of {Math.max(pageCount, 1)}
        </span>
      </div>

      <div className="sui-pagination__controls">
        <label className="sui-pagination__page-size">
          <span className="sui-pagination__page-size-label">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="sui-pagination__pages">
          <Button
            size="icon-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon />
          </Button>

          {pages.map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={page}
                className="sui-pagination__page"
                size="icon-sm"
                variant={page === pageIndex ? 'default' : 'ghost'}
                aria-label={`Go to page ${page + 1}`}
                aria-current={page === pageIndex ? 'page' : undefined}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </Button>
            ) : (
              <span
                key={`${page}-${index}`}
                className="sui-pagination__ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            ),
          )}

          <Button
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            size="icon-sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </nav>
  )
}

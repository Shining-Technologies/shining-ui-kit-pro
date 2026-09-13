'use client'

import { cn } from '../../../lib/cn'
import type { HeaderCellProps } from '../types/components'
import { useDataTable } from '../context'
import { ColumnMenu } from './column-menu'
import { SortIndicator } from './sort-indicator'

/**
 * The default header cell: label, sort control, column menu and resize grip.
 *
 * Sorting lives on a real `<button>` rather than on the `<th>` so that it is
 * reachable by keyboard and announced correctly, and so a click on the menu or
 * the resize handle cannot be mistaken for a sort (§12, §39).
 */
export function DataTableHeaderCell<TData>({
  header,
  table,
  cellProps,
  sortDirection,
  sortIndex,
  canSort,
  canResize,
  children,
}: HeaderCellProps<TData>) {
  const { columnLabels } = useDataTable<TData>()
  const column = header.column
  const label = columnLabels.get(column.id) ?? column.id

  if (header.isPlaceholder) return <th {...cellProps} />

  const isResizing = header.column.getIsResizing()
  // A focusable separator is a widget, and ARIA requires it to report its
  // value — here, the column's width. A group head spans several leaves, so it
  // has no single min or max of its own.
  const size = header.getSize()
  const isLeaf = header.subHeaders.length === 0

  // Describe what the click will actually do, including clearing the sort.
  const next = column.getNextSortingOrder()
  const sortAction =
    next === 'asc' ? 'sort ascending' : next === 'desc' ? 'sort descending' : 'clear sort'

  return (
    <th {...cellProps}>
      <div className="sui-th__inner">
        {canSort ? (
          <button
            type="button"
            className="sui-th__sort"
            onClick={header.column.getToggleSortingHandler()}
            aria-label={`${label}, ${sortAction}`}
          >
            <span className="sui-th__label">{children}</span>
            <SortIndicator direction={sortDirection} index={sortIndex} />
          </button>
        ) : (
          <span className="sui-th__label">{children}</span>
        )}

        <ColumnMenu column={column} label={label} />
      </div>

      {canResize ? (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${label}`}
          aria-valuenow={size}
          aria-valuemin={isLeaf ? column.columnDef.minSize : undefined}
          aria-valuemax={isLeaf ? column.columnDef.maxSize : undefined}
          aria-valuetext={`${size} pixels`}
          tabIndex={0}
          className={cn('sui-resizer', isResizing && 'sui-resizer--active')}
          data-resizing={isResizing || undefined}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={() => header.column.resetSize()}
          onKeyDown={(event) => {
            // Keyboard resizing: arrows nudge, Enter or Backspace resets.
            if (event.key === 'Enter' || event.key === 'Backspace') {
              event.preventDefault()
              column.resetSize()
              return
            }
            const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
            if (direction === 0) return
            event.preventDefault()
            const step = (event.shiftKey ? 32 : 8) * direction
            const min = column.columnDef.minSize ?? 56
            const max = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
            const next = Math.min(Math.max(column.getSize() + step, min), max)
            table.setColumnSizing((previous) => ({ ...previous, [column.id]: next }))
          }}
        />
      ) : null}
    </th>
  )
}

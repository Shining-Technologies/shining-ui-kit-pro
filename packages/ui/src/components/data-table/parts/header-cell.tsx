'use client'

import type { HeaderCellProps } from '../types/components'
import { useDataTable } from '../context'
import { ColumnMenu } from './column-menu'
import { DataTableColumnResizer } from './column-resizer'
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

      {canResize ? <DataTableColumnResizer header={header} table={table} label={label} /> : null}
    </th>
  )
}

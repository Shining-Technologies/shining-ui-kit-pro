import { flexRender } from '@tanstack/react-table'
import type { CSSProperties } from 'react'
import { ALIGN_CLASS } from '../../lib/class-names'
import { cn } from '../../lib/cn'
import {
  pinningClasses,
  pinningStyle,
  responsiveColumnClass,
  sizeStyle,
} from '../../lib/cell-style'
import { useDataTable } from '../../context/table-context'

/**
 * Renders the header groups.
 *
 * This component is not itself replaceable — it is the wiring. What *is*
 * replaceable is every part it renders: `Header`, `HeaderRow` and `HeaderCell`.
 */
export function TableHead<TData>() {
  const { table, components, headerClassName, classNames, stickyHeader, rowIndex } =
    useDataTable<TData>()
  const { Header, HeaderRow, HeaderCell } = components

  return (
    <Header
      table={table}
      headerProps={{
        role: 'rowgroup',
        className: cn('sui-thead', stickyHeader && 'sui-thead--sticky', headerClassName),
      }}
    >
      {table.getHeaderGroups().map((headerGroup, groupIndex) => (
        <HeaderRow
          key={headerGroup.id}
          table={table}
          headerGroup={headerGroup}
          rowProps={{
            role: 'row',
            'aria-rowindex': rowIndex?.header(groupIndex),
            className: cn('sui-tr', 'sui-tr--head', classNames.headerRow),
            // Grouped headers are several rows deep. Each one sticks below the
            // one above it instead of all of them stacking at `top: 0`, where
            // the lower rows would slide under the first and vanish.
            style: stickyHeader
              ? ({
                  '--sui-sticky-top': `calc(var(--sui-header-height) * ${groupIndex})`,
                } as CSSProperties)
              : undefined,
          }}
        >
          {headerGroup.headers.map((header) => {
            const column = header.column
            const meta = column.columnDef.meta
            const canSort = column.getCanSort()
            const sortDirection = column.getIsSorted()
            const sortIndex = table.getState().sorting.length > 1 ? column.getSortIndex() + 1 : 0
            const pinned = column.getIsPinned()

            return (
              <HeaderCell
                key={header.id}
                table={table}
                header={header}
                sortDirection={sortDirection}
                sortIndex={sortIndex}
                canSort={canSort}
                canResize={column.getCanResize()}
                isPinned={pinned}
                cellProps={{
                  role: 'columnheader',
                  scope: header.colSpan > 1 ? 'colgroup' : 'col',
                  colSpan: header.colSpan > 1 ? header.colSpan : undefined,
                  // Only sortable columns advertise a sort state.
                  'aria-sort': canSort
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : sortDirection === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined,
                  className: cn(
                    'sui-th',
                    ALIGN_CLASS[meta?.align ?? 'left'],
                    responsiveColumnClass(table, column),
                    pinningClasses(column),
                    meta?.headerClassName,
                    classNames.headerCell,
                  ),
                  style: { ...sizeStyle(header.id, 'header'), ...pinningStyle(column) },
                  'data-column-id': column.id,
                  'data-pinned': pinned || undefined,
                  'data-sorted': sortDirection || undefined,
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(column.columnDef.header, header.getContext())}
              </HeaderCell>
            )
          })}
        </HeaderRow>
      ))}
    </Header>
  )
}

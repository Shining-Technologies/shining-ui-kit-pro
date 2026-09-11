import { derive } from '@shining-ui-kit/core'
import { flexRender, type Row } from '@tanstack/react-table'
import { Fragment, type KeyboardEvent } from 'react'
import { useDataTable } from '../../context/table-context'
import { pinningClasses, pinningStyle, sizeStyle } from '../../lib/cell-style'
import { ALIGN_CLASS, responsiveClass } from '../../lib/class-names'
import { cn } from '../../lib/cn'

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
    className: cn('sui-tbody', refetching && 'sui-tbody--refetching', bodyClassName),
    'data-refetching': refetching || undefined,
  }
  // A virtualized body renders from `rows` itself; building elements for every
  // row here would undo the point of virtualizing.
  const virtualized = context.features.virtualization.enabled

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

  return (
    <Body table={table} rows={rows} bodyProps={bodyProps}>
      {virtualized
        ? null
        : rows.map((row, index) => (
            <BodyRow key={row.id} row={row} index={index} rowCount={rows.length} />
          ))}
    </Body>
  )
}

interface BodyRowProps<TData> {
  row: Row<TData>
  index: number
  rowCount: number
  /** Supplied by the virtualized body so rows can be measured. */
  measureRef?: (node: HTMLElement | null) => void
}

/**
 * Builds one row's prop bag and its cells.
 *
 * Note how little the `Row` and `Cell` components receive to do: everything is
 * decided here, once, so overriding them is safe.
 */
export function BodyRow<TData>({ row, index, rowCount, measureRef }: BodyRowProps<TData>) {
  const context = useDataTable<TData>()
  const {
    table,
    components,
    features,
    navigation,
    rowClassName,
    cellClassName,
    classNames,
    columnLabels,
    onRowClick,
    onRowDoubleClick,
    isRowDisabled,
    renderExpandedRow,
  } = context
  const { Row: RowComponent, Cell, ExpandedRow } = components

  const disabled = isRowDisabled?.(row.original) ?? false
  const selected = row.getIsSelected()
  const expanded = row.getIsExpanded()
  const canExpand = row.getCanExpand()
  const selectable = features.selection.enabled
  const interactive = navigation.enabled && !disabled

  const activate = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (disabled) return
    onRowClick?.(row, event)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    // Controls inside the row (checkboxes, menus, links) keep their own keys.
    if (event.target !== event.currentTarget) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        navigation.focusRow(index + 1, event.currentTarget)
        break
      case 'ArrowUp':
        event.preventDefault()
        navigation.focusRow(index - 1, event.currentTarget)
        break
      case 'Home':
        event.preventDefault()
        navigation.focusRow(0, event.currentTarget)
        break
      case 'End':
        event.preventDefault()
        navigation.focusRow(rowCount - 1, event.currentTarget)
        break
      case 'Enter':
        if (onRowClick) {
          event.preventDefault()
          activate(event)
        }
        break
      case ' ':
        if (selectable && row.getCanSelect()) {
          event.preventDefault()
          row.toggleSelected()
        }
        break
      case 'ArrowRight':
        if (canExpand && !expanded) {
          event.preventDefault()
          row.toggleExpanded(true)
        }
        break
      case 'ArrowLeft':
        if (canExpand && expanded) {
          event.preventDefault()
          row.toggleExpanded(false)
        }
        break
      default:
        break
    }
  }

  const detailsId = `${row.id}-expanded`

  return (
    <Fragment>
      <RowComponent
        table={table}
        row={row}
        rowIndex={index}
        isSelected={selected}
        isExpanded={expanded}
        isDisabled={disabled}
        rowProps={{
          ref: measureRef,
          className: cn(
            'sui-tr',
            'sui-row',
            selected && 'sui-row--selected',
            disabled && 'sui-row--disabled',
            interactive && 'sui-row--interactive',
            derive(rowClassName, row),
          ),
          'data-sui-row': '',
          'data-row-id': row.id,
          'data-index': index,
          'data-state': selected ? 'selected' : undefined,
          'data-expanded': expanded || undefined,
          'data-disabled': disabled || undefined,
          'aria-selected': selectable ? selected : undefined,
          // No `aria-expanded` here: it is only valid on rows of a `treegrid`,
          // not a `table`. The expander button carries it, together with
          // `aria-controls` pointing at the detail row.
          'aria-disabled': disabled || undefined,
          tabIndex: interactive ? navigation.tabIndexFor(index, rowCount) : undefined,
          onFocus: interactive ? () => navigation.setFocusedIndex(index) : undefined,
          onKeyDown: interactive ? handleKeyDown : undefined,
          onClick: onRowClick && !disabled ? (event) => onRowClick(row, event) : undefined,
          onDoubleClick:
            onRowDoubleClick && !disabled ? (event) => onRowDoubleClick(row, event) : undefined,
        }}
      >
        {row.getVisibleCells().map((cell) => {
          const column = cell.column
          const meta = column.columnDef.meta
          const pinned = column.getIsPinned()

          return (
            <Cell
              key={cell.id}
              table={table}
              row={row}
              cell={cell}
              cellProps={{
                className: cn(
                  'sui-td',
                  ALIGN_CLASS[meta?.align ?? 'left'],
                  responsiveClass(meta?.responsive),
                  pinningClasses(column),
                  meta?.wrap && 'sui-td--wrap',
                  meta?.hideInCards && 'sui-hide-in-cards',
                  meta?.className,
                  derive(cellClassName, cell),
                ),
                style: { ...sizeStyle(column.id, 'cell'), ...pinningStyle(column) },
                'data-column-id': column.id,
                'data-pinned': pinned || undefined,
                // Powers the card layout's `::before` labels without any JS.
                'data-label': meta?.hideLabelInCards
                  ? undefined
                  : (columnLabels.get(column.id) ?? column.id),
              }}
            >
              {flexRender(column.columnDef.cell, cell.getContext())}
            </Cell>
          )
        })}
      </RowComponent>

      {expanded && renderExpandedRow ? (
        <ExpandedRow
          table={table}
          row={row}
          colSpan={table.getVisibleLeafColumns().length || 1}
          rowProps={{
            id: detailsId,
            className: cn('sui-tr', 'sui-expanded', classNames.expandedRow),
            'data-sui-expanded-row': '',
            'data-row-id': row.id,
          }}
        >
          {renderExpandedRow(row)}
        </ExpandedRow>
      ) : null}
    </Fragment>
  )
}

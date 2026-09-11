import { derive } from '@shining-technologies/ui-kit-core'
import { flexRender, type Row } from '@tanstack/react-table'
import { Fragment, type KeyboardEvent } from 'react'
import {
  ACTIONS_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  SELECTION_COLUMN_ID,
} from '../../columns/built-in'
import { expandedRowId, useDataTable } from '../../context/table-context'
import {
  cardOrderStyle,
  pinningClasses,
  pinningStyle,
  responsiveColumnClass,
  sizeStyle,
} from '../../lib/cell-style'
import { ALIGN_CLASS } from '../../lib/class-names'
import { cn } from '../../lib/cn'
import { CardLabel } from './card-label'

/** Injected columns hold a named control, not a value; they need no label. */
const STRUCTURAL_COLUMNS = new Set([SELECTION_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID])

export interface BodyRowProps<TData> {
  row: Row<TData>
  index: number
  rowCount: number
  /** Index of the row holding the tab stop; see `RowNavigation.resolveTabStop`. */
  tabStop: number
  /** Supplied by the virtualized body so rows can be measured. */
  measureRef?: (node: HTMLElement | null) => void
}

/**
 * Builds one row's prop bag and its cells.
 *
 * Note how little the `Row` and `Cell` components receive to do: everything is
 * decided here, once, so overriding them is safe.
 */
export function BodyRow<TData>({
  row,
  index,
  rowCount,
  tabStop,
  measureRef,
}: BodyRowProps<TData>) {
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
    responsiveMode,
  } = context
  const { Row: RowComponent, Cell, ExpandedRow } = components
  // Only a table that can become cards carries the in-cell labels.
  const cardLabels = responsiveMode !== 'scroll'
  const ariaRowIndex = context.rowIndex?.body(index)

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
        navigation.focusRow(index - 1, event.currentTarget, -1)
        break
      case 'Home':
        event.preventDefault()
        navigation.focusRow(0, event.currentTarget)
        break
      case 'End':
        event.preventDefault()
        navigation.focusRow(rowCount - 1, event.currentTarget, -1)
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

  const detailsId = expandedRowId(context.tableId, row.id)

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
          role: 'row',
          'aria-rowindex': ariaRowIndex,
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
          tabIndex: interactive ? (index === tabStop ? 0 : -1) : undefined,
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
          const label = columnLabels.get(column.id) ?? column.id

          return (
            <Cell
              key={cell.id}
              table={table}
              row={row}
              cell={cell}
              cellProps={{
                role: 'cell',
                className: cn(
                  'sui-td',
                  ALIGN_CLASS[meta?.align ?? 'left'],
                  responsiveColumnClass(table, column),
                  pinningClasses(column),
                  meta?.wrap && 'sui-td--wrap',
                  meta?.hideInCards && 'sui-hide-in-cards',
                  meta?.className,
                  derive(cellClassName, cell),
                ),
                style: {
                  ...sizeStyle(column.id, 'cell'),
                  ...pinningStyle(column),
                  ...cardOrderStyle(meta?.responsive?.priority),
                },
                'data-column-id': column.id,
                'data-pinned': pinned || undefined,
                // Marks a cell whose label a card shows; styling only.
                'data-label': meta?.hideLabelInCards ? undefined : label,
              }}
            >
              {cardLabels && !STRUCTURAL_COLUMNS.has(column.id) ? (
                <CardLabel label={label} visuallyHidden={meta?.hideLabelInCards} />
              ) : null}
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
            role: 'row',
            // Straight after the row it details.
            'aria-rowindex': ariaRowIndex === undefined ? undefined : ariaRowIndex + 1,
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

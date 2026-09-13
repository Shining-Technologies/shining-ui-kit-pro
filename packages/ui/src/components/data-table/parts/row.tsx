import { flexRender } from '@tanstack/react-table'
import type { CellProps, ExpandedRowProps, RowProps } from '../types/components'

/**
 * The default row.
 *
 * Everything behavioural — ARIA state, the roving tab stop, click, double-click
 * and key handling — arrives pre-built in `rowProps`. A custom row that spreads
 * it inherits all of that, which is why replacing this component cannot break
 * sorting, selection, expansion or keyboard navigation (§9, §10).
 */
export function DataTableRow<TData>({ rowProps, children }: RowProps<TData>) {
  return <tr {...rowProps}>{children}</tr>
}

export function DataTableCell<TData>({ cellProps, children }: CellProps<TData>) {
  return <td {...cellProps}>{children}</td>
}

/**
 * The detail row rendered underneath an expanded row.
 *
 * It is a sibling `<tr>` rather than a nested table so the column grid stays
 * intact and screen readers still read a well-formed table.
 */
export function DataTableExpandedRow<TData>({
  rowProps,
  colSpan,
  children,
}: ExpandedRowProps<TData>) {
  return (
    <tr {...rowProps}>
      <td role="cell" colSpan={colSpan} className="sui-expanded__cell">
        <div className="sui-expanded__content">{children}</div>
      </td>
    </tr>
  )
}

/** Render a cell's content through the engine, for use inside custom cells. */
export function renderCellContent<TData>(cell: CellProps<TData>['cell']) {
  return flexRender(cell.column.columnDef.cell, cell.getContext())
}

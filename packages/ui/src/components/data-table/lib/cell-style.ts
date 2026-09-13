import type { Column, Table } from '@tanstack/react-table'
import type { CSSProperties } from 'react'
import { columnSizeValue, columnSizeVar, responsiveClass } from './class-names'

/**
 * The `sui-hide-below-*` classes for a column, unless the user has explicitly
 * turned the column on — then it stays on at every width.
 *
 * Responsive hiding is applied as table state once the page is running; the
 * classes are what make the server render and first paint agree with it.
 */
export function responsiveColumnClass<TData>(
  table: Table<TData>,
  column: Column<TData, unknown>,
): string | undefined {
  if (table.getState().columnVisibility[column.id] === true) return undefined
  return responsiveClass(column.columnDef.meta?.responsive)
}

/**
 * Column widths are published as CSS custom properties on the table element and
 * read back by every cell.
 *
 * During a resize drag only this one style object changes; the thousands of
 * cells that reference the variables are untouched, so dragging stays smooth on
 * wide tables (§20, §40).
 */
export function buildColumnSizeVars<TData>(table: Table<TData>): CSSProperties {
  const headers = table.getFlatHeaders()
  const vars: Record<string, string> = {}
  for (const header of headers) {
    vars[columnSizeVar(header.id, 'header')] = String(header.getSize())
    vars[columnSizeVar(header.column.id, 'cell')] = String(header.column.getSize())
  }
  return vars as CSSProperties
}

/**
 * A cell's width, published as a custom property rather than as `width`.
 *
 * An inline `width` cannot be overridden by a stylesheet, which is what forced
 * the card layout to fight it with `!important`. As a variable, the width is
 * still per-cell and still exact, but the one rule that reads it —
 * `.sui-td { width: var(--sui-cell-size) }` — can be overridden normally.
 */
export function sizeStyle(columnId: string, kind: 'header' | 'cell'): CSSProperties {
  return { '--sui-cell-size': columnSizeValue(columnId, kind) } as CSSProperties
}

/**
 * `meta.responsive.priority`: where a cell sits on its card in the card layout.
 *
 * Published as a variable that only the card rules read, so it has no effect
 * on the table layout. Prioritised cells come first, lowest first; the rest
 * follow in declared order.
 */
export function cardOrderStyle(priority: number | undefined): CSSProperties {
  return priority === undefined ? {} : ({ '--sui-card-order': priority } as CSSProperties)
}

/** Sticky offsets for a pinned column, measured from the pinned group's edge. */
export function pinningStyle<TData>(column: Column<TData, unknown>): CSSProperties {
  const pinned = column.getIsPinned()
  if (!pinned) return {}
  return pinned === 'left'
    ? { left: `${column.getStart('left')}px` }
    : { right: `${column.getAfter('right')}px` }
}

/** Classes that make a pinned column stick, plus the edge that casts the shadow. */
export function pinningClasses<TData>(column: Column<TData, unknown>): string | undefined {
  const pinned = column.getIsPinned()
  if (!pinned) return undefined
  const classes = ['sui-pinned', `sui-pinned--${pinned}`]
  if (pinned === 'left' && column.getIsLastColumn('left')) classes.push('sui-pinned--edge')
  if (pinned === 'right' && column.getIsFirstColumn('right')) classes.push('sui-pinned--edge')
  return classes.join(' ')
}

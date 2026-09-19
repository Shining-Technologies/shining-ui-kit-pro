import type { ColumnSizingState } from '../../../core'
import type { Column, Header, Table } from '@tanstack/react-table'
import type { CSSProperties } from 'react'
import { columnPinVar, columnSizeValue, columnSizeVar, responsiveClass } from './class-names'

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

/** The engine's own fallbacks, for a column definition that sets none. */
const ENGINE_SIZE = 150
const ENGINE_MIN_SIZE = 20

/**
 * A column's width under `sizing`, clamped exactly as the engine clamps it.
 *
 * The engine only answers for its current state; a resize in progress needs
 * the same answer for a state that has not been committed yet.
 */
export function columnSizeFor<TData>(
  column: Column<TData, unknown>,
  sizing: ColumnSizingState,
): number {
  const def = column.columnDef
  const size = sizing[column.id] ?? def.size ?? ENGINE_SIZE
  return Math.min(
    Math.max(def.minSize ?? ENGINE_MIN_SIZE, size),
    def.maxSize ?? Number.MAX_SAFE_INTEGER,
  )
}

function headerSizeFor<TData>(header: Header<TData, unknown>, sizing: ColumnSizingState): number {
  if (header.subHeaders.length === 0) return columnSizeFor(header.column, sizing)
  let sum = 0
  for (const sub of header.subHeaders) sum += headerSizeFor(sub, sizing)
  return sum
}

/**
 * Column widths and pinned offsets are published as CSS custom properties on
 * the table element and read back by every cell.
 *
 * During a resize drag the table rewrites these properties directly on the
 * element, without rendering at all, and commits the result to state once, when
 * the drag ends. The thousands of cells that reference the variables are never
 * touched, so dragging stays smooth on wide tables (§20, §40).
 *
 * `sizing` defaults to the table's state; a resize in progress passes the
 * widths it is previewing.
 */
export function buildColumnSizeVars<TData>(
  table: Table<TData>,
  sizing: ColumnSizingState = table.getState().columnSizing,
): CSSProperties {
  const vars: Record<string, string> = {}
  for (const header of table.getFlatHeaders()) {
    vars[columnSizeVar(header.id, 'header')] = String(headerSizeFor(header, sizing))
    vars[columnSizeVar(header.column.id, 'cell')] = String(columnSizeFor(header.column, sizing))
  }

  // Sticky offsets: a left-pinned column sits after the pinned columns before
  // it, a right-pinned one before those after it. A group head takes the
  // offset of its outermost leaf on that side.
  const left = table.getLeftVisibleLeafColumns()
  const right = table.getRightVisibleLeafColumns()
  if (left.length === 0 && right.length === 0) return vars as CSSProperties

  const start = new Map<string, number>()
  let offset = 0
  for (const column of left) {
    start.set(column.id, offset)
    offset += columnSizeFor(column, sizing)
  }
  const after = new Map<string, number>()
  offset = 0
  for (let index = right.length - 1; index >= 0; index -= 1) {
    const column = right[index]!
    after.set(column.id, offset)
    offset += columnSizeFor(column, sizing)
  }

  for (const header of table.getFlatHeaders()) {
    const column = header.column
    const pinned = column.getIsPinned()
    if (!pinned) continue
    const leaves = column.getLeafColumns()
    if (pinned === 'left') {
      const first = leaves.find((leaf) => start.has(leaf.id))
      if (first) vars[columnPinVar(column.id, 'left')] = String(start.get(first.id))
    } else {
      const last = [...leaves].reverse().find((leaf) => after.has(leaf.id))
      if (last) vars[columnPinVar(column.id, 'right')] = String(after.get(last.id))
    }
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

/**
 * Sticky offsets for a pinned column, measured from the pinned group's edge.
 *
 * Like widths, they are read from variables on the table, so resizing a pinned
 * column moves the columns pinned beside it without rendering them.
 */
export function pinningStyle<TData>(column: Column<TData, unknown>): CSSProperties {
  const pinned = column.getIsPinned()
  if (!pinned) return {}
  return pinned === 'left'
    ? { left: `calc(var(${columnPinVar(column.id, 'left')}, 0) * 1px)` }
    : { right: `calc(var(${columnPinVar(column.id, 'right')}, 0) * 1px)` }
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

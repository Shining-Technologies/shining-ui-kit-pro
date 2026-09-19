'use client'

import type { ColumnSizingState } from '../../../core'
import type { Column, Header, Table } from '@tanstack/react-table'
import { ACTIONS_COLUMN_ID, EXPANDER_COLUMN_ID, SELECTION_COLUMN_ID } from '../columns/built-in'
import { buildColumnSizeVars, columnSizeFor } from './cell-style'

/** Injected columns never stretch to fill a gap left by a narrower column. */
const STRUCTURAL_COLUMNS = new Set([SELECTION_COLUMN_ID, EXPANDER_COLUMN_ID, ACTIONS_COLUMN_ID])

/**
 * One resize, from the moment the grip is grabbed to the moment it is let go.
 *
 * `preview` shows a width without committing it; `commit` hands the final
 * widths to the table in one state update; `cancel` puts everything back.
 */
export interface ColumnResizeSession {
  /** The widths the table would have with the column `delta` pixels wider. */
  sizesFor(delta: number): ColumnSizingState
  /** How far the column's edge actually moves for `delta`, after clamping. */
  appliedDelta(delta: number): number
  /** Show `delta` on screen, writing variables on the `<table>` only. */
  preview(delta: number): void
  /** Commit `delta` to `columnSizing` and drop the preview. */
  commit(delta: number): void
  /** Drop the preview and leave the state as it was. */
  cancel(): void
}

function clampTo<TData>(column: Column<TData, unknown>, size: number): number {
  const def = column.columnDef
  return Math.round(
    Math.min(Math.max(size, def.minSize ?? 20), def.maxSize ?? Number.MAX_SAFE_INTEGER),
  )
}

/** The leaf columns under a header that are currently shown. */
function visibleLeaves<TData>(header: Header<TData, unknown>): Column<TData, unknown>[] {
  return header.column.getLeafColumns().filter((column) => column.getIsVisible())
}

/**
 * Where a table stands before the resize.
 *
 * A fixed-layout table narrower than its frame is stretched by the browser,
 * which shares the spare width among every column. While that is happening a
 * column's declared width is not the width on screen, and changing one moves
 * all of them: the grip drifts away from the pointer. So the widths on screen
 * are measured and taken as the starting point, and the spare width is handed
 * to one column — the last ordinary one — instead of to all of them.
 */
function measure<TData>(table: Table<TData>, element: HTMLTableElement | null) {
  const sizing = table.getState().columnSizing
  const empty = { base: sizing, fill: 0, shown: [] as Column<TData, unknown>[] }
  if (!element || typeof window === 'undefined') return empty
  if (window.getComputedStyle(element).tableLayout !== 'fixed') return empty

  // Columns hidden by a responsive class are in the model but not on screen:
  // they have no cell to measure and take no width.
  const rendered = new Map<string, number>()
  for (const cell of element.querySelectorAll<HTMLElement>('thead th[data-column-id]')) {
    const width = cell.getBoundingClientRect().width
    if (width > 0) rendered.set(cell.dataset.columnId!, width)
  }
  const shown = table.getVisibleLeafColumns().filter((column) => rendered.has(column.id))
  if (shown.length === 0) return empty

  const frame = element.parentElement
  let fill = 0
  if (frame) {
    const style = window.getComputedStyle(frame)
    fill =
      frame.clientWidth -
      (Number.parseFloat(style.paddingLeft) || 0) -
      (Number.parseFloat(style.paddingRight) || 0)
  }

  const declared = shown.reduce((sum, column) => sum + columnSizeFor(column, sizing), 0)
  const stretched = element.getBoundingClientRect().width > declared + 1
  if (!stretched) return { base: sizing, fill, shown }

  const base: ColumnSizingState = { ...sizing }
  for (const column of shown) base[column.id] = clampTo(column, rendered.get(column.id)!)
  return { base, fill, shown }
}

/**
 * Start resizing `header`.
 *
 * `element` is the `<table>` the header belongs to. Without it — a table that
 * is not in the document, or a test environment with no layout — the resize
 * still works; it just cannot measure a stretched table or preview a drag.
 */
export function beginColumnResize<TData>(
  table: Table<TData>,
  header: Header<TData, unknown>,
  element: HTMLTableElement | null,
): ColumnResizeSession {
  const { base, fill, shown } = measure(table, element)
  const leaves = visibleLeaves(header)
  const leafIds = new Set(leaves.map((column) => column.id))
  const startSizes = leaves.map((column) => columnSizeFor(column, base))
  const startTotal = startSizes.reduce((sum, size) => sum + size, 0)

  // The column that takes up the spare width when a resize leaves the table
  // narrower than its frame: the last shown, unpinned data column that is not
  // being resized. Without one the browser stretches every column as before.
  const absorber = [...shown]
    .reverse()
    .find(
      (column) =>
        !leafIds.has(column.id) && !column.getIsPinned() && !STRUCTURAL_COLUMNS.has(column.id),
    )

  const sizesFor = (delta: number): ColumnSizingState => {
    const next: ColumnSizingState = { ...base }
    if (startTotal <= 0) return next
    // A group head shares the change among its columns in proportion to their
    // widths, as the engine does.
    const scale = Math.max(startTotal + delta, 0) / startTotal
    leaves.forEach((column, index) => {
      next[column.id] = clampTo(column, startSizes[index]! * scale)
    })

    if (absorber && fill > 0) {
      const total = shown.reduce((sum, column) => sum + columnSizeFor(column, next), 0)
      const spare = fill - total
      if (spare > 0) {
        next[absorber.id] = clampTo(absorber, columnSizeFor(absorber, base) + spare)
      }
    }
    return next
  }

  const appliedDelta = (delta: number) => {
    const next = sizesFor(delta)
    return leaves.reduce((sum, column) => sum + columnSizeFor(column, next), 0) - startTotal
  }

  // Values the preview overwrote, so they can be put back exactly.
  const touched = new Map<string, string>()
  const restore = () => {
    if (!element) return
    for (const [name, value] of touched) {
      if (value) element.style.setProperty(name, value)
      else element.style.removeProperty(name)
    }
    touched.clear()
  }

  return {
    sizesFor,
    appliedDelta,
    preview(delta) {
      if (!element) return
      const vars = buildColumnSizeVars(table, sizesFor(delta)) as Record<string, string>
      for (const [name, value] of Object.entries(vars)) {
        if (!touched.has(name)) touched.set(name, element.style.getPropertyValue(name))
        element.style.setProperty(name, value)
      }
    },
    commit(delta) {
      // The preview is dropped before the state changes, in the same task, so
      // the next paint shows the committed widths — or, when a controlled
      // parent declines them, the widths it kept — never a stale preview.
      restore()
      const next = sizesFor(delta)
      const current = table.getState().columnSizing
      const changed =
        Object.keys(next).length !== Object.keys(current).length ||
        Object.keys(next).some((id) => next[id] !== current[id])
      if (changed) table.setColumnSizing(next)
    },
    cancel: restore,
  }
}

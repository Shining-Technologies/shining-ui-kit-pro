'use client'

import type { Header, Table } from '@tanstack/react-table'
import type { KeyboardEvent, PointerEvent } from 'react'
import { cn } from '../../../lib/cn'
import { beginColumnResize } from '../lib/column-resize'

export interface ColumnResizerProps<TData> {
  header: Header<TData, unknown>
  table: Table<TData>
  /** The column's plain-text label, for the grip's accessible name. */
  label: string
  className?: string
}

/**
 * The resize grip on a header cell.
 *
 * A drag never renders the table. The grip captures the pointer, and on each
 * animation frame rewrites the width variables on the `<table>` (§20); the new
 * widths reach `columnSizing` once, when the grip is let go. Escape during a
 * drag puts the column back. `features.resizing.mode: 'onEnd'` moves only the
 * grip's guide line during the drag and reflows the table on release.
 *
 * Exported for custom `HeaderCell` components, which get the same behaviour by
 * rendering `<DataTableColumnResizer header={header} table={table} label="…" />`.
 */
export function DataTableColumnResizer<TData>({
  header,
  table,
  label,
  className,
}: ColumnResizerProps<TData>) {
  const column = header.column
  // A focusable separator is a widget, and ARIA requires it to report its
  // value — here, the column's width. A group head spans several leaves, so it
  // has no single min or max of its own.
  const size = header.getSize()
  const isLeaf = header.subHeaders.length === 0

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    // No text selection, no focus ring, no sort.
    event.preventDefault()
    event.stopPropagation()

    const grip = event.currentTarget
    const element = grip.closest('table')
    const session = beginColumnResize(table, header, element)
    const live = table.options.columnResizeMode !== 'onEnd'
    const direction =
      element && window.getComputedStyle(element).direction === 'rtl' ? -1 : 1
    const startX = event.clientX
    const pointerId = event.pointerId
    let delta = 0
    let frame = 0

    const root = document.documentElement
    const previousCursor = root.style.cursor
    const previousSelect = root.style.userSelect
    root.style.cursor = 'col-resize'
    root.style.userSelect = 'none'
    grip.dataset.resizing = 'true'
    element?.setAttribute('data-resizing', '')
    try {
      grip.setPointerCapture(pointerId)
    } catch {
      // A pointer that is already gone cannot be captured; the listeners on
      // the grip still see the rest of the gesture in most browsers.
    }

    const render = () => {
      frame = 0
      if (live) session.preview(delta)
      else grip.style.setProperty('--sui-resize-offset', `${session.appliedDelta(delta) * direction}px`)
    }

    const onMove = (move: globalThis.PointerEvent) => {
      if (move.pointerId !== pointerId) return
      delta = (move.clientX - startX) * direction
      if (!frame) frame = window.requestAnimationFrame(render)
    }

    const finish = (commit: boolean) => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      grip.removeEventListener('pointermove', onMove)
      grip.removeEventListener('pointerup', onUp)
      grip.removeEventListener('pointercancel', onCancel)
      grip.removeEventListener('lostpointercapture', onLost)
      window.removeEventListener('keydown', onKey, true)
      try {
        if (grip.hasPointerCapture(pointerId)) grip.releasePointerCapture(pointerId)
      } catch {
        // Already released.
      }
      root.style.cursor = previousCursor
      root.style.userSelect = previousSelect
      delete grip.dataset.resizing
      grip.style.removeProperty('--sui-resize-offset')
      element?.removeAttribute('data-resizing')
      // A click without movement — half of a double-click — changes nothing.
      if (commit && delta !== 0) session.commit(delta)
      else session.cancel()
    }

    const onUp = (up: globalThis.PointerEvent) => {
      if (up.pointerId !== pointerId) return
      delta = (up.clientX - startX) * direction
      finish(true)
    }
    const onCancel = () => finish(false)
    // A capture lost to something else (the window losing focus, an alert)
    // ends the drag where it is, as a release would.
    const onLost = () => finish(true)
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape') return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }

    grip.addEventListener('pointermove', onMove)
    grip.addEventListener('pointerup', onUp)
    grip.addEventListener('pointercancel', onCancel)
    grip.addEventListener('lostpointercapture', onLost)
    window.addEventListener('keydown', onKey, true)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    // Keyboard resizing: arrows nudge, Enter or Backspace resets.
    if (event.key === 'Enter' || event.key === 'Backspace') {
      event.preventDefault()
      column.resetSize()
      return
    }
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (step === 0) return
    event.preventDefault()
    const session = beginColumnResize(table, header, event.currentTarget.closest('table'))
    session.commit((event.shiftKey ? 32 : 8) * step)
  }

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label}`}
      aria-valuenow={size}
      aria-valuemin={isLeaf ? column.columnDef.minSize : undefined}
      aria-valuemax={isLeaf ? column.columnDef.maxSize : undefined}
      aria-valuetext={`${size} pixels`}
      tabIndex={0}
      className={cn('sui-resizer', className)}
      onPointerDown={onPointerDown}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation()
        column.resetSize()
      }}
      onKeyDown={onKeyDown}
    />
  )
}

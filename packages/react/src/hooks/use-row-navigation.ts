import { useCallback, useState } from 'react'

export interface RowNavigation {
  /** Whether rows participate in keyboard navigation at all. */
  enabled: boolean
  /** Index of the row that currently owns the single tab stop. */
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  /**
   * Move DOM focus to another row, relative to the row the event came from.
   * Clamped to the rows that actually exist.
   */
  focusRow: (index: number, origin: HTMLElement) => void
  /** `0` for the row holding the tab stop, `-1` for the rest. */
  tabIndexFor: (index: number, rowCount: number) => number | undefined
}

/**
 * Roving tabindex over rows.
 *
 * A table with 100 interactive rows must not create 100 tab stops, so exactly
 * one row is tabbable and the arrow keys move that tab stop — the pattern the
 * ARIA authoring practices prescribe (§39).
 *
 * Sibling rows are found by walking the DOM from the row that received the key,
 * rather than through a ref or a registry. That means a completely custom `Row`
 * component takes part automatically, as long as it spreads `rowProps` (which
 * carries the `data-sui-row` marker).
 */
export function useRowNavigation(enabled: boolean): RowNavigation {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const focusRow = useCallback((index: number, origin: HTMLElement) => {
    const scope = origin.closest('table') ?? origin.parentElement
    if (!scope) return
    const rows = scope.querySelectorAll<HTMLElement>('[data-sui-row]')
    if (rows.length === 0) return
    const target = rows[Math.max(0, Math.min(index, rows.length - 1))]
    if (!target) return
    target.focus()
  }, [])

  const tabIndexFor = useCallback(
    (index: number, rowCount: number) => {
      if (!enabled) return undefined
      // The focused row can vanish when filtering or paging; fall back to the last.
      const anchor = Math.max(0, Math.min(focusedIndex, rowCount - 1))
      return index === anchor ? 0 : -1
    },
    [enabled, focusedIndex],
  )

  return { enabled, focusedIndex, setFocusedIndex, focusRow, tabIndexFor }
}

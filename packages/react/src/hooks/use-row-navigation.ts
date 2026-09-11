import { useCallback, useState } from 'react'

export interface RowNavigation {
  /** Whether rows participate in keyboard navigation at all. */
  enabled: boolean
  /** Index of the row that currently owns the single tab stop. */
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  /**
   * Move DOM focus to another row, relative to the row the event came from.
   * Clamped to the rows that actually exist. A row that cannot take focus — a
   * disabled one — is passed over in `direction`, the way the key points.
   */
  focusRow: (index: number, origin: HTMLElement, direction?: 1 | -1) => void
  /** `0` for the row holding the tab stop, `-1` for the rest. */
  tabIndexFor: (index: number, rowCount: number) => number | undefined
  /**
   * The index of the row that holds the tab stop among rows `first`…`last`,
   * or `-1` when none of them can take focus. The focused row when it can,
   * otherwise the nearest one that can: a disabled row, or one a virtualized
   * body has scrolled out of the DOM, must not take the table's only tab stop
   * with it.
   */
  resolveTabStop: (canFocus: (index: number) => boolean, first: number, last: number) => number
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

  const focusRow = useCallback((index: number, origin: HTMLElement, direction: 1 | -1 = 1) => {
    const scope = origin.closest('table') ?? origin.parentElement
    if (!scope) return
    // Only this table's rows: a table rendered inside an expanded detail row
    // carries the same marker.
    const rows = Array.from(scope.querySelectorAll<HTMLElement>('[data-sui-row]')).filter(
      (row) => (row.closest('table') ?? row.parentElement) === scope,
    )
    const first = rows[0]
    if (!first) return
    // Rows are matched by their index, not their position in the DOM: a
    // virtualized body renders a window of rows that does not start at 0.
    // When the target is outside that window, the nearest rendered row wins.
    let position =
      first.dataset.index === undefined
        ? Math.max(0, Math.min(index, rows.length - 1))
        : rows.findIndex((row) => Number(row.dataset.index) === index)
    if (position === -1) position = index < Number(first.dataset.index) ? 0 : rows.length - 1
    // A disabled row has no tab index and cannot take focus; stepping onto one
    // used to strand focus above it. Keep going until a row can, or stay put.
    while (rows[position] && !rows[position]!.hasAttribute('tabindex')) position += direction
    rows[position]?.focus()
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

  const resolveTabStop = useCallback(
    (canFocus: (index: number) => boolean, first: number, last: number) => {
      if (!enabled || last < first) return -1
      // The focused row can vanish when filtering or paging; the nearest wins.
      const anchor = Math.max(first, Math.min(focusedIndex, last))
      for (let distance = 0; distance <= last - first; distance++) {
        if (anchor + distance <= last && canFocus(anchor + distance)) return anchor + distance
        if (distance > 0 && anchor - distance >= first && canFocus(anchor - distance)) {
          return anchor - distance
        }
      }
      return -1
    },
    [enabled, focusedIndex],
  )

  return { enabled, focusedIndex, setFocusedIndex, focusRow, tabIndexFor, resolveTabStop }
}

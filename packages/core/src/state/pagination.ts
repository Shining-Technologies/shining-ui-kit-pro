/** Pure pagination arithmetic. No React, no engine — trivially testable. */

export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

export interface PageRange {
  /** 1-based index of the first row on the page. `0` when there are no rows. */
  from: number
  /** 1-based index of the last row on the page. */
  to: number
  total: number
}

/** The "Showing 21–40 of 1,240" numbers. */
export function getPageRange(pageIndex: number, pageSize: number, total: number): PageRange {
  if (total <= 0 || pageSize <= 0) return { from: 0, to: 0, total: Math.max(total, 0) }
  const from = pageIndex * pageSize + 1
  if (from > total) return { from: 0, to: 0, total }
  return { from, to: Math.min(from + pageSize - 1, total), total }
}

/**
 * Build the page-button list, collapsing long runs into ellipses.
 *
 * Returns zero-based page indices, matching the engine's `pageIndex`.
 *
 * ```
 * getPageNumbers(30, 62, 1) -> [0, 'ellipsis-start', 29, 30, 31, 'ellipsis-end', 61]
 * ```
 */
export function getPageNumbers(pageIndex: number, pageCount: number, siblingCount = 1): PageItem[] {
  if (pageCount <= 0) return []
  const siblings = Math.max(0, siblingCount)
  // first + last + current + 2 ellipses + siblings on both sides
  const maxSlots = siblings * 2 + 5

  if (pageCount <= maxSlots) return range(0, pageCount - 1)

  const current = clamp(pageIndex, 0, pageCount - 1)
  const left = Math.max(current - siblings, 0)
  const right = Math.min(current + siblings, pageCount - 1)

  const showLeftEllipsis = left > 1
  const showRightEllipsis = right < pageCount - 2

  // One ellipsis plus the far-edge page consume two slots; the rest is a solid run.
  const runLength = Math.max(maxSlots - 2, 1)

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(0, runLength - 1), 'ellipsis-end', pageCount - 1]
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [0, 'ellipsis-start', ...range(pageCount - runLength, pageCount - 1)]
  }
  return [0, 'ellipsis-start', ...range(left, right), 'ellipsis-end', pageCount - 1]
}

/** Total pages for a row count, never below 1 so the UI always has a page. */
export function getPageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(Math.max(total, 0) / pageSize))
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

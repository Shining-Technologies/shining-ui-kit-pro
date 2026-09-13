import { describe, expect, it } from 'vitest'
import {
  clampPageIndex,
  getPageCount,
  getPageNumbers,
  getPageRange,
  getSelectedRowIds,
  getSelectionStatus,
  paginateRows,
  setRowSelected,
  setRowsSelected,
  toggleRowSelected,
} from '..'

describe('getPageRange', () => {
  it('reports the 1-based window shown to the user', () => {
    expect(getPageRange(1, 20, 1240)).toEqual({ from: 21, to: 40, total: 1240 })
  })

  it('clamps the last page to the row count', () => {
    expect(getPageRange(6, 20, 125)).toEqual({ from: 121, to: 125, total: 125 })
  })

  it('collapses to zero when there is nothing to show', () => {
    expect(getPageRange(0, 20, 0)).toEqual({ from: 0, to: 0, total: 0 })
    expect(getPageRange(10, 20, 5)).toEqual({ from: 0, to: 0, total: 5 })
  })
})

describe('getPageNumbers', () => {
  it('lists every page while they fit', () => {
    expect(getPageNumbers(0, 5, 1)).toEqual([0, 1, 2, 3, 4])
  })

  it('ellipsises the tail near the start and the head near the end', () => {
    expect(getPageNumbers(0, 62, 1)).toEqual([0, 1, 2, 3, 4, 'ellipsis-end', 61])
    expect(getPageNumbers(61, 62, 1)).toEqual([0, 'ellipsis-start', 57, 58, 59, 60, 61])
  })

  it('ellipsises both sides in the middle and honours the sibling count', () => {
    expect(getPageNumbers(30, 62, 1)).toEqual([0, 'ellipsis-start', 29, 30, 31, 'ellipsis-end', 61])
    expect(getPageNumbers(30, 62, 2)).toEqual([0, 'ellipsis-start', 28, 29, 30, 31, 32, 'ellipsis-end', 61])
  })

  it('survives out-of-range and empty inputs', () => {
    expect(getPageNumbers(999, 3, 1)).toEqual([0, 1, 2])
    expect(getPageNumbers(0, 0, 1)).toEqual([])
  })
})

describe('page count, clamping and slicing', () => {
  it('rounds up and never returns zero pages', () => {
    expect(getPageCount(101, 20)).toBe(6)
    expect(getPageCount(0, 20)).toBe(1)
    expect(getPageCount(50, 0)).toBe(1)
  })

  it('clamps untrusted page indices', () => {
    expect(clampPageIndex(9, 3)).toBe(2)
    expect(clampPageIndex(-4, 3)).toBe(0)
    expect(clampPageIndex(Number.NaN, 3)).toBe(0)
    expect(clampPageIndex(1.7, 3)).toBe(1)
  })

  it('slices one page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => i)
    expect(paginateRows(rows, { pageIndex: 2, pageSize: 10 })).toEqual([20, 21, 22, 23, 24])
    expect(paginateRows(rows, { pageIndex: 9, pageSize: 10 })).toEqual([])
  })
})

describe('selection helpers', () => {
  it('selects, deselects and toggles immutably', () => {
    const start = { a: true }
    const next = setRowSelected(start, 'b', true)
    expect(next).toEqual({ a: true, b: true })
    expect(start).toEqual({ a: true })
    expect(setRowSelected(next, 'a', false)).toEqual({ b: true })
    expect(toggleRowSelected({}, 'x')).toEqual({ x: true })
  })

  it('keeps one row in single mode', () => {
    expect(setRowSelected({ a: true, b: true }, 'c', true, 'single')).toEqual({ c: true })
  })

  it('selects a page and reports the header checkbox state', () => {
    const selection = setRowsSelected({}, ['1', '2'], true)
    expect(getSelectedRowIds(selection)).toEqual(['1', '2'])
    expect(getSelectionStatus(selection, ['1', '2'])).toBe('all')
    expect(getSelectionStatus(selection, ['1', '2', '3'])).toBe('some')
    expect(getSelectionStatus({}, ['1'])).toBe('none')
    expect(getSelectedRowIds({ a: false, b: true })).toEqual(['b'])
  })
})

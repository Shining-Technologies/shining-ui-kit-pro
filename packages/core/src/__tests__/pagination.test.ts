import { describe, expect, it } from 'vitest'
import { getPageCount, getPageNumbers, getPageRange } from '../state/pagination'

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

  it('ellipsises the tail near the start', () => {
    expect(getPageNumbers(0, 62, 1)).toEqual([0, 1, 2, 3, 4, 'ellipsis-end', 61])
  })

  it('ellipsises the head near the end', () => {
    expect(getPageNumbers(61, 62, 1)).toEqual([0, 'ellipsis-start', 57, 58, 59, 60, 61])
  })

  it('ellipsises both sides in the middle', () => {
    expect(getPageNumbers(30, 62, 1)).toEqual([0, 'ellipsis-start', 29, 30, 31, 'ellipsis-end', 61])
  })

  it('honours the sibling count', () => {
    expect(getPageNumbers(30, 62, 2)).toEqual([
      0,
      'ellipsis-start',
      28,
      29,
      30,
      31,
      32,
      'ellipsis-end',
      61,
    ])
  })

  it('survives out-of-range and empty inputs', () => {
    expect(getPageNumbers(999, 3, 1)).toEqual([0, 1, 2])
    expect(getPageNumbers(0, 0, 1)).toEqual([])
  })
})

describe('getPageCount', () => {
  it('rounds up and never returns zero', () => {
    expect(getPageCount(101, 20)).toBe(6)
    expect(getPageCount(0, 20)).toBe(1)
    expect(getPageCount(50, 0)).toBe(1)
  })
})

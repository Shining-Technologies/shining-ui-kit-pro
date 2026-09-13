import { describe, expect, it } from 'vitest'
import {
  createColumnFilterFn,
  datePredicate,
  getActiveFilters,
  getOperators,
  globalFilterFn,
  isFilterActive,
  matchesFilter,
  multiSelectPredicate,
  normalizeFilterValue,
  numberPredicate,
  selectPredicate,
  textPredicate,
  toCalendarDate,
} from '..'

const row = (value: unknown) => ({ getValue: () => value })

describe('text predicate', () => {
  it.each([
    ['contains', 'John Smith', 'smith', true],
    ['contains', 'John Smith', 'zzz', false],
    ['notContains', 'John Smith', 'zzz', true],
    ['equals', 'Active', 'active', true],
    ['notEquals', 'Active', 'active', false],
    ['startsWith', 'John Smith', 'joh', true],
    ['endsWith', 'John Smith', 'ith', true],
    ['endsWith', 'John Smith', 'joh', false],
  ] as const)('%s(%s, %s) === %s', (op, value, needle, expected) => {
    expect(textPredicate(value, op, needle)).toBe(expected)
  })

  it('ignores diacritics and case', () => {
    expect(textPredicate('Renée Fabergé', 'contains', 'renee')).toBe(true)
  })

  it('treats a blank needle as "no filter"', () => {
    expect(textPredicate('anything', 'contains', '   ')).toBe(true)
  })

  it('handles emptiness operators', () => {
    expect(textPredicate('', 'isEmpty', null)).toBe(true)
    expect(textPredicate('x', 'isEmpty', null)).toBe(false)
    expect(textPredicate('x', 'isNotEmpty', null)).toBe(true)
  })
})

describe('number predicate', () => {
  it.each([
    ['equals', 10, 10, true],
    ['notEquals', 10, 10, false],
    ['greaterThan', 10, 5, true],
    ['greaterThanOrEqual', 10, 10, true],
    ['lessThan', 10, 20, true],
    ['lessThanOrEqual', 10, 9, false],
  ] as const)('%s(%s, %s) === %s', (op, value, target, expected) => {
    expect(numberPredicate(value, op, target)).toBe(expected)
  })

  it('supports between with tuples, objects and open ends', () => {
    expect(numberPredicate(15, 'between', [10, 20])).toBe(true)
    expect(numberPredicate(25, 'between', [10, 20])).toBe(false)
    expect(numberPredicate(25, 'between', [10, null])).toBe(true)
    expect(numberPredicate(5, 'between', [null, 10])).toBe(true)
    expect(numberPredicate(5, 'between', [null, null])).toBe(true)
    expect(numberPredicate(15, 'between', { min: 10, max: 20 })).toBe(true)
  })

  it('reads a reversed range the way the user meant it', () => {
    expect(numberPredicate(15, 'between', [20, 10])).toBe(true)
  })

  it('parses numeric strings, which is what a URL or an input produces', () => {
    expect(numberPredicate('42', 'equals', 42)).toBe(true)
    expect(numberPredicate(42, 'between', ['40', '50'])).toBe(true)
  })
})

describe('date predicate', () => {
  it('matches the whole day for "on"', () => {
    expect(datePredicate('2024-01-15T13:45:00Z', 'on', '2024-01-15', { timeZone: 'UTC' })).toBe(true)
    expect(datePredicate('2024-01-15T13:45:00Z', 'on', '2024-01-16', { timeZone: 'UTC' })).toBe(false)
  })

  it('compares by day for before/after', () => {
    const value = '2024-01-15T13:45:00Z'
    const utc = { timeZone: 'UTC' }
    expect(datePredicate(value, 'before', '2024-01-16', utc)).toBe(true)
    expect(datePredicate(value, 'before', '2024-01-15', utc)).toBe(false)
    expect(datePredicate(value, 'after', '2024-01-14', utc)).toBe(true)
    expect(datePredicate(value, 'after', '2024-01-15', utc)).toBe(false)
  })

  it('treats both ends of a range as inclusive', () => {
    const utc = { timeZone: 'UTC' }
    expect(datePredicate('2024-01-15T23:59:59Z', 'between', ['2024-01-15', '2024-01-15'], utc)).toBe(true)
    expect(datePredicate('2024-01-15T00:00:00Z', 'between', ['2024-01-01', '2024-01-14'], utc)).toBe(false)
  })

  /*
   * The V1 bug: the day a timestamp belongs to was decided in whatever zone
   * the code ran in, so a UTC server and a Sydney browser disagreed.
   */
  it('decides the day in the zone it is given, identically on every runtime', () => {
    const placed = '2024-03-05T20:00:00Z' // 7am on the 6th in Sydney
    expect(datePredicate(placed, 'on', '2024-03-06', { timeZone: 'Australia/Sydney' })).toBe(true)
    expect(datePredicate(placed, 'on', '2024-03-05', { timeZone: 'Australia/Sydney' })).toBe(false)
    expect(datePredicate(placed, 'on', '2024-03-05', { timeZone: 'UTC' })).toBe(true)
    expect(datePredicate(placed, 'on', '2024-03-05', { timeZone: 'America/Los_Angeles' })).toBe(true)
  })

  it('keeps a calendar date on its own day in every zone', () => {
    for (const timeZone of ['UTC', 'Australia/Sydney', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      expect(datePredicate('2024-03-05', 'on', '2024-03-05', { timeZone })).toBe(true)
    }
  })

  /*
   * The other V1 bug: "end of day" was midnight + 24h, which is an hour short
   * on the 25-hour day daylight saving ends (Sydney, 7 April 2024).
   */
  it('includes the last hour of a daylight-saving day', () => {
    const lateOnDstDay = '2024-04-07T13:30:00Z' // 23:30 in Sydney, after clocks went back
    expect(
      datePredicate(lateOnDstDay, 'between', ['2024-04-01', '2024-04-07'], {
        timeZone: 'Australia/Sydney',
      }),
    ).toBe(true)
    expect(datePredicate(lateOnDstDay, 'on', '2024-04-07', { timeZone: 'Australia/Sydney' })).toBe(true)
  })

  it('accepts Date objects and epoch milliseconds', () => {
    const time = Date.UTC(2024, 0, 15, 12)
    expect(datePredicate(new Date(time), 'on', '2024-01-15', { timeZone: 'UTC' })).toBe(true)
    expect(datePredicate(time, 'on', '2024-01-15', { timeZone: 'UTC' })).toBe(true)
  })

  it('never matches rows without a usable date, and ignores an unusable filter', () => {
    expect(datePredicate(null, 'on', '2024-01-15')).toBe(false)
    expect(datePredicate('not a date', 'on', '2024-01-15')).toBe(false)
    expect(datePredicate('2024-01-15', 'on', '2024-02-30')).toBe(true)
  })

  it('rejects an invalid time zone loudly', () => {
    expect(() => toCalendarDate('2024-01-15T00:00:00Z', 'Mars/Olympus')).toThrow(/time zone/)
  })
})

describe('select and multiSelect predicates', () => {
  it('compares select values loosely by text', () => {
    expect(selectPredicate('active', 'equals', 'active')).toBe(true)
    expect(selectPredicate('active', 'notEquals', 'active')).toBe(false)
    expect(selectPredicate(1, 'equals', '1')).toBe(true)
  })

  it('matches multiSelect against scalar and array row values', () => {
    expect(multiSelectPredicate('admin', 'includes', ['admin', 'owner'])).toBe(true)
    expect(multiSelectPredicate(['viewer'], 'includes', ['admin'])).toBe(false)
    expect(multiSelectPredicate(['viewer'], 'notIncludes', ['admin'])).toBe(true)
    expect(multiSelectPredicate('admin', 'includes', [])).toBe(true)
  })
})

describe('normalization and activity', () => {
  it('pairs a bare value with the type default operator', () => {
    expect(normalizeFilterValue('john', 'text')).toEqual({ operator: 'contains', value: 'john' })
  })

  it('passes structured values through untouched', () => {
    const value = { operator: 'endsWith', value: 'x' } as const
    expect(normalizeFilterValue(value, 'text')).toBe(value)
  })

  it('reports whether a filter would narrow anything', () => {
    expect(isFilterActive('', 'text')).toBe(false)
    expect(isFilterActive(undefined, 'boolean')).toBe(false)
    expect(isFilterActive('a', 'text')).toBe(true)
    expect(isFilterActive({ operator: 'isEmpty', value: null }, 'text')).toBe(true)
    expect(isFilterActive({ operator: 'contains', value: undefined }, 'text')).toBe(false)
    expect(isFilterActive({ operator: 'between', value: [null, null] }, 'number')).toBe(false)
    expect(isFilterActive({ operator: 'between', value: [1, null] }, 'number')).toBe(true)
    expect(isFilterActive({ operator: 'isFalse', value: undefined }, 'boolean')).toBe(true)
    expect(isFilterActive([], 'multiSelect')).toBe(false)
  })

  /* The V1 panel counted this entry as "1 active" while nothing was filtered. */
  it('drops filters whose value was cleared', () => {
    const filters = [
      { id: 'name', value: { operator: 'contains', value: undefined } },
      { id: 'age', value: { operator: 'greaterThan', value: 30 } },
    ]
    const configs = new Map([
      ['name', { type: 'text' as const }],
      ['age', { type: 'number' as const }],
    ])
    expect(getActiveFilters(filters, configs).map((f) => f.id)).toEqual(['age'])
    expect(getActiveFilters(filters, { name: { type: 'text' }, age: { type: 'number' } })).toHaveLength(1)
  })
})

describe('engine integration', () => {
  it('builds a filter fn that short-circuits inactive filters', () => {
    const fn = createColumnFilterFn({ type: 'text' })
    expect(fn(row('anything'), 'name', '')).toBe(true)
    expect(fn(row('Jane'), 'name', 'jan')).toBe(true)
    expect(fn(row('Jane'), 'name', 'zzz')).toBe(false)
  })

  it('passes the time zone through to date filters', () => {
    const fn = createColumnFilterFn({ type: 'date' }, { timeZone: 'Australia/Sydney' })
    expect(fn(row('2024-03-05T20:00:00Z'), 'placed', '2024-03-06')).toBe(true)
  })

  it('prefers a custom predicate over the built-ins', () => {
    const fn = createColumnFilterFn({ type: 'text', predicate: () => false })
    expect(fn(row('Jane'), 'name', 'jane')).toBe(false)
  })

  it('searches globally without case or accent sensitivity', () => {
    expect(globalFilterFn(row('Renée'), 'name', 'renee')).toBe(true)
    expect(globalFilterFn(row('Renée'), 'name', '  ')).toBe(true)
    expect(globalFilterFn(row(null), 'name', 'x')).toBe(false)
  })

  it('dispatches by filter type', () => {
    expect(matchesFilter(true, 'boolean', { operator: 'isTrue', value: null })).toBe(true)
    expect(matchesFilter(false, 'boolean', { operator: 'isTrue', value: null })).toBe(false)
  })

  it('restricts the operator list when a column asks it to', () => {
    expect(getOperators('text', ['contains', 'equals']).map((o) => o.operator)).toEqual([
      'contains',
      'equals',
    ])
    expect(getOperators('text')).toHaveLength(8)
  })
})

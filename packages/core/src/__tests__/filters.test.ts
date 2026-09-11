import { describe, expect, it } from 'vitest'
import {
  createColumnFilterFn,
  datePredicate,
  getOperators,
  globalFilterFn,
  isFilterActive,
  matchesFilter,
  multiSelectPredicate,
  normalizeFilterValue,
  numberPredicate,
  selectPredicate,
  textPredicate,
} from '../filters'

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

  it('supports between with tuples and with open ends', () => {
    expect(numberPredicate(15, 'between', [10, 20])).toBe(true)
    expect(numberPredicate(25, 'between', [10, 20])).toBe(false)
    expect(numberPredicate(25, 'between', [10, null])).toBe(true)
    expect(numberPredicate(5, 'between', [null, 10])).toBe(true)
    expect(numberPredicate(5, 'between', [null, null])).toBe(true)
  })

  it('parses numeric strings', () => {
    expect(numberPredicate('42', 'equals', 42)).toBe(true)
  })
})

describe('date predicate', () => {
  const jan15 = new Date('2024-01-15T13:45:00')

  it('matches the whole day for "on"', () => {
    expect(datePredicate(jan15, 'on', '2024-01-15')).toBe(true)
    expect(datePredicate(jan15, 'on', '2024-01-16')).toBe(false)
  })

  it('compares by day boundary for before/after', () => {
    expect(datePredicate(jan15, 'before', '2024-01-16')).toBe(true)
    expect(datePredicate(jan15, 'before', '2024-01-15')).toBe(false)
    expect(datePredicate(jan15, 'after', '2024-01-14')).toBe(true)
    expect(datePredicate(jan15, 'after', '2024-01-15')).toBe(false)
  })

  it('treats the end of a range as inclusive', () => {
    expect(datePredicate(jan15, 'between', ['2024-01-15', '2024-01-15'])).toBe(true)
    expect(datePredicate(jan15, 'between', ['2024-01-01', '2024-01-14'])).toBe(false)
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

describe('normalization', () => {
  it('pairs a bare value with the type default operator', () => {
    expect(normalizeFilterValue('john', 'text')).toEqual({ operator: 'contains', value: 'john' })
  })

  it('passes structured values through untouched', () => {
    const value = { operator: 'endsWith', value: 'x' } as const
    expect(normalizeFilterValue(value, 'text')).toBe(value)
  })

  it('reports whether a filter would narrow anything', () => {
    expect(isFilterActive('', 'text')).toBe(false)
    expect(isFilterActive('a', 'text')).toBe(true)
    expect(isFilterActive({ operator: 'isEmpty', value: null }, 'text')).toBe(true)
    expect(isFilterActive({ operator: 'between', value: [null, null] }, 'number')).toBe(false)
    expect(isFilterActive({ operator: 'between', value: [1, null] }, 'number')).toBe(true)
    expect(isFilterActive([], 'multiSelect')).toBe(false)
  })
})

describe('engine integration', () => {
  it('builds a filter fn that short-circuits inactive filters', () => {
    const fn = createColumnFilterFn({ type: 'text' })
    expect(fn(row('anything'), 'name', '')).toBe(true)
    expect(fn(row('Jane'), 'name', 'jan')).toBe(true)
    expect(fn(row('Jane'), 'name', 'zzz')).toBe(false)
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

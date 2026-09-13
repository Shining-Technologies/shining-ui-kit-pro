/*
 * Regression tests for the 2.0.0-rc.0 core fixes: unreadable sort values,
 * boolean bare values, select filters with unusable values, URL operator
 * validation and round trips, the shared search rule, and trimmed text filters.
 */
import { describe, expect, it } from 'vitest'
import {
  applyQuery,
  compareDate,
  compareNumber,
  compareText,
  getSortEmptyCheck,
  matchesColumnFilter,
  matchesSearchValue,
  multiSelectPredicate,
  normalizeFilterValue,
  parseQuerySearchParams,
  resolveComparator,
  selectPredicate,
  serializeQuerySearchParams,
  sortRows,
  textPredicate,
  type QueryColumn,
  type SortableColumn,
} from '..'

interface Cell {
  v: unknown
}

const values = (rows: Cell[]) => rows.map((row) => row.v)
const by = (compare: SortableColumn<Cell>['compare'], isEmpty?: (value: unknown) => boolean) =>
  new Map<string, SortableColumn<Cell>>([['v', { getValue: (row) => row.v, compare, isEmpty }]])

describe('sorting: values a comparator cannot read sort as empty', () => {
  it('places unreadable numbers last in both directions', () => {
    const rows: Cell[] = [{ v: 'n/a' }, { v: 5 }, { v: null }, { v: 10 }, { v: 'abc' }]
    expect(values(sortRows(rows, [{ id: 'v', desc: false }], by(compareNumber)))).toEqual([5, 10, 'n/a', null, 'abc'])
    expect(values(sortRows(rows, [{ id: 'v', desc: true }], by(compareNumber)))).toEqual([10, 5, 'n/a', null, 'abc'])
  })

  it('places unreadable dates last in both directions', () => {
    const invalid = new Date(Number.NaN)
    const rows: Cell[] = [{ v: '2024-01-02' }, { v: 'someday' }, { v: invalid }, { v: '2024-01-01' }]
    expect(values(sortRows(rows, [{ id: 'v', desc: false }], by(compareDate)))).toEqual([
      '2024-01-01',
      '2024-01-02',
      'someday',
      invalid,
    ])
    expect(values(sortRows(rows, [{ id: 'v', desc: true }], by(compareDate)))).toEqual([
      '2024-01-02',
      '2024-01-01',
      'someday',
      invalid,
    ])
  })

  it('does the same through applyQuery', () => {
    const data = [{ id: 'a', amount: 5 }, { id: 'b', amount: 'n/a' }, { id: 'c', amount: 10 }]
    const columns: QueryColumn<(typeof data)[number]>[] = [{ accessorKey: 'amount', sortingFn: 'number' }]
    const ids = (desc: boolean) =>
      applyQuery(data, { sorting: [{ id: 'amount', desc }] }, { columns }).rows.map((row) => row.id)
    expect(ids(false)).toEqual(['a', 'c', 'b'])
    expect(ids(true)).toEqual(['c', 'a', 'b'])
  })

  it('exposes the emptiness rule of each comparator', () => {
    expect(getSortEmptyCheck(resolveComparator('number'))('n/a')).toBe(true)
    expect(getSortEmptyCheck(resolveComparator('number'))('42')).toBe(false)
    expect(getSortEmptyCheck(resolveComparator('datetime'))('someday')).toBe(true)
    expect(getSortEmptyCheck(resolveComparator('text'))('n/a')).toBe(false)
    expect(getSortEmptyCheck(resolveComparator(undefined))(new Date(Number.NaN))).toBe(true)
    const byLength = (a: string, b: string) => a.length - b.length
    expect(getSortEmptyCheck(byLength)('')).toBe(true)
    expect(getSortEmptyCheck(byLength)('x')).toBe(false)
  })

  it('accepts an extra emptiness rule per column', () => {
    const rows: Cell[] = [{ v: 'b' }, { v: 'skip' }, { v: 'a' }]
    const column = by(compareText, (value) => value === 'skip')
    expect(values(sortRows(rows, [{ id: 'v', desc: true }], column))).toEqual(['b', 'a', 'skip'])
  })
})

describe('boolean filters: a bare false means isFalse', () => {
  it('normalises false-like bare values to isFalse', () => {
    expect(normalizeFilterValue(false, 'boolean')).toEqual({ operator: 'isFalse', value: false })
    expect(normalizeFilterValue('false', 'boolean')).toEqual({ operator: 'isFalse', value: 'false' })
    expect(normalizeFilterValue(0, 'boolean')).toEqual({ operator: 'isFalse', value: 0 })
    expect(normalizeFilterValue(true, 'boolean')).toEqual({ operator: 'isTrue', value: true })
  })

  it('filters rows accordingly, including from a URL', () => {
    expect(matchesColumnFilter(false, { type: 'boolean' }, false)).toBe(true)
    expect(matchesColumnFilter(true, { type: 'boolean' }, false)).toBe(false)
    const data = [{ id: 'on', active: true }, { id: 'off', active: false }]
    const columns: QueryColumn<(typeof data)[number]>[] = [{ accessorKey: 'active', filter: { type: 'boolean' } }]
    const query = parseQuerySearchParams('f.active=false', { columns })
    expect(applyQuery(data, query, { columns }).rows.map((row) => row.id)).toEqual(['off'])
  })
})

describe('select filters with a value no option can hold', () => {
  it('ignores a select filter whose value has no text form', () => {
    for (const rowValue of ['a', null, undefined, { a: 1 }]) {
      expect(selectPredicate(rowValue, 'equals', ['a'])).toBe(true)
      expect(selectPredicate(rowValue, 'notEquals', { a: 1 })).toBe(true)
    }
  })

  it('never matches a row without a text form against a real option', () => {
    expect(selectPredicate(null, 'equals', 'a')).toBe(false)
    expect(selectPredicate({ a: 1 }, 'equals', 'a')).toBe(false)
    expect(selectPredicate(undefined, 'notEquals', 'a')).toBe(true)
    expect(selectPredicate(2, 'equals', '2')).toBe(true)
  })

  it('applies the same rule to multiSelect', () => {
    expect(multiSelectPredicate([null], 'includes', [{ a: 1 }])).toBe(true)
    expect(multiSelectPredicate([{ a: 1 }], 'includes', ['a'])).toBe(false)
    expect(multiSelectPredicate([null, 'a'], 'includes', [null, 'a'])).toBe(true)
    expect(multiSelectPredicate([null], 'includes', [null, 'b'])).toBe(false)
  })
})

describe('query search params', () => {
  interface Row {
    name: string
    amount: number
    secret: string
  }
  const columns: QueryColumn<Row>[] = [
    { accessorKey: 'name' },
    { accessorKey: 'amount', filter: { type: 'number' } },
    { accessorKey: 'secret', enableFiltering: false, enableSorting: false },
  ]

  it('drops operators that are not valid for the column type when parsing', () => {
    const parsed = parseQuerySearchParams('f.name=greaterThan:5&f.amount=greaterThan:5', { columns })
    expect(parsed.columnFilters).toEqual([{ id: 'amount', value: { operator: 'greaterThan', value: 5 } }])
  })

  it('writes only what parsing would accept when columns are given', () => {
    const params = serializeQuerySearchParams(
      {
        sorting: [
          { id: 'secret', desc: false },
          { id: 'nope', desc: true },
          { id: 'amount', desc: true },
        ],
        columnFilters: [
          { id: 'secret', value: 'x' },
          { id: 'name', value: { operator: 'greaterThan', value: 5 } },
          { id: 'amount', value: { operator: 'lessThan', value: 3 } },
        ],
      },
      { columns },
    )
    expect(Object.fromEntries(params)).toEqual({ sort: '-amount', 'f.amount': 'lessThan:3' })
  })

  it('keeps sorting as given without columns', () => {
    expect(serializeQuerySearchParams({ sorting: [{ id: 'x', desc: true }] }).get('sort')).toBe('-x')
  })

  it('keeps the common URL for a plain bare string', () => {
    expect(serializeQuerySearchParams({ columnFilters: [{ id: 'name', value: 'ann' }] }).toString()).toBe('f.name=ann')
  })

  it.each([
    'ann',
    '42',
    '-7',
    ' 7',
    'true',
    'null',
    '"quoted"',
    '[1,2]',
    '{"a":1}',
    '{"operator":"contains","value":"x"}',
    'contains:x',
    'isEmpty:',
    '',
    'http://example.com/a?b=c',
  ])('round-trips the bare string %j without columns', (value) => {
    const params = serializeQuerySearchParams({ columnFilters: [{ id: 'x', value }] })
    expect(parseQuerySearchParams(params).columnFilters).toEqual([{ id: 'x', value }])
  })

  it.each([[42], [true], [[1, 'a']], [{ from: 1, to: 5 }], [{ operator: 'contains', value: '42' }]])(
    'round-trips %j without columns',
    (value) => {
      const params = serializeQuerySearchParams({ columnFilters: [{ id: 'x', value }] })
      expect(parseQuerySearchParams(params).columnFilters).toEqual([{ id: 'x', value }])
    },
  )

  it('does not write a filter whose operator could not be read back', () => {
    expect(serializeQuerySearchParams({ columnFilters: [{ id: 'x', value: { operator: 'nope', value: 1 } }] }).toString()).toBe('')
  })
})

describe('matchesSearchValue', () => {
  it('matches strings and finite numbers as text', () => {
    expect(matchesSearchValue('Renée', 'renee')).toBe(true)
    expect(matchesSearchValue(300, '30')).toBe(true)
    expect(matchesSearchValue(Number.NaN, 'nan')).toBe(false)
    expect(matchesSearchValue(Number.POSITIVE_INFINITY, 'inf')).toBe(false)
  })

  it('matches dates by calendar day in the given zone', () => {
    const placed = new Date('2024-03-05T20:00:00Z')
    expect(matchesSearchValue(placed, '2024-03-06', { timeZone: 'Australia/Sydney' })).toBe(true)
    expect(matchesSearchValue(placed, '2024-03-06', { timeZone: 'UTC' })).toBe(false)
    expect(matchesSearchValue(new Date(Number.NaN), '2024')).toBe(false)
  })

  it('never matches booleans, null or objects, and matches anything with an empty query', () => {
    expect(matchesSearchValue(true, 'true')).toBe(false)
    expect(matchesSearchValue(null, 'null')).toBe(false)
    expect(matchesSearchValue({ a: 'x' }, 'x')).toBe(false)
    expect(matchesSearchValue(null, '   ')).toBe(true)
  })

  it('is the rule applyQuery searches with', () => {
    const data = [{ id: '1', when: new Date('2024-03-05T20:00:00Z'), flag: true }]
    const columns: QueryColumn<(typeof data)[number]>[] = [{ accessorKey: 'when' }, { accessorKey: 'flag' }]
    expect(applyQuery(data, { globalFilter: '2024-03-06' }, { columns, timeZone: 'Australia/Sydney' }).total).toBe(1)
    expect(applyQuery(data, { globalFilter: '2024-03-06' }, { columns, timeZone: 'UTC' }).total).toBe(0)
    expect(applyQuery(data, { globalFilter: 'true' }, { columns }).total).toBe(0)
  })
})

describe('text filters trim the search text', () => {
  it('ignores surrounding whitespace in the needle', () => {
    expect(textPredicate('Active', 'equals', ' active ')).toBe(true)
    expect(textPredicate('John Smith', 'startsWith', '  john')).toBe(true)
    expect(textPredicate('John Smith', 'endsWith', 'smith  ')).toBe(true)
  })
})

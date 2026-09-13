import { describe, expect, it } from 'vitest'
import {
  applyQuery,
  compareText,
  createTextComparator,
  parseQuerySearchParams,
  serializeQuerySearchParams,
  sortRows,
  type ColumnBehavior,
  type DataTableQuery,
} from '..'

interface Order {
  id: string
  customer: string
  status: 'open' | 'paid' | 'void'
  amount: number | null
  placedAt: string
  owner: { name: string }
}

const orders: Order[] = [
  { id: '1', customer: 'Renée', status: 'open', amount: 120, placedAt: '2024-03-05T20:00:00Z', owner: { name: 'Zoe' } },
  { id: '2', customer: 'adam', status: 'paid', amount: 80, placedAt: '2024-03-06T01:00:00Z', owner: { name: 'Ann' } },
  { id: '3', customer: 'Bea', status: 'void', amount: null, placedAt: '2024-03-04T12:00:00Z', owner: { name: 'Max' } },
  { id: '4', customer: 'Carl', status: 'paid', amount: 300, placedAt: '2024-03-06T22:00:00Z', owner: { name: 'Ann' } },
  { id: '5', customer: 'item 10', status: 'open', amount: 5, placedAt: '2024-02-01T00:00:00Z', owner: { name: 'Ann' } },
  { id: '6', customer: 'item 9', status: 'open', amount: 7, placedAt: '2024-02-02T00:00:00Z', owner: { name: 'Ann' } },
]

const columns: ColumnBehavior<Order>[] = [
  { accessorKey: 'customer', filter: { type: 'text' } },
  { accessorKey: 'status', filter: { type: 'multiSelect' }, enableGlobalFilter: false },
  { accessorKey: 'amount', filter: { type: 'number' }, sortingFn: 'number' },
  { accessorKey: 'placedAt', filter: { type: 'date' }, sortingFn: 'datetime' },
  { accessorPath: 'owner.name', id: 'owner' },
  { id: 'secret', accessorFn: (row) => row.id, enableFiltering: false, enableSorting: false },
]

const ids = (rows: Order[]) => rows.map((row) => row.id)

describe('applyQuery', () => {
  it('filters with the same predicates the table uses', () => {
    const result = applyQuery(
      orders,
      { columnFilters: [{ id: 'status', value: { operator: 'includes', value: ['paid'] } }] },
      { columns },
    )
    expect(ids(result.rows)).toEqual(['2', '4'])
    expect(result.total).toBe(2)
  })

  it('accepts bare filter values with the column default operator', () => {
    expect(ids(applyQuery(orders, { columnFilters: [{ id: 'customer', value: 'RENEE' }] }, { columns }).rows)).toEqual(['1'])
  })

  it('decides date filters in the zone it is given', () => {
    const query = { columnFilters: [{ id: 'placedAt', value: { operator: 'on', value: '2024-03-06' } }] }
    expect(ids(applyQuery(orders, query, { columns, timeZone: 'UTC' }).rows)).toEqual(['2', '4'])
    expect(ids(applyQuery(orders, query, { columns, timeZone: 'Australia/Sydney' }).rows)).toEqual(['1', '2'])
  })

  it('searches text and number columns, skipping ones opted out', () => {
    expect(ids(applyQuery(orders, { globalFilter: 'paid' }, { columns }).rows)).toEqual([])
    expect(ids(applyQuery(orders, { globalFilter: 'ann' }, { columns }).rows)).toEqual(['2', '4', '5', '6'])
    expect(ids(applyQuery(orders, { globalFilter: '300' }, { columns }).rows)).toEqual(['4'])
  })

  it('ignores filters and sorts on unknown or disabled columns', () => {
    const result = applyQuery(
      orders,
      {
        columnFilters: [
          { id: 'passwordHash', value: 'x' },
          { id: 'secret', value: '1' },
        ],
        sorting: [{ id: 'secret', desc: true }],
      },
      { columns },
    )
    expect(ids(result.rows)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('sorts numerically and keeps empty values last in both directions', () => {
    expect(ids(applyQuery(orders, { sorting: [{ id: 'amount', desc: false }] }, { columns }).rows)).toEqual(['5', '6', '2', '1', '4', '3'])
    expect(ids(applyQuery(orders, { sorting: [{ id: 'amount', desc: true }] }, { columns }).rows)).toEqual(['4', '1', '2', '6', '5', '3'])
  })

  it('sorts text naturally (item 9 before item 10) and stably across columns', () => {
    const result = applyQuery(
      orders,
      { sorting: [{ id: 'owner', desc: false }, { id: 'customer', desc: false }] },
      { columns },
    )
    expect(ids(result.rows)).toEqual(['2', '4', '6', '5', '3', '1'])
  })

  it('paginates and moves a page past the end back to the last page', () => {
    const page = applyQuery(orders, { pageIndex: 1, pageSize: 4 }, { columns })
    expect(ids(page.rows)).toEqual(['5', '6'])
    expect(page).toMatchObject({ total: 6, pageCount: 2, pageIndex: 1, pageSize: 4 })

    const stale = applyQuery(orders, { pageIndex: 7, pageSize: 4 }, { columns })
    expect(stale.pageIndex).toBe(1)
    expect(ids(stale.rows)).toEqual(['5', '6'])
  })

  it('returns everything when no page size is given', () => {
    expect(applyQuery(orders, {}, { columns }).rows).toHaveLength(6)
  })
})

describe('sorting helpers', () => {
  it('uses a fixed default locale so server and browser agree', () => {
    expect(['b', 'A', 'c'].sort(compareText)).toEqual(['A', 'b', 'c'])
    expect(createTextComparator('sv')('ä', 'z')).toBeGreaterThan(0)
  })

  it('does not mutate its input', () => {
    const input = [{ v: 2 }, { v: 1 }]
    const byValue = { getValue: (r: { v: number }) => r.v, compare: (a: unknown, b: unknown) => Number(a) - Number(b) }
    const sorted = sortRows(input, [{ id: 'v', desc: false }], new Map([['v', byValue]]))
    expect(sorted.map((r) => r.v)).toEqual([1, 2])
    expect(input.map((r) => r.v)).toEqual([2, 1])
  })
})

describe('query search params', () => {
  const query: DataTableQuery = {
    pageIndex: 2,
    pageSize: 25,
    sorting: [{ id: 'placedAt', desc: true }, { id: 'customer', desc: false }],
    columnFilters: [
      { id: 'status', value: { operator: 'includes', value: ['open', 'paid'] } },
      { id: 'amount', value: { operator: 'between', value: [10, 200] } },
      { id: 'customer', value: { operator: 'contains', value: undefined } },
    ],
    globalFilter: 'ann',
  }

  it('writes a short, readable URL without inactive filters', () => {
    const params = serializeQuerySearchParams(query, { columns })
    expect(Object.fromEntries(params)).toEqual({
      page: '3',
      size: '25',
      sort: '-placedAt,customer',
      q: 'ann',
      'f.status': 'includes:["open","paid"]',
      'f.amount': 'between:[10,200]',
    })
  })

  it('round-trips', () => {
    const parsed = parseQuerySearchParams(serializeQuerySearchParams(query, { columns }), { columns })
    expect(parsed).toEqual({ ...query, columnFilters: query.columnFilters.slice(0, 2) })
  })

  it('omits defaults so an untouched table has a clean URL', () => {
    expect(serializeQuerySearchParams({ pageIndex: 0, pageSize: 10, sorting: [], columnFilters: [], globalFilter: '' }).toString()).toBe('')
  })

  it('keeps unrelated keys of the page and supports a prefix', () => {
    const params = serializeQuerySearchParams(
      { pageIndex: 1, globalFilter: 'x' },
      { prefix: 'orders.', base: 'tab=billing&orders.q=old' },
    )
    expect(params.toString()).toBe('tab=billing&orders.page=2&orders.q=x')
    expect(parseQuerySearchParams(params, { prefix: 'orders.' })).toMatchObject({ pageIndex: 1, globalFilter: 'x' })
  })

  it('reads a Next.js searchParams object, including repeated keys', () => {
    const parsed = parseQuerySearchParams({ page: ['4', '9'], sort: '-amount', 'f.customer': 'bea' }, { columns })
    expect(parsed.pageIndex).toBe(3)
    expect(parsed.sorting).toEqual([{ id: 'amount', desc: true }])
    expect(parsed.columnFilters).toEqual([{ id: 'customer', value: 'bea' }])
  })

  it('treats the URL as untrusted input', () => {
    const parsed = parseQuerySearchParams(
      'page=-3&size=100000&sort=passwordHash,secret,-amount,-amount&f.passwordHash=x&f.status=drop:["x"]&f.amount=between:[1,',
      { columns, pageSizeOptions: [10, 25, 50] },
    )
    expect(parsed.pageIndex).toBe(0)
    expect(parsed.pageSize).toBe(10)
    expect(parsed.sorting).toEqual([{ id: 'amount', desc: true }])
    // `drop:` is not an operator, so the raw text is a bare value; `between:[1,` is broken JSON kept as text.
    expect(parsed.columnFilters.map((f) => f.id)).toEqual(['status', 'amount'])
    expect(parsed.columnFilters[1]?.value).toEqual({ operator: 'between', value: '[1,' })
  })
})

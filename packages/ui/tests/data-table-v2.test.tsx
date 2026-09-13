/*
 * Regression tests for the DataTable defects fixed in V2, and the guarantee
 * that makes server-side tables trustworthy: a client-side DataTable and
 * `applyQuery` on a server return the same rows in the same order.
 */
import {
  applyQuery,
  CellDate,
  CellNumber,
  DataTable,
  useDataTableQueryState,
  type ColumnDef,
  type ColumnFiltersState,
  type DataTableQuery,
  type PaginationState,
  type SortingState,
} from '@shining-technologies/ui'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

interface Order {
  id: string
  name: string
  group: number
  amount: number | null
  placedAt: string
}

const orders: Order[] = [
  { id: 'r1', name: 'Renée', group: 1, amount: 120, placedAt: '2024-03-05T20:00:00Z' },
  { id: 'r2', name: 'adam', group: 2, amount: 80, placedAt: '2024-03-06T01:00:00Z' },
  { id: 'r3', name: 'Bea', group: 1, amount: null, placedAt: '2024-03-04T12:00:00Z' },
  { id: 'r4', name: 'Carl', group: 2, amount: 300, placedAt: '2024-03-06T22:00:00Z' },
  { id: 'r5', name: 'item 10', group: 3, amount: 5, placedAt: '2024-02-01T00:00:00Z' },
  { id: 'r6', name: 'item 9', group: 3, amount: 7, placedAt: '2024-02-02T00:00:00Z' },
]

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'Id', cell: ({ value }) => <span data-order-id={value}>{value}</span> },
  { accessorKey: 'name', header: 'Name', filter: { type: 'text' } },
  {
    accessorKey: 'group',
    header: 'Group',
    filter: {
      type: 'select',
      options: [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Three', value: 3 },
      ],
    },
  },
  { accessorKey: 'amount', header: 'Amount', filter: { type: 'number' }, sortingFn: 'number' },
  { accessorKey: 'placedAt', header: 'Placed', filter: { type: 'date' }, sortingFn: 'datetime' },
]

const renderedIds = () =>
  [...document.querySelectorAll('[data-order-id]')].map((node) => node.getAttribute('data-order-id'))

describe('parity with applyQuery', () => {
  const queries: Partial<DataTableQuery>[] = [
    { sorting: [{ id: 'amount', desc: false }] },
    { sorting: [{ id: 'amount', desc: true }] },
    { sorting: [{ id: 'name', desc: false }] },
    { columnFilters: [{ id: 'group', value: { operator: 'equals', value: 2 } }] },
    {
      columnFilters: [{ id: 'amount', value: { operator: 'between', value: [6, 150] } }],
      sorting: [{ id: 'placedAt', desc: true }],
    },
    { columnFilters: [{ id: 'placedAt', value: { operator: 'on', value: '2024-03-06' } }] },
    { globalFilter: 'item', sorting: [{ id: 'name', desc: true }] },
    { columnFilters: [{ id: 'name', value: 'RENEE' }] },
    { pageIndex: 1, pageSize: 4, sorting: [{ id: 'name', desc: false }] },
  ]

  for (const timeZone of ['UTC', 'Australia/Sydney']) {
    for (const [index, query] of queries.entries()) {
      it(`query ${index + 1} in ${timeZone}`, () => {
        const pagination: PaginationState = { pageIndex: query.pageIndex ?? 0, pageSize: query.pageSize ?? 10 }
        render(
          <DataTable
            data={orders}
            columns={columns}
            label="Orders"
            timeZone={timeZone}
            sorting={query.sorting ?? []}
            columnFilters={query.columnFilters ?? []}
            globalFilter={query.globalFilter ?? ''}
            pagination={pagination}
          />,
        )
        const expected = applyQuery(orders, { ...query, ...pagination }, { columns, timeZone, locale: 'en-US' })
        expect(renderedIds()).toEqual(expected.rows.map((row) => row.id))
      })
    }
  }

  it('keeps empty values last when sorting descending', () => {
    render(
      <DataTable data={orders} columns={columns} label="Orders" sorting={[{ id: 'amount', desc: true }]} />,
    )
    expect(renderedIds().at(-1)).toBe('r3')
  })

  it('decides which day a timestamp is on in the table’s time zone', () => {
    const on6th = [{ id: 'placedAt', value: { operator: 'on', value: '2024-03-06' } }]
    const { unmount } = render(
      <DataTable data={orders} columns={columns} label="Orders" timeZone="UTC" columnFilters={on6th} />,
    )
    expect(renderedIds()).toEqual(['r2', 'r4'])
    unmount()
    render(
      <DataTable data={orders} columns={columns} label="Orders" timeZone="Australia/Sydney" columnFilters={on6th} />,
    )
    expect(renderedIds()).toEqual(['r1', 'r2'])
  })
})

describe('filter state that narrows nothing', () => {
  const cleared: ColumnFiltersState = [{ id: 'name', value: { operator: 'contains', value: undefined } }]

  it('is not counted by the filter panel', () => {
    render(
      <DataTable
        data={orders}
        columns={columns}
        label="Orders"
        features={{ filtering: { globalSearch: false } }}
        defaultColumnFilters={cleared}
      />,
    )
    expect(screen.getByRole('button', { name: 'Filters, none active' })).toBeInTheDocument()
    expect(renderedIds()).toHaveLength(6)
  })

  it('gets no active-filter chip', () => {
    render(<DataTable data={orders} columns={columns} label="Orders" defaultColumnFilters={cleared} />)
    expect(screen.queryByRole('button', { name: 'Remove Name filter' })).not.toBeInTheDocument()
  })
})

describe('typed filter values from the panel', () => {
  it('stores a numeric select option as a number', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable data={orders} columns={columns} label="Orders" onColumnFiltersChange={onColumnFiltersChange} />,
    )
    await user.click(screen.getByRole('button', { name: /^Filters,/ }))
    await user.click(await screen.findByRole('combobox', { name: 'Group value' }))
    await user.click(await screen.findByRole('option', { name: 'Two' }))

    await waitFor(() => expect(renderedIds()).toEqual(['r2', 'r4']))
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'group', value: { operator: 'equals', value: 2 } },
    ])
  })

  it('stores a number input as a number', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable data={orders} columns={columns} label="Orders" onColumnFiltersChange={onColumnFiltersChange} />,
    )
    await user.click(screen.getByRole('button', { name: /^Filters,/ }))
    await user.type(await screen.findByRole('spinbutton', { name: 'Amount value' }), '80')

    await waitFor(() => expect(renderedIds()).toEqual(['r2']))
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'amount', value: { operator: 'equals', value: 80 } },
    ])
  })
})

describe('locale', () => {
  const many: Order[] = Array.from({ length: 1240 }, (_, index) => ({
    id: `r${index}`,
    name: `Row ${index}`,
    group: 1,
    amount: index,
    placedAt: '2024-01-01',
  }))

  it('formats counts in en-US by default, whatever the runtime locale', () => {
    render(<DataTable data={many} columns={columns} label="Orders" />)
    expect(screen.getByText('Showing 1–10 of 1,240')).toBeInTheDocument()
  })

  it('formats counts in the locale it is given', () => {
    render(<DataTable data={many} columns={columns} label="Orders" locale="de-DE" />)
    expect(screen.getByText('Showing 1–10 of 1.240')).toBeInTheDocument()
  })

  it('shows default date cells in the table’s locale and time zone', () => {
    const rows = [{ id: 'd1', at: new Date('2024-03-05T20:00:00Z') }]
    render(
      <DataTable
        data={rows}
        columns={[{ accessorKey: 'at', header: 'At' }]}
        label="Dates"
        timeZone="Australia/Sydney"
        showPagination={false}
      />,
    )
    expect(screen.getByText('Mar 6, 2024')).toBeInTheDocument()
  })
})

describe('search box controlled through a slow round trip', () => {
  /**
   * A parent that applies the search term late, like a Next.js page whose
   * `globalFilter` comes back from the URL after `router.replace`.
   */
  function UrlDrivenTable({ delay }: { delay: number }) {
    const [applied, setApplied] = useState('')
    return (
      <DataTable
        data={orders}
        columns={columns}
        label="Orders"
        globalFilter={applied}
        onGlobalFilterChange={(next) => setTimeout(() => setApplied(next), delay)}
        features={{ filtering: { debounceMs: 0 } }}
      />
    )
  }

  it('does not revert what the user is typing when an earlier value comes back', async () => {
    // Keys 50ms apart, echoes 80ms after each push: the echo of "i" lands
    // between "t" and "e". V1 adopted it and the input became "ie".
    const user = userEvent.setup({ delay: 50 })
    render(<UrlDrivenTable delay={80} />)
    const box = screen.getByRole('searchbox', { name: 'Search table' })

    await user.type(box, 'ite')
    await new Promise((resolve) => setTimeout(resolve, 250))

    expect(box).toHaveValue('ite')
    await waitFor(() => expect(renderedIds()).toEqual(['r5', 'r6']))
  })

  it('still adopts a genuinely external change', async () => {
    const user = userEvent.setup()
    render(<UrlDrivenTable delay={20} />)
    const box = screen.getByRole('searchbox', { name: 'Search table' })

    await user.type(box, 'carl')
    await waitFor(() => expect(renderedIds()).toEqual(['r4']))

    await user.click(screen.getByRole('button', { name: 'Clear 1 filter' }))
    await waitFor(() => expect(box).toHaveValue(''))
    await waitFor(() => expect(renderedIds()).toHaveLength(6))
  })
})

describe('useDataTableQueryState: a query kept in a slow external source', () => {
  const initial: DataTableQuery = {
    pageIndex: 1,
    pageSize: 2,
    sorting: [],
    columnFilters: [],
    globalFilter: '',
  }

  /**
   * Stands in for a router: the query only comes back as props after a delay,
   * and every change is recorded as a navigation.
   */
  function RoutedTable({ onNavigate, delay = 60 }: { onNavigate: (q: DataTableQuery) => void; delay?: number }) {
    const [source, setSource] = useState(initial)
    const state = useDataTableQueryState(source, (next) => {
      onNavigate(next)
      setTimeout(() => setSource(next), delay)
    })
    // The "server": answers whatever query the source holds.
    const page = applyQuery(orders, source, { columns, locale: 'en-US' })
    return (
      <DataTable
        {...state}
        mode="server"
        data={page.rows}
        rowCount={page.total}
        columns={columns}
        label="Orders"
        features={{ filtering: { debounceMs: 0 } }}
      />
    )
  }

  it('merges a sort and the page reset it causes into one navigation', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<RoutedTable onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: /^Amount, / }))

    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1))
    expect(onNavigate).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageIndex: 0, pageSize: 2, sorting: [{ id: 'amount', desc: false }] }),
    )
    await waitFor(() => expect(renderedIds()).toEqual(['r5', 'r6']))
  })

  it('keeps earlier changes when a second one lands before the source catches up', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<RoutedTable onNavigate={onNavigate} delay={300} />)

    await user.click(screen.getByRole('button', { name: /^Amount, / }))
    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'item')

    await waitFor(() =>
      expect(onNavigate).toHaveBeenLastCalledWith(
        expect.objectContaining({ sorting: [{ id: 'amount', desc: false }], globalFilter: 'item', pageIndex: 0 }),
      ),
    )
    await waitFor(() => expect(renderedIds()).toEqual(['r5', 'r6']), { timeout: 2000 })
  })

  it('follows the source when it changes on its own, like the Back button', async () => {
    function Controlled() {
      const [source, setSource] = useState(initial)
      const state = useDataTableQueryState(source, setSource)
      const page = applyQuery(orders, source, { columns, locale: 'en-US' })
      return (
        <>
          <button type="button" onClick={() => setSource({ ...initial, pageIndex: 0, globalFilter: 'carl' })}>
            back
          </button>
          <DataTable {...state} mode="server" data={page.rows} rowCount={page.total} columns={columns} label="Orders" />
        </>
      )
    }
    const user = userEvent.setup()
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'back' }))
    await waitFor(() => expect(renderedIds()).toEqual(['r4']))
    expect(screen.getByRole('searchbox', { name: 'Search table' })).toHaveValue('carl')
  })
})

describe('cell toolkit follows the table', () => {
  const rows = [{ id: 'c1', day: '2025-10-13', at: '2024-03-05T20:00:00Z', amount: 1240.5 }]
  const cellColumns: ColumnDef<(typeof rows)[number]>[] = [
    { accessorKey: 'day', header: 'Day', cell: ({ value }) => <CellDate value={value} /> },
    { accessorKey: 'at', header: 'At', cell: ({ value }) => <CellDate value={value} /> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ value }) => <CellNumber value={value} /> },
  ]

  it('formats in the table locale and keeps a calendar date on its own day', () => {
    // Los Angeles is behind UTC: V1 showed 2025-10-13 as the 12th there, and the
    // timestamp in the runtime's own zone rather than the table's.
    render(
      <DataTable data={rows} columns={cellColumns} label="Cells" timeZone="America/Los_Angeles" locale="en-AU" showPagination={false} />,
    )
    expect(screen.getByText('13 Oct 2025')).toBeInTheDocument()
    expect(screen.getByText('5 Mar 2024')).toBeInTheDocument()
    expect(screen.getByText('1,240.5')).toBeInTheDocument()
  })

  it('shows a timestamp on its day in the table time zone', () => {
    render(
      <DataTable data={rows} columns={cellColumns} label="Cells" timeZone="Australia/Sydney" locale="en-AU" showPagination={false} />,
    )
    expect(screen.getByText('6 Mar 2024')).toBeInTheDocument()
    expect(screen.getByText('13 Oct 2025')).toBeInTheDocument()
  })
})

describe('server-mode pagination is not re-sorted by the client', () => {
  it('renders server rows in the order given', () => {
    const sorting: SortingState = [{ id: 'name', desc: false }]
    render(
      <DataTable
        data={[...orders].reverse()}
        columns={columns}
        label="Orders"
        mode="server"
        rowCount={orders.length}
        sorting={sorting}
      />,
    )
    expect(renderedIds()).toEqual(['r6', 'r5', 'r4', 'r3', 'r2', 'r1'])
  })
})

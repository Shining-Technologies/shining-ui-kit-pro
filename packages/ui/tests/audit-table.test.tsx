import {
  DataTable,
  createColumnHelper,
  datePredicate,
  toCalendarDate,
  toTimestamp,
  type ColumnDef,
  type DataTableQuery,
  type PaginationState,
} from '@shining-technologies/ui'
import { escapeCsvField, tableToCsv } from '@shining-technologies/ui/csv'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, users, type User } from './fixtures'

type Table<T> = Parameters<typeof tableToCsv<T>>[0]

const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

// ------------------------------------------------------------ consumer types
// A typical application's column definitions. This block is the test: it has
// to compile under `pnpm typecheck` without a single cast.

interface Account {
  id: string
  name: string
  email: string | null
  balance: number
  createdAt: Date
  tags: string[]
  address?: { city: string }
}

const accountColumns: ColumnDef<Account>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ value }) => value.toUpperCase() },
  { accessorKey: 'email', header: 'Email', cell: ({ value }) => value ?? '—' },
  {
    accessorKey: 'balance',
    header: 'Balance',
    meta: { align: 'right' },
    cell: ({ value, row }) => `${row.original.name}: ${value.toFixed(2)}`,
    filter: { type: 'number' },
  },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ value }) => value.toISOString() },
  {
    id: 'tagCount',
    header: 'Tags',
    accessorFn: (row) => row.tags.length,
  },
  { id: 'city', header: 'City', accessorPath: 'address.city' },
  { id: 'actions', header: 'Actions', cell: ({ row }) => <button>{row.original.id}</button> },
]

const helper = createColumnHelper<Account>()
const helperColumns = [
  helper.accessor('balance', { header: 'Balance', cell: ({ value }) => value.toFixed(2) }),
  helper.computed('initial', (row) => row.name.charAt(0), {
    cell: ({ value }) => value.toLowerCase(),
  }),
  helper.display({ id: 'menu', cell: ({ row }) => row.original.id }),
]

// A typo in `accessorKey` must still be caught.
// @ts-expect-error -- 'nmae' is not a key of Account
const typo: ColumnDef<Account> = { accessorKey: 'nmae', header: 'Name' }
void typo

const accounts: Account[] = [
  { id: 'a', name: 'Ada', email: null, balance: 1, createdAt: new Date(0), tags: [] },
]

describe('consumer column types', () => {
  it('compiles and renders typed columns without casts', () => {
    render(
      <>
        <DataTable data={accounts} columns={accountColumns} getRowId={(row) => row.id} />
        <DataTable data={accounts} columns={helperColumns} />
      </>,
    )
    expect(document.querySelectorAll('table')).toHaveLength(2)
  })
})

// ------------------------------------------------------------------- server
const lastQuery = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls[fn.mock.calls.length - 1]?.[0] as DataTableQuery

describe('server mode', () => {
  it('returns to the first page on a new search, in a single query', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        rowCount={100}
        pageSize={5}
        defaultPagination={{ pageIndex: 3, pageSize: 5 }}
        features={{ filtering: { debounceMs: 0 } }}
        onQueryChange={onQueryChange}
      />,
    )
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))

    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'a')
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(2))
    // Never page 3 of the new result — not even for one request.
    expect(onQueryChange.mock.calls[1]?.[0]).toMatchObject({ pageIndex: 0, globalFilter: 'a' })
  })

  it('returns to the first page on a new sort', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        rowCount={100}
        pageSize={5}
        defaultPagination={{ pageIndex: 3, pageSize: 5 }}
        onQueryChange={onQueryChange}
      />,
    )
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: /^Name, sort/ }))
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(2))
    expect(lastQuery(onQueryChange)).toMatchObject({
      pageIndex: 0,
      sorting: [{ id: 'name', desc: false }],
    })
  })

  it('keeps the page when only the client sorts it', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        rowCount={100}
        pageSize={5}
        defaultPagination={{ pageIndex: 3, pageSize: 5 }}
        features={{ sorting: { mode: 'client' } }}
        onQueryChange={onQueryChange}
      />,
    )
    await waitFor(() => expect(onQueryChange).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: /^Name, sort/ }))
    await waitFor(() => expect(lastQuery(onQueryChange).sorting).toHaveLength(1))
    expect(lastQuery(onQueryChange).pageIndex).toBe(3)
  })

  it('leaves filters without a value out of the query', async () => {
    const onQueryChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={[{ accessorKey: 'name', header: 'Name', filter: { type: 'text' } }]}
        mode="server"
        rowCount={5}
        defaultColumnFilters={[{ id: 'name', value: { operator: 'startsWith', value: undefined } }]}
        onQueryChange={onQueryChange}
      />,
    )
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))
    expect(lastQuery(onQueryChange).columnFilters).toEqual([])
    // …and nothing is offered to clear, because nothing is filtering.
    expect(screen.queryByRole('button', { name: /^Clear \d+ filter/ })).not.toBeInTheDocument()
  })

  it('steps back when the total shrinks under the current page', async () => {
    const onQueryChange = vi.fn()
    const props = {
      data: users,
      columns: userColumns,
      mode: 'server' as const,
      pageSize: 5,
      defaultPagination: { pageIndex: 3, pageSize: 5 },
      onQueryChange,
    }
    const { rerender } = render(<DataTable {...props} rowCount={20} />)
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))

    // The last row of page 4 was deleted: 16 rows is still 4 pages…
    rerender(<DataTable {...props} rowCount={16} />)
    expect(onQueryChange).toHaveBeenCalledTimes(1)
    // …15 is three.
    rerender(<DataTable {...props} rowCount={15} />)
    await waitFor(() => expect(lastQuery(onQueryChange).pageIndex).toBe(2))
  })

  it('does not step back against a total that is still loading', async () => {
    const onQueryChange = vi.fn()
    const props = {
      data: users,
      columns: userColumns,
      mode: 'server' as const,
      pageSize: 5,
      defaultPagination: { pageIndex: 3, pageSize: 5 },
      onQueryChange,
    }
    const { rerender } = render(<DataTable {...props} rowCount={0} loading />)
    rerender(<DataTable {...props} rowCount={5} loading />)
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))
    expect(lastQuery(onQueryChange).pageIndex).toBe(3)
  })
})

// -------------------------------------------------------------------- state
const manyUsers = makeUsers(30)

describe('controlled pagination with unmemoised data', () => {
  it('does not loop when the parent rebuilds `data` on every render', async () => {
    const user = userEvent.setup()
    let renders = 0

    function Parent() {
      renders++
      const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 })
      return (
        <DataTable
          // A new array every render: the engine treats it as new data.
          data={manyUsers.slice()}
          columns={userColumns}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )
    }

    render(<Parent />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(renders).toBeLessThan(10)
  })
})

describe('keepPageOnDataChange', () => {
  function Polled({ count, keep = true }: { count: number; keep?: boolean }) {
    // A new array each render, as a refetch or a poll hands over.
    return (
      <DataTable
        data={makeUsers(count)}
        columns={userColumns}
        pageSize={5}
        keepPageOnDataChange={keep}
      />
    )
  }

  it('stays on the page through a refetch', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Polled count={30} />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByText('Page 2 of 6')).toBeInTheDocument()
    rerender(<Polled count={30} />)
    // The engine's reset is queued, so give it the chance to happen.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(screen.getByText('Page 2 of 6')).toBeInTheDocument()
  })

  it('still returns to the first page on a new sort', async () => {
    const user = userEvent.setup()
    render(<Polled count={30} />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await user.click(screen.getByRole('button', { name: /^Name, sort/ }))
    expect(screen.getByText('Page 1 of 6')).toBeInTheDocument()
  })

  it('steps back when the new data has fewer pages', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Polled count={30} />)
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    }
    expect(screen.getByText('Page 6 of 6')).toBeInTheDocument()
    rerender(<Polled count={12} />)
    await waitFor(() => expect(screen.getByText('Page 3 of 3')).toBeInTheDocument())
  })

  it('leaves the default reset alone when not asked', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Polled count={30} keep={false} />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    rerender(<Polled count={30} keep={false} />)
    await waitFor(() => expect(screen.getByText('Page 1 of 6')).toBeInTheDocument())
  })
})

describe('row identity', () => {
  // V2: `features.selection.getRowId` was removed from `SelectionFeature`; row
  // identity is the top-level `getRowId` prop only.
  it('honours features.selection.getRowId', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        features={{ selection: { enabled: true } }}
        getRowId={(row) => `user-${row.id}`}
      />,
    )
    expect(bodyRows()[0]).toHaveAttribute('data-row-id', 'user-1')
  })

  it('scopes detail-row ids to their table', async () => {
    const user = userEvent.setup()
    render(
      <>
        <DataTable data={users} columns={userColumns} renderExpandedRow={() => <p>First</p>} />
        <DataTable data={users} columns={userColumns} renderExpandedRow={() => <p>Second</p>} />
      </>,
    )
    const toggles = screen.getAllByRole('button', { name: 'Expand row details' })
    const second = toggles[users.length]!
    expect(toggles[0]!.getAttribute('aria-controls')).not.toBe(second.getAttribute('aria-controls'))

    await user.click(second)
    expect(document.getElementById(second.getAttribute('aria-controls')!)).toHaveTextContent(
      'Second',
    )
  })
})

// --------------------------------------------------------------- pagination
describe('pagination control', () => {
  it('lists a page size that the options do not include', () => {
    render(<DataTable data={makeUsers(50)} columns={userColumns} pageSize={20} />)
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('20')
  })

  it('never announces "page 1 of 0"', () => {
    render(<DataTable data={[] as User[]} columns={userColumns} />)
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })
})

// ------------------------------------------------------------------- search
describe('global search', () => {
  it('searches a column whose first value is empty', async () => {
    const user = userEvent.setup()
    const rows = [
      { id: '1', name: 'Ada', email: null as string | null },
      { id: '2', name: 'Grace', email: 'zed@example.com' as string | null },
    ]
    render(
      <DataTable
        data={rows}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email' },
        ]}
        features={{ filtering: { debounceMs: 0 } }}
      />,
    )
    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'zed')
    await waitFor(() => expect(bodyRows()).toHaveLength(1))
    expect(bodyRows()[0]).toHaveTextContent('Grace')
  })
})

// ------------------------------------------------------------------ filters
describe('date filters', () => {
  const originalTz = process.env.TZ
  // West of Greenwich, where `Date.parse('2024-03-05')` lands on the 4th.
  beforeAll(() => {
    process.env.TZ = 'America/New_York'
  })
  afterAll(() => {
    process.env.TZ = originalTz
  })

  // V2: `toTimestamp` is for ordering only and reads a date-only string as UTC
  // midnight; which day a value falls on is `toCalendarDate`'s job.
  it('reads a calendar date as that day in local time', () => {
    expect(toTimestamp('2024-03-05')).toBe(Date.UTC(2024, 2, 5))
    expect(toCalendarDate('2024-03-05')).toBe('2024-03-05')
    expect(toCalendarDate('2024-03-05', 'America/New_York')).toBe('2024-03-05')
  })

  it('matches the picked day, not the day before', () => {
    const morning = new Date(2024, 2, 5, 9, 30)
    expect(datePredicate(morning, 'on', '2024-03-05')).toBe(true)
    expect(datePredicate(morning, 'before', '2024-03-05')).toBe(false)
    expect(datePredicate(morning, 'between', ['2024-03-05', '2024-03-05'])).toBe(true)
  })
})

// ---------------------------------------------------------------------- csv
describe('CSV export from a DataTable', () => {
  it('labels the header row with the column headers, not their ids', () => {
    let captured: Table<User> | undefined
    render(
      <DataTable
        data={users}
        columns={userColumns}
        slots={{
          toolbarActions: ({ table }) => {
            captured = table
            return null
          },
        }}
      />,
    )
    const header = tableToCsv(captured!).split('\r\n')[0]
    expect(header).toBe('Name,Email,Role,Status,Score,Created')
  })

  it('keeps plain numbers numeric while still neutralising formulas', () => {
    expect(escapeCsvField('-42', ',', true)).toBe('-42')
    expect(escapeCsvField('-1.5e3', ',', true)).toBe('-1.5e3')
    expect(escapeCsvField('+7', ',', true)).toBe('+7')
    expect(escapeCsvField('-2+3', ',', true)).toBe("'-2+3")
    expect(escapeCsvField('-1+cmd|x', ',', true)).toBe("'-1+cmd|x")
    expect(escapeCsvField('=HYPERLINK("x")', ',', true)).toBe(`"'=HYPERLINK(""x"")"`)
  })
})

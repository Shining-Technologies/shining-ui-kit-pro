/*
 * Regression tests for the DataTable defects found while documenting
 * 2.0.0-rc.0. One `describe` per defect.
 */
import {
  applyQuery,
  CellProgress,
  DataTable,
  DefaultViewOptions,
  renderCellContent,
  type ColumnDef,
} from '@shining-technologies/ui'
import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, users, type User } from './fixtures'

const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

describe('cell context rowIndex', () => {
  it("is the row's position in data, also after sorting", () => {
    const seen = new Map<string, number>()
    const columns: ColumnDef<User>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ value, rowIndex }) => {
          seen.set(value, rowIndex)
          return value
        },
      },
    ]
    render(
      <DataTable data={users} columns={columns} defaultSorting={[{ id: 'name', desc: false }]} />,
    )
    // Sorted, Alan Turing is second on screen but third in `data`.
    expect(bodyRows()[1]).toHaveTextContent('Alan Turing')
    expect(seen.get('Alan Turing')).toBe(2)
    expect(seen.get('Barbara Liskov')).toBe(4)
  })
})

describe('loadingRowCount default', () => {
  it('is the page size, capped at 8', () => {
    const { container, rerender } = render(
      <DataTable data={[]} columns={userColumns} loading pageSize={25} />,
    )
    expect(container.querySelectorAll('.sui-row--skeleton')).toHaveLength(8)

    rerender(<DataTable data={[]} columns={userColumns} loading pageSize={5} />)
    expect(container.querySelectorAll('.sui-row--skeleton')).toHaveLength(5)
  })
})

describe('headingActions', () => {
  it('renders without a title, description or icon', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        headingActions={<button type="button">New user</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'New user' })).toBeInTheDocument()
  })

  it('renders the function form', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        headingActions={({ table }) => <span>{table.getRowCount()} users</span>}
      />,
    )
    expect(screen.getByText('5 users')).toBeInTheDocument()
  })
})

describe('features.virtualization on a plain DataTable', () => {
  it('is ignored with a development warning, and the rows still render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(
        <DataTable
          data={users}
          columns={userColumns}
          features={{ virtualization: { enabled: true } }}
        />,
      )
      expect(bodyRows()).toHaveLength(5)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('@shining-technologies/ui/virtualized'),
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('does not warn for VirtualizedDataTable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(
        <VirtualizedDataTable data={users} columns={userColumns} label="Users" maxHeight={400} />,
      )
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('features.virtualization'))
    } finally {
      warn.mockRestore()
    }
  })
})

describe('VirtualizedDataTable pagination options', () => {
  it('stay merged over the pagination-off default', () => {
    render(
      <VirtualizedDataTable
        data={makeUsers(30)}
        columns={userColumns}
        label="Users"
        maxHeight={400}
        features={{ pagination: { pageSize: 5 } }}
      />,
    )
    expect(screen.queryByRole('navigation', { name: 'Table pagination' })).not.toBeInTheDocument()
  })

  it('turn pagination on only with an explicit enabled: true', () => {
    render(
      <VirtualizedDataTable
        data={makeUsers(30)}
        columns={userColumns}
        label="Users"
        maxHeight={400}
        features={{ pagination: { enabled: true, pageSize: 5 } }}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Table pagination' })).toBeInTheDocument()
  })
})

describe('"Clear filters" count', () => {
  it('counts only filters that narrow the result', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        defaultColumnFilters={[
          { id: 'role', value: { operator: 'equals', value: 'admin' } },
          // An operator with no value yet: kept in state, not a filter.
          { id: 'score', value: { operator: 'between', value: [undefined, undefined] } },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Clear 1 filter' })).toBeInTheDocument()
  })
})

describe('active filter chips', () => {
  const chipFor = (label: string) =>
    screen.getByRole('button', { name: `Remove ${label} filter` }).closest('.sui-chip')

  it('show a range bound of 0', () => {
    const { rerender } = render(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[{ id: 'score', value: { operator: 'between', value: [0, 80] } }]}
      />,
    )
    expect(chipFor('Score')).toHaveTextContent('0 – 80')

    rerender(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[{ id: 'score', value: { operator: 'between', value: [null, 0] } }]}
      />,
    )
    expect(chipFor('Score')).toHaveTextContent('to 0')
  })

  it('use filter.label when it is set', () => {
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'role',
        header: 'Role',
        filter: {
          type: 'select',
          label: 'Access level',
          options: [{ label: 'Admin', value: 'admin' }],
        },
      },
    ]
    render(
      <DataTable
        data={users}
        columns={columns}
        defaultColumnFilters={[{ id: 'role', value: 'admin' }]}
      />,
    )
    expect(chipFor('Access level')).toHaveTextContent('Access level')
  })
})

describe('empty and error state slots', () => {
  it('treat a null empty state as an intentional blank', () => {
    const { rerender } = render(<DataTable data={[]} columns={userColumns} emptyState={null} />)
    expect(screen.queryByText('No results')).not.toBeInTheDocument()

    rerender(<DataTable data={[]} columns={userColumns} slots={{ emptyState: '' }} />)
    expect(screen.queryByText('No results')).not.toBeInTheDocument()
  })

  it("treat an '' error state as an intentional blank", () => {
    render(
      <DataTable data={users} columns={userColumns} error={new Error('Boom')} errorState="" />,
    )
    expect(screen.queryByText('Could not load data')).not.toBeInTheDocument()
    expect(screen.queryByText('Boom')).not.toBeInTheDocument()
  })

  it('still show the defaults when no slot is given', () => {
    render(<DataTable data={[]} columns={userColumns} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})

describe('grouped select options', () => {
  const options = [
    { label: 'Admin', value: 'admin', group: 'Staff' },
    { label: 'Viewer', value: 'viewer', group: 'Guests' },
    { label: 'Editor', value: 'editor', group: 'Staff' },
  ]

  it('render under labelled groups in the panel select', async () => {
    const user = userEvent.setup()
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'role', header: 'Role', filter: { type: 'select', options } },
    ]
    render(<DataTable data={users} columns={columns} />)

    await user.click(screen.getByRole('button', { name: /^Filters,/ }))
    await user.click(await screen.findByRole('combobox', { name: 'Role value' }))

    const staff = await screen.findByRole('group', { name: 'Staff' })
    expect(within(staff).getAllByRole('option').map((node) => node.textContent)).toEqual([
      'Admin',
      'Editor',
    ])
    const guests = screen.getByRole('group', { name: 'Guests' })
    expect(within(guests).getByRole('option', { name: 'Viewer' })).toBeInTheDocument()
  })

  it('render under labelled groups in the multi-select', async () => {
    const user = userEvent.setup()
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'role',
        header: 'Role',
        filter: {
          type: 'multiSelect',
          options: [...options, { label: 'Nobody', value: 'nobody' }],
        },
      },
    ]
    render(<DataTable data={users} columns={columns} filterLayout="inline" />)

    await user.click(screen.getByRole('button', { name: 'Role filter' }))
    const listbox = await screen.findByRole('listbox')

    const staff = within(listbox).getByRole('group', { name: 'Staff' })
    expect(within(staff).getAllByRole('option').map((node) => node.textContent)).toEqual([
      'Admin',
      'Editor',
    ])
    expect(within(listbox).getByRole('group', { name: 'Guests' })).toBeInTheDocument()
    // Ungrouped options stay outside every group, and headings are not options.
    expect(within(listbox).getAllByRole('option')).toHaveLength(4)
    expect(within(listbox).getByRole('option', { name: 'Nobody' }).closest('[role="group"]')).toBeNull()
  })
})

describe('CellProgress showValue', () => {
  it('shows the rounded percentage of max', () => {
    render(<CellProgress value={5} max={8} label="Done" />)
    expect(screen.getByText('63%')).toBeInTheDocument()
  })
})

describe('inline single-value filter label', () => {
  it("names a number column's operator", async () => {
    const user = userEvent.setup()
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'score',
        header: 'Score',
        filter: { type: 'number', defaultOperator: 'greaterThan' },
      },
    ]
    render(<DataTable data={users} columns={columns} filterLayout="inline" />)

    await user.click(screen.getByRole('button', { name: 'Score filter' }))
    const input = await screen.findByRole('spinbutton', { name: 'Score' })
    expect(input.closest('label')?.querySelector('.sui-range-panel__label')).toHaveTextContent('>')
  })

  it("still names a date column's operator", async () => {
    const user = userEvent.setup()
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        filter: { type: 'date', defaultOperator: 'before' },
      },
    ]
    const { baseElement } = render(
      <DataTable data={users} columns={columns} filterLayout="inline" />,
    )

    await user.click(screen.getByRole('button', { name: 'Created filter' }))
    await screen.findByText('Pick a date')
    expect(baseElement.querySelector('.sui-range-panel__label')).toHaveTextContent('before')
  })
})

describe('exports for custom parts', () => {
  it('include DefaultViewOptions and renderCellContent', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        components={{
          ViewOptions: (props) => (
            <div data-testid="picker">
              <DefaultViewOptions {...props} />
            </div>
          ),
          Cell: ({ cell, cellProps }) => (
            <td {...cellProps} data-custom-cell="">
              {renderCellContent(cell)}
            </td>
          ),
        }}
      />,
    )

    const picker = screen.getByTestId('picker')
    await user.click(within(picker).getByRole('button', { name: /^Columns,/ }))
    expect(await screen.findByText('Toggle columns')).toBeInTheDocument()
    expect(document.querySelector('[data-custom-cell]')).toHaveTextContent('Ada Lovelace')
  })
})

describe('parity with applyQuery', () => {
  const renderedRowIds = () =>
    [...document.querySelectorAll('tbody tr[data-sui-row]')].map((row) =>
      row.getAttribute('data-row-id'),
    )

  describe('global search over a mixed-type column', () => {
    interface Mixed {
      id: string
      label: string
      mixed: unknown
    }

    const rows: Mixed[] = [
      // A boolean first: the old per-column probe made the whole column unsearchable.
      { id: 'm1', label: 'one', mixed: true },
      { id: 'm2', label: 'two', mixed: 'True story' },
      { id: 'm3', label: 'three', mixed: 120 },
      { id: 'm4', label: 'four', mixed: new Date('2024-03-05T20:00:00Z') },
      { id: 'm5', label: 'five', mixed: null },
      { id: 'm6', label: 'six', mixed: 'a12' },
      { id: 'm7', label: 'seven', mixed: Number.NaN },
      { id: 'm8', label: 'eight', mixed: false },
      { id: 'm9', label: 'nine', mixed: { note: 'true' } },
    ]
    const columns: ColumnDef<Mixed>[] = [
      { accessorKey: 'label', header: 'Label', enableGlobalFilter: false },
      { accessorKey: 'mixed', header: 'Mixed', cell: () => null },
    ]

    const cases: Array<{ query: string; timeZone: string; expected: string[] }> = [
      { query: 'true', timeZone: 'UTC', expected: ['m2'] },
      { query: '12', timeZone: 'UTC', expected: ['m3', 'm6'] },
      { query: '2024-03-06', timeZone: 'Australia/Sydney', expected: ['m4'] },
      { query: '2024-03-06', timeZone: 'UTC', expected: [] },
      { query: 'false', timeZone: 'UTC', expected: [] },
      { query: 'nan', timeZone: 'UTC', expected: [] },
      { query: '   ', timeZone: 'UTC', expected: rows.map((row) => row.id) },
    ]

    for (const { query, timeZone, expected } of cases) {
      it(`"${query}" in ${timeZone}`, () => {
        render(
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            globalFilter={query}
            pageSize={50}
            timeZone={timeZone}
          />,
        )
        const server = applyQuery(rows, { globalFilter: query, pageSize: 50 }, { columns, timeZone })
        expect(server.rows.map((row) => row.id)).toEqual(expected)
        expect(renderedRowIds()).toEqual(expected)
      })
    }
  })

  describe("sorting a number column with 'n/a' values", () => {
    interface Priced {
      id: string
      price: number | string | null
    }

    const rows: Priced[] = [
      { id: 'p1', price: 'n/a' },
      { id: 'p2', price: 40 },
      { id: 'p3', price: null },
      { id: 'p4', price: '15' },
      { id: 'p5', price: 'n/a' },
      { id: 'p6', price: 300 },
    ]
    const columns: ColumnDef<Priced>[] = [
      { accessorKey: 'id', header: 'Id' },
      { accessorKey: 'price', header: 'Price', sortingFn: 'number' },
    ]

    const cases = [
      // Unreadable values sort last in both directions, in input order.
      { desc: true, expected: ['p6', 'p2', 'p4', 'p1', 'p3', 'p5'] },
      { desc: false, expected: ['p4', 'p2', 'p6', 'p1', 'p3', 'p5'] },
    ]

    for (const { desc, expected } of cases) {
      it(desc ? 'descending' : 'ascending', () => {
        const sorting = [{ id: 'price', desc }]
        render(
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            sorting={sorting}
            pageSize={50}
          />,
        )
        const server = applyQuery(rows, { sorting, pageSize: 50 }, { columns })
        expect(server.rows.map((row) => row.id)).toEqual(expected)
        expect(renderedRowIds()).toEqual(expected)
      })
    }
  })
})

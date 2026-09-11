import { tableToCsv } from '@shining-technologies/ui-kit-export-csv'
import { DataTable, type ColumnDef } from '@shining-technologies/ui-kit-react'
import { VirtualizedDataTable } from '@shining-technologies/ui-kit-react/virtualized'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { makeUsers, userColumns, users, type User } from './fixtures'

type Table<T> = Parameters<typeof tableToCsv<T>>[0]

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-sui-row]'))
const rowIndexes = () => bodyRows().map((row) => row.getAttribute('aria-rowindex'))
const lastQuery = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls[fn.mock.calls.length - 1]?.[0] as { pageIndex: number }

const footedColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'score', header: 'Score', footer: '393' },
]

// ------------------------------------------------------------ roles (item 1)
describe('explicit table roles', () => {
  it('states a role on every part, native elements included', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={footedColumns}
        label="Users"
        getRowId={(row) => row.id}
        defaultExpanded={{ '1': true }}
        renderExpandedRow={() => <p>Details</p>}
      />,
    )
    expect(container.querySelector('table')).toHaveAttribute('role', 'table')
    for (const section of container.querySelectorAll('thead, tbody, tfoot')) {
      expect(section).toHaveAttribute('role', 'rowgroup')
    }
    for (const row of container.querySelectorAll('tr')) {
      expect(row).toHaveAttribute('role', 'row')
    }
    for (const head of container.querySelectorAll('th')) {
      expect(head).toHaveAttribute('role', 'columnheader')
    }
    for (const cell of container.querySelectorAll('td')) {
      expect(cell).toHaveAttribute('role', 'cell')
    }
  })

  it('states them on the empty and error rows too', () => {
    const { container, rerender } = render(<DataTable data={[]} columns={userColumns} />)
    expect(container.querySelector('.sui-state-row')).toHaveAttribute('role', 'row')
    expect(container.querySelector('.sui-state-cell')).toHaveAttribute('role', 'cell')
    rerender(<DataTable data={[]} columns={userColumns} error="Nope" />)
    expect(container.querySelector('.sui-state-cell')).toHaveAttribute('role', 'cell')
  })

  it('renders no card labels for a table that never becomes cards', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(container.querySelector('.sui-td__label')).toBeNull()
    expect(screen.getAllByRole('cell')[0]).toHaveAccessibleName('Ada Lovelace')
  })
})

// ------------------------------------------------------ card layout (item 1)
/**
 * The card layout is CSS, so these tests load the real stylesheet and narrow
 * the window: happy-dom evaluates the media query, so what the accessibility
 * tree sees is what a browser at phone width would build.
 */
describe('card layout, with the stylesheet applied', () => {
  const view = window as unknown as {
    happyDOM: { setViewport: (viewport: { width: number; height: number }) => void }
  }
  let style: HTMLStyleElement

  beforeAll(() => {
    style = document.createElement('style')
    style.textContent = readFileSync(
      resolve(process.cwd(), 'packages/react/src/styles/table.css'),
      'utf8',
    )
    document.head.appendChild(style)
  })
  afterAll(() => style.remove())
  afterEach(() => view.happyDOM.setViewport({ width: 1024, height: 768 }))

  const narrow = () => view.happyDOM.setViewport({ width: 500, height: 800 })

  const cardColumns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email', meta: { hideLabelInCards: true } },
    { accessorKey: 'score', header: 'Score', footer: '393', meta: { label: 'Points' } },
  ]

  it('keeps the table, its rows and its cells in the accessibility tree', () => {
    narrow()
    const { container } = render(
      <DataTable data={users} columns={cardColumns} responsiveMode="cards" label="Users" />,
    )
    // The card rules are live: the header row is gone from the tree.
    expect(getComputedStyle(container.querySelector('thead')!).display).toBe('none')
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)

    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    // Five cards and the footer's card.
    expect(rows).toHaveLength(6)
    const cells = within(rows[0]!).getAllByRole('cell')
    expect(cells).toHaveLength(3)
    // Each cell carries its column's name, which a card is otherwise missing.
    expect(cells[0]).toHaveAccessibleName('Name Ada Lovelace')
    expect(cells[2]).toHaveAccessibleName('Points 92')
    // `hideLabelInCards` hides the name from sight, not from a screen reader.
    expect(cells[1]).toHaveAccessibleName('Email ada@example.com')
    expect(cells[1]!.querySelector('.sui-td__label--hidden')).not.toBeNull()
    // The footer total says what it totals.
    expect(within(rows[5]!).getByRole('cell', { name: 'Points 393' })).toBeInTheDocument()
  })

  it('shows the label on the card and hides it in the table layout', () => {
    const table = <DataTable data={users} columns={cardColumns} responsiveMode="cards" />
    const label = () => document.querySelector('td[data-column-id="name"] .sui-td__label')!

    // Wide: the column header names the cell, so the label would say it twice.
    const wide = render(table)
    expect(getComputedStyle(label()).display).toBe('none')
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
    expect(screen.getAllByRole('cell')[0]).toHaveAccessibleName('Ada Lovelace')
    wide.unmount()

    // (Rendered afresh: happy-dom does not recompute styles on a resize.)
    narrow()
    render(table)
    expect(getComputedStyle(label()).display).toBe('block')
    expect(screen.getAllByRole('cell')[0]).toHaveAccessibleName('Name Ada Lovelace')
  })

  it('has no axe violations as cards', async () => {
    narrow()
    const { container } = render(
      <DataTable
        data={users}
        columns={cardColumns}
        responsiveMode="cards"
        label="Users"
        getRowId={(row) => row.id}
        enableRowSelection
        defaultExpanded={{ '2': true }}
        renderExpandedRow={(row) => <p>Details for {row.original.name}</p>}
        rowActions={() => <button type="button">Edit</button>}
      />,
    )
    expect(getComputedStyle(container.querySelector('tbody tr')!).display).toBe('flex')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations as a table with card labels in it', async () => {
    const { container } = render(
      <DataTable data={users} columns={cardColumns} responsiveMode="auto" label="Users" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ------------------------------------------------ aria-rowcount (item 2)
describe('aria-rowcount and aria-rowindex', () => {
  it('counts the header row and offsets client pages', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} label="Users" pageSize={2} />)
    // One header row and five data rows.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '6')
    expect(document.querySelector('thead tr')).toHaveAttribute('aria-rowindex', '1')
    expect(rowIndexes()).toEqual(['2', '3'])

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(rowIndexes()).toEqual(['4', '5'])
    await user.click(screen.getByRole('button', { name: 'Go to last page' }))
    expect(rowIndexes()).toEqual(['6'])
  })

  it('counts footer rows and indexes them last', () => {
    render(<DataTable data={users} columns={footedColumns} label="Users" pageSize={2} />)
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '7')
    expect(document.querySelector('tfoot tr')).toHaveAttribute('aria-rowindex', '7')
  })

  it('offsets server pages by the page start and counts the server total', () => {
    render(
      <DataTable
        data={users}
        columns={footedColumns}
        label="Users"
        mode="server"
        rowCount={100}
        pageSize={5}
        defaultPagination={{ pageIndex: 3, pageSize: 5 }}
      />,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '102')
    expect(rowIndexes()).toEqual(['17', '18', '19', '20', '21'])
    expect(document.querySelector('tfoot tr')).toHaveAttribute('aria-rowindex', '102')
  })

  it('reports an unknown total as -1 when the server has not given one', () => {
    render(
      <DataTable
        data={users}
        columns={footedColumns}
        label="Users"
        mode="server"
        pageSize={5}
        defaultPagination={{ pageIndex: 1, pageSize: 5 }}
      />,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '-1')
    expect(rowIndexes()[0]).toBe('7')
    expect(document.querySelector('tfoot tr')).not.toHaveAttribute('aria-rowindex')
  })

  it('counts a grouped header as several rows', () => {
    render(
      <DataTable
        data={users}
        label="Users"
        columns={[
          {
            id: 'person',
            header: 'Person',
            columns: [
              { accessorKey: 'name', header: 'Name' },
              { accessorKey: 'email', header: 'Email' },
            ],
          },
        ]}
      />,
    )
    const heads = document.querySelectorAll('thead tr')
    expect(heads).toHaveLength(2)
    expect(heads[1]).toHaveAttribute('aria-rowindex', '2')
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '7')
    expect(rowIndexes()[0]).toBe('3')
  })

  it('counts open detail rows and places each after its row', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        pageSize={2}
        getRowId={(row) => row.id}
        defaultExpanded={{ '1': true }}
        renderExpandedRow={() => <p>Details</p>}
      />,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '7')
    expect(rowIndexes()).toEqual(['2', '4'])
    expect(document.querySelector('[data-sui-expanded-row]')).toHaveAttribute('aria-rowindex', '3')

    // The detail row on page 1 still pushes page 2 down.
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(rowIndexes()).toEqual(['5', '6'])
  })

  it('leaves the count off when there are no rows to count', () => {
    const { rerender } = render(<DataTable data={[]} columns={userColumns} label="Users" />)
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount')
    expect(document.querySelector('thead tr')).not.toHaveAttribute('aria-rowindex')
    rerender(<DataTable data={users} columns={userColumns} label="Users" error="Nope" />)
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount')
  })
})

// ------------------------------------------------------ readonly data (item 3)
describe('read-only data', () => {
  it('accepts readonly arrays for data and columns, in both tables', () => {
    const frozen: readonly User[] = Object.freeze([...users])
    const columns: readonly ColumnDef<User>[] = Object.freeze([...userColumns])
    render(
      <>
        <DataTable data={frozen} columns={columns} label="Frozen" />
        <VirtualizedDataTable data={frozen} columns={columns} label="Frozen, virtualized" />
      </>,
    )
    expect(screen.getByRole('table', { name: 'Frozen' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Frozen, virtualized' })).toBeInTheDocument()
  })
})

// ------------------------------------------------------------ csv (item 4)
describe('CSV export of rows the table does not hold', () => {
  const everything = makeUsers(20)
  const csvColumns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name' },
    { id: 'contact', header: 'Email', accessorFn: (row) => row.email },
    { accessorKey: 'score', header: 'Score' },
  ]

  function captureServerTable(selection: Record<string, boolean>) {
    let captured: Table<User> | undefined
    render(
      <DataTable
        // The page the server sent: rows 6–10 of 20.
        data={everything.slice(5, 10)}
        columns={csvColumns}
        mode="server"
        rowCount={everything.length}
        pageSize={5}
        defaultPagination={{ pageIndex: 1, pageSize: 5 }}
        getRowId={(row) => row.id}
        enableRowSelection
        defaultRowSelection={selection}
        slots={{
          toolbarActions: ({ table }) => {
            captured = table
            return null
          },
        }}
      />,
    )
    return captured!
  }

  it('exports every row it is given, through the table columns', () => {
    const table = captureServerTable({})
    const lines = tableToCsv(table, { data: everything }).split('\r\n')
    expect(lines).toHaveLength(21)
    expect(lines[0]).toBe('Name,Email,Score')
    expect(lines[1]).toBe('User 0001,user1@example.com,0')
    expect(lines[20]).toBe(`User 0020,user20@example.com,${(19 * 7) % 101}`)
  })

  it('exports selections made on pages that are no longer loaded', () => {
    const table = captureServerTable({ '2': true, '7': true, '19': true })
    // Without `data`, only the loaded page is known.
    expect(tableToCsv(table, { rows: 'selected' }).split('\r\n').slice(1)).toEqual([
      'User 0007,user7@example.com,42',
    ])
    const lines = tableToCsv(table, { rows: 'selected', data: everything }).split('\r\n')
    expect(lines.slice(1).map((line) => line.split(',')[0])).toEqual([
      'User 0002',
      'User 0007',
      'User 0019',
    ])
  })

  it('applies formatValue to the given rows, and leaves `page` to the screen', () => {
    const table = captureServerTable({})
    const formatted = tableToCsv(table, {
      data: everything.slice(0, 1),
      columnIds: ['name'],
      formatValue: (value, columnId, row) => `${columnId}:${String(value)}:${row.id}`,
    })
    expect(formatted.split('\r\n')[1]).toBe('name:User 0001:1')
    expect(tableToCsv(table, { rows: 'page', data: everything }).split('\r\n')).toHaveLength(6)
  })
})

// ---------------------------------------------------- matchMedia (item 5)
describe('responsive columns on a MediaQueryList without addEventListener', () => {
  it('falls back to addListener and removeListener', () => {
    let width = 1200
    const listeners = new Set<() => void>()
    const addListener = vi.fn((listener: () => void) => listeners.add(listener))
    const removeListener = vi.fn((listener: () => void) => listeners.delete(listener))
    const spy = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          get matches() {
            const max = /max-width:\s*(\d+)px/.exec(query)
            return max ? width <= Number(max[1]) : false
          },
          media: query,
          // Safari 13: no addEventListener / removeEventListener.
          addListener,
          removeListener,
        }) as unknown as MediaQueryList,
    )
    try {
      const { container, unmount } = render(
        <DataTable
          data={users}
          columns={[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'email', header: 'Email', meta: { responsive: { hideBelow: 'md' } } },
          ]}
        />,
      )
      expect(container.querySelector('td[data-column-id="email"]')).not.toBeNull()
      expect(addListener).toHaveBeenCalled()

      width = 500
      act(() => listeners.forEach((listener) => listener()))
      expect(container.querySelector('td[data-column-id="email"]')).toBeNull()

      unmount()
      expect(removeListener).toHaveBeenCalled()
      expect(listeners.size).toBe(0)
    } finally {
      spy.mockRestore()
    }
  })
})

// ------------------------------------------------ server step-back (item 6)
describe('server total dropping to zero', () => {
  it('returns to the first page', async () => {
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

    rerender(<DataTable {...props} data={[]} rowCount={0} />)
    await waitFor(() => expect(lastQuery(onQueryChange).pageIndex).toBe(0))
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })
})

// ------------------------------------------------------- other defects (7)
describe('the column resize grip', () => {
  it('reports its value, as a focusable separator must', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataTable
        data={users}
        label="Users"
        columns={[
          { accessorKey: 'name', header: 'Name', size: 200, enableResizing: true },
          { accessorKey: 'email', header: 'Email' },
        ]}
      />,
    )
    const grip = screen.getByRole('separator', { name: 'Resize Name' })
    expect(grip).toHaveAttribute('aria-valuenow', '200')
    expect(grip).toHaveAttribute('aria-valuemin', '56')
    expect(grip).toHaveAttribute('aria-valuemax', '900')
    expect(await axe(container)).toHaveNoViolations()

    grip.focus()
    await user.keyboard('{ArrowRight}')
    expect(grip).toHaveAttribute('aria-valuenow', '208')
  })
})

describe('keyboard navigation around disabled rows', () => {
  const inactive = (row: User) => row.status === 'inactive'

  it('does not park the only tab stop on a disabled row', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        enableRowSelection
        isRowDisabled={(row: User) => row.id === '1'}
      />,
    )
    const rows = bodyRows()
    expect(rows[0]).not.toHaveAttribute('tabindex')
    expect(rows[1]).toHaveAttribute('tabindex', '0')
    expect(rows.filter((row) => row.getAttribute('tabindex') === '0')).toHaveLength(1)
  })

  it('steps over disabled rows instead of stopping at them', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        enableRowSelection
        isRowDisabled={inactive}
      />,
    )
    // Alan Turing (3rd) and Barbara Liskov (5th) are inactive.
    const rows = bodyRows()
    rows[1]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[3])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(rows[1])
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(rows[3])
    // Nothing enabled below: stay put rather than lose focus.
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[3])
  })
})

describe('footer cells on cards', () => {
  it('leave a column hidden in cards off the footer card too', () => {
    const { container } = render(
      <DataTable
        data={users}
        responsiveMode="cards"
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'score', header: 'Score', footer: '393', meta: { hideInCards: true } },
        ]}
      />,
    )
    expect(container.querySelector('tfoot td[data-column-id="score"]')).toHaveClass(
      'sui-hide-in-cards',
    )
  })
})

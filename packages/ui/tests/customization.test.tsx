import {
  DataTable,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
  cn,
  createColumnHelper,
  useDataTable,
  type CellProps,
  type ColumnDef,
  type RowProps,
} from '@shining-technologies/ui'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CSSProperties } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userColumns, users, type User } from './fixtures'

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-sui-row]'))

describe('component overrides', () => {
  it('replaces the row without breaking sorting, selection or a11y', async () => {
    const user = userEvent.setup()

    // The canonical custom row: spread the prop bag, add your own styling.
    const CustomRow = ({ rowProps, children, isSelected }: RowProps<User>) => (
      <tr {...rowProps} className={cn(rowProps.className, 'my-row')} data-custom="yes">
        {children}
        <td data-testid="extra">{isSelected ? 'selected' : 'not selected'}</td>
      </tr>
    )

    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        components={{ Row: CustomRow }}
      />,
    )

    expect(bodyRows()[0]).toHaveClass('my-row')
    expect(bodyRows()[0]).toHaveAttribute('data-custom', 'yes')

    // Sorting still works through the untouched header.
    await user.click(screen.getByRole('button', { name: /^Name, / }))
    expect(document.querySelectorAll('tbody td[data-column-id="name"]')[0]?.textContent).toBe(
      'Ada Lovelace',
    )

    // Selection still works, and the ARIA state is still applied.
    await user.click(screen.getByRole('checkbox', { name: 'Select row 2' }))
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByTestId('extra')[1]).toHaveTextContent('selected')
  })

  it('replaces a cell while keeping the rendered content', () => {
    const CustomCell = ({ cellProps, children }: CellProps<User>) => (
      <td {...cellProps} data-custom-cell="">
        <em>{children}</em>
      </td>
    )
    render(<DataTable data={users} columns={userColumns} components={{ Cell: CustomCell }} />)
    expect(document.querySelectorAll('td[data-custom-cell]').length).toBeGreaterThan(0)
    expect(screen.getByText('Ada Lovelace').tagName).toBe('EM')
  })

  it('replaces the whole toolbar', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        components={{ Toolbar: () => <div data-testid="toolbar">My toolbar</div> }}
      />,
    )
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('replaces pagination while the table keeps paging', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        pageSize={2}
        components={{
          Pagination: ({ table }) => (
            <button type="button" onClick={() => table.nextPage()}>
              More
            </button>
          ),
        }}
      />,
    )
    expect(bodyRows()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
  })

  it('replaces the header cell', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        components={{
          HeaderCell: ({ cellProps, children }) => (
            <th {...cellProps} data-custom-header="">
              {children}
            </th>
          ),
        }}
      />,
    )
    expect(document.querySelectorAll('th[data-custom-header]')).toHaveLength(6)
  })
})

describe('slots', () => {
  it('renders content around the table', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        slots={{
          beforeTable: <p>Before</p>,
          afterTable: ({ table }) => <p>After: {table.getRowModel().rows.length} rows</p>,
          toolbarActions: <button type="button">Export</button>,
        }}
      />,
    )
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After: 5 rows')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })

  it('replaces the empty state through the shorthand prop', () => {
    render(<DataTable data={[]} columns={userColumns} emptyState={<p>Nothing at all</p>} />)
    expect(screen.getByText('Nothing at all')).toBeInTheDocument()
    expect(screen.queryByText('No results')).not.toBeInTheDocument()
  })
})

describe('composable toolbar', () => {
  it('lets the toolbar be assembled by hand', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        slots={{
          toolbar: (
            <DataTableToolbar>
              <DataTableSearch />
              <span data-testid="mine">Mine</span>
              <DataTableViewOptions />
            </DataTableToolbar>
          ),
        }}
      />,
    )
    expect(screen.getByRole('searchbox', { name: 'Search table' })).toBeInTheDocument()
    expect(screen.getByTestId('mine')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Columns,/ })).toBeInTheDocument()
    // The default filter button is not part of this custom arrangement.
    expect(screen.queryByRole('button', { name: /^Filters,/ })).not.toBeInTheDocument()
  })

  it('exposes the live table through useDataTable', async () => {
    const user = userEvent.setup()

    function SelectionCount() {
      const { table } = useDataTable<User>()
      return <p data-testid="count">{table.getSelectedRowModel().rows.length} picked</p>
    }

    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        slots={{ afterTable: <SelectionCount /> }}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    expect(screen.getByTestId('count')).toHaveTextContent('1 picked')
  })
})

describe('class and theme overrides', () => {
  it('applies every className hook', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        className="root-x"
        tableClassName="table-x"
        headerClassName="head-x"
        bodyClassName="body-x"
        rowClassName={(row) => (row.original.status === 'inactive' ? 'row-inactive' : undefined)}
        cellClassName="cell-x"
        classNames={{ toolbar: 'toolbar-x', pagination: 'pagination-x' }}
      />,
    )
    expect(container.querySelector('.sui-root')).toHaveClass('root-x')
    expect(container.querySelector('table')).toHaveClass('table-x')
    expect(container.querySelector('thead')).toHaveClass('head-x')
    expect(container.querySelector('tbody')).toHaveClass('body-x')
    expect(container.querySelector('.sui-toolbar')).toHaveClass('toolbar-x')
    expect(container.querySelector('.sui-pagination')).toHaveClass('pagination-x')
    expect(bodyRows()[2]).toHaveClass('row-inactive')
    expect(container.querySelectorAll('td.cell-x').length).toBeGreaterThan(0)
  })

  // V2: the `theme` prop is gone; the same tokens are set as CSS variables
  // through `style`, and density is its own prop.
  it('writes theme tokens as CSS variables on the root', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        style={
          {
            '--sui-header-background': '#111827',
            '--sui-row-hover': '#1f2937',
            '--radius-lg': '12px',
          } as CSSProperties
        }
        density="spacious"
      />,
    )
    const root = container.querySelector<HTMLElement>('.sui-root')!
    expect(root.style.getPropertyValue('--sui-header-background')).toBe('#111827')
    expect(root.style.getPropertyValue('--sui-row-hover')).toBe('#1f2937')
    expect(root.style.getPropertyValue('--radius-lg')).toBe('12px')
    expect(root).toHaveAttribute('data-density', 'spacious')
  })
})

describe('typed columns', () => {
  it('infers the value type through the column helper', () => {
    const column = createColumnHelper<User>()
    const columns: ColumnDef<User>[] = [
      column.accessor('name', { header: 'Name' }),
      column.computed('initials', (row) => row.name.slice(0, 2).toUpperCase(), {
        header: 'Initials',
        // `value` is a string here because `computed` inferred it.
        cell: ({ value }) => <span data-testid="initials">{value.toLowerCase()}</span>,
      }),
      column.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <button type="button">Do {row.original.name}</button>,
      }),
    ]

    render(<DataTable data={users} columns={columns} />)
    expect(screen.getAllByTestId('initials')[0]).toHaveTextContent('ad')
    expect(screen.getByRole('button', { name: 'Do Ada Lovelace' })).toBeInTheDocument()
  })
})

describe('column visibility', () => {
  it('hides a column from the picker and restores it', async () => {
    const user = userEvent.setup()
    const onColumnVisibilityChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Columns,/ }))
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Email' }))
    // The menu is modal, so the table behind it is aria-hidden until it closes.
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.getAllByRole('columnheader')).toHaveLength(5))
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ email: false })
  })

  it('honours defaultVisible on a column', () => {
    render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email', defaultVisible: false },
        ]}
      />,
    )
    expect(screen.getAllByRole('columnheader')).toHaveLength(1)
  })
})

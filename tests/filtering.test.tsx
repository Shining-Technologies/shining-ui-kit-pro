import { DataTable, type ColumnFiltersState } from '@shining-ui-kit/react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userColumns, users } from './fixtures'

const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

describe('global search', () => {
  it('narrows rows as you type, ignoring case', async () => {
    const user = userEvent.setup()
    render(
      <DataTable data={users} columns={userColumns} features={{ filtering: { debounceMs: 0 } }} />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'grace')
    await waitFor(() => expect(bodyRows()).toHaveLength(1))
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('offers to clear filters from the empty state', async () => {
    const user = userEvent.setup()
    render(
      <DataTable data={users} columns={userColumns} features={{ filtering: { debounceMs: 0 } }} />,
    )

    const search = screen.getByRole('searchbox', { name: 'Search table' })
    await user.type(search, 'nobody-matches-this')
    await waitFor(() => expect(screen.getByText('No results')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(bodyRows()).toHaveLength(5))
    expect(search).toHaveValue('')
  })

  it('reports the search term through onGlobalFilterChange', async () => {
    const user = userEvent.setup()
    const onGlobalFilterChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        features={{ filtering: { debounceMs: 0 } }}
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    )
    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'ada')
    await waitFor(() => expect(onGlobalFilterChange).toHaveBeenCalledWith('ada'))
  })
})

describe('column filters', () => {
  it('filters from controlled state without any UI interaction', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[{ id: 'role', value: { operator: 'equals', value: 'admin' } }]}
      />,
    )
    expect(bodyRows()).toHaveLength(2)
  })

  it('accepts a bare value and pairs it with the type default operator', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[{ id: 'name', value: 'turing' }]}
      />,
    )
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
  })

  it('applies number operators', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[{ id: 'score', value: { operator: 'greaterThanOrEqual', value: 80 } }]}
      />,
    )
    expect(bodyRows()).toHaveLength(2)
  })

  it('applies date ranges inclusively', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        columnFilters={[
          { id: 'createdAt', value: { operator: 'between', value: ['2024-01-01', '2024-02-20'] } },
        ]}
      />,
    )
    expect(bodyRows()).toHaveLength(2)
  })

  it('shows a chip per active filter and removes it on demand', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [filters, setFilters] = useState<ColumnFiltersState>([
        { id: 'role', value: { operator: 'equals', value: 'admin' } },
      ])
      return (
        <DataTable
          data={users}
          columns={userColumns}
          columnFilters={filters}
          onColumnFiltersChange={setFilters}
        />
      )
    }

    render(<Controlled />)
    expect(bodyRows()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Remove Role filter' }))
    await waitFor(() => expect(bodyRows()).toHaveLength(5))
  })

  it('drives the filter panel and reports structured values', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Filters,/ }))
    const statusValue = await screen.findByRole('combobox', { name: 'Status value' })
    await user.click(statusValue)
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))

    await waitFor(() => expect(bodyRows()).toHaveLength(2))
    expect(onColumnFiltersChange).toHaveBeenCalledWith([
      { id: 'status', value: { operator: 'equals', value: 'inactive' } },
    ])
  })

  it('leaves rows untouched in server mode', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        columnFilters={[{ id: 'role', value: { operator: 'equals', value: 'admin' } }]}
      />,
    )
    expect(bodyRows()).toHaveLength(5)
  })
})

describe('inline filter layout', () => {
  it('lays one control out per filterable column and applies it in place', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        filterLayout="inline"
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    // No "Filter" button to open: every filter is already on screen.
    expect(screen.queryByRole('button', { name: /^Filters,/ })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Role filter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Score filter' })).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status filter' }))
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))

    await waitFor(() => expect(bodyRows()).toHaveLength(2))
    expect(onColumnFiltersChange).toHaveBeenCalledWith([
      { id: 'status', value: { operator: 'equals', value: 'inactive' } },
    ])
  })

  it('writes a range filter as `between`, whatever the column default is', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        filterLayout="inline"
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Score filter' }))
    await user.type(await screen.findByRole('spinbutton', { name: 'Score minimum' }), '80')

    await waitFor(() => expect(bodyRows()).toHaveLength(2))
    expect(onColumnFiltersChange).toHaveBeenLastCalledWith([
      { id: 'score', value: { operator: 'between', value: [80, undefined] } },
    ])
  })

  it('clears the filter when both ends of a range are emptied', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} filterLayout="inline" />)

    await user.click(screen.getByRole('button', { name: 'Score filter' }))
    const from = await screen.findByRole('spinbutton', { name: 'Score minimum' })
    await user.type(from, '80')
    await waitFor(() => expect(bodyRows()).toHaveLength(2))

    await user.clear(from)
    await waitFor(() => expect(bodyRows()).toHaveLength(5))
  })
})

describe('clearing filters', () => {
  it('offers a clear button only once something is filtered', async () => {
    const user = userEvent.setup()
    render(
      <DataTable data={users} columns={userColumns} features={{ filtering: { debounceMs: 0 } }} />,
    )
    expect(screen.queryByRole('button', { name: /^Clear \d+ filters?$/ })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search table' }), 'ada')
    const clear = await screen.findByRole('button', { name: 'Clear 1 filter' })

    await user.click(clear)
    await waitFor(() => expect(bodyRows()).toHaveLength(5))
    expect(screen.queryByRole('button', { name: /^Clear \d+ filters?$/ })).not.toBeInTheDocument()
  })

  it('counts every applied filter, search included', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        defaultGlobalFilter="a"
        defaultColumnFilters={[{ id: 'role', value: { operator: 'equals', value: 'admin' } }]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Clear 2 filters' })).toBeInTheDocument()
  })

  it('gives every active inline control its own way out', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} filterLayout="inline" />)

    expect(screen.queryByRole('button', { name: 'Clear Status filter' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status filter' }))
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))
    await waitFor(() => expect(bodyRows()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Clear Status filter' }))
    await waitFor(() => expect(bodyRows()).toHaveLength(5))
  })
})

describe('one search box', () => {
  it('drops a column text filter the search box already covers', () => {
    render(<DataTable data={users} columns={userColumns} filterLayout="inline" />)

    // `name` and `email` are plain text filters on globally searchable columns:
    // two more boxes that do what the one search box already does.
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
    expect(screen.queryByRole('textbox', { name: 'Name filter' })).not.toBeInTheDocument()
  })

  it('keeps a text filter the search box cannot do', () => {
    render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', filter: { type: 'text' } },
          // Not searchable globally, so its own filter is the only way in.
          {
            accessorKey: 'email',
            header: 'Email',
            enableGlobalFilter: false,
            filter: { type: 'text' },
          },
          // Asks for an operator the search box does not offer.
          {
            accessorKey: 'role',
            header: 'Role',
            filter: { type: 'text', defaultOperator: 'startsWith' },
          },
        ]}
        filterLayout="inline"
      />,
    )
    expect(screen.queryByRole('textbox', { name: 'Name filter' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email filter' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Role filter' })).toBeInTheDocument()
  })
})

describe('the date filter', () => {
  it('offers presets, two labelled ends and a way out', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        filterLayout="inline"
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Created filter' }))
    expect(await screen.findByRole('button', { name: 'Last 7 days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Created from' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Created to' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'This month' }))
    await waitFor(() => {
      const filters = onColumnFiltersChange.mock.lastCall?.[0] ?? []
      expect(filters[0].value.operator).toBe('between')
      expect(filters[0].value.value).toHaveLength(2)
    })
  })

  it('picks a day from the kit’s own calendar', async () => {
    const user = userEvent.setup()
    const onColumnFiltersChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        filterLayout="inline"
        onColumnFiltersChange={onColumnFiltersChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Created filter' }))
    await user.click(await screen.findByRole('button', { name: 'Created from' }))

    const grid = await screen.findByRole('grid', { name: 'Created from' })
    const day = within(grid)
      .getAllByRole('button')
      .find((button) => button.textContent === '15')!
    await user.click(day)

    await waitFor(() => {
      const filters = onColumnFiltersChange.mock.lastCall?.[0] ?? []
      expect(String(filters[0].value.value[0])).toMatch(/^\d{4}-\d{2}-15$/)
    })
  })
})

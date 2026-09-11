import { DataTable, type DataTableQuery, type PaginationState } from '@shining-technologies/ui-kit-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, users } from './fixtures'

const bodyRows = () => document.querySelectorAll('tbody tr[data-sui-row]')

// Built once. A `data` array recreated on every render changes identity, and the
// engine treats that as "new data" and resets the page — see docs/performance.md.
const manyUsers = makeUsers(50)

describe('client pagination', () => {
  it('shows only one page and reports the visible range', () => {
    render(<DataTable data={makeUsers(95)} columns={userColumns} pageSize={10} />)
    expect(bodyRows()).toHaveLength(10)
    expect(screen.getByText('Showing 1–10 of 95')).toBeInTheDocument()
  })

  it('moves between pages with the controls', async () => {
    const user = userEvent.setup()
    render(<DataTable data={makeUsers(95)} columns={userColumns} pageSize={10} />)

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByText('Showing 11–20 of 95')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to last page' }))
    expect(screen.getByText('Showing 91–95 of 95')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Go to first page' }))
    expect(screen.getByText('Showing 1–10 of 95')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
  })

  it('jumps straight to a numbered page and marks it current', async () => {
    const user = userEvent.setup()
    render(<DataTable data={makeUsers(95)} columns={userColumns} pageSize={10} />)

    await user.click(screen.getByRole('button', { name: 'Go to page 3' }))
    expect(screen.getByText('Showing 21–30 of 95')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('changes the page size and returns to the first page', async () => {
    const user = userEvent.setup()
    render(<DataTable data={makeUsers(95)} columns={userColumns} pageSize={10} />)

    await user.click(screen.getByRole('button', { name: 'Go to page 3' }))
    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    await user.click(await screen.findByRole('option', { name: '25' }))

    await waitFor(() => expect(bodyRows()).toHaveLength(25))
    expect(screen.getByText('Showing 1–25 of 95')).toBeInTheDocument()
  })

  it('can be turned off entirely', () => {
    render(
      <DataTable
        data={makeUsers(30)}
        columns={userColumns}
        features={{ pagination: { enabled: false } }}
      />,
    )
    expect(bodyRows()).toHaveLength(30)
    expect(screen.queryByRole('navigation', { name: 'Table pagination' })).not.toBeInTheDocument()
  })

  it('works as controlled state', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 })
      return (
        <>
          <output data-testid="page">{pagination.pageIndex}</output>
          <DataTable
            data={manyUsers}
            columns={userColumns}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </>
      )
    }

    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
  })
})

describe('server pagination', () => {
  it('derives the page count from rowCount without slicing the data', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        rowCount={1240}
        pageSize={5}
        defaultPagination={{ pageIndex: 4, pageSize: 5 }}
      />,
    )
    expect(bodyRows()).toHaveLength(5)
    expect(screen.getByText('Showing 21–25 of 1,240')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 248' })).toBeInTheDocument()
  })

  it('emits a consolidated query on mount and on every change', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn<(query: DataTableQuery) => void>()

    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        rowCount={100}
        pageSize={10}
        onQueryChange={onQueryChange}
      />,
    )

    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))
    expect(onQueryChange).toHaveBeenCalledWith({
      pageIndex: 0,
      pageSize: 10,
      sorting: [],
      columnFilters: [],
      globalFilter: '',
    })

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(2))
    expect(onQueryChange.mock.calls[1]?.[0]).toMatchObject({ pageIndex: 1, pageSize: 10 })
  })

  it('does not re-emit when unrelated props change', async () => {
    const onQueryChange = vi.fn()
    const { rerender } = render(
      <DataTable data={users} columns={userColumns} mode="server" onQueryChange={onQueryChange} />,
    )
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledTimes(1))

    rerender(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        onQueryChange={onQueryChange}
        className="changed"
      />,
    )
    expect(onQueryChange).toHaveBeenCalledTimes(1)
  })
})

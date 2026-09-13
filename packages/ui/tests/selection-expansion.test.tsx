import { DataTable, type RowSelectionState } from '@shining-technologies/ui'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, users, type User } from './fixtures'

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-sui-row]'))

const manyUsers = makeUsers(20)

describe('row selection', () => {
  it('injects a checkbox column and selects individual rows', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
      />,
    )

    const rowCheckbox = screen.getByRole('checkbox', { name: 'Select row 2' })
    await user.click(rowCheckbox)

    expect(onRowSelectionChange).toHaveBeenCalledWith({ '2': true })
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true')
    expect(bodyRows()[1]).toHaveAttribute('data-state', 'selected')
  })

  it('selects and clears the whole page from the header checkbox', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
      />,
    )

    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows on this page' })
    await user.click(selectAll)
    expect(bodyRows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true)
    expect(screen.getByText('5 of 5 selected')).toBeInTheDocument()

    await user.click(selectAll)
    expect(bodyRows().every((row) => row.getAttribute('aria-selected') === 'false')).toBe(true)
  })

  it('reports a mixed state when only some rows are selected', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    expect(screen.getByRole('checkbox', { name: 'Select all rows on this page' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
  })

  it('allows only one row at a time in single mode', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        features={{ selection: { enabled: true, mode: 'single' } }}
      />,
    )

    expect(
      screen.queryByRole('checkbox', { name: 'Select all rows on this page' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select row 3' }))

    const selected = bodyRows().filter((row) => row.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
  })

  it('refuses to select rows the application marks unselectable', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        isRowDisabled={(row: User) => row.status === 'inactive'}
      />,
    )

    const disabled = screen.getByRole('checkbox', { name: 'Select row 3' })
    expect(disabled).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('works as controlled state and survives paging', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [selection, setSelection] = useState<RowSelectionState>({})
      return (
        <>
          <output data-testid="count">{Object.keys(selection).length}</output>
          <DataTable
            data={manyUsers}
            columns={userColumns}
            getRowId={(row) => row.id}
            enableRowSelection
            pageSize={5}
            rowSelection={selection}
            onRowSelectionChange={setSelection}
          />
        </>
      )
    }

    render(<Controlled />)
    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})

describe('expandable rows', () => {
  it('injects an expander and reveals detail content', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        renderExpandedRow={(row) => <p>Email: {row.original.email}</p>}
      />,
    )

    const toggle = screen.getAllByRole('button', { name: 'Expand row details' })[0]!
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(screen.getByText('Email: ada@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse row details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(bodyRows()[0]).toHaveAttribute('data-expanded', 'true')
  })

  it('points aria-controls at the detail row it reveals', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        renderExpandedRow={() => <p>Details</p>}
      />,
    )

    const toggle = screen.getAllByRole('button', { name: 'Expand row details' })[0]!
    const controls = toggle.getAttribute('aria-controls')
    await user.click(toggle)
    expect(document.getElementById(controls!)).toBeInTheDocument()
  })

  it('keeps only one row open in single mode', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        features={{ expanding: { mode: 'single' } }}
        renderExpandedRow={(row) => <p>Detail for {row.original.name}</p>}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: 'Expand row details' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Expand row details' })[0]!)

    await waitFor(() =>
      expect(document.querySelectorAll('tr[data-sui-expanded-row]')).toHaveLength(1),
    )
    expect(screen.getByText('Detail for Grace Hopper')).toBeInTheDocument()
  })

  it('coexists with selection on the same row', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        renderExpandedRow={() => <p>Details</p>}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: 'Expand row details' })[0]!)
    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))

    const row = bodyRows()[0]!
    expect(row).toHaveAttribute('aria-selected', 'true')
    expect(row).toHaveAttribute('data-expanded', 'true')
  })
})

describe('row actions', () => {
  it('renders an actions column that does not trigger the row click', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const onEdit = vi.fn()

    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        rowActions={(row) => (
          <button type="button" onClick={onEdit}>
            Edit {row.original.name}
          </button>
        )}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit Ada Lovelace' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('still fires the row click elsewhere in the row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<DataTable data={users} columns={userColumns} onRowClick={onRowClick} />)

    await user.click(screen.getByText('Ada Lovelace'))
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0]?.[0].original).toMatchObject({ name: 'Ada Lovelace' })
  })

  it('fires double click separately', async () => {
    const user = userEvent.setup()
    const onRowDoubleClick = vi.fn()
    render(<DataTable data={users} columns={userColumns} onRowDoubleClick={onRowDoubleClick} />)

    await user.dblClick(screen.getByText('Ada Lovelace'))
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('does not activate disabled rows', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        onRowClick={onRowClick}
        isRowDisabled={(row: User) => row.status === 'inactive'}
      />,
    )

    await user.click(screen.getByText('Alan Turing'))
    expect(onRowClick).not.toHaveBeenCalled()
    expect(within(bodyRows()[2]!).getByText('Alan Turing')).toBeInTheDocument()
    expect(bodyRows()[2]).toHaveAttribute('aria-disabled', 'true')
  })
})

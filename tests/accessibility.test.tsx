import { DataTable } from '@shining-technologies/ui-kit-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { userColumns, users, type User } from './fixtures'

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-sui-row]'))

describe('semantics', () => {
  it('has no axe violations in its default state', async () => {
    const { container } = render(<DataTable data={users} columns={userColumns} label="Users" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations with selection, expansion and actions enabled', async () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        getRowId={(row) => row.id}
        enableRowSelection
        renderExpandedRow={() => <p>Details</p>}
        rowActions={() => <button type="button">Edit</button>}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations in the empty, loading and error states', async () => {
    const empty = render(<DataTable data={[]} columns={userColumns} label="Users" />)
    expect(await axe(empty.container)).toHaveNoViolations()
    empty.unmount()

    const loading = render(<DataTable data={[]} columns={userColumns} label="Users" loading />)
    expect(await axe(loading.container)).toHaveNoViolations()
    loading.unmount()

    const failed = render(
      <DataTable data={[]} columns={userColumns} label="Users" error={new Error('Nope')} />,
    )
    expect(await axe(failed.container)).toHaveNoViolations()
  })

  it('names every interactive control', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        getRowId={(row) => row.id}
        enableRowSelection
      />,
    )

    for (const button of screen.getAllByRole('button')) {
      const name = button.getAttribute('aria-label') ?? button.textContent?.trim()
      expect(
        name,
        `button without an accessible name: ${button.outerHTML.slice(0, 80)}`,
      ).toBeTruthy()
    }
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toHaveAccessibleName()
    }
  })

  it('exposes the row count to assistive technology', () => {
    render(<DataTable data={users} columns={userColumns} label="Users" pageSize={2} />)
    // Every row of the table, per ARIA: the header row and the five data rows,
    // even though only two are rendered — and each rendered row says where it is.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '6')
    expect(bodyRows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3'])
  })
})

describe('keyboard navigation', () => {
  const interactive = (props = {}) =>
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        getRowId={(row) => row.id}
        enableRowSelection
        {...props}
      />,
    )

  it('gives the rows exactly one tab stop', () => {
    interactive()
    const rows = bodyRows()
    expect(rows[0]).toHaveAttribute('tabindex', '0')
    expect(rows.slice(1).every((row) => row.getAttribute('tabindex') === '-1')).toBe(true)
  })

  it('moves focus with the arrow keys, Home and End', async () => {
    const user = userEvent.setup()
    interactive()
    const rows = bodyRows()

    rows[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[1])

    await user.keyboard('{ArrowDown}{ArrowUp}')
    expect(document.activeElement).toBe(rows[1])

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(rows[4])

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(rows[0])
  })

  it('does not run past the ends', async () => {
    const user = userEvent.setup()
    interactive()
    const rows = bodyRows()

    rows[0]!.focus()
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(rows[0])

    rows[4]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[4])
  })

  it('toggles selection with Space', async () => {
    const user = userEvent.setup()
    interactive()
    const row = bodyRows()[0]!

    row.focus()
    await user.keyboard(' ')
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard(' ')
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('activates a row with Enter', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    interactive({ onRowClick })

    bodyRows()[2]!.focus()
    await user.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0]?.[0].original).toMatchObject({ name: 'Alan Turing' })
  })

  it('expands and collapses with the left and right arrows', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        getRowId={(row) => row.id}
        renderExpandedRow={(row) => <p>Detail for {row.original.name}</p>}
      />,
    )

    bodyRows()[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Detail for Ada Lovelace')).toBeInTheDocument()

    bodyRows()[0]!.focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.queryByText('Detail for Ada Lovelace')).not.toBeInTheDocument()
  })

  it('leaves keys alone for controls inside a row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    interactive({ onRowClick })

    const checkbox = screen.getByRole('checkbox', { name: 'Select row 1' })
    checkbox.focus()
    await user.keyboard('{Enter}')
    // The row's Enter handler must not fire from a focused control inside it.
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('does not make rows focusable when nothing is interactive', () => {
    render(<DataTable data={users} columns={userColumns} label="Users" />)
    expect(bodyRows().every((row) => !row.hasAttribute('tabindex'))).toBe(true)
  })

  it('reaches the sort control by keyboard', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} label="Users" />)

    const sort = screen.getByRole('button', { name: /^Name, / })
    sort.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })
})

describe('disabled rows', () => {
  it('marks them and keeps them out of selection', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        label="Users"
        getRowId={(row) => row.id}
        enableRowSelection
        isRowDisabled={(row: User) => row.status === 'inactive'}
      />,
    )
    expect(bodyRows()[2]).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('checkbox', { name: 'Select row 3' })).toBeDisabled()
  })
})

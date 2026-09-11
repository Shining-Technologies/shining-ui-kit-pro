import { DataTable, type SortingState } from '@shining-ui-kit/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userColumns, users } from './fixtures'

/** Read the first cell of every rendered body row, in order. */
function columnValues(columnId: string): string[] {
  return Array.from(document.querySelectorAll(`tbody td[data-column-id="${columnId}"]`)).map(
    (cell) => cell.textContent ?? '',
  )
}

const sortButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, `) })

describe('sorting', () => {
  it('cycles ascending, descending, then unsorted', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} />)

    const original = columnValues('name')

    await user.click(sortButton('Name'))
    expect(columnValues('name')).toEqual([
      'Ada Lovelace',
      'Alan Turing',
      'Barbara Liskov',
      'Grace Hopper',
      'Katherine Johnson',
    ])

    await user.click(sortButton('Name'))
    expect(columnValues('name')).toEqual([
      'Katherine Johnson',
      'Grace Hopper',
      'Barbara Liskov',
      'Alan Turing',
      'Ada Lovelace',
    ])

    await user.click(sortButton('Name'))
    expect(columnValues('name')).toEqual(original)
  })

  it('sorts numbers numerically, not as text', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} />)
    await user.click(sortButton('Score'))
    expect(columnValues('score')).toEqual(['64', '71', '78', '88', '92'])
  })

  it('reports sort state through aria-sort', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} />)

    const header = screen.getByRole('columnheader', { name: /Name/ })
    expect(header).toHaveAttribute('aria-sort', 'none')

    await user.click(sortButton('Name'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')

    await user.click(sortButton('Name'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
  })

  it('supports multi-column sorting with shift-click', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} />)

    await user.click(sortButton('Role'))
    await user.keyboard('{Shift>}')
    await user.click(sortButton('Name'))
    await user.keyboard('{/Shift}')

    // admin rows first (by name), then editors, then viewers.
    expect(columnValues('name')).toEqual([
      'Ada Lovelace',
      'Barbara Liskov',
      'Grace Hopper',
      'Katherine Johnson',
      'Alan Turing',
    ])
  })

  it('respects a column that opts out of sorting', () => {
    render(
      <DataTable
        data={users}
        columns={[{ accessorKey: 'name', header: 'Name', enableSorting: false }]}
      />,
    )
    expect(screen.queryByRole('button', { name: /^Name, / })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort')
  })

  it('leaves the rows alone in server mode but still reports the state', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        mode="server"
        onSortingChange={onSortingChange}
      />,
    )

    const before = columnValues('name')
    await user.click(sortButton('Name'))

    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }])
    expect(columnValues('name')).toEqual(before)
  })

  it('works as controlled state', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [sorting, setSorting] = useState<SortingState>([{ id: 'score', desc: true }])
      return (
        <>
          <output data-testid="state">{JSON.stringify(sorting)}</output>
          <DataTable
            data={users}
            columns={userColumns}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        </>
      )
    }

    render(<Controlled />)
    expect(columnValues('score')).toEqual(['92', '88', '78', '71', '64'])

    await user.click(sortButton('Name'))
    expect(screen.getByTestId('state')).toHaveTextContent('[{"id":"name","desc":false}]')
  })

  it('accepts the config-object form of the sorting prop', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        sorting={{ mode: 'server' }}
        onSortingChange={onSortingChange}
      />,
    )
    const before = columnValues('name')
    await user.click(sortButton('Name'))
    expect(onSortingChange).toHaveBeenCalled()
    expect(columnValues('name')).toEqual(before)
  })
})

import { DataTable, type ColumnDef } from '@shining-technologies/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { memo, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, type User } from './fixtures'

const tenThousand = makeUsers(10_000)
const oneThousand = makeUsers(1_000)

describe('large data sets', () => {
  it('renders only the current page, whatever the data size', () => {
    render(<DataTable data={tenThousand} columns={userColumns} pageSize={25} />)
    expect(document.querySelectorAll('tbody tr[data-sui-row]')).toHaveLength(25)
    expect(screen.getByText('Showing 1–25 of 10,000')).toBeInTheDocument()
  })

  it('paginates 10,000 rows without noticeable cost', () => {
    const { rerender } = render(
      <DataTable data={tenThousand} columns={userColumns} pageSize={50} />,
    )
    const start = performance.now()
    rerender(
      <DataTable
        data={tenThousand}
        columns={userColumns}
        pageSize={50}
        defaultPagination={{ pageIndex: 0, pageSize: 50 }}
      />,
    )
    // A generous ceiling: this is a regression guard, not a benchmark.
    expect(performance.now() - start).toBeLessThan(2_000)
  })

  it('sorts 1,000 rows and shows the new first row', async () => {
    const user = userEvent.setup()
    render(<DataTable data={oneThousand} columns={userColumns} pageSize={10} />)

    await user.click(screen.getByRole('button', { name: /^Score, / }))
    const first = document.querySelector('tbody td[data-column-id="score"]')
    expect(first).toHaveTextContent('0')
  })

  it('handles a wide table', () => {
    const wide: ColumnDef<User>[] = Array.from({ length: 40 }, (_, index) => ({
      id: `col-${index}`,
      accessorPath: 'name',
      header: `Column ${index}`,
    }))
    render(<DataTable data={oneThousand} columns={wide} pageSize={10} />)
    expect(screen.getAllByRole('columnheader')).toHaveLength(40)
  })
})

describe('render behaviour', () => {
  it('does not re-render cells of untouched rows when one row is selected', async () => {
    const user = userEvent.setup()
    const renderCount = vi.fn()

    const CountingCell = memo(function CountingCell({ value }: { value: string }) {
      renderCount(value)
      return <span>{value}</span>
    })

    const columns: ColumnDef<User>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ value }) => <CountingCell value={value} />,
      },
    ]
    const rows = makeUsers(5)

    render(
      <DataTable data={rows} columns={columns} getRowId={(row) => row.id} enableRowSelection />,
    )

    renderCount.mockClear()
    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))

    // Memoised cells whose props did not change must not re-render.
    expect(renderCount).not.toHaveBeenCalled()
  })

  it('keeps a stable table instance across parent re-renders', async () => {
    const user = userEvent.setup()
    const instances = new Set<unknown>()

    function Probe() {
      const [, force] = useState(0)
      return (
        <>
          <button type="button" onClick={() => force((n) => n + 1)}>
            Re-render
          </button>
          <DataTable
            data={oneThousand}
            columns={userColumns}
            pageSize={5}
            components={{
              Body: ({ table, bodyProps, children }) => {
                instances.add(table)
                return <tbody {...bodyProps}>{children}</tbody>
              },
            }}
          />
        </>
      )
    }

    render(<Probe />)
    await user.click(screen.getByRole('button', { name: 'Re-render' }))
    await user.click(screen.getByRole('button', { name: 'Re-render' }))

    expect(instances.size).toBe(1)
  })
})

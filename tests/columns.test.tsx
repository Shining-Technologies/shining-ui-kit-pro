import { DataTable, RowAction, RowActionGroup, type ColumnDef } from '@shining-ui-kit/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { userColumns, users, type User } from './fixtures'

describe('column sizing', () => {
  it('publishes widths as CSS variables the cells read back', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', size: 240 },
          { accessorKey: 'email', header: 'Email' },
        ]}
      />,
    )
    const table = container.querySelector<HTMLElement>('table')!
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('240')

    // The width reaches the cell as a custom property, not as an inline
    // `width`: an inline width cannot be overridden by a stylesheet, and the
    // card layout has to ignore column widths entirely.
    const cell = container.querySelector<HTMLElement>('td[data-column-id="name"]')!
    expect(cell.style.getPropertyValue('--sui-cell-size')).toBe(
      'calc(var(--sui-c-name-size) * 1px)',
    )
  })

  it('offers a resize handle only when resizing is enabled', () => {
    const { container, rerender } = render(<DataTable data={users} columns={userColumns} />)
    expect(container.querySelectorAll('.sui-resizer')).toHaveLength(0)

    rerender(
      <DataTable data={users} columns={userColumns} features={{ resizing: { enabled: true } }} />,
    )
    expect(container.querySelectorAll('.sui-resizer')).toHaveLength(6)
  })

  it('turns resizing on when a column asks for it', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', enableResizing: true },
          { accessorKey: 'email', header: 'Email' },
        ]}
      />,
    )
    expect(container.querySelectorAll('.sui-resizer').length).toBeGreaterThan(0)
  })

  it('resizes from the keyboard and reports the new size', async () => {
    const user = userEvent.setup()
    const onColumnSizingChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={[{ accessorKey: 'name', header: 'Name', size: 200, enableResizing: true }]}
        onColumnSizingChange={onColumnSizingChange}
      />,
    )

    const handle = screen.getByRole('separator', { name: 'Resize Name' })
    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 208 })

    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 240 })
  })

  it('clamps a keyboard resize to the column bounds', async () => {
    const user = userEvent.setup()
    const onColumnSizingChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={[
          {
            accessorKey: 'name',
            header: 'Name',
            size: 100,
            minSize: 96,
            maxSize: 104,
            enableResizing: true,
          },
        ]}
        onColumnSizingChange={onColumnSizingChange}
      />,
    )

    const handle = screen.getByRole('separator', { name: 'Resize Name' })
    handle.focus()
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 96 })
  })
})

describe('column pinning', () => {
  it('sticks a pinned column and marks the group edge', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', defaultPinned: 'left', size: 180 },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'score', header: 'Score', defaultPinned: 'right' },
        ]}
      />,
    )

    const pinnedCell = container.querySelector<HTMLElement>('td[data-column-id="name"]')!
    expect(pinnedCell).toHaveClass('sui-pinned', 'sui-pinned--left', 'sui-pinned--edge')
    expect(pinnedCell).toHaveAttribute('data-pinned', 'left')
    expect(pinnedCell.style.left).toBe('0px')

    const right = container.querySelector<HTMLElement>('td[data-column-id="score"]')!
    expect(right).toHaveClass('sui-pinned--right')
    expect(right.style.right).toBe('0px')
  })

  it('freezes the row-actions column to the right by default', () => {
    const { container } = render(
      <DataTable data={users} columns={userColumns} rowActions={() => <button>Edit</button>} />,
    )

    const actions = container.querySelector<HTMLElement>('td[data-column-id="sui-actions"]')!
    expect(actions).toHaveClass('sui-pinned', 'sui-pinned--right', 'sui-pinned--edge')
    expect(actions.style.right).toBe('0px')
    // The header travels with it, or the column would shear on scroll.
    expect(container.querySelector('th[data-column-id="sui-actions"]')).toHaveClass('sui-pinned')
  })

  it('lets the actions column scroll away when asked', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        rowActions={() => <button>Edit</button>}
        features={{ pinning: { actions: false } }}
      />,
    )
    expect(container.querySelector('td[data-column-id="sui-actions"]')).not.toHaveClass(
      'sui-pinned',
    )
  })

  it('freezes the selection column on request', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        enableRowSelection
        features={{ pinning: { selection: 'left' } }}
      />,
    )
    expect(container.querySelector('td[data-column-id="sui-select"]')).toHaveClass(
      'sui-pinned--left',
    )
  })

  it('pins from the column menu', async () => {
    const user = userEvent.setup()
    const onColumnPinningChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        features={{ pinning: { enabled: true } }}
        onColumnPinningChange={onColumnPinningChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Options for Name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Pin to left' }))

    await waitFor(() =>
      expect(onColumnPinningChange).toHaveBeenCalledWith({ left: ['name'], right: [] }),
    )
  })
})

describe('footers and groups', () => {
  it('renders a footer row when a column declares one', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', footer: 'Total' },
          {
            accessorKey: 'score',
            header: 'Score',
            footer: ({ table }) =>
              String(
                table
                  .getRowModel()
                  .rows.reduce((sum, row) => sum + (row.getValue<number>('score') ?? 0), 0),
              ),
          },
        ]}
      />,
    )
    const foot = container.querySelector('tfoot')!
    expect(foot).toBeInTheDocument()
    expect(foot).toHaveTextContent('Total')
    expect(foot).toHaveTextContent('393')
  })

  it('renders grouped headers spanning their children', () => {
    const columns: ColumnDef<User>[] = [
      {
        id: 'identity',
        header: 'Identity',
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email' },
        ],
      },
      { accessorKey: 'score', header: 'Score' },
    ]
    render(<DataTable data={users} columns={columns} />)

    const group = screen.getByRole('columnheader', { name: 'Identity' })
    expect(group).toHaveAttribute('colspan', '2')
    expect(group).toHaveAttribute('scope', 'colgroup')
    expect(screen.getAllByRole('row')).toHaveLength(7) // 2 header rows + 5 data
  })
})

describe('responsive columns', () => {
  it('turns responsive metadata into CSS classes', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'email',
            header: 'Email',
            meta: { responsive: { hideBelow: 'md' } },
          },
        ]}
      />,
    )
    expect(container.querySelector('td[data-column-id="email"]')).toHaveClass('sui-hide-below-md')
    expect(container.querySelector('th[data-column-id="email"]')).toHaveClass('sui-hide-below-md')
  })

  it('marks a wrapping column so it can opt out of truncation', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email', meta: { wrap: true } },
        ]}
      />,
    )
    expect(container.querySelector('td[data-column-id="email"]')).toHaveClass('sui-td--wrap')
    expect(container.querySelector('td[data-column-id="name"]')).not.toHaveClass('sui-td--wrap')
  })

  it('labels cells for the card layout', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(container.querySelector('td[data-column-id="email"]')).toHaveAttribute(
      'data-label',
      'Email',
    )
  })
})

describe('the actions column', () => {
  it('carries a visible header, because a column of icons under a blank head reads as broken', () => {
    render(
      <DataTable data={users} columns={userColumns} rowActions={() => <button>Edit</button>} />,
    )
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  it('keeps the name for screen readers when the header is hidden', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        rowActionsHeader={false}
        rowActions={() => <button>Edit</button>}
      />,
    )
    const header = screen.getByRole('columnheader', { name: 'Actions' })
    expect(header.querySelector('.sui-sr-only')).toBeInTheDocument()
  })

  it('takes as many icon actions as a row needs', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const Icon = () => <svg />
    render(
      <DataTable
        data={users.slice(0, 1)}
        columns={userColumns}
        rowActionsWidth={140}
        rowActions={() => (
          <RowActionGroup>
            <RowAction icon={Icon} label="View" href="/x" />
            <RowAction icon={Icon} label="Edit" onClick={onEdit} />
            <RowAction icon={Icon} label="Delete" destructive onClick={() => {}} />
            <RowAction icon={Icon} label="Archive" disabled onClick={() => {}} />
          </RowActionGroup>
        )}
      />,
    )

    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/x')
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('does not let a row action also activate the row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const Icon = () => <svg />
    render(
      <DataTable
        data={users.slice(0, 1)}
        columns={userColumns}
        onRowClick={onRowClick}
        rowActions={() => (
          <RowActionGroup>
            <RowAction icon={Icon} label="Edit" onClick={() => {}} />
          </RowActionGroup>
        )}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })
})

describe('described row actions', () => {
  const Icon = () => <svg />

  it('builds the buttons from a list of actions', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <DataTable
        data={users.slice(0, 1)}
        columns={userColumns}
        rowActions={(row) => [
          { icon: Icon, label: 'View', href: `/users/${row.original.id}` },
          { icon: Icon, label: 'Edit', onClick: onEdit },
          { icon: Icon, label: 'Delete', destructive: true, onClick: () => {} },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/users/1')
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'sui-row-action--destructive',
    )
  })

  it('holds a hidden action’s place so icons do not shuffle between rows', () => {
    const { container } = render(
      <DataTable
        data={users.slice(0, 2)}
        columns={userColumns}
        rowActions={(row) => [
          { icon: Icon, label: 'View', onClick: () => {} },
          { icon: Icon, label: 'Delete', onClick: () => {}, hidden: row.index === 0 },
        ]}
      />,
    )

    const groups = container.querySelectorAll('.sui-row-actions')
    expect(groups[0]!.children).toHaveLength(2)
    expect(groups[0]!.querySelector('.sui-row-action--placeholder')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1)
  })

  it('still takes plain JSX', () => {
    render(
      <DataTable
        data={users.slice(0, 1)}
        columns={userColumns}
        rowActions={() => <button>Something else</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Something else' })).toBeInTheDocument()
  })
})

describe('the expander column', () => {
  it('names itself with a glyph rather than an empty head', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        renderExpandedRow={(row) => <p>{row.original.email}</p>}
      />,
    )
    const header = container.querySelector('th[data-column-id="sui-expander"]')!
    expect(header.querySelector('svg')).toBeInTheDocument()
    expect(header).toHaveAccessibleName('Details')
  })
})

describe('the header menu', () => {
  it('never covers a structural column’s own control', () => {
    // The menu is drawn over the head rather than beside it, so that it cannot
    // displace a label. In a 44px checkbox column there is nothing else there.
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        enableRowSelection
        renderExpandedRow={(row) => <p>{row.original.email}</p>}
        rowActions={() => <button>Edit</button>}
      />,
    )

    for (const id of ['sui-select', 'sui-expander', 'sui-actions']) {
      const header = container.querySelector(`th[data-column-id="${id}"]`)!
      expect(header.querySelector('.sui-th__menu')).not.toBeInTheDocument()
    }
    // Data columns keep theirs.
    expect(container.querySelector('th[data-column-id="name"] .sui-th__menu')).toBeInTheDocument()
  })

  it('still pins the injected columns, which is state rather than a capability', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        enableRowSelection
        features={{ pinning: { selection: 'left' } }}
        rowActions={() => <button>Edit</button>}
      />,
    )
    expect(container.querySelector('td[data-column-id="sui-select"]')).toHaveClass('sui-pinned')
    expect(container.querySelector('td[data-column-id="sui-actions"]')).toHaveClass('sui-pinned')
  })
})

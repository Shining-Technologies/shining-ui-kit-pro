import { DataTable, type ColumnDef } from '@shining-technologies/ui'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userColumns, users, type User } from './fixtures'

/**
 * A viewport for `matchMedia`: queries are evaluated against `width`, and
 * `resize` notifies every listener the way a real window would.
 */
function mockViewport(initialWidth: number) {
  let width = initialWidth
  const listeners = new Set<() => void>()
  const evaluate = (query: string) => {
    const max = /max-width:\s*(\d+)px/.exec(query)
    const min = /min-width:\s*(\d+)px/.exec(query)
    if (max) return width <= Number(max[1])
    if (min) return width >= Number(min[1])
    return false
  }
  const spy = vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return evaluate(query)
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  )
  return {
    resize(next: number) {
      width = next
      act(() => listeners.forEach((listener) => listener()))
    },
    restore: () => spy.mockRestore(),
  }
}

const responsiveColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email', meta: { responsive: { hideBelow: 'md' } } },
  { accessorKey: 'role', header: 'Role' },
]

const cell = (container: HTMLElement, id: string) =>
  container.querySelector(`td[data-column-id="${id}"]`)

describe('responsive column visibility', () => {
  let viewport: ReturnType<typeof mockViewport> | undefined
  afterEach(() => viewport?.restore())

  it('hides the column below its breakpoint and brings it back above it', () => {
    viewport = mockViewport(500)
    const { container } = render(<DataTable data={users} columns={responsiveColumns} />)
    expect(cell(container, 'email')).toBeNull()

    viewport.resize(1200)
    expect(cell(container, 'email')).not.toBeNull()
  })

  it('can be turned back on from the column picker, and then stays on', async () => {
    const user = userEvent.setup()
    viewport = mockViewport(500)
    const { container } = render(<DataTable data={users} columns={responsiveColumns} />)

    await user.click(screen.getByRole('button', { name: /Columns, 1 hidden/ }))
    const email = screen.getByRole('menuitemcheckbox', { name: 'Email' })
    expect(email).toHaveAttribute('aria-checked', 'false')
    await user.click(email)

    const shown = cell(container, 'email')
    expect(shown).not.toBeNull()
    // The CSS fallback must not hide what the user explicitly asked for.
    expect(shown).not.toHaveClass('sui-hide-below-md')
  })

  it('keeps its defaults out of the visibility state it reports', async () => {
    const user = userEvent.setup()
    viewport = mockViewport(500)
    const onColumnVisibilityChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={responsiveColumns}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Role' }))
    // Only the user's change — not a snapshot of what this viewport hides.
    expect(onColumnVisibilityChange).toHaveBeenLastCalledWith({ role: false })
  })

  it('"Show all columns" includes the ones hidden at this width', async () => {
    const user = userEvent.setup()
    viewport = mockViewport(500)
    const { container } = render(<DataTable data={users} columns={responsiveColumns} />)

    await user.click(screen.getByRole('button', { name: /Columns/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Show all columns' }))
    expect(cell(container, 'email')).not.toBeNull()
  })
})

describe('card layout', () => {
  it('prints each column name on its card, and totals on the footer card', () => {
    const { container } = render(
      <DataTable
        data={users}
        responsiveMode="cards"
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'score', header: 'Score', footer: '416' },
        ]}
      />,
    )
    expect(cell(container, 'name')).toHaveAttribute('data-label', 'Name')
    const footer = container.querySelectorAll('tfoot td')
    expect(footer[0]).not.toHaveAttribute('data-label')
    expect(footer[1]).toHaveAttribute('data-label', 'Score')
  })

  it('orders cells by responsive priority through a card-only variable', () => {
    const { container } = render(
      <DataTable
        data={users}
        responsiveMode="cards"
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'status', header: 'Status', meta: { responsive: { priority: 1 } } },
        ]}
      />,
    )
    const status = container.querySelector<HTMLElement>('td[data-column-id="status"]')!
    expect(status.style.getPropertyValue('--sui-card-order')).toBe('1')
  })

  it('offers sorting and select-all, which the hidden header row used to hold', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataTable data={users} columns={userColumns} responsiveMode="auto" enableRowSelection />,
    )
    // The value, without the card label the cell carries for screen readers.
    const firstName = () => cell(container, 'name')?.lastChild?.textContent
    const controls = screen.getByRole('group', { name: 'Sort and select' })

    await user.click(within(controls).getByRole('checkbox', { name: /Select all rows/ }))
    expect(container.querySelectorAll('tbody tr[data-state="selected"]')).toHaveLength(5)

    // No direction without a column to sort by.
    expect(within(controls).getByRole('button', { name: 'Sort descending' })).toBeDisabled()

    await user.click(within(controls).getByRole('combobox', { name: 'Sort by' }))
    await user.click(await screen.findByRole('option', { name: 'Name' }))
    await waitFor(() => expect(firstName()).toBe('Ada Lovelace'))

    await user.click(within(controls).getByRole('button', { name: 'Sort descending' }))
    await waitFor(() => expect(firstName()).toBe('Katherine Johnson'))
  })

  it('is not rendered for the scrolling layout', () => {
    render(<DataTable data={users} columns={userColumns} enableRowSelection />)
    expect(screen.queryByRole('group', { name: 'Sort and select' })).toBeNull()
  })
})

describe('keyboard navigation with a table inside a detail row', () => {
  it('moves between the outer rows, not into the nested table', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        onRowClick={() => {}}
        defaultExpanded={{ '0': true }}
        renderExpandedRow={() => (
          <DataTable data={users} columns={userColumns} onRowClick={() => {}} />
        )}
      />,
    )
    const outer = container.querySelector('table')!
    const outerRows = Array.from(outer.querySelectorAll<HTMLElement>('[data-sui-row]')).filter(
      (row) => row.closest('table') === outer,
    )

    outerRows[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(outerRows[1])
  })
})

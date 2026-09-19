import { DataTable, type ColumnDef } from '@shining-technologies/ui'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { userColumns, users, type User } from './fixtures'

const nextFrame = () =>
  act(() => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())))

const resizable: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, enableResizing: true },
  { accessorKey: 'email', header: 'Email', size: 200 },
  { accessorKey: 'score', header: 'Score', size: 100 },
]

function grab(name: string) {
  return screen.getByRole('separator', { name: `Resize ${name}` })
}

describe('drag resizing', () => {
  it('previews the drag on the table element and commits once, on release', async () => {
    const onColumnSizingChange = vi.fn()
    const { container } = render(
      <DataTable data={users} columns={resizable} onColumnSizingChange={onColumnSizingChange} />,
    )
    const table = container.querySelector<HTMLElement>('table')!
    const grip = grab('Name')

    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    expect(grip).toHaveAttribute('data-resizing', 'true')
    expect(table).toHaveAttribute('data-resizing')

    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 160 })
    await nextFrame()
    // The width moved with the pointer without a state update.
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('260')
    expect(onColumnSizingChange).not.toHaveBeenCalled()

    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 170 })
    expect(onColumnSizingChange).toHaveBeenCalledTimes(1)
    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 270 })
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('270')
    expect(grip).not.toHaveAttribute('data-resizing')
    expect(table).not.toHaveAttribute('data-resizing')
    expect(grip).toHaveAttribute('aria-valuenow', '270')
  })

  it('puts the column back when Escape is pressed mid-drag', async () => {
    const onColumnSizingChange = vi.fn()
    const { container } = render(
      <DataTable data={users} columns={resizable} onColumnSizingChange={onColumnSizingChange} />,
    )
    const table = container.querySelector<HTMLElement>('table')!
    const grip = grab('Name')

    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 40 })
    await nextFrame()
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('140')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('200')
    expect(onColumnSizingChange).not.toHaveBeenCalled()

    // The gesture is over: a late release changes nothing.
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 40 })
    expect(onColumnSizingChange).not.toHaveBeenCalled()
  })

  it('treats a click without movement as no resize', () => {
    const onColumnSizingChange = vi.fn()
    render(
      <DataTable data={users} columns={resizable} onColumnSizingChange={onColumnSizingChange} />,
    )
    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 100 })
    expect(onColumnSizingChange).not.toHaveBeenCalled()
  })

  it('clamps a drag to the column bounds', () => {
    const onColumnSizingChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={[
          // Spreading a member of the ColumnDef union does not narrow it to a leaf column.
          { ...resizable[0]!, minSize: 150, maxSize: 240 } as ColumnDef<User>,
          ...resizable.slice(1),
        ]}
        onColumnSizingChange={onColumnSizingChange}
      />,
    )
    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: -400 })
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 150 })
  })

  it("moves only the grip's guide line in 'onEnd' mode", async () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={resizable}
        features={{ resizing: { enabled: true, mode: 'onEnd' } }}
      />,
    )
    const table = container.querySelector<HTMLElement>('table')!
    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 130 })
    await nextFrame()
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('200')
    expect(grip.style.getPropertyValue('--sui-resize-offset')).toBe('30px')

    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 130 })
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('230')
    expect(grip.style.getPropertyValue('--sui-resize-offset')).toBe('')
  })

  it('keeps the grip under the pointer when the table is stretched to fill its frame', () => {
    const onColumnSizingChange = vi.fn()
    const { container } = render(
      <DataTable data={users} columns={resizable} onColumnSizingChange={onColumnSizingChange} />,
    )
    const table = container.querySelector<HTMLTableElement>('table')!
    const frame = table.parentElement!
    // 500px of columns in a 1000px frame: the browser doubles every column.
    table.style.tableLayout = 'fixed'
    Object.defineProperty(frame, 'clientWidth', { configurable: true, value: 1000 })
    const rect = (width: number) => ({ width }) as DOMRect
    vi.spyOn(table, 'getBoundingClientRect').mockReturnValue(rect(1000))
    const widths: Record<string, number> = { name: 400, email: 400, score: 200 }
    for (const th of container.querySelectorAll<HTMLElement>('thead th[data-column-id]')) {
      vi.spyOn(th, 'getBoundingClientRect').mockReturnValue(rect(widths[th.dataset.columnId!]!))
    }

    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 500 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 400 })

    // The column shrinks by exactly the drag, from the width on screen; the
    // freed 100px goes to the last column instead of back to every column.
    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 300, email: 400, score: 300 })
  })
})

describe('pinning order', () => {
  it('pins a column to the right before the actions column, not after it', async () => {
    const user = userEvent.setup()
    const onColumnPinningChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        rowActions={() => <button>Edit</button>}
        onColumnPinningChange={onColumnPinningChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Options for Name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Pin to right' }))
    await waitFor(() =>
      expect(onColumnPinningChange).toHaveBeenCalledWith({
        left: [],
        right: ['name', 'sui-actions'],
      }),
    )
  })
})

describe('remembering the column layout', () => {
  const storageKey = (ids: string) => `sui-data-table:columns:${ids}:columnPinning`
  const userIds = userColumns.map((column) => ('accessorKey' in column ? column.accessorKey : column.id)).join(',')

  async function pinNameLeft() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Options for Name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Pin to left' }))
  }

  it('keeps a pinned column pinned on the next visit', async () => {
    const first = render(
      <DataTable data={users} columns={userColumns} features={{ pinning: { enabled: true } }} />,
    )
    await pinNameLeft()
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(storageKey(userIds))!)).toEqual({
        left: ['name'],
        right: [],
      }),
    )
    first.unmount()

    const { container } = render(
      <DataTable data={users} columns={userColumns} features={{ pinning: { enabled: true } }} />,
    )
    expect(container.querySelector('td[data-column-id="name"]')).toHaveClass('sui-pinned--left')
  })

  it('names the table by its id when it has one', async () => {
    render(
      <DataTable
        id="customers"
        data={users}
        columns={userColumns}
        features={{ pinning: { enabled: true } }}
      />,
    )
    await pinNameLeft()
    await waitFor(() =>
      expect(window.localStorage.getItem('sui-data-table:customers:columnPinning')).not.toBeNull(),
    )
  })

  it('remembers nothing with persist={false}', async () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        persist={false}
        features={{ pinning: { enabled: true } }}
      />,
    )
    await pinNameLeft()
    await waitFor(() =>
      expect(screen.getAllByRole('cell')[0]).toHaveAttribute('data-pinned', 'left'),
    )
    expect(window.localStorage.length).toBe(0)
  })

  it('leaves a controlled pinning to the application', () => {
    window.localStorage.setItem(storageKey(userIds), JSON.stringify({ left: ['name'], right: [] }))
    const onColumnPinningChange = vi.fn()
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        features={{ pinning: { enabled: true } }}
        columnPinning={{ left: [], right: [] }}
        onColumnPinningChange={onColumnPinningChange}
      />,
    )
    expect(container.querySelector('td[data-column-id="name"]')).not.toHaveClass('sui-pinned')
    expect(onColumnPinningChange).not.toHaveBeenCalled()
  })

  it('drops stored columns that no longer exist and keeps the actions column last', () => {
    window.localStorage.setItem(
      storageKey(userIds),
      JSON.stringify({ left: ['gone', 'name'], right: ['sui-actions', 'email'] }),
    )
    const onColumnPinningChange = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        rowActions={() => <button>Edit</button>}
        onColumnPinningChange={onColumnPinningChange}
      />,
    )
    expect(onColumnPinningChange).toHaveBeenCalledWith({
      left: ['name'],
      right: ['email', 'sui-actions'],
    })
  })

  it('ignores a stored value it cannot read', () => {
    window.localStorage.setItem(storageKey(userIds), '{not json')
    const { container } = render(
      <DataTable data={users} columns={userColumns} features={{ pinning: { enabled: true } }} />,
    )
    expect(container.querySelector('.sui-pinned')).toBeNull()
  })

  it('remembers widths when asked to', () => {
    const first = render(
      <DataTable data={users} columns={resizable} persist={{ key: 'sized', state: ['columnSizing'] }} />,
    )
    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 150 })
    first.unmount()

    const { container } = render(
      <DataTable data={users} columns={resizable} persist={{ key: 'sized', state: ['columnSizing'] }} />,
    )
    const table = container.querySelector<HTMLElement>('table')!
    expect(table.style.getPropertyValue('--sui-c-name-size')).toBe('250')
  })
})

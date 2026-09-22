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
  // The fingerprint a table without an `id` is named by: FNV-1a of its column
  // ids, computed here independently so a change to the key format is noticed.
  const fingerprint = (ids: string[]) => {
    let hash = 0x811c9dc5
    for (const char of ids.join(',')) {
      hash ^= char.charCodeAt(0)
      hash = Math.imul(hash, 0x01000193)
    }
    return `sui-data-table:columns:${(hash >>> 0).toString(36)}`
  }
  const userIds = userColumns.map((column) =>
    'accessorKey' in column ? (column.accessorKey as string) : column.id!,
  )
  const userKey = fingerprint(userIds)
  const stored = (key = userKey) => {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as Record<string, unknown>)
  }
  const seed = (record: Record<string, unknown>, key = userKey) =>
    window.localStorage.setItem(key, JSON.stringify(record))

  async function pin(name: string, side: 'left' | 'right') {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: `Options for ${name}` }))
    await user.click(await screen.findByRole('menuitem', { name: `Pin to ${side}` }))
  }
  async function unpin(name: string) {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: `Options for ${name}` }))
    await user.click(await screen.findByRole('menuitem', { name: 'Unpin' }))
  }
  async function hide(name: string) {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Columns,/ }))
    await user.click(await screen.findByRole('menuitemcheckbox', { name }))
    await user.keyboard('{Escape}')
  }
  const cell = (container: HTMLElement, id: string) =>
    container.querySelector(`td[data-column-id="${id}"]`)

  it('pins from the header menu with nothing set up', async () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
  })

  it('remembers pinning and hidden columns by default, in one versioned record', async () => {
    render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await pin('Score', 'right')
    await hide('Email')
    await waitFor(() =>
      expect(stored()).toEqual({
        version: 1,
        columnPinning: { left: ['name'], right: ['score'] },
        columnVisibility: { email: false },
      }),
    )
  })

  it('remembers an unpin', async () => {
    render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await waitFor(() => expect(stored()?.columnPinning).toEqual({ left: ['name'], right: [] }))
    await unpin('Name')
    await waitFor(() => expect(stored()?.columnPinning).toEqual({ left: [], right: [] }))
  })

  it('restores the layout on the next mount, and on a fresh page', async () => {
    const first = render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await pin('Score', 'right')
    await hide('Email')
    await waitFor(() => expect(stored()?.columnVisibility).toEqual({ email: false }))
    first.unmount()

    // The same tree mounted again in the same document.
    const second = render(<DataTable data={users} columns={userColumns} />)
    expect(cell(second.container, 'name')).toHaveClass('sui-pinned--left')
    expect(cell(second.container, 'score')).toHaveClass('sui-pinned--right')
    expect(cell(second.container, 'email')).toBeNull()
    second.unmount()

    // A reload: nothing in memory, only what the browser kept.
    const record = window.localStorage.getItem(userKey)!
    window.localStorage.clear()
    window.localStorage.setItem(userKey, record)
    const third = render(<DataTable data={users} columns={userColumns} />)
    expect(cell(third.container, 'name')).toHaveClass('sui-pinned--left')
    expect(cell(third.container, 'score')).toHaveClass('sui-pinned--right')
    expect(cell(third.container, 'email')).toBeNull()
  })

  it('names the table by its id when it has one', async () => {
    render(<DataTable id="customers" data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await waitFor(() => expect(stored('sui-data-table:customers')).not.toBeNull())
    expect(stored()).toBeNull()
  })

  it('prefers a persist key over the id', async () => {
    render(
      <DataTable id="customers" persist="company-customers" data={users} columns={userColumns} />,
    )
    await pin('Name', 'left')
    await waitFor(() => expect(stored('sui-data-table:company-customers')).not.toBeNull())
    expect(stored('sui-data-table:customers')).toBeNull()
    expect(stored()).toBeNull()
  })

  it('keeps its identity when a header is renamed or is an element', async () => {
    const renamed: ColumnDef<User>[] = userColumns.map((column, index) =>
      index === 0 ? { ...column, header: 'Full name' } : column,
    )
    const elements: ColumnDef<User>[] = userColumns.map((column) => ({
      ...column,
      header: <span>{String(column.header)}</span>,
      meta: { ...column.meta, label: String(column.header) },
    }))

    const first = render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await waitFor(() => expect(stored()).not.toBeNull())
    first.unmount()

    const second = render(<DataTable data={users} columns={renamed} />)
    expect(cell(second.container, 'name')).toHaveClass('sui-pinned--left')
    second.unmount()

    const third = render(<DataTable data={users} columns={elements} />)
    expect(cell(third.container, 'name')).toHaveClass('sui-pinned--left')
    await pin('Email', 'right')
    await waitFor(() =>
      expect(stored()?.columnPinning).toEqual({ left: ['name'], right: ['email'] }),
    )
    expect(window.localStorage.length).toBe(1)
  })

  it('remembers nothing with persist={false}', async () => {
    render(<DataTable data={users} columns={userColumns} persist={false} />)
    await pin('Name', 'left')
    await waitFor(() =>
      expect(screen.getAllByRole('cell')[0]).toHaveAttribute('data-pinned', 'left'),
    )
    expect(window.localStorage.length).toBe(0)
  })

  it('leaves a controlled slice to the application', () => {
    seed({
      version: 1,
      columnPinning: { left: ['name'], right: [] },
      columnVisibility: { email: false },
    })
    const onColumnPinningChange = vi.fn()
    const onColumnVisibilityChange = vi.fn()
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        columnPinning={{ left: [], right: [] }}
        onColumnPinningChange={onColumnPinningChange}
        columnVisibility={{}}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )
    expect(cell(container, 'name')).not.toHaveClass('sui-pinned')
    expect(cell(container, 'email')).not.toBeNull()
    expect(onColumnPinningChange).not.toHaveBeenCalled()
    expect(onColumnVisibilityChange).not.toHaveBeenCalled()
  })

  it('drops columns that no longer exist and gives new ones their defaults', () => {
    seed(
      {
        version: 1,
        columnPinning: { left: ['gone', 'name'], right: ['sui-actions', 'email'] },
        columnVisibility: { email: false, oldColumn: false, 'sui-actions': false },
      },
      fingerprint([...userIds, 'initials', 'secret']),
    )
    const withNewColumns: ColumnDef<User>[] = [
      ...userColumns,
      { id: 'initials', header: 'Initials', accessorFn: (row) => row.name[0] },
      { id: 'secret', header: 'Secret', accessorFn: () => '', defaultVisible: false },
    ]
    const onColumnPinningChange = vi.fn()
    const onColumnVisibilityChange = vi.fn()
    const { container } = render(
      <DataTable
        data={users}
        columns={withNewColumns}
        rowActions={() => <button>Edit</button>}
        onColumnPinningChange={onColumnPinningChange}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />,
    )
    expect(onColumnPinningChange).toHaveBeenCalledWith({
      left: ['name'],
      right: ['email', 'sui-actions'],
    })
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ secret: false, email: false })
    expect(cell(container, 'initials')).not.toBeNull()
    expect(cell(container, 'secret')).toBeNull()
    expect(cell(container, 'sui-actions')).not.toBeNull()
  })

  it('never pins a column to both sides', async () => {
    seed({ version: 1, columnPinning: { left: ['name', 'name'], right: ['name', 'email'] } })
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
    expect(cell(container, 'email')).toHaveClass('sui-pinned--right')
    await pin('Email', 'left')
    await waitFor(() =>
      expect(stored()?.columnPinning).toEqual({ left: ['name', 'email'], right: [] }),
    )
  })

  it.each([
    ['not json', '{not json'],
    ['a bare value', JSON.stringify({ left: ['name'], right: [] })],
    ['a version it does not know', JSON.stringify({ version: 999, columnPinning: { left: ['name'] } })],
    ['the wrong shape inside', JSON.stringify({ version: 1, columnPinning: 'name', columnVisibility: [] })],
  ])('ignores a stored record that is %s', async (_, raw) => {
    window.localStorage.setItem(userKey, raw)
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(container.querySelector('.sui-pinned')).toBeNull()
    await pin('Name', 'left')
    await waitFor(() => expect(stored()?.columnPinning).toEqual({ left: ['name'], right: [] }))
    expect(stored()?.version).toBe(1)
  })

  it('works without storage at all', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: access denied')
      },
    })
    try {
      const { container } = render(<DataTable data={users} columns={userColumns} />)
      await pin('Name', 'left')
      expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
    } finally {
      Object.defineProperty(window, 'localStorage', descriptor)
    }
  })

  it('works when storage refuses to write', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    const setItem = vi.fn(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const full = { getItem: () => null, setItem, removeItem: () => undefined, length: 0 }
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => full })
    try {
      const { container } = render(<DataTable data={users} columns={userColumns} />)
      await pin('Name', 'left')
      expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
      await waitFor(() => expect(setItem).toHaveBeenCalled())
    } finally {
      Object.defineProperty(window, 'localStorage', descriptor)
    }
    expect(window.localStorage.length).toBe(0)
  })

  it('imports what a 2.1 table kept, under its old name, and tidies up', () => {
    const legacy = `sui-data-table:columns:${userIds.join(',')}`
    window.localStorage.setItem(`${legacy}:columnPinning`, JSON.stringify({ left: ['name'], right: [] }))
    window.localStorage.setItem(`${legacy}:columnSizing`, JSON.stringify({ name: 240 }))
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
    expect(stored()).toEqual({
      version: 1,
      columnPinning: { left: ['name'], right: [] },
      columnSizing: { name: 240 },
    })
    expect(window.localStorage.getItem(`${legacy}:columnPinning`)).toBeNull()
    expect(window.localStorage.getItem(`${legacy}:columnSizing`)).toBeNull()
  })

  it('imports what a 2.1 table with an id kept', () => {
    window.localStorage.setItem(
      'sui-data-table:customers:columnPinning',
      JSON.stringify({ left: ['name'], right: [] }),
    )
    const { container } = render(<DataTable id="customers" data={users} columns={userColumns} />)
    expect(cell(container, 'name')).toHaveClass('sui-pinned--left')
    expect(stored('sui-data-table:customers')?.columnPinning).toEqual({ left: ['name'], right: [] })
    expect(window.localStorage.getItem('sui-data-table:customers:columnPinning')).toBeNull()
  })

  it('keeps a slice it does not manage as it was', async () => {
    seed({ version: 1, columnSizing: { name: 240 } })
    render(<DataTable data={users} columns={userColumns} />)
    await pin('Name', 'left')
    await waitFor(() =>
      expect(stored()).toEqual({
        version: 1,
        columnSizing: { name: 240 },
        columnPinning: { left: ['name'], right: [] },
      }),
    )
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
    expect(stored('sui-data-table:sized')).toEqual({ version: 1, columnSizing: { name: 250 } })
  })

  it('does not remember widths by default', async () => {
    const key = fingerprint(['name', 'email', 'score'])
    render(<DataTable data={users} columns={resizable} />)
    const grip = grab('Name')
    fireEvent.pointerDown(grip, { pointerId: 1, isPrimary: true, button: 0, clientX: 100 })
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 150 })
    await pin('Name', 'left')
    await waitFor(() => expect(stored(key)).not.toBeNull())
    expect(stored(key)).not.toHaveProperty('columnSizing')
  })
})

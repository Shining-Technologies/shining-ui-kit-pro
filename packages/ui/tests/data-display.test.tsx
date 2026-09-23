/*
 * The data-display components added in 2.2: Chip, FilterBar and FilterChips,
 * BulkActionBar (standalone and in the DataTable), Timeline, TreeView and
 * KanbanBoard.
 */
import {
  BulkActionBar,
  Chip,
  DataTable,
  FilterBar,
  FilterBarActions,
  FilterChips,
  KanbanBoard,
  SearchInput,
  Timeline,
  TimelineHeading,
  TimelineItem,
  TreeView,
  type KanbanColumn,
  type KanbanMove,
  type TreeNode,
} from '@shining-technologies/ui'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { userColumns, users } from './fixtures'

/* --------------------------------------------------------------------- chip */

describe('Chip', () => {
  it('renders a static tag that cannot be operated', () => {
    render(<Chip tone="success">Paid</Chip>)
    const chip = screen.getByText('Paid').closest('[data-slot="chip"]')!
    expect(chip.tagName).toBe('SPAN')
    expect(chip).toHaveClass('sui-chip', 'sui-chip--toned', 'sui-tone--success')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('is a pressed-state toggle with selected', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    const { rerender } = render(
      <Chip selected={false} onSelectedChange={onSelectedChange}>
        Open
      </Chip>,
    )
    const toggle = screen.getByRole('button', { name: 'Open' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(onSelectedChange).toHaveBeenCalledWith(true)

    rerender(
      <Chip selected onSelectedChange={onSelectedChange}>
        Open
      </Chip>,
    )
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    toggle.focus()
    await user.keyboard(' ')
    expect(onSelectedChange).toHaveBeenLastCalledWith(false)
  })

  it('has a separately named remove button', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const { container } = render(
      <Chip onRemove={onRemove} removeLabel="Remove Design">
        Design
      </Chip>,
    )
    await user.click(screen.getByRole('button', { name: 'Remove Design' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('keeps the toggle and the remove button apart, never nested', () => {
    render(
      <Chip selected onSelectedChange={() => {}} onRemove={() => {}} removeLabel="Remove Mine">
        Mine
      </Chip>,
    )
    const toggle = screen.getByRole('button', { name: 'Mine' })
    const remove = screen.getByRole('button', { name: 'Remove Mine' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).not.toContainElement(remove)
  })

  it('disables both controls', () => {
    render(
      <Chip disabled selected={false} onSelectedChange={() => {}} onRemove={() => {}}>
        Mine
      </Chip>,
    )
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
})

/* --------------------------------------------------------------- filter bar */

describe('FilterBar and FilterChips', () => {
  it('groups the controls under a name, with actions at the end', async () => {
    const { container } = render(
      <FilterBar aria-label="Filter projects">
        <SearchInput aria-label="Search projects" />
        <FilterBarActions>
          <button type="button">Export</button>
        </FilterBarActions>
      </FilterBar>,
    )
    const bar = screen.getByRole('group', { name: 'Filter projects' })
    expect(within(bar).getByRole('searchbox', { name: 'Search projects' })).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('announces how many filters apply and clears them all', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn()
    render(
      <FilterChips onClearAll={onClearAll}>
        <Chip onRemove={() => {}} removeLabel="Remove Status filter">
          Status: Open
        </Chip>
        <Chip onRemove={() => {}} removeLabel="Remove Owner filter">
          Owner: Ada
        </Chip>
      </FilterChips>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('2 filters applied')
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })

  it('renders nothing without chips', () => {
    const { container } = render(<FilterChips onClearAll={() => {}}>{null}</FilterChips>)
    expect(container).toBeEmptyDOMElement()
  })
})

/* ------------------------------------------------------------- search input */

describe('SearchInput', () => {
  it('clears with the button and with Escape, uncontrolled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SearchInput aria-label="Search" onValueChange={onValueChange} />)
    const box = screen.getByRole('searchbox', { name: 'Search' })
    await user.type(box, 'acme')
    expect(box).toHaveValue('acme')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
    await user.type(box, 'x{Escape}')
    expect(box).toHaveValue('')
    expect(onValueChange).toHaveBeenLastCalledWith('')
  })

  it('follows a controlled value and hides clear when disabled', () => {
    const { rerender } = render(<SearchInput aria-label="Search" value="north" onValueChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('north')
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    rerender(<SearchInput aria-label="Search" value="north" disabled onValueChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })
})

/* -------------------------------------------------------------- bulk actions */

describe('BulkActionBar', () => {
  it('renders nothing with nothing selected', () => {
    const { container } = render(<BulkActionBar count={0} onClear={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('counts, groups the actions, and clears', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const { container } = render(
      <BulkActionBar count={3} total={1240} onClear={onClear}>
        <button type="button">Export</button>
      </BulkActionBar>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('3 of 1,240 selected')
    // Only the count is live, so actions are not re-read on every change.
    expect(screen.getByRole('status')).not.toContainElement(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByRole('group', { name: 'Bulk actions' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('gives the DataTable bulk actions through slots.selectionActions', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    render(
      <DataTable
        data={users}
        columns={userColumns}
        getRowId={(row) => row.id}
        enableRowSelection
        slots={{
          selectionActions: ({ table }) => (
            <button
              type="button"
              onClick={() => onExport(table.getSelectedRowModel().rows.map((row) => row.id))}
            >
              Export selected
            </button>
          ),
        }}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Export selected' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Select row 2' }))
    await user.click(screen.getByRole('button', { name: 'Export selected' }))
    expect(onExport).toHaveBeenCalledWith(['2'])
    expect(screen.getByText(/selected/, { selector: '.sui-selection-bar__count' })).toHaveTextContent(
      `1 of ${users.length} selected`,
    )
  })

  it('keeps the table bar a single live region when there are no actions', async () => {
    const user = userEvent.setup()
    render(<DataTable data={users} columns={userColumns} getRowId={(row) => row.id} enableRowSelection />)
    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }))
    const bar = document.querySelector('.sui-selection-bar')!
    expect(bar).toHaveAttribute('role', 'status')
    expect(bar).toContainElement(screen.getByRole('button', { name: 'Clear selection' }))
  })
})

/* ----------------------------------------------------------------- timeline */

describe('Timeline', () => {
  it('is an ordered list of events with machine-readable times', async () => {
    const { container } = render(
      <Timeline aria-label="History">
        <TimelineHeading>Today</TimelineHeading>
        <TimelineItem title="Invoice paid" time="2 hours ago" dateTime="2026-09-24T09:30" tone="success">
          Paid by card.
        </TimelineItem>
        <TimelineItem title="Approval" pending />
      </Timeline>,
    )
    const list = screen.getByRole('list', { name: 'History' })
    expect(list.tagName).toBe('OL')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('2 hours ago').tagName).toBe('TIME')
    expect(screen.getByText('2 hours ago')).toHaveAttribute('datetime', '2026-09-24T09:30')
    expect(screen.getByText('Approval').closest('li')).toHaveAttribute('data-pending', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has a compact variant for audit logs', () => {
    render(
      <Timeline variant="compact">
        <TimelineItem title="Role changed" time="09:30" />
      </Timeline>,
    )
    expect(screen.getByRole('list')).toHaveClass('sui-timeline--compact')
  })
})

/* ---------------------------------------------------------------- tree view */

const TREE: TreeNode[] = [
  {
    id: 'finance',
    label: 'Finance',
    children: [
      { id: 'ap', label: 'Accounts payable' },
      { id: 'ar', label: 'Accounts receivable' },
    ],
  },
  { id: 'hr', label: 'HR', children: [{ id: 'payroll', label: 'Payroll' }] },
  { id: 'legal', label: 'Legal', disabled: true },
]

describe('TreeView', () => {
  it('is a tree with one tab stop and nested groups', async () => {
    const { container } = render(<TreeView aria-label="Departments" items={TREE} defaultExpanded={['finance']} />)
    const tree = screen.getByRole('tree', { name: 'Departments' })
    const items = within(tree).getAllByRole('treeitem')
    expect(items).toHaveLength(5)
    expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1)
    const finance = screen.getByRole('treeitem', { name: /Finance/ })
    expect(finance).toHaveAttribute('aria-expanded', 'true')
    expect(finance).toHaveAttribute('aria-level', '1')
    expect(screen.getByRole('treeitem', { name: 'Accounts payable' })).toHaveAttribute('aria-level', '2')
    expect(within(finance).getByRole('group')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('moves, opens and closes with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<TreeView aria-label="Departments" items={TREE} />)
    await user.tab()
    const finance = screen.getByRole('treeitem', { name: 'Finance' })
    expect(finance).toHaveFocus()
    expect(finance).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{ArrowRight}')
    expect(finance).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('treeitem', { name: 'Accounts payable' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('treeitem', { name: 'Accounts receivable' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('treeitem', { name: /^Finance/ })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('treeitem', { name: 'Finance' })).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{End}')
    expect(screen.getByRole('treeitem', { name: 'Legal' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('treeitem', { name: 'Finance' })).toHaveFocus()
    await user.keyboard('h')
    expect(screen.getByRole('treeitem', { name: 'HR' })).toHaveFocus()
  })

  it('selects one node, or toggles several in multiple mode', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    const onAction = vi.fn()
    const { unmount } = render(
      <TreeView aria-label="Departments" items={TREE} onSelectedChange={onSelectedChange} onAction={onAction} />,
    )
    await user.click(screen.getByText('HR'))
    expect(onSelectedChange).toHaveBeenLastCalledWith(['hr'])
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'hr' }))
    expect(screen.getByRole('treeitem', { name: 'HR' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByText('Legal'))
    expect(onSelectedChange).toHaveBeenCalledTimes(1)
    unmount()

    const onMulti = vi.fn()
    render(<TreeView aria-label="Departments" items={TREE} selectionMode="multiple" onSelectedChange={onMulti} />)
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true')
    await user.tab()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown} ')
    expect(onMulti).toHaveBeenLastCalledWith(['finance', 'hr'])
    await user.keyboard(' ')
    expect(onMulti).toHaveBeenLastCalledWith(['finance'])
  })

  it('respects a controlled expanded list', async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    render(<TreeView aria-label="Departments" items={TREE} expanded={[]} onExpandedChange={onExpandedChange} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onExpandedChange).toHaveBeenCalledWith(['finance'])
    expect(screen.getByRole('treeitem', { name: 'Finance' })).toHaveAttribute('aria-expanded', 'false')
  })
})

/* ------------------------------------------------------------------- kanban */

interface Card {
  id: string
  title: string
  status: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress', limit: 1 },
  { id: 'done', title: 'Done' },
]

function applyMove(cards: Card[], move: KanbanMove): Card[] {
  const moving = cards.find((card) => card.id === move.itemId)!
  const rest = cards.filter((card) => card.id !== move.itemId)
  const target = rest.filter((card) => card.status === move.toColumnId)
  const before = target[move.toIndex]
  const moved = { ...moving, status: move.toColumnId }
  if (!before) {
    const last = target[target.length - 1]
    const at = last ? rest.indexOf(last) + 1 : rest.length
    return [...rest.slice(0, at), moved, ...rest.slice(at)]
  }
  const at = rest.indexOf(before)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

function Board({ onMove }: { onMove?: (move: KanbanMove) => void }) {
  const [cards, setCards] = useState<Card[]>([
    { id: 'a', title: 'Quote Acme', status: 'todo' },
    { id: 'b', title: 'Call Globex', status: 'todo' },
    { id: 'c', title: 'Invoice Initech', status: 'doing' },
  ])
  return (
    <KanbanBoard
      aria-label="Pipeline"
      columns={COLUMNS}
      items={cards}
      getItemId={(card) => card.id}
      getColumnId={(card) => card.status}
      getItemLabel={(card) => card.title}
      renderItem={(card) => card.title}
      onMove={(move) => {
        onMove?.(move)
        setCards((current) => applyMove(current, move))
      }}
    />
  )
}

const columnOf = (name: string) => screen.getByRole('region', { name })

describe('KanbanBoard', () => {
  it('renders columns as named regions with counts and limits', async () => {
    const { container } = render(<Board />)
    expect(screen.getByRole('group', { name: 'Pipeline' })).toBeInTheDocument()
    expect(within(columnOf('To do')).getAllByRole('listitem')).toHaveLength(2)
    expect(within(columnOf('In progress')).getByLabelText('1 of 1 allowed')).toBeInTheDocument()
    expect(within(columnOf('Done')).getByText('No items')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('moves a card with the keyboard and announces each step', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Board onMove={onMove} />)
    const card = screen.getByText('Call Globex').closest('li')!
    card.focus()
    await user.keyboard(' ')
    expect(card).toHaveAttribute('data-grabbed', 'true')
    expect(screen.getByText(/Picked up Call Globex/)).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(onMove).toHaveBeenLastCalledWith({
      itemId: 'b',
      fromColumnId: 'todo',
      toColumnId: 'doing',
      fromIndex: 1,
      toIndex: 1,
    })
    expect(within(columnOf('In progress')).getByText('Call Globex')).toBeInTheDocument()
    expect(screen.getByText(/moved to In progress, position 2 of 2/)).toBeInTheDocument()
    expect(within(columnOf('In progress')).getByText('Call Globex').closest('li')).toHaveFocus()
    expect(within(columnOf('In progress')).getByLabelText('2 of 1 allowed')).toHaveAttribute('data-over', 'true')

    await user.keyboard('{ArrowUp}')
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ toColumnId: 'doing', toIndex: 0 }))
    await user.keyboard(' ')
    expect(screen.getByText(/Dropped Call Globex in In progress, position 1 of 2/)).toBeInTheDocument()
  })

  it('puts a card back where it started on Escape', async () => {
    const user = userEvent.setup()
    render(<Board />)
    const card = screen.getByText('Quote Acme').closest('li')!
    card.focus()
    await user.keyboard(' {ArrowRight}{ArrowRight}')
    expect(within(columnOf('Done')).getByText('Quote Acme')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(within(columnOf('To do')).getAllByRole('listitem')[0]).toHaveTextContent('Quote Acme')
    expect(screen.getByText(/Move cancelled/)).toBeInTheDocument()
  })

  it('moves a card by drag and drop', () => {
    const onMove = vi.fn()
    render(<Board onMove={onMove} />)
    const card = screen.getByText('Quote Acme').closest('li')!
    const done = columnOf('Done')
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    fireEvent.dragStart(card, { dataTransfer })
    fireEvent.dragOver(done, { dataTransfer, clientY: 10 })
    fireEvent.drop(done, { dataTransfer, clientY: 10 })
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'a', fromColumnId: 'todo', toColumnId: 'done', toIndex: 0 }),
    )
  })

  it('is read-only without onMove', () => {
    render(
      <KanbanBoard
        columns={COLUMNS}
        items={[{ id: 'a', status: 'todo' }]}
        getItemId={(card) => card.id}
        getColumnId={(card) => card.status}
        renderItem={(card) => card.id}
      />,
    )
    const card = screen.getByText('a').closest('li')!
    expect(card).toHaveAttribute('draggable', 'false')
    expect(card).not.toHaveAttribute('aria-roledescription')
  })
})

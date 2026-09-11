import { DataTable } from '@shining-technologies/ui-kit-react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userColumns, users } from './fixtures'

describe('basic rendering', () => {
  it('renders a semantic table with a header row and one row per record', () => {
    render(<DataTable data={users} columns={userColumns} label="Users" />)

    const table = screen.getByRole('table', { name: 'Users' })
    expect(table).toBeInTheDocument()

    // 6 declared columns, no injected ones by default.
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
    // 1 header row + 5 data rows.
    expect(screen.getAllByRole('row')).toHaveLength(6)

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('barbara@example.com')).toBeInTheDocument()
  })

  it('renders header labels from the column definitions', () => {
    render(<DataTable data={users} columns={userColumns} />)
    for (const label of ['Name', 'Email', 'Role', 'Status', 'Score', 'Created']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('uses a custom cell renderer with a typed value', () => {
    render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'score',
            header: 'Score',
            // `value` is typed as number here; `.toFixed` would not compile otherwise.
            cell: ({ value }) => <span data-testid="score">{value.toFixed(1)}</span>,
          },
        ]}
      />,
    )
    expect(screen.getAllByTestId('score')[0]).toHaveTextContent('92.0')
  })

  it('reads dotted accessor paths', () => {
    const data = [{ id: '1', user: { profile: { city: 'Sydney' } } }]
    render(
      <DataTable
        data={data}
        columns={[{ id: 'city', accessorPath: 'user.profile.city', header: 'City' }]}
      />,
    )
    expect(screen.getByText('Sydney')).toBeInTheDocument()
  })

  it('applies alignment and class metadata to cells', () => {
    render(<DataTable data={users} columns={userColumns} />)
    const scoreCell = document.querySelector('td[data-column-id="score"]')
    expect(scoreCell).toHaveClass('sui-align-right')
  })

  it('shows the empty state when there are no rows', () => {
    render(<DataTable data={[]} columns={userColumns} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(screen.getByText(/nothing to show here yet/i)).toBeInTheDocument()
  })

  it('shows a skeleton while loading and marks the table busy', () => {
    render(<DataTable data={[]} columns={userColumns} loading loadingRowCount={3} />)
    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelectorAll('.sui-row--skeleton')).toHaveLength(3)
  })

  it('shows the error state with a retry action', () => {
    render(
      <DataTable
        data={[]}
        columns={userColumns}
        error={new Error('Network unreachable')}
        onRetry={() => {}}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText('Network unreachable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('renders a visible caption and links it to the table', () => {
    render(<DataTable data={users} columns={userColumns} caption="All users" />)
    expect(screen.getByRole('table', { name: 'All users' })).toBeInTheDocument()
  })

  it('carries density, variant and responsive mode as data attributes', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={userColumns}
        density="compact"
        variant="striped"
        responsiveMode="cards"
      />,
    )
    const root = container.querySelector('.sui-root')
    expect(root).toHaveAttribute('data-density', 'compact')
    expect(root).toHaveAttribute('data-variant', 'striped')
    expect(root).toHaveAttribute('data-responsive', 'cards')
  })
})

describe('the fixed frame', () => {
  it('clips the container and pins the header and footer inside it', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          { accessorKey: 'name', header: 'Name', footer: 'Total' },
          { accessorKey: 'score', header: 'Score' },
        ]}
        maxHeight={320}
      />,
    )

    const frame = container.querySelector<HTMLElement>('.sui-container')!
    expect(frame).toHaveAttribute('data-framed')
    expect(frame.style.maxHeight).toBe('320px')
    expect(container.querySelector('thead')).toHaveClass('sui-thead--sticky')
    expect(container.querySelector('tfoot')).toHaveClass('sui-tfoot--sticky')
  })

  it('offsets each header row of a grouped header so they stack', () => {
    const { container } = render(
      <DataTable
        data={users}
        columns={[
          {
            id: 'identity',
            header: 'Identity',
            columns: [
              { accessorKey: 'name', header: 'Name' },
              { accessorKey: 'email', header: 'Email' },
            ],
          },
        ]}
        maxHeight={320}
      />,
    )

    const rows = container.querySelectorAll<HTMLElement>('thead tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.style.getPropertyValue('--sui-sticky-top')).toBe(
      'calc(var(--sui-header-height) * 0)',
    )
    expect(rows[1]!.style.getPropertyValue('--sui-sticky-top')).toBe(
      'calc(var(--sui-header-height) * 1)',
    )
  })

  it('leaves the offsets off when the header does not stick', () => {
    const { container } = render(
      <DataTable data={users} columns={userColumns} stickyHeader={false} />,
    )
    expect(container.querySelector('thead')).not.toHaveClass('sui-thead--sticky')
    expect(
      container.querySelector<HTMLElement>('thead tr')!.style.getPropertyValue('--sui-sticky-top'),
    ).toBe('')
  })
})

describe('refetching', () => {
  it('shows skeletons only when there are no rows to keep', () => {
    const { container } = render(<DataTable data={[]} columns={userColumns} loading />)
    expect(container.querySelectorAll('.sui-row--skeleton').length).toBeGreaterThan(0)
  })

  it('keeps the rows on screen and dims them through a refetch', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} loading />)

    // Swapping loaded rows for skeletons resizes every row and column on each
    // page change; the rows stay and the body dims instead.
    expect(container.querySelectorAll('.sui-row--skeleton')).toHaveLength(0)
    expect(container.querySelectorAll('tbody tr[data-sui-row]')).toHaveLength(5)
    expect(container.querySelector('tbody')).toHaveAttribute('data-refetching')
    expect(container.querySelector('table')).toHaveAttribute('aria-busy', 'true')
  })
})

describe('the heading', () => {
  it('renders a title and description, and names the table with them', () => {
    render(
      <DataTable
        data={users}
        columns={userColumns}
        title="Free-quote chats"
        description="Every conversation the assistant stored."
      />,
    )
    expect(screen.getByText('Free-quote chats')).toBeVisible()
    expect(screen.getByText('Every conversation the assistant stored.')).toBeVisible()
    // The title doubles as the table's accessible name, so `label` is optional.
    expect(screen.getByRole('table', { name: 'Free-quote chats' })).toBeInTheDocument()
  })

  it('keeps an explicit label as the accessible name', () => {
    render(<DataTable data={users} columns={userColumns} title="Chats" label="Team members" />)
    expect(screen.getByRole('table', { name: 'Team members' })).toBeInTheDocument()
  })

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    expect(container.querySelector('.sui-heading')).not.toBeInTheDocument()
  })
})

describe('the card surface', () => {
  it('puts the toolbar, the rows and the pagination inside one border', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    const root = container.querySelector<HTMLElement>('.sui-root')!

    expect(root).toHaveAttribute('data-surface', 'card')
    // Everything the card owns is a direct child of it, or the border would
    // have to be drawn around a subset of the component.
    for (const part of ['.sui-toolbar', '.sui-container', '.sui-pagination']) {
      expect(root.querySelector(part)?.parentElement).toBe(root)
    }
  })

  it('can be split back into separate blocks', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} surface="plain" />)
    expect(container.querySelector('.sui-root')).toHaveAttribute('data-surface', 'plain')
  })
})

describe('the toolbar layout', () => {
  it('puts the search and the filters in one wrapping flow', () => {
    const { container } = render(
      <DataTable data={users} columns={userColumns} filterLayout="inline" />,
    )

    // One flow: the search box and every filter, wrapping together.
    const start = container.querySelector<HTMLElement>('.sui-toolbar__row .sui-toolbar__start')!
    expect(within(start).getByRole('searchbox', { name: 'Search table' })).toBeInTheDocument()
    expect(start.querySelector('.sui-inline-filters')).toBeInTheDocument()

    // A fixed cluster: the count and the column picker never join the wrap.
    const end = container.querySelector<HTMLElement>('.sui-toolbar__row .sui-toolbar__end')!
    expect(end.querySelector('.sui-toolbar__count')).toBeInTheDocument()
    expect(within(end).getByRole('button', { name: /Columns/ })).toBeInTheDocument()
    expect(end.querySelector('.sui-inline-filters')).not.toBeInTheDocument()
  })

  it('puts the panel layout button in the same flow', () => {
    const { container } = render(<DataTable data={users} columns={userColumns} />)
    const start = container.querySelector<HTMLElement>('.sui-toolbar__row .sui-toolbar__start')!
    expect(within(start).getByRole('button', { name: /^Filters,/ })).toBeVisible()
    expect(within(start).getByRole('searchbox', { name: 'Search table' })).toBeInTheDocument()
  })
})

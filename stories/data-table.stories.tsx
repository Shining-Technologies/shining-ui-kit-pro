import {
  DataTable,
  EyeIcon,
  PencilIcon,
  RowAction,
  RowActionGroup,
  TrashIcon,
  type ColumnDef,
  type DataTableQuery,
} from '@shining-ui-kit/react'
import { makeUsers, users, type User } from '@shining-ui-kit/examples'
import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, filter: { type: 'text' } },
  { accessorKey: 'email', header: 'Email', size: 240, filter: { type: 'text' } },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 120,
    filter: {
      type: 'multiSelect',
      options: ['Owner', 'Admin', 'Editor', 'Viewer'].map((value) => ({ label: value, value })),
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    filter: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  },
  { accessorKey: 'location', header: 'Location', size: 140, filter: { type: 'text' } },
  { accessorKey: 'lastActive', header: 'Last active', size: 140, filter: { type: 'date' } },
]

const meta = {
  title: 'DataTable/Basic',
  component: DataTable<User>,
  parameters: { layout: 'padded' },
  args: { data: users.slice(0, 12), columns, label: 'Team members' },
} satisfies Meta<typeof DataTable<User>>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {}

export const Empty: Story = {
  args: { data: [] },
}

export const Loading: Story = {
  args: { data: [], loading: true },
}

export const LoadingCustomRowCount: Story = {
  name: 'Loading (custom skeleton size)',
  args: { data: [], loading: true, loadingRowCount: 3 },
}

export const ErrorState: Story = {
  name: 'Error',
  args: {
    data: [],
    error: new Error('The users service did not respond in time.'),
    onRetry: () => window.alert('Retrying…'),
  },
}

export const Sorting: Story = {
  args: { defaultSorting: [{ id: 'name', desc: false }] },
  parameters: {
    docs: { description: { story: 'Click a header to cycle ascending, descending, unsorted.' } },
  },
}

export const MultiSorting: Story = {
  args: {
    defaultSorting: [
      { id: 'role', desc: false },
      { id: 'name', desc: false },
    ],
    features: { sorting: { multi: 'always' } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `multi: "always"` every header click adds to the sort. The default is `true`, ' +
          'which requires Shift-click.',
      },
    },
  },
}

export const NoSorting: Story = {
  args: { features: { sorting: { enabled: false } } },
}

export const Filtering: Story = {
  args: {
    defaultColumnFilters: [{ id: 'status', value: { operator: 'equals', value: 'active' } }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Filters arrive pre-applied and appear as removable chips under the toolbar.',
      },
    },
  },
}

export const AdvancedFiltering: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        Open <strong>Filter</strong>. Every column declares its filter type; the operator list and
        the number of value inputs come from the core filter registry, not from this component.
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: {
    columns: [
      ...columns,
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        size: 140,
        filter: { type: 'date', defaultOperator: 'between' },
      },
    ],
  },
}

export const InlineFilters: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        The same filters as <strong>AdvancedFiltering</strong>, laid out flat instead of behind a
        button. Nothing but <code>filterLayout</code> changes: the engine, the state shape and the
        operator registry are identical.
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: { filterLayout: 'inline' },
}

export const ScrollingRowsOnly: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        <code>maxHeight</code> turns the table into a fixed frame: the header sticks to its top, the
        footer to its bottom, and the rows are the only part that moves. Scroll and watch the header
        lift — the shadow only appears once there is something underneath it.
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: {
    data: makeUsers(60),
    maxHeight: 380,
    columns: [
      ...columns,
      {
        id: 'seats',
        header: 'Seats',
        size: 110,
        accessorFn: (row: User) => row.role,
        cell: ({ row }) => (row.original.status === 'active' ? 1 : 0),
        footer: ({ table }) =>
          `${table.getRowModel().rows.filter((row) => row.original.status === 'active').length} in use`,
        meta: { align: 'right' },
      },
    ] satisfies ColumnDef<User>[],
    features: { pagination: { pageSize: 60 } },
  },
}

export const TitleAndDescription: Story = {
  args: {
    title: 'Team members',
    description:
      'Everyone with access to this workspace. Suspended accounts stay listed — they still hold data.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The title becomes the accessible name of the table, and the description answers the question a column header cannot: what is *not* in this list.',
      },
    },
  },
}

export const ClearingFilters: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        Pick a role, then look at the toolbar: an active control grows its own clear button, and
        <strong> Clear filters</strong> appears with a count of everything applied — the search box
        included.
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: { filterLayout: 'inline' },
}

export const PinnedRowActions: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        Scroll sideways. The actions column is frozen to the right edge by default, and only casts
        its shadow while there is something scrolled underneath it. Free it with
        <code>
          {' '}
          features={'{'} pinning: {'{'} actions: false {'}'} {'}'}
        </code>
        .
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: {
    data: makeUsers(20),
    columns: [
      { accessorKey: 'name', header: 'Name', size: 220 },
      { accessorKey: 'email', header: 'Email', size: 260 },
      { accessorKey: 'phone', header: 'Phone', size: 200 },
      { accessorKey: 'location', header: 'Location', size: 200 },
      { accessorKey: 'createdAt', header: 'Joined', size: 180 },
      { accessorKey: 'lastActive', header: 'Last active', size: 180 },
    ] satisfies ColumnDef<User>[],
    rowActionsWidth: 120,
    rowActions: () => (
      <RowActionGroup>
        <RowAction icon={EyeIcon} label="View" href="#view" />
        <RowAction icon={PencilIcon} label="Edit" onClick={() => {}} />
        <RowAction icon={TrashIcon} label="Delete" destructive onClick={() => {}} />
      </RowActionGroup>
    ),
  },
}

export const Pagination: Story = {
  args: { data: makeUsers(240), pageSize: 10 },
}

export const PaginationWithoutNumbers: Story = {
  args: { data: makeUsers(240), features: { pagination: { showPageNumbers: false } } },
}

export const NoPagination: Story = {
  args: { data: users.slice(0, 20), features: { pagination: { enabled: false } } },
}

export const ServerPagination: Story = {
  render: () => <ServerExample />,
  args: { data: [], columns },
  parameters: {
    docs: {
      description: {
        story:
          'The table holds no data. It emits a `DataTableQuery` and renders whatever the fake ' +
          'API returns — swap `fetchPage` for your own client.',
      },
    },
  },
}

const ALL = makeUsers(1_240)

function ServerExample() {
  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState<DataTableQuery | null>(null)

  useEffect(() => {
    if (!query) return
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      if (cancelled) return
      const search = query.globalFilter.trim().toLowerCase()
      const matched = search
        ? ALL.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(search))
        : ALL
      const start = query.pageIndex * query.pageSize
      setRows(matched.slice(start, start + query.pageSize))
      setTotal(matched.length)
      setLoading(false)
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <DataTable<User>
      data={rows}
      columns={columns}
      label="Users (server-side)"
      mode="server"
      rowCount={total}
      pageSize={10}
      loading={loading}
      getRowId={(row) => row.id}
      onQueryChange={setQuery}
    />
  )
}

export const Selection: Story = {
  args: { enableRowSelection: true, getRowId: (row: User) => row.id },
}

export const SingleSelection: Story = {
  args: {
    getRowId: (row: User) => row.id,
    features: { selection: { enabled: true, mode: 'single' } },
  },
}

export const SelectionWithDisabledRows: Story = {
  args: {
    enableRowSelection: true,
    getRowId: (row: User) => row.id,
    isRowDisabled: (row: User) => row.status === 'suspended',
  },
}

export const ColumnVisibility: Story = {
  args: { defaultColumnVisibility: { location: false } },
  parameters: {
    docs: { description: { story: 'Open **Columns**. Visibility is ordinary, liftable state.' } },
  },
}

export const ColumnResizing: Story = {
  args: { features: { resizing: { enabled: true } } },
  parameters: {
    docs: {
      description: {
        story:
          'Drag a column edge, double-click it to reset, or focus the handle and use the arrow ' +
          'keys (Shift for larger steps).',
      },
    },
  },
}

export const ColumnPinning: Story = {
  args: {
    data: makeUsers(20),
    columns: [
      { accessorKey: 'name', header: 'Name', size: 200, defaultPinned: 'left' },
      { accessorKey: 'email', header: 'Email', size: 260 },
      { accessorKey: 'phone', header: 'Phone', size: 200 },
      { accessorKey: 'location', header: 'Location', size: 200 },
      { accessorKey: 'createdAt', header: 'Joined', size: 180 },
      { accessorKey: 'lastActive', header: 'Last active', size: 180 },
      { accessorKey: 'role', header: 'Role', size: 160, defaultPinned: 'right' },
    ] satisfies ColumnDef<User>[],
    features: { pinning: { enabled: true } },
  },
  parameters: {
    docs: { description: { story: 'Scroll sideways — pinned columns stay and cast a shadow.' } },
  },
}

export const ExpandableRows: Story = {
  args: {
    getRowId: (row: User) => row.id,
    renderExpandedRow: (row) => (
      <dl className="ex-details">
        <div>
          <dt>Phone</dt>
          <dd>{row.original.phone}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{row.original.location}</dd>
        </div>
        <div>
          <dt>Joined</dt>
          <dd>{row.original.createdAt}</dd>
        </div>
      </dl>
    ),
  },
}

export const RowInteractions: Story = {
  args: {
    onRowClick: (row) => window.alert(`Clicked ${row.original.name}`),
    onRowDoubleClick: (row) => window.alert(`Opened ${row.original.name}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Rows become keyboard reachable: arrows move, Enter activates, Space selects when ' +
          'selection is on.',
      },
    },
  },
}

export const WithFooter: Story = {
  args: {
    columns: [
      { accessorKey: 'name', header: 'Name', footer: 'Total' },
      { accessorKey: 'role', header: 'Role' },
      {
        accessorKey: 'status',
        header: 'Status',
        footer: ({ table }) => `${table.getRowModel().rows.length} people`,
      },
    ] satisfies ColumnDef<User>[],
  },
}

export const GroupedHeaders: Story = {
  args: {
    columns: [
      {
        id: 'identity',
        header: 'Identity',
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email' },
        ],
      },
      {
        id: 'access',
        header: 'Access',
        columns: [
          { accessorKey: 'role', header: 'Role' },
          { accessorKey: 'status', header: 'Status' },
        ],
      },
    ] satisfies ColumnDef<User>[],
  },
}

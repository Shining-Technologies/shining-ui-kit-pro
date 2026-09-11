import { users, type User } from '@shining-technologies/ui-kit-examples'
import {
  Badge,
  Button,
  CellBadge,
  CellDate,
  CellPerson,
  CopyIcon,
  DataTable,
  DataTableFilters,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  cn,
  useDataTable,
  type CellProps,
  type ColumnDef,
  type HeaderCellProps,
  type RowProps,
} from '@shining-technologies/ui-kit-react'
import { downloadTableCsv } from '@shining-technologies/ui-kit-export-csv'
import type { Meta, StoryObj } from '@storybook/react'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, filter: { type: 'text' } },
  { accessorKey: 'email', header: 'Email', size: 240 },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'status', header: 'Status', size: 120 },
]

const meta = {
  title: 'Customization',
  component: DataTable<User>,
  args: { data: users.slice(0, 8), columns, label: 'Team members' },
} satisfies Meta<typeof DataTable<User>>

export default meta
type Story = StoryObj<typeof meta>

export const CustomCells: Story = {
  args: {
    columns: [
      {
        accessorKey: 'name',
        header: 'User',
        size: 260,
        cell: ({ value, row }) => <CellPerson name={value} description={row.original.email} />,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 130,
        cell: ({ value }) => <CellBadge variant="outline">{value}</CellBadge>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        cell: ({ value }) => (
          <CellBadge
            tone={value === 'active' ? 'success' : value === 'invited' ? 'info' : 'danger'}
          >
            {value}
          </CellBadge>
        ),
      },
      {
        accessorKey: 'lastActive',
        header: 'Last active',
        size: 150,
        cell: ({ value }) => <CellDate value={value} options={{ dateStyle: 'long' }} />,
      },
    ] satisfies ColumnDef<User>[],
  },
}

/** Spread `rowProps` and everything the table needs keeps working. */
const StripedRow = ({ rowProps, children, rowIndex, isSelected }: RowProps<User>) => (
  <tr
    {...rowProps}
    className={cn(rowProps.className, rowIndex % 2 === 1 && 'sb-odd')}
    style={{ outline: isSelected ? '2px solid var(--sui-primary)' : undefined, outlineOffset: -2 }}
  >
    {children}
  </tr>
)

export const CustomRows: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        A replacement <code>Row</code> that spreads <code>rowProps</code>. Selection, keyboard
        navigation and ARIA state all survive, because they arrive pre-built in the prop bag.
      </p>
      <style>{`.sb-odd { background: var(--sui-row-striped); }`}</style>
      <DataTable<User> {...args} />
    </>
  ),
  args: {
    enableRowSelection: true,
    getRowId: (row: User) => row.id,
    components: { Row: StripedRow },
  },
}

const LoudHeaderCell = ({ cellProps, children, canSort, header, table }: HeaderCellProps<User>) => (
  <th {...cellProps}>
    <button
      type="button"
      disabled={!canSort}
      onClick={header.column.getToggleSortingHandler()}
      style={{
        all: 'unset',
        cursor: canSort ? 'pointer' : 'default',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontSize: '0.6875rem',
        color: header.column.getIsSorted() ? 'var(--sui-primary)' : 'inherit',
      }}
      aria-label={canSort ? `Sort by ${String(header.column.id)}` : undefined}
    >
      {children}
      {header.column.getIsSorted() === 'asc' ? ' ↑' : ''}
      {header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
      {table.getState().sorting.length > 1 && header.column.getIsSorted()
        ? ` ${header.column.getSortIndex() + 1}`
        : ''}
    </button>
  </th>
)

export const CustomHeader: Story = {
  args: { components: { HeaderCell: LoudHeaderCell } },
}

const MonospaceCell = ({ cellProps, children }: CellProps<User>) => (
  <td {...cellProps} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}>
    {children}
  </td>
)

export const CustomCellComponent: Story = {
  name: 'Custom Cell (global override)',
  args: { components: { Cell: MonospaceCell } },
}

function ExportButton() {
  const { table } = useDataTable<User>()
  return (
    <Button onClick={() => downloadTableCsv(table, { filename: 'team.csv' })}>Export CSV</Button>
  )
}

export const CustomToolbar: Story = {
  render: (args) => (
    <>
      <p className="sb-note">
        The toolbar is assembled by hand from the exported pieces, plus an application-specific
        export button that reads the live table through <code>useDataTable()</code>.
      </p>
      <DataTable<User> {...args} />
    </>
  ),
  args: {
    columns: [...columns, { accessorKey: 'location', header: 'Location', size: 140 }],
    slots: {
      toolbar: (
        <DataTableToolbar>
          <DataTableSearch />
          <DataTableFilters />
          <span style={{ marginInlineStart: 'auto', display: 'flex', gap: '0.5rem' }}>
            <ExportButton />
            <DataTableViewOptions />
          </span>
        </DataTableToolbar>
      ),
    },
  },
}

export const ReplacedToolbar: Story = {
  args: {
    components: {
      Toolbar: ({ table }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            border: '1px solid var(--sui-border)',
            borderRadius: 'var(--sui-radius)',
            background: 'var(--sui-muted)',
          }}
        >
          <strong>Team</strong>
          <Badge tone="accent">{table.getRowModel().rows.length} people</Badge>
        </div>
      ),
    },
  },
}

export const Slots: Story = {
  args: {
    slots: {
      beforeTable: (
        <p className="sb-note" style={{ margin: 0 }}>
          Anything can go above the table.
        </p>
      ),
      toolbarActions: <Button variant="solid">Invite people</Button>,
      afterTable: ({ table }) => (
        <p className="sb-note" style={{ margin: 0 }}>
          Showing {table.getRowModel().rows.length} of {table.getRowCount()} people.
        </p>
      ),
    },
  },
}

export const CustomEmptyState: Story = {
  args: {
    data: [],
    emptyState: (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, margin: 0 }}>Nobody here yet</p>
        <p className="sb-note" style={{ margin: '0.25rem 0 1rem' }}>
          Invite a teammate to get started.
        </p>
        <Button variant="solid">Invite someone</Button>
      </div>
    ),
  },
}

export const RowActionIcons: Story = {
  args: {
    getRowId: (row: User) => row.id,
    // Described, not rendered: the table builds each button, its tooltip and
    // its accessible name from this list.
    rowActions: (row) => [
      {
        icon: EyeIcon,
        label: `View ${row.original.name}`,
        onClick: () => window.alert(`View ${row.original.name}`),
      },
      { icon: PencilIcon, label: `Edit ${row.original.name}`, onClick: () => {} },
      { icon: CopyIcon, label: `Duplicate ${row.original.name}`, onClick: () => {} },
      {
        icon: TrashIcon,
        label: `Delete ${row.original.name}`,
        destructive: true,
        onClick: () => {},
      },
    ],
  },
}

export const ClassNameOverrides: Story = {
  args: {
    rowClassName: (row) => (row.original.status === 'suspended' ? 'sb-dim' : undefined),
    cellClassName: (cell) => (cell.column.id === 'name' ? 'sb-bold' : undefined),
  },
  render: (args) => (
    <>
      <style>{`.sb-dim { opacity: 0.5 } .sb-bold { font-weight: 600 }`}</style>
      <DataTable<User> {...args} />
    </>
  ),
}

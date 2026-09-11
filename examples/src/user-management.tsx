import {
  CellBadge,
  CellDate,
  CellPerson,
  CellText,
  DataTable,
  EyeIcon,
  MailIcon,
  TrashIcon,
  type ColumnDef,
} from '@shining-ui-kit/react'
import { users, type User } from './data'

/**
 * User management — the canonical admin table.
 *
 * Shows: composite person cells, status badges, selection, row actions frozen
 * to the right edge, the inline filter layout, responsive column hiding, a
 * date column with a real date filter, and a card layout that switches on the
 * table's own width rather than the window's.
 */
const STATUS_TONE = {
  active: 'success',
  invited: 'info',
  suspended: 'danger',
} as const

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    size: 260,
    enableHiding: false,
    cell: ({ value, row }) => (
      <CellPerson name={value} description={row.original.email} imageSrc={row.original.avatar} />
    ),
    filter: { type: 'text', label: 'Name' },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 130,
    filter: {
      type: 'multiSelect',
      options: [
        { label: 'Owner', value: 'Owner' },
        { label: 'Admin', value: 'Admin' },
        { label: 'Editor', value: 'Editor' },
        { label: 'Viewer', value: 'Viewer' },
      ],
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 130,
    cell: ({ value }) => (
      <CellBadge tone={STATUS_TONE[value]}>{value[0]!.toUpperCase() + value.slice(1)}</CellBadge>
    ),
    filter: {
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Invited', value: 'invited' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    size: 140,
    meta: { responsive: { hideBelow: 'lg' } },
    cell: ({ value }) => <CellText>{value}</CellText>,
    filter: { type: 'text' },
  },
  {
    accessorKey: 'lastActive',
    header: 'Last active',
    size: 150,
    meta: { responsive: { hideBelow: 'md' } },
    cell: ({ value }) => <CellDate value={value} />,
    filter: { type: 'date' },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    size: 150,
    defaultVisible: false,
    cell: ({ value }) => <CellDate value={value} />,
    filter: { type: 'date' },
  },
]

export interface UserTableProps {
  onView?: (user: User) => void
  onDelete?: (user: User) => void
}

export function UserManagementTable({ onView, onDelete }: UserTableProps = {}) {
  return (
    <DataTable
      data={users}
      columns={userColumns}
      label="Team members"
      getRowId={(row) => row.id}
      enableRowSelection
      pageSize={10}
      filterLayout="inline"
      responsiveMode="auto"
      isRowDisabled={(row) => row.status === 'suspended'}
      renderExpandedRow={(row) => (
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
      )}
      rowActions={(row) => [
        {
          icon: EyeIcon,
          label: `View ${row.original.name}`,
          onClick: () => onView?.(row.original),
        },
        // Kept in the row rather than dropped from it: the bin stays at the
        // same x whether or not this user can be re-invited.
        {
          icon: MailIcon,
          label: `Send ${row.original.name} another invite`,
          disabled: row.original.status !== 'invited',
          onClick: () => {},
        },
        {
          icon: TrashIcon,
          label: `Remove ${row.original.name}`,
          destructive: true,
          onClick: () => onDelete?.(row.original),
        },
      ]}
    />
  )
}

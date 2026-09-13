// Render-free column schema shared by the Server Component, the route handler and the client table.
import type { ColumnBehavior, SelectOption } from '@shining-technologies/ui/core'
import type { Role, Status, User } from './users'

export const ROLE_OPTIONS: SelectOption<Role>[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
]

export const STATUS_OPTIONS: SelectOption<Status>[] = [
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Suspended', value: 'suspended' },
]

export const USER_TIME_ZONE = 'Australia/Sydney'
export const USER_LOCALE = 'en-AU'

export const userColumns: ColumnBehavior<User>[] = [
  { accessorKey: 'id', enableGlobalFilter: false, enableSorting: false },
  { accessorKey: 'name', filter: { type: 'text' } },
  { accessorKey: 'email', filter: { type: 'text' } },
  { accessorKey: 'role', filter: { type: 'multiSelect', options: ROLE_OPTIONS } },
  { accessorKey: 'status', filter: { type: 'multiSelect', options: STATUS_OPTIONS } },
  { accessorKey: 'score', sortingFn: 'number', filter: { type: 'number' }, enableGlobalFilter: false },
  { accessorKey: 'lastLogin', sortingFn: 'datetime', filter: { type: 'date' }, enableGlobalFilter: false },
  { accessorKey: 'createdAt', sortingFn: 'datetime', filter: { type: 'date' }, enableGlobalFilter: false },
]

export const USER_LABELS: Record<keyof User, string> = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  role: 'Role',
  status: 'Status',
  score: 'Score',
  lastLogin: 'Last login',
  createdAt: 'Created',
}

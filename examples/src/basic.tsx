import { DataTable, type ColumnDef } from '@shining-ui-kit/react'
import { users, type User } from './data'

/**
 * The smallest useful table: data in, columns in, done.
 *
 * Sorting, search, filtering, pagination, the column picker, the empty state
 * and full keyboard support are already there.
 */
const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
]

export function BasicTable() {
  return <DataTable data={users.slice(0, 8)} columns={columns} label="Team" />
}

export const basicColumns = columns

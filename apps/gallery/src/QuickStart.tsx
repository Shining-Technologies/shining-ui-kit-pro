import { BasicTable } from '@shining-ui-kit/examples'

const SNIPPET = `import { DataTable, type ColumnDef } from '@shining-ui-kit/react'
import '@shining-ui-kit/react/styles.css'

interface User {
  name: string
  email: string
  role: string
  status: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
]

export function Team({ users }: { users: User[] }) {
  return <DataTable data={users} columns={columns} />
}`

export function QuickStart() {
  return (
    <div className="qs">
      <pre className="qs__code">
        <code>{SNIPPET}</code>
      </pre>
      <p className="docs__blurb">
        That is the whole file. Sorting, search, per-column filters, pagination, the column picker,
        the empty state and full keyboard support are already there.
      </p>
      <BasicTable />
    </div>
  )
}

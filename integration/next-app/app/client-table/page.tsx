import { users } from '@/lib/users'
import { ClientUsersTable } from './client-users-table'

export default function ClientTablePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Users (client mode)</h1>
      <ClientUsersTable rows={users} />
    </main>
  )
}

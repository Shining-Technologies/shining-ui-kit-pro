import { applyQuery, parseQuerySearchParams } from '@shining-technologies/ui/core'
import { users } from '@/lib/users'
import { USER_LOCALE, USER_TIME_ZONE, userColumns } from '@/lib/user-columns'
import { UsersTable } from './users-table'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseQuerySearchParams(await searchParams, {
    columns: userColumns,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
  })
  const result = applyQuery(users, query, {
    columns: userColumns,
    timeZone: USER_TIME_ZONE,
    locale: USER_LOCALE,
  })
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Users (server mode)</h1>
      <UsersTable rows={result.rows} total={result.total} query={{ ...query, pageIndex: result.pageIndex }} />
    </main>
  )
}

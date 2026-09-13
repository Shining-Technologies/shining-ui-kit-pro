'use client'

import { DataTable } from '@shining-technologies/ui'
import type { User } from '@/lib/users'
import { USER_LOCALE, USER_TIME_ZONE } from '@/lib/user-columns'
import { buildUserColumns } from '@/app/user-column-defs'

const columns = buildUserColumns()

export function ClientUsersTable({ rows }: { rows: User[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(u) => u.id}
      filterLayout="panel"
      pageSize={10}
      defaultColumnFilters={[
        { id: 'status', value: { operator: 'includes', value: ['active'] } },
        { id: 'lastLogin', value: { operator: 'after', value: '2026-03-15' } },
      ]}
      defaultSorting={[{ id: 'score', desc: true }]}
      timeZone={USER_TIME_ZONE}
      locale={USER_LOCALE}
      label="Client users"
    />
  )
}

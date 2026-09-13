'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  DataTable,
  serializeQuerySearchParams,
  useDataTableQueryState,
  type DataTableQuery,
} from '@shining-technologies/ui'
import type { User } from '@/lib/users'
import { USER_LOCALE, USER_TIME_ZONE, userColumns } from '@/lib/user-columns'
import { buildUserColumns } from '@/app/user-column-defs'

const columns = buildUserColumns()

export function UsersTable({ rows, total, query }: { rows: User[]; total: number; query: DataTableQuery }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const state = useDataTableQueryState(query, (next) =>
    startTransition(() =>
      router.replace(
        `${pathname}?${serializeQuerySearchParams(next, {
          columns: userColumns,
          base: searchParams,
          defaultPageSize: 10,
        })}`,
        { scroll: false },
      ),
    ),
  )

  return (
    <>
      <p className="mb-2">
        <Link href="/users" data-testid="reset-view">
          Reset view
        </Link>
      </p>
      <DataTable
        mode="server"
        {...state}
        data={rows}
        rowCount={total}
        columns={columns}
        timeZone={USER_TIME_ZONE}
        locale={USER_LOCALE}
        loading={isPending}
        getRowId={(u) => u.id}
        filterLayout="inline"
        features={{ pagination: { pageSizeOptions: [10, 25, 50] } }}
        label="Users"
      />
    </>
  )
}

'use client'

import { Badge, CellDate, type ColumnDef } from '@shining-technologies/ui'
import type { Status, User } from '@/lib/users'
import { USER_LABELS, USER_LOCALE, USER_TIME_ZONE, userColumns } from '@/lib/user-columns'

const STATUS_TONE: Record<Status, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  invited: 'warning',
  suspended: 'destructive',
}

/** Adds headers and cell renderers to the shared, render-free schema. */
export function buildUserColumns(): ColumnDef<User>[] {
  return userColumns.map((shared): ColumnDef<User> => {
    // ROUGH-EDGE: ColumnBehavior<User> types accessorFn as (row) => unknown and accessorPath as
    // string | undefined, so spreading the shared schema into a typed AccessorKeyColumnDef<User, K>
    // fails (TS2322) unless every accessor field is stripped and accessorKey is re-declared.
    const { accessorFn: _fn, accessorPath: _path, accessorKey, ...schema } = shared
    const key = accessorKey as keyof User
    const header = USER_LABELS[key]
    switch (key) {
      case 'status':
        return {
          ...schema,
          accessorKey: 'status',
          header,
          cell: ({ value }) => <Badge tone={STATUS_TONE[value]}>{value}</Badge>,
        }
      case 'lastLogin':
        return {
          ...schema,
          accessorKey: 'lastLogin',
          header,
          cell: ({ value }) => (
            <CellDate
              value={value}
              locale={USER_LOCALE}
              options={{ dateStyle: 'medium', timeStyle: 'short', timeZone: USER_TIME_ZONE }}
            />
          ),
        }
      case 'createdAt':
        return {
          ...schema,
          accessorKey: 'createdAt',
          header,
          cell: ({ value }) => (
            <CellDate value={value} locale={USER_LOCALE} options={{ dateStyle: 'medium', timeZone: 'UTC' }} />
          ),
        }
      default:
        return { ...schema, accessorKey: key, header } as ColumnDef<User>
    }
  })
}

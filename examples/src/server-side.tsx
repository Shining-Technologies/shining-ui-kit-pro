import { DataTable, type ColumnDef, type DataTableQuery } from '@shining-ui-kit/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { makeUsers, type User } from './data'

/**
 * Server-side everything.
 *
 * The table owns no data: it reports a {@link DataTableQuery} and renders
 * whatever comes back. Swap `fetchPage` for `fetch`, a GraphQL client, React
 * Query or a server action — the table never learns which (§37).
 */
const ALL_ROWS = makeUsers(1_240)

export interface Page<T> {
  rows: T[]
  total: number
}

/** Stands in for an API. Applies the query exactly as a real backend would. */
export async function fetchPage(query: DataTableQuery, signal?: AbortSignal): Promise<Page<User>> {
  await new Promise((resolve) => setTimeout(resolve, 350))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  let rows = ALL_ROWS

  const search = query.globalFilter.trim().toLowerCase()
  if (search) {
    rows = rows.filter((row) =>
      `${row.name} ${row.email} ${row.location}`.toLowerCase().includes(search),
    )
  }

  for (const filter of query.columnFilters) {
    const value = (filter.value as { value?: unknown })?.value ?? filter.value
    if (value === undefined || value === '') continue
    rows = rows.filter((row) =>
      String(row[filter.id as keyof User] ?? '')
        .toLowerCase()
        .includes(String(value).toLowerCase()),
    )
  }

  const sort = query.sorting[0]
  if (sort) {
    const key = sort.id as keyof User
    rows = [...rows].sort((a, b) => {
      const result = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, {
        numeric: true,
      })
      return sort.desc ? -result : result
    })
  }

  const start = query.pageIndex * query.pageSize
  return { rows: rows.slice(start, start + query.pageSize), total: rows.length }
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, filter: { type: 'text' } },
  { accessorKey: 'email', header: 'Email', size: 240, filter: { type: 'text' } },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'location', header: 'Location', size: 150, filter: { type: 'text' } },
  { accessorKey: 'lastActive', header: 'Last active', size: 140 },
]

export function ServerSideTable() {
  const [page, setPage] = useState<Page<User>>({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)
  const [query, setQuery] = useState<DataTableQuery | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async (next: DataTableQuery) => {
    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await fetchPage(next)
      // Ignore responses that arrived after a newer request was issued.
      if (id === requestId.current) setPage(result)
    } catch (cause) {
      if (id === requestId.current) setError(cause)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query) void load(query)
  }, [query, load])

  return (
    <DataTable
      data={page.rows}
      columns={columns}
      label="Users (server-side)"
      mode="server"
      rowCount={page.total}
      pageSize={10}
      loading={loading}
      error={error}
      getRowId={(row) => row.id}
      onQueryChange={setQuery}
      onRetry={() => query && void load(query)}
      features={{ filtering: { debounceMs: 400 } }}
    />
  )
}

# Server-side data

The table reports what it needs and renders what you give it. It has no opinion about REST,
GraphQL, React Query, SWR or server actions, and it never imports any of them.

## The shape of it

```tsx
<DataTable
  data={page.rows}
  columns={columns}
  mode="server"
  rowCount={page.total}
  loading={loading}
  error={error}
  onRetry={refetch}
  getRowId={(row) => row.id}
  onQueryChange={(query) => void load(query)}
/>
```

`mode="server"` switches sorting, filtering and pagination to manual: the engine keeps the
state and reports it, but leaves the rows alone. `rowCount` is what lets it work out the page
count. `data` accepts a readonly array, so a frozen or `as const` result passes as it is.

## The query

```ts
interface DataTableQuery {
  pageIndex: number
  pageSize: number
  sorting: SortingState // [{ id, desc }]
  columnFilters: ColumnFiltersState // [{ id, value }]
  globalFilter: string
}
```

`onQueryChange` fires once on mount (so it can drive the initial load) and then once per real
change to one of those five things. Unrelated re-renders do not trigger a fetch.

- **A new sort, filter or search returns to page 0 in the same update**, so the change and
  the page reset arrive as one query, not two — and never as page 5 of a different result.
- **`columnFilters` only lists filters that have a value.** Picking an operator in an empty
  filter changes nothing on the server, so it neither fires a query nor resets the page.
- **A shrinking total steps back.** When `rowCount` drops under the current page — the last
  row of the last page deleted — the table moves to the page that now ends the result. When
  `rowCount` settles at 0, that is page 0. It waits until `loading` is false, so a stale total
  mid-fetch does not move it.

## A complete example

```tsx
function UsersTable() {
  const [page, setPage] = useState<Page<User>>({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [query, setQuery] = useState<DataTableQuery | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async (next: DataTableQuery) => {
    const id = ++requestId.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await api.users(next)
      if (id === requestId.current) setPage(result) // ignore stale responses
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
      mode="server"
      rowCount={page.total}
      loading={loading}
      error={error}
      onRetry={() => query && void load(query)}
      onQueryChange={setQuery}
      getRowId={(row) => row.id}
      features={{ filtering: { debounceMs: 400 } }}
    />
  )
}
```

The out-of-order guard matters: without it, a slow page-1 response can overwrite a fast
page-2 one.

## With React Query

The recommended pattern:

```tsx
const EMPTY: User[] = []   // module level: one array, not a new one per render

const [query, setQuery] = useState<DataTableQuery | null>(null)
const { data, isFetching, error, refetch } = useQuery({
  queryKey: ['users', query],
  queryFn: () => api.users(query!),
  enabled: !!query,                    // wait for the table's first query
  placeholderData: keepPreviousData,   // avoids a flash of empty rows while paging
})

<DataTable
  data={data?.rows ?? EMPTY}
  columns={columns}
  mode="server"
  rowCount={data?.total}
  loading={isFetching}
  error={error}
  onRetry={refetch}
  onQueryChange={setQuery}
  getRowId={(row) => row.id}
/>
```

Prefer `rowCount={data?.total}` to `?? 0`: undefined says "not known yet", while `0` claims an
empty result before the first page has even arrived.

## Mixing modes

`mode` is a default; each feature can disagree. A common combination is server pagination with
client-side sorting of the page you already have:

```tsx
features={{
  pagination: { mode: 'server' },
  sorting:    { mode: 'client' },
  filtering:  { mode: 'server' },
}}
```

## Debouncing

The search box debounces before it reaches the table state, so typing does not fire a request
per keystroke. Raise it for slow backends:

```tsx
features={{ filtering: { debounceMs: 500 } }}
```

## Selection with server data

Pass `getRowId` so selection is keyed by a real id, not by array position — otherwise a
refetch silently selects different rows.

## Exporting to CSV

The table holds one page, so a CSV export of it holds one page. Fetch the full set and pass
it through `@shining-technologies/ui-kit-export-csv`'s `data` option:

```ts
downloadTableCsv(table, { data: allRows, filename: 'users.csv' })
```

The rows go through the table's own columns. With `rows: 'selected'`, selections made on other
pages are included, matched by `getRowId`.

## Translating the query

Filter values are `{ operator, value }` pairs, which map cleanly onto most query languages:

```ts
const where = query.columnFilters.map(({ id, value }) => {
  const { operator, value: operand } = normalizeFilterValue(value, 'text')
  return { field: id, op: operator, value: operand }
})
```

`normalizeFilterValue` and the operator registry are exported from `@shining-technologies/ui-kit-core`, so
your server can share the same vocabulary.

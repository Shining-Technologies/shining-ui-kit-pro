# Pagination

## Client pagination

On by default with a page size of 10.

```tsx
<DataTable data={rows} columns={columns} pageSize={25} />
```

```tsx
features={{
  pagination: {
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    showPageNumbers: true,
    siblingCount: 1,       // page buttons either side of the current page
  },
}}
```

Turn it off — render every row — with `features={{ pagination: { enabled: false } }}`, or hide
just the control with `showPagination={false}`.

## State

```tsx
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

<DataTable pagination={pagination} onPaginationChange={setPagination} … />
```

`pageIndex` is zero-based. `defaultPagination` sets the starting page when uncontrolled.

## Server pagination

Give the table the total row count and it derives everything else:

```tsx
<DataTable
  data={page.rows}
  columns={columns}
  mode="server"
  rowCount={page.total}
  pageSize={20}
  loading={loading}
  onQueryChange={({ pageIndex, pageSize }) => load(pageIndex, pageSize)}
/>
```

The control is identical in both modes — "Showing 21–40 of 1,240", numbered pages, first /
previous / next / last. Nothing in the UI knows where the rows came from.

A `pageSize` that is not among `pageSizeOptions`, like the `20` above, is added to the
page-size select, so the select always shows the current size. An empty table reads
"Page 1 of 1", not "Page 1 of 0".

## Staying on the page when data changes

In client pagination a new `data` array returns to the first page. When the array changes
because of a poll or a refetch rather than a new result, pass `keepPageOnDataChange`: the
page is kept (or steps back to the last one if the data got shorter), while sorting,
filtering and searching still reset it. Server pagination never resets on new data, so it
ignores the prop.

## Replacing the control

```tsx
<DataTable
  components={{
    Pagination: ({ table }) => (
      <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
        Load more
      </button>
    ),
  }}
/>
```

Or drop content in through the slot: `slots={{ pagination: <MyPager /> }}`.

The page-number arithmetic is exported and pure, so a custom control can reuse it:

```ts
import { getPageNumbers, getPageRange } from '@shining-technologies/ui-kit-core'

getPageNumbers(30, 62, 1) // [0, 'ellipsis-start', 29, 30, 31, 'ellipsis-end', 61]
getPageRange(1, 20, 1240) // { from: 21, to: 40, total: 1240 }
```

## Accessibility

The control is a `<nav aria-label="Table pagination">`. The current page button carries
`aria-current="page"`, and a visually hidden live region announces "Page 3 of 62" on every
change without moving focus.

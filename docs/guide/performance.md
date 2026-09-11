# Performance

## The one rule that matters

**Keep `data` and `columns` referentially stable.**

```tsx
// Bad: a new array on every render.
<DataTable data={users.map(toRow)} columns={[{ accessorKey: 'name' }]} />

// Good.
const rows = useMemo(() => users.map(toRow), [users])
const columns = useMemo<ColumnDef<Row>[]>(() => [...], [])
<DataTable data={rows} columns={columns} />
```

A new `data` array is, correctly, treated as new data — which resets the page index. If your
table keeps snapping back to page 1, this is why.

## What the library already does

**Only the current page renders.** A 10,000-row table with `pageSize={25}` puts 25 rows in the
DOM. Sorting and filtering still run across all 10,000, in the engine, not in React.

**Column widths are CSS variables.** Widths are published once on the `<table>` element as
`--sui-c-<id>-size` and read back by every cell. A resize drag updates one style object rather
than thousands of inline widths.

**Responsive rules are CSS.** Column hiding and the card layout are media queries — no resize
listener, no re-render on viewport change.

**Handlers are stable.** Internal callbacks go through `useEventCallback`, so they keep a
stable identity while always seeing the latest scope. That is what makes `React.memo` on your
own cells actually work.

**One state store.** The engine instance is the single source of truth; no component keeps a
second copy that has to be kept in sync.

## Making your own cells cheap

Memoise cell components that do real work:

```tsx
const StatusCell = memo(function StatusCell({ status }: { status: Status }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>
})

{ accessorKey: 'status', header: 'Status', cell: ({ value }) => <StatusCell status={value} /> }
```

Pass primitives, not objects. `<StatusCell status={value} />` memoises; `<StatusCell row={row} />`
does not, because `row` changes identity whenever table state does.

Do not memoise everything by reflex — a cell that renders a string is cheaper than the
comparison that would guard it.

## Virtualisation

For long, unpaginated lists:

```tsx
import { VirtualizedDataTable } from '@shining-ui-kit/react/virtualized'

;<VirtualizedDataTable
  data={fiftyThousandRows}
  columns={columns}
  maxHeight="70vh"
  features={{ virtualization: { enabled: true, estimateRowHeight: 48, overscan: 8 } }}
/>
```

It lives at a separate entry point so `@tanstack/react-virtual` — an optional peer dependency
— only reaches apps that import it. The table needs a bounded height (`maxHeight`): that is
what creates the scroll container it measures against.

Reach for it when you genuinely cannot paginate. Pagination is faster, simpler, and better for
screen readers.

## Measuring

```tsx
<Profiler id="table" onRender={(id, phase, duration) => console.log(id, phase, duration)}>
  <DataTable … />
</Profiler>
```

If a table feels slow, check in this order:

1. Is `data` or `columns` being recreated each render?
2. Is a `cell` function doing expensive work (date parsing, JSON, sorting) per render?
3. Is a parent re-rendering the whole page on every keystroke?
4. Only then: virtualisation.

# Filtering

Filtering is a system, not a search box. A column declares _what kind of value it holds_; the
library derives the operators, the panel UI and the predicate from that.

## Declaring a filter

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  filter: {
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
}
```

That is enough for the column to appear in the **Filter** panel with the right control, the
right operator list, and a working predicate.

## Types and operators

| Type          | Operators                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `text`        | `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`                           |
| `number`      | `equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `isEmpty`, `isNotEmpty` |
| `date`        | `on`, `before`, `after`, `between`, `isEmpty`, `isNotEmpty`                                                                   |
| `select`      | `equals`, `notEquals`, `isEmpty`, `isNotEmpty`                                                                                |
| `multiSelect` | `includes`, `notIncludes`, `isEmpty`, `isNotEmpty`                                                                            |
| `boolean`     | `isTrue`, `isFalse`                                                                                                           |

Text comparisons ignore case _and_ accents (`renee` matches `Renée`). Date comparisons work
on whole days, and `between` includes both ends.

Restrict or reorder the list per column:

```tsx
filter: { type: 'text', operators: ['contains', 'equals'], defaultOperator: 'equals' }
```

## Filter state

Stored in `columnFilters` as `{ id, value }`. The value is normally structured:

```ts
;[{ id: 'score', value: { operator: 'greaterThanOrEqual', value: 80 } }]
```

A bare value is also accepted and pairs with the type's default operator, which keeps simple
controlled usage terse:

```ts
;[{ id: 'name', value: 'john' }] // means: name contains "john"
```

Controlled:

```tsx
const [filters, setFilters] = useState<ColumnFiltersState>([])

<DataTable columnFilters={filters} onColumnFiltersChange={setFilters} … />
```

Uncontrolled with an initial value: `defaultColumnFilters={[…]}`.

## Global search

The toolbar search box drives `globalFilter`. Columns opt out with
`enableGlobalFilter: false`. Typing is debounced (250 ms by default) so that server mode does
not fire a request per keystroke:

```tsx
features={{ filtering: { debounceMs: 400, searchPlaceholder: 'Search users…' } }}
```

Turn the box off entirely with `features={{ filtering: { globalSearch: false } }}`.

## Two filter layouts

The same filters, arranged two ways. `filterLayout` chooses; nothing else changes — the
engine, the state shape and the operator registry are identical in both.

```tsx
<DataTable filterLayout="panel" />   // default
<DataTable filterLayout="inline" />
```

**`panel`** collects every filter behind one **Filter** button, with an operator picker per
row. It scales: twelve filters cost one button of toolbar space, and rare operators
(`startsWith`, `isNotEmpty`) are available without cluttering the common case. Applied
filters are summarised as chips underneath, because a filter you cannot see is a filter you
cannot undo.

**`inline`** lays one control per filterable column flat across the toolbar, each naming its
own field. The whole query is legible without opening anything, which is what you want on a
table people filter constantly. The trade-off is deliberate: an inline control offers the
operator its type is usually filtered by, not all of them — text contains, select equals,
dates and numbers a `between` range behind one trigger. Reach for `panel` when the operator
matters as much as the value.

The inline bar also shows the filtered row count, since the controls and their result belong
together. Turn that off with `showToolbarCount={false}`, or on for the panel layout with
`showToolbarCount`.

## Dates and ranges

A `date` or `number` filter is a range unless the column says otherwise — "amount equals 80"
is almost never the question. Declare `defaultOperator` to get a single value instead:

```tsx
filter: { type: 'date' }                          // From / To, with presets
filter: { type: 'date', defaultOperator: 'on' }   // one day
filter: { type: 'number' }                        // Minimum / Maximum
filter: { type: 'number', defaultOperator: 'greaterThan' }
```

Each end is labelled — **From** / **To**, **Minimum** / **Maximum** — because `3 – 7` in two
anonymous boxes is only obvious to whoever wrote it, and either end may be left empty for an
open-ended range. Date ranges also offer **Today**, **Last 7 days**, **Last 30 days** and
**This month**, which is what most range picking actually is.

Dates are picked from the kit's own `Calendar`: a month grid built from the same tokens as
everything else, with the full ARIA grid keyboard — arrows by day, `PageUp` / `PageDown` by
month, `Home` / `End` across the week. It is exported, so it can be used outside a filter:

```tsx
import { Calendar, DateField } from '@shining-technologies/ui-kit-react'

;<DateField label="Start date" value={from} onChange={setFrom} max={to} />
```

Values are `yyyy-mm-dd` strings in the viewer's own timezone — never `toISOString()`, which
would move the day by one for half the planet every evening.

## One search box

The toolbar shows exactly one free-text field. A `text` filter on a column that the search box
already covers is the same control twice, so the inline layout leaves it out — the two of
them side by side, identical, is the confusing part.

It keeps the column's own filter when the search box genuinely cannot do the job:

- the column opted out of global search with `enableGlobalFilter: false`, or
- the filter asks for an operator the search box does not offer (`defaultOperator`,
  `operators`), such as `startsWith` or `isEmpty`.

The panel layout always lists every filter: it is a form, not a second search box.

## Getting back out

Every applied filter has a visible way out, at two scales:

- An active inline control grows a **clear** button against its trailing edge. A filter you can
  only undo by finding the right "Any" option again is a trap, and select-shaped controls are
  the worst offenders.
- The toolbar shows **Clear filters** with a count as soon as anything is applied — column
  filters and the search box together. It is the one way back to the whole data set when four
  filters are narrowing it.

In the panel layout the applied filters are also summarised as removable chips, because a
filter behind a closed popover is otherwise invisible.

Both layouts read from `filterableColumns(table, filterConfigs)`, so a column that can be
filtered in one can be filtered in the other.

## Custom predicates

When the built-in operators do not express your rule, take over the predicate. The panel and
the operator list keep working:

```tsx
filter: {
  type: 'text',
  label: 'Tags',
  predicate: (rowValue, filter) =>
    Array.isArray(rowValue) &&
    rowValue.some((tag) => String(tag).startsWith(String(filter.value))),
}
```

## Server-side filtering

```tsx
<DataTable mode="server" onQueryChange={({ columnFilters, globalFilter }) => fetch(…)} />
```

The engine stops filtering locally and simply reports state. The panel, the chips and the
operator list are unchanged — see [server-side](./server-side.md).

## Replacing the filter UI

The UI reads the operator registry from `@shining-technologies/ui-kit-core`; it never invents semantics. So
you can replace it wholesale and filtering still behaves identically:

```tsx
<DataTable components={{ Filters: MyFilterPanel }} … />
```

`Filters` receives both layouts' job: the default implementation dispatches on
`filterLayout`, and `FilterPanel` / `InlineFilters` are exported individually if you want to
keep one and replace the other.

Inside your panel, `useColumnFilter(column, config)` gives you `filter`, `operators`,
`arity`, `setOperator`, `setValue`, `setRangeValue` and `clear`.

## Using the engine outside the table

Every predicate is exported and pure, so the same rules can run on a server:

```ts
import { matchesFilter, isFilterActive } from '@shining-technologies/ui-kit-core'

rows.filter((row) => matchesFilter(row.status, 'select', { operator: 'equals', value: 'active' }))
```

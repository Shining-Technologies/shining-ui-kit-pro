# Sorting

## The cycle

Clicking a header goes ascending → descending → unsorted. The cycle is the same for every
data type: the engine's default of "numbers descend first" makes behaviour depend on the
values, which is exactly the kind of surprise a predictable API should avoid.

A column can opt in to descending-first:

```tsx
{ accessorKey: 'revenue', header: 'Revenue', sortDescFirst: true }
```

Remove the "unsorted" step with `features={{ sorting: { removable: false } }}`.

## Multi-column sorting

Shift-click adds a column to the sort; a small index appears next to the arrow. To make every
click additive:

```tsx
features={{ sorting: { multi: 'always' } }}
```

Disable it with `multi: false`.

## Comparators

`sortingFn` takes a **value** comparator — simpler than the engine's row comparator:

```tsx
{ accessorKey: 'priority', header: 'Priority', sortingFn: (a, b) => rank[a] - rank[b] }
```

Built-ins: `'auto'` (picks by runtime type), `'text'` (locale-aware, numeric-aware),
`'number'`, `'datetime'`, `'boolean'`. Empty values always sort last, in both directions.

## State

```tsx
const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

<DataTable sorting={sorting} onSortingChange={setSorting} … />
```

Uncontrolled with a starting order: `defaultSorting={[{ id: 'name', desc: false }]}`.

## Server-side sorting

```tsx
<DataTable sorting={{ mode: 'server' }} onSortingChange={refetch} … />
```

or `mode="server"` for every feature at once. The header still reports `aria-sort` and the
arrow still moves — only the row model is left alone.

> `sorting` accepts either a `SortingState` (an array) or a `{ mode }` config object. They can
> never be confused, because state is always an array. `features.sorting` is the canonical
> place for configuration.

## Accessibility

The sort control is a real `<button>` inside the `<th>`, so it is tabbable and activates with
Enter or Space. Its accessible name says what the next click will do — "Name, sort ascending",
"Name, sort descending", "Name, clear sort". The `<th>` carries `aria-sort`, and only sortable
columns carry it at all.

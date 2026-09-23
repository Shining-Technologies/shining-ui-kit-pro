# Data view

Controls for a view over a collection that is not a `DataTable`: a card grid, a list, a board, a
calendar. `FilterBar` lays out a search box, filters and actions on one wrapping line, `FilterChips`
shows the filters in force as removable chips, and `BulkActionBar` carries the count and the actions
for a selection. They look like the DataTable's own toolbar, active filters and selection bar, so a
page that has both reads as one product.

```tsx
import {
  BulkActionBar,
  FilterBar,
  FilterBarActions,
  FilterChips,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/data-view'
```

**Server and client.** All four are client components (`'use client'`). They take event handlers,
so render them from a client component.

Exported types: `BulkActionBarProps`, `FilterBarProps`, `FilterChipsProps`.

- [FilterBar](#filterbar)
- [FilterChips](#filterchips)
- [BulkActionBar](#bulkactionbar)
- [Accessibility](#accessibility)
- [Related](#related)

## FilterBar

A line of controls that narrow a list. Put a `SearchInput`, `Select`s, `Combobox`es and toggle
`Chip`s in it, and actions (a view switch, Export, New) in `FilterBarActions`, which pushes them to
the end. It wraps onto more lines as the width runs out, and under 40rem the search takes a line of
its own.

```tsx
'use client'

import {
  Button,
  Chip,
  FilterBar,
  FilterBarActions,
  FilterChips,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shining-technologies/ui'

export function ProjectFilters({ filters, setFilters, clearAll }: ProjectFiltersProps) {
  return (
    <>
      <FilterBar aria-label="Filter projects">
        <SearchInput
          aria-label="Search projects"
          value={filters.query}
          onValueChange={(query) => setFilters({ ...filters, query })}
        />
        <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
        <Chip selected={filters.mine} onSelectedChange={(mine) => setFilters({ ...filters, mine })}>
          Mine
        </Chip>
        <FilterBarActions>
          <Button size="sm">New project</Button>
        </FilterBarActions>
      </FilterBar>

      <FilterChips onClearAll={clearAll}>
        {filters.status !== 'all' ? (
          <Chip onRemove={() => setFilters({ ...filters, status: 'all' })} removeLabel="Remove status filter">
            Status: {filters.status}
          </Chip>
        ) : null}
      </FilterChips>
    </>
  )
}
```

| Prop         | Type     | Default     | Description |
| ------------ | -------- | ----------- | ----------- |
| `aria-label` | `string` | `'Filters'` | Names the group. |

`FilterBar` renders a `<div role="group">` and accepts all `<div>` props; `FilterBarActions` renders a
`<div>`. Filter state is yours: neither component holds any. Classes: `.sui-filter-bar`,
`.sui-filter-bar__actions`; `data-slot="filter-bar"` and `"filter-bar-actions"`.

## FilterChips

The filters in force, as chips, with a "Clear all" button. A filter set in a popover or a select is
easy to forget once it closes; the chips keep it on screen. Pass one removable `Chip` per filter. With
no chips it renders nothing.

| Prop         | Type                          | Default                        | Description |
| ------------ | ----------------------------- | ------------------------------ | ----------- |
| `onClearAll` | `() => void`                  | —                              | Shows the "Clear all" button. |
| `clearLabel` | `string`                      | `'Clear all'`                  | The button's text. |
| `summary`    | `(count: number) => string`   | `'2 filters applied'`          | The sentence announced as the count changes. |
| `children`   | `ReactNode`                   | —                              | The chips. |

Also accepts all `<div>` props. The count is a visually hidden `role="status"` region, so it is
announced politely as filters come and go. Classes: `.sui-active-filters` (shared with the
DataTable), `.sui-filter-chips`, `.sui-filter-chips__clear`.

## BulkActionBar

The "N selected" band, with the actions that apply to every selected item. The DataTable renders this
for its row selection — give it actions with `slots.selectionActions`, see
[Bulk actions](../data-table.md#bulk-actions). On its own it serves a card grid, a list or a board with
a selection of its own. It renders nothing while `count` is `0`.

```tsx
'use client'

import { BulkActionBar, Button } from '@shining-technologies/ui'

<BulkActionBar count={selected.size} total={projects.length} onClear={() => setSelected(new Set())}>
  <Button size="sm" variant="outline">Export</Button>
  <Button size="sm" variant="destructive">Archive</Button>
</BulkActionBar>
```

| Prop           | Type                        | Default             | Description |
| -------------- | --------------------------- | ------------------- | ----------- |
| `count`        | `number`                    | —                   | Required. How many items are selected. |
| `total`        | `number`                    | —                   | How many there are, for "3 of 40 selected". |
| `onClear`      | `() => void`                | —                   | Shows the Clear button. |
| `clearLabel`   | `string`                    | `'Clear selection'` | The Clear button's text. |
| `formatNumber` | `(value: number) => string` | `en-US` grouping    | Formats the counts. The default is the same on server and client. |
| `label`        | `ReactNode`                 | —                   | Replaces the "3 of 40 selected" text. |
| `children`     | `ReactNode`                 | —                   | The actions. |

Also accepts all `<div>` props. With actions, the count is a polite live region and the actions are a
`role="group"` named "Bulk actions"; without them, the whole bar is the live region, as the table's bar
has always been. Classes: `.sui-selection-bar` (shared with the DataTable), `__count`, `__actions`,
`__clear`; `data-slot="bulk-action-bar"`.

## Accessibility

- `FilterBar` is a named group; name each control inside it (`aria-label` on a `SearchInput` or a
  `SelectTrigger` with no visible label).
- `FilterChips` and `BulkActionBar` announce their counts politely. The chips' remove buttons need a
  `removeLabel` that names the filter.
- Keep the filters' order stable: moving a control as filters change moves the user's focus target.

## Related

- [Badge](./badge.md): `Chip`
- [Form](./form.md): `SearchInput`, `Select`, `Combobox`, `MultiCombobox`
- [Data table](../data-table.md): the connected toolbar, filters and selection bar
- [Navigation](./navigation.md): `Pagination` under the results
- [Feedback](./feedback.md): `Empty` for no results

# Cells

## Custom cells

A `cell` function receives the extracted, typed value plus the row, column, cell and table:

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ value, row, column, table, rowIndex, meta }) => <StatusBadge status={value} />,
}
```

`value` is typed from the accessor, so `value.toFixed(2)` on a number column compiles and
`value.toUpperCase()` on it does not.

## The cell toolkit

Optional, consistent renderers for the cases every table needs:

```tsx
import {
  CellBadge,
  CellDate,
  CellEmpty,
  CellLink,
  CellNumber,
  CellPerson,
  CellProgress,
  CellStack,
  CellText,
} from '@shining-technologies/ui-kit-react'
```

| Component      | For                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| `CellText`     | Truncating text with a hover title                                          |
| `CellBadge`    | Status pills — `tone`: neutral / success / warning / danger / info / accent |
| `CellStack`    | Two lines in one cell: a value and the thing always read with it            |
| `CellPerson`   | Avatar plus a name, a contact line and an ownership line                    |
| `CellProgress` | An accessible meter with an optional value                                  |
| `CellNumber`   | `Intl.NumberFormat` — currency, percent, compact — with tabular figures     |
| `CellDate`     | `Intl.DateTimeFormat` inside a `<time>` element                             |
| `CellLink`     | A link that does not also trigger the row's click handler                   |
| `CellEmpty`    | The muted placeholder, so a blank reads as an answer                        |

### Stacked cells

An id and its status, a date and its time, a service and its extras: pairs that are only ever
read together belong in one column, not two.

```tsx
cell: ({ value, row }) => (
  <CellStack secondary={<CellBadge tone="success">Paid</CellBadge>}>{value}</CellStack>
)
```

### People

```tsx
cell: ({ value, row }) => (
  <CellPerson
    name={value}
    description={row.original.email}
    caption={row.original.owner ? `Handled by ${row.original.owner}` : 'Unassigned'}
    seed={row.original.id}
  />
)
```

The avatar's colour is hashed from `seed` (or the name) into the project's chart ramp, so the
same person is the same colour in every table and a retheme carries the avatars with it. It is
a tint of that colour rather than the colour itself — nothing guarantees white initials would
clear 4.5:1 against an arbitrary project's hue.

```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  meta: { align: 'right' },
  cell: ({ value }) => <CellNumber value={value} options={{ style: 'currency', currency: 'AUD' }} />,
}
```

None of them is required. A `cell` function can return any React you like.

## Row actions

Two shapes, and they mix. Icons for the two or three things people do constantly; a menu for
the long tail.

### Icon actions

Describe them and the table builds the buttons:

```tsx
import { Eye, Pencil, Trash2 } from 'lucide-react'

;<DataTable
  rowActions={(row) => [
    { icon: Eye, label: 'View', href: `/orders/${row.original.id}` },
    { icon: Pencil, label: 'Edit', onClick: () => edit(row.original) },
    {
      icon: Trash2,
      label: 'Delete',
      destructive: true,
      disabled: row.original.locked,
      onClick: () => remove(row.original),
    },
  ]}
/>
```

`hidden: true` leaves an action out for one row while holding its place, so the icons do not
shuffle from row to row — which is what makes a column of actions scannable.

Compose them by hand when a row needs something else in the cell:

```tsx
import { RowAction, RowActionGroup } from '@shining-technologies/ui-kit-react'

;<DataTable
  rowActionsWidth={150}
  rowActions={(row) => (
    <RowActionGroup align="end">
      <RowAction icon={Eye} label="View" href={`/orders/${row.original.id}`} />
      <MyCustomThing row={row} />
    </RowActionGroup>
  )}
/>
```

Any icon component that takes SVG props works — the kit's own, or lucide's. `label` is not
optional: it is the button's accessible name _and_ its tooltip, so an icon never carries the
meaning alone. Add as many as the row needs and widen the column with `rowActionsWidth`.

The group aligns to the `start` by default, which keeps the first icon at the same x in every
row even when later ones only appear for some records; `align="end"` hugs the table's edge.

The column's header reads **Actions**. Change it with `rowActionsHeader`, or pass `false` to
keep the name for screen readers and hide it.

### A menu

For the common case — view, edit, delete — the icons above are the default: three buttons a
row is faster to read and to hit than a `⋮` that hides them. Reach for the menu when a row has
more actions than fit on one line, or when they need headings and separators.

```tsx
import { RowActions } from '@shining-technologies/ui-kit-react'

;<DataTable
  rowActions={(row) => (
    <RowActions
      label={`Actions for ${row.original.name}`}
      items={[
        { label: 'View', onSelect: () => view(row.original) },
        { label: 'Edit', onSelect: () => edit(row.original) },
        {
          label: 'Delete',
          onSelect: () => remove(row.original),
          destructive: true,
          separatorBefore: true,
        },
      ]}
    />
  )}
/>
```

The library supplies the menu; the actions are yours. The actions column is injected at the
end, and clicks inside it never reach the row's own handlers.

## Interactive content inside cells

Anything interactive should stop propagation if the table also has `onRowClick`. The toolkit
components already do:

```tsx
cell: ({ row }) => (
  <button
    onClick={(event) => {
      event.stopPropagation()
      approve(row.original)
    }}
  >
    Approve
  </button>
)
```

## Overriding every cell at once

```tsx
components={{
  Cell: ({ cellProps, children }) => (
    <td {...cellProps} className={cn(cellProps.className, 'tabular-nums')}>{children}</td>
  ),
}}
```

## The default renderer

With no `cell`, values render as: `null`/`undefined` → empty, `Date` → local date string,
`boolean` → Yes/No, everything else → `String(value)`.

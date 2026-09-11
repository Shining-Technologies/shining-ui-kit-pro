# Columns

A column definition says _where the value comes from_, _how it behaves_ and _how it renders_.
The three are independent.

## Accessor columns

The common case. `value` is typed from the row:

```tsx
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'name', header: 'Product' },
  {
    accessorKey: 'price', // Product['price'] is number
    header: 'Price',
    cell: ({ value }) => `$${value.toFixed(2)}`, // so `.toFixed` compiles
  },
]
```

A typo in `accessorKey` is a compile error.

## Nested values

A dotted path uses `accessorPath` and needs an explicit `id`. Its `value` is `unknown`,
because TypeScript cannot resolve a dotted string to a property type:

```tsx
{ id: 'city', accessorPath: 'user.profile.city', header: 'City' }
```

Use `accessorFn` when you want the nested value typed.

## Computed columns

In an array literal TypeScript cannot infer a computed column's value type. Use the column
helper when you want it:

```tsx
const column = createColumnHelper<Order>()

const columns = [
  column.accessor('customer', { header: 'Customer' }),
  column.computed('total', (order) => order.qty * order.price, {
    header: 'Total',
    cell: ({ value }) => value.toFixed(2), // value: number
  }),
  column.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <RowMenu row={row} />,
  }),
  column.path('city', 'address.city', { header: 'City' }),
]
```

## Display columns

Columns with no value at all — actions, avatars, drag handles — need an `id`:

```tsx
{ id: 'actions', header: 'Actions', cell: ({ row }) => <Menu row={row} /> }
```

The selection, expander and row-action columns are display columns the table injects for
you. Their ids are exported (`SELECTION_COLUMN_ID`, `EXPANDER_COLUMN_ID`,
`ACTIONS_COLUMN_ID`) so you can place them yourself if you want a different order.

## Grouped headers

```tsx
{
  id: 'identity',
  header: 'Identity',
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
  ],
}
```

The group header spans its children and is marked `scope="colgroup"`.

## Metadata

`meta` carries presentation hints available to every renderer through
`column.columnDef.meta`:

```tsx
{
  accessorKey: 'price',
  header: 'Price',
  meta: {
    align: 'right',
    className: 'font-medium',
    headerClassName: 'uppercase',
    label: 'Unit price',                       // column picker + card layout
    responsive: { hideBelow: 'md' },
    wrap: false,                               // cells truncate unless told otherwise
    hideLabelInCards: false,
    hideInCards: false,
  },
}
```

Add your own fields by augmenting the interface:

```ts
declare module '@shining-ui-kit/core' {
  interface ColumnMeta {
    currency?: string
  }
}
```

## API reference

| Property                       | Type                                                                          | Notes                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `id`                           | `string`                                                                      | Defaults to `accessorKey`; required otherwise                  |
| `accessorKey`                  | `keyof TData & string`                                                        | Typed key on the row                                           |
| `accessorPath`                 | `string`                                                                      | Dotted path; requires `id`; `value` is `unknown`               |
| `accessorFn`                   | `(row, index) => TValue`                                                      | Computed value; requires `id`                                  |
| `header`                       | `ReactNode \| (ctx) => ReactNode`                                             | A string here also becomes the column label                    |
| `cell`                         | `(ctx) => ReactNode`                                                          | `ctx` is `{ value, row, rowIndex, column, cell, table, meta }` |
| `footer`                       | `ReactNode \| (ctx) => ReactNode`                                             | Any footer turns on `<tfoot>`                                  |
| `enableSorting`                | `boolean`                                                                     |                                                                |
| `sortingFn`                    | `'auto' \| 'text' \| 'number' \| 'datetime' \| 'boolean' \| (a, b) => number` | A _value_ comparator                                           |
| `sortDescFirst`                | `boolean`                                                                     | Start this column's cycle at descending                        |
| `enableFiltering`              | `boolean`                                                                     |                                                                |
| `filter`                       | `ColumnFilterConfig`                                                          | See [filtering](./filtering.md)                                |
| `enableGlobalFilter`           | `boolean`                                                                     | Include in the toolbar search                                  |
| `enableHiding`                 | `boolean`                                                                     |                                                                |
| `defaultVisible`               | `boolean`                                                                     | Initial visibility                                             |
| `enableResizing`               | `boolean`                                                                     | Turns resizing on for the table                                |
| `size` / `minSize` / `maxSize` | `number`                                                                      | Pixels                                                         |
| `enablePinning`                | `boolean`                                                                     |                                                                |
| `defaultPinned`                | `'left' \| 'right' \| false`                                                  |                                                                |
| `meta`                         | `ColumnMeta`                                                                  | Augmentable                                                    |

# Customization

Five levels, from cosmetic to total. Reach for the lowest one that does the job.

## 1. Class names

```tsx
<DataTable
  className="rounded-2xl"
  tableClassName="text-sm"
  headerClassName="uppercase"
  bodyClassName="divide-y"
  rowClassName={(row) => (row.original.status === 'inactive' ? 'opacity-60' : '')}
  cellClassName={(cell) => (cell.column.id === 'name' ? 'font-medium' : '')}
  classNames={{
    container: '…',
    heading: '…',
    toolbar: '…',
    headerRow: '…',
    headerCell: '…',
    footer: '…',
    pagination: '…',
    expandedRow: '…',
  }}
/>
```

Every one is merged through `tailwind-merge`, so your utility beats the default rather than
landing in a specificity fight.

## 2. Tokens and themes

See [theming](./theming.md).

## 3. Slots

Inject application UI without replacing anything:

```tsx
<DataTable
  slots={{
    beforeTable: <Banner />,
    toolbarActions: <Button onClick={invite}>Invite</Button>,
    afterTable: ({ table }) => <p>{table.getRowCount()} people</p>,
    emptyState: <NoUsersYet />,
    rowActions: (row) => <RowMenu row={row} />,
  }}
/>
```

Slots: `toolbar`, `toolbarActions`, `beforeTable`, `afterTable`, `emptyState`,
`loadingState`, `errorState`, `pagination`, `rowActions`. Each takes a node or a function of
`{ table }`. `emptyState`, `loadingState`, `errorState` and `rowActions` also exist as
top-level props, which is the same thing spelled shorter.

## 4. Component overrides

Replace any structural part. Anything you leave out keeps its default:

```tsx
<DataTable
  components={{
    Root,
    Container,
    Table,
    Header,
    HeaderRow,
    HeaderCell,
    Body,
    Row,
    Cell,
    ExpandedRow,
    Footer,
    Heading,
    Toolbar,
    Search,
    Filters,
    ClearFilters,
    SelectionBar,
    ViewOptions,
    Pagination,
    EmptyState,
    LoadingState,
    ErrorState,
  }}
/>
```

### The prop-bag contract

Every part receives a prop bag that already contains the ARIA attributes, data attributes,
geometry and event handlers the table needs. **Spread it, and you cannot break anything.**

```tsx
const MyRow = ({ rowProps, children, isSelected }: RowProps<User>) => (
  <tr {...rowProps} className={cn(rowProps.className, isSelected && 'ring-1 ring-blue-500')}>
    {children}
  </tr>
)
```

`rowProps` carries `aria-selected`, `aria-disabled`, `data-state`, `data-index`,
`data-sui-row`, the roving `tabIndex`, and the click / double-click / key handlers. That is why
replacing `Row` cannot break sorting, selection, expansion or keyboard navigation.

The same shape applies throughout: `cellProps`, `rowProps`, `headerProps`, `bodyProps`,
`tableProps`, `containerProps`, `rootProps`.

`children` is the already-rendered content — the cells for a row, the label for a header cell,
the value for a cell. Render it; do not re-derive it.

Wrap a default instead of reimplementing it:

```tsx
import { DEFAULT_COMPONENTS } from '@shining-ui-kit/react'

const LoggingRow = (props: RowProps<User>) => {
  useEffect(() => track('row.render', props.row.id), [props.row.id])
  return <DEFAULT_COMPONENTS.Row {...props} />
}
```

## 5. Build your own layout

`useDataTable()` gives any descendant the live table instance and the whole render model:

```tsx
function SelectionBar() {
  const { table } = useDataTable<User>()
  const rows = table.getSelectedRowModel().rows
  if (rows.length === 0) return null
  return <Toolbar>{rows.length} selected <Button onClick={() => archive(rows)}>Archive</Button></Toolbar>
}

<DataTable … slots={{ beforeTable: <SelectionBar /> }} />
```

The composable toolbar pieces are exported and context-connected:

```tsx
slots={{
  toolbar: (
    <DataTableToolbar>
      <DataTableSearch />
      <DataTableFilters />
      <DataTableActions><ExportButton /></DataTableActions>
      <DataTableViewOptions />
    </DataTableToolbar>
  ),
}}
```

## Precedence

`components` beats `slots` beats the default. If you both replace `EmptyState` and set
`slots.emptyState`, the component wins — and your component can read the slot from context if
it wants to honour it.

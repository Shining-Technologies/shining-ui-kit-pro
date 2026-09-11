# Selection

## Turning it on

```tsx
<DataTable
  data={users}
  columns={columns}
  getRowId={(row) => row.id}
  enableRowSelection
  onRowSelectionChange={setSelection}
/>
```

A checkbox column is injected at the front. The header checkbox selects the current page and
shows a real mixed state (`aria-checked="mixed"`) when only some rows are selected.

**Always pass `getRowId`.** Without it, selection is keyed by array position, so it breaks
the moment rows are sorted, filtered or refetched.

## Single selection

```tsx
features={{ selection: { enabled: true, mode: 'single' } }}
```

The header checkbox disappears, and selecting a row clears the previous one.

## Deciding which rows can be selected

```tsx
<DataTable
  isRowDisabled={(row) => row.status === 'archived'}
  // or, if you want them selectable but visually normal:
  features={{ selection: { enableRow: (row) => row.status !== 'archived' } }}
/>
```

`isRowDisabled` does more than block selection: the row is dimmed, marked
`aria-disabled="true"`, skipped by row-click and double-click, and left out of keyboard
activation.

## Reading the selection

```tsx
const { table } = useDataTable<User>()
const selected = table.getSelectedRowModel().rows.map((row) => row.original)
```

Or lift the state and derive from it:

```tsx
const [selection, setSelection] = useState<RowSelectionState>({})
const selectedIds = Object.keys(selection).filter((id) => selection[id])
```

## Selection across pages

Selection is keyed by row id, so it survives paging, sorting and filtering as long as
`getRowId` is stable. The pagination bar shows "3 of 1,240 selected".

## Keyboard

With selection on, rows join the keyboard model: one roving tab stop, arrows to move, Space to
toggle. Controls inside a row keep their own keys — pressing Enter on a focused checkbox does
not also fire the row's click handler.

## Styling the selected state

Selected rows get `aria-selected="true"`, `data-state="selected"` and the class
`sui-row--selected`, backed by the `--sui-row-selected` and `--sui-row-selected-hover` tokens.

```css
.my-table .sui-row--selected {
  --sui-row-selected: #ecfdf5;
}
```

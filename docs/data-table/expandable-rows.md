# Expandable rows

## Basic use

Providing `renderExpandedRow` turns expansion on and injects the expander column:

```tsx
<DataTable
  data={users}
  columns={columns}
  getRowId={(row) => row.id}
  renderExpandedRow={(row) => <UserDetails user={row.original} />}
/>
```

The detail row is a sibling `<tr>` spanning every visible column, so the column grid stays
intact and screen readers still read a well-formed table.

## One at a time

```tsx
features={{ expanding: { mode: 'single' } }}
```

Opening a row closes whichever was open.

## State

```tsx
const [expanded, setExpanded] = useState<ExpandedState>({ 'usr_001': true })

<DataTable expanded={expanded} onExpandedChange={setExpanded} … />
```

Keys are row ids, so pass `getRowId` if you want expansion to survive sorting and paging.

## Accessibility

The expander is a real button with `aria-expanded` and `aria-controls` pointing at the detail
row's `id`. The row itself deliberately does **not** carry `aria-expanded` — that attribute is
only valid on rows of a `treegrid`, and putting it on a `table` row is an ARIA violation that
axe (correctly) reports.

From the keyboard: focus a row and press **→** to expand, **←** to collapse.

## Working with selection

Expansion and selection are independent. A row can be both selected and expanded, and the
detail row is never selectable itself.

## Styling

```css
.sui-expanded > .sui-expanded__cell {
  background: var(--sui-muted);
}
.sui-expanded__content {
  padding: 1rem 1.5rem;
}
```

Replace the wrapper outright when you need a different structure:

```tsx
components={{
  ExpandedRow: ({ rowProps, colSpan, children }) => (
    <tr {...rowProps}>
      <td colSpan={colSpan} className="p-0">
        <div className="border-l-2 border-blue-500 pl-4">{children}</div>
      </td>
    </tr>
  ),
}}
```

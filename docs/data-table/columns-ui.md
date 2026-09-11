# Column visibility, resizing and pinning

## Visibility

The **Columns** menu lists every column that can be hidden. A column opts out with
`enableHiding: false`, and starts hidden with `defaultVisible: false`.

Visibility is ordinary state, so it can be persisted per user:

```tsx
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
  () => JSON.parse(localStorage.getItem('users.columns') ?? '{}'),
)

useEffect(() => {
  localStorage.setItem('users.columns', JSON.stringify(columnVisibility))
}, [columnVisibility])

<DataTable columnVisibility={columnVisibility} onColumnVisibilityChange={setColumnVisibility} />
```

Hide the menu entirely with `features={{ columnVisibility: { enabled: false } }}`.

## Resizing

Resizing turns on as soon as any column declares `enableResizing: true`, or explicitly:

```tsx
features={{ resizing: { enabled: true, mode: 'onChange' } }}
```

`mode: 'onEnd'` defers the update until the drag finishes, which is worth it on very wide
tables.

Users can drag the grip, **double-click it to reset**, or focus it and use the arrow keys —
Shift for larger steps, Enter or Backspace to reset. The handle is a
`role="separator"` with an accessible name, so keyboard resizing is real, not decorative.

Sizes are ordinary state (`columnSizing` / `onColumnSizingChange`), so a user's layout can be
saved the same way visibility is.

### How it stays fast

Widths are published once on the `<table>` element as CSS custom properties
(`--sui-c-<id>-size`), and every cell reads `width: calc(var(--sui-c-name-size) * 1px)`. A drag
updates one style object, not thousands of cells.

## Pinning

```tsx
{ accessorKey: 'name', header: 'Name', defaultPinned: 'left' }
{ id: 'actions', header: 'Actions', defaultPinned: 'right' }
```

Declaring `defaultPinned` (or `enablePinning`) on any column turns the feature on and adds
**Pin to left / Pin to right / Unpin** to every column menu. Force it with
`features={{ pinning: { enabled: true } }}`.

Pinned cells become `position: sticky` at the offset the engine computes, and the column at
the edge of each pinned group casts a shadow (`--sui-shadow-pinned-left` /
`--sui-shadow-pinned-right`) so the boundary reads clearly while scrolling. The shadow only
appears while there is something scrolled underneath it — a permanent one claims the table
overflows when it does not.

### The actions column

A table with `rowActions` pins that column to the right automatically — actions people cannot
reach without scrolling to the far edge are actions they will not use. Move it or free it:

```tsx
features={{ pinning: { actions: 'left' } }}   // freeze it to the left instead
features={{ pinning: { actions: false } }}    // let it scroll with the rest
features={{ pinning: { selection: 'left' } }} // freeze the checkbox column too
```

Pinning turns itself on when any of those is set, or when a column declares `defaultPinned`.

State lives in `columnPinning` / `onColumnPinningChange`:

```ts
{ left: ['name'], right: ['actions'] }
```

## Together

Visibility, sizing and pinning are three independent state slices. Persisting all three gives
users a table layout that survives a reload:

```tsx
<DataTable
  columnVisibility={view.visibility}
  columnSizing={view.sizing}
  columnPinning={view.pinning}
  onColumnVisibilityChange={(visibility) => save({ ...view, visibility })}
  onColumnSizingChange={(sizing) => save({ ...view, sizing })}
  onColumnPinningChange={(pinning) => save({ ...view, pinning })}
/>
```

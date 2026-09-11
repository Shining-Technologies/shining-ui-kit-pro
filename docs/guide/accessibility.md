# Accessibility

Accessibility is a property of the architecture here, not a pass at the end. Behaviour lives
in prop bags, so a custom row that spreads `rowProps` inherits the ARIA state and the keyboard
model it never had to know about.

## What the table guarantees

**Semantics.** Real `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<th scope="col">`. Grouped
headers use `scope="colgroup"` and a correct `colspan`. `aria-rowcount` counts every row of
the table: header rows, data rows (the filtered total, or `rowCount` in server mode), open
detail rows and footer rows. It is still correct when only a page is rendered. It is `-1` in
server mode without a `rowCount`, and it is omitted in the empty, loading and error states.
Each row carries a 1-based `aria-rowindex`, offset by the page's start, so a screen reader's
"row N of M" is exact across pages.

**Card layout** (`responsiveMode="cards"` or `"auto"`, below its breakpoint). Every part
carries an explicit role: `table`, `rowgroup`, `row`, `columnheader` and `cell`. That way the
semantics survive the CSS `display` changes that turn rows into cards. Cards have no header
row, so each cell contains its column name as real text. A screen reader hears "Email
ada@example.com". For `hideLabelInCards` the name is visually hidden but still read.

**Sorting.** The sort control is a `<button>` inside the `<th>`, so it is tabbable and
activates with Enter or Space. Its name describes the _next_ action — "Name, sort ascending",
"Name, clear sort". The `<th>` carries `aria-sort`, and only sortable columns carry it.

**Selection.** Radix checkboxes with a genuine mixed state: the header checkbox reports
`aria-checked="mixed"` when some rows are selected. Row checkboxes are labelled by their
position among the rows currently on screen, so the label still means something after
sorting. Selected rows carry `aria-selected`.

**Expansion.** The expander button carries `aria-expanded` and `aria-controls` pointing at the
detail row. The row itself deliberately does not — `aria-expanded` is only valid on rows of a
`treegrid`, and axe reports it as a violation on a `table`.

**Keyboard navigation.** Rows use a roving tab stop when anything about them is interactive
(row click, selection or expansion), so a 100-row table adds one tab stop, not a hundred.

| Key        | Action                          |
| ---------- | ------------------------------- |
| ↑ / ↓      | Move between rows               |
| Home / End | First / last row                |
| Enter      | Activate the row (`onRowClick`) |
| Space      | Toggle selection                |
| → / ←      | Expand / collapse               |

Controls inside a row keep their own keys: pressing Enter on a focused checkbox does not also
fire the row's click handler. Disabled rows are skipped by the arrow keys and never hold the
tab stop.

**Column resizing.** The grip is a `role="separator"` with an accessible name. It reports the
width in pixels through `aria-valuenow`. A leaf column also gets `aria-valuemin` and
`aria-valuemax` from its `minSize` and `maxSize`. Focus the grip and use ← / → to resize
(Shift for larger steps), Enter or Backspace to reset. Keyboard resizing is real, not a
token gesture.

**Pagination.** A `<nav aria-label="Table pagination">`. The current page carries
`aria-current="page"`, and a visually hidden live region announces "Page 3 of 62" without
moving focus.

**States.** The error state is a `role="alert"`. The loading skeleton is `aria-hidden`, and
the table is marked `aria-busy`. Every button, checkbox and select has an accessible name —
including the ones that look empty, such as the selection and expander headers.

**Focus.** Visible focus rings everywhere, from the `--sui-ring` token, so they follow your
theme rather than disappearing into it.

**Motion.** All transitions collapse under `prefers-reduced-motion: reduce`.

## What you owe it

**Name the table.** `label` (visually hidden) or `caption` (visible). A table with no name is
just "table" in a screen reader's list.

```tsx
<DataTable label="Team members" … />
```

**Name your row actions.** An icon-only button carries no text, so every action's `label` — its
accessible name and its tooltip — has to identify the row, not just the verb:

```tsx
rowActions={(row) => [
  { icon: EyeIcon, label: `View ${row.original.name}`, onClick: … },
  { icon: TrashIcon, label: `Delete ${row.original.name}`, destructive: true, onClick: … },
]}
```

**Do not hide meaning in colour alone.** A red badge should also say "Failed".

**Title every dialog.** Radix requires a `DialogTitle`, and in development an unnamed
`DialogContent`, `AlertDialogContent` or `SheetContent` logs a warning. If the design has no
visible heading, keep the title and hide it: `<DialogTitle className="sui-sr-only">`. On close,
focus returns to whatever opened the dialog. For a dialog opened from a menu item, it returns
to the menu's trigger.

**`HoldButton` has a second path.** Pointer and keyboard can hold it (a held Space or Enter
counts). Screen-reader browse mode and voice control send a click with no press, and that
click opens a confirmation dialog. Confirming it runs `onHoldComplete`. This is
`confirmOnClick`, on by default. With `false`, such clicks are ignored and you owe those users
another path.

## The shell and theme controls

**Phone drawer.** Below its breakpoint the sidebar is a real modal: `role="dialog"` with
`aria-modal`. The rest of the page is inert and does not scroll. Escape and the backdrop close
it, and focus returns to what opened it.

**Radio groups.** `ColorModeToggle` and the `ProjectEditor` preset picker follow the
radio-group keyboard pattern: a single tab stop, arrows that move and select, and Home / End.

**Keep custom parts honest.** Spread the prop bag. If you must not, replicate what it carries
— the bag is a documented contract, and the tests enforce it.

## Testing

The suite runs `vitest-axe` against the default table, against a table with selection,
expansion and row actions, and against the empty, loading and error states. Two real bugs were
found and fixed this way: `aria-expanded` on a `<tr>`, and the empty `<th>` of the injected
expander column.

```bash
pnpm test
```

Add the same check to your own tables:

```tsx
import { axe } from 'vitest-axe'

it('is accessible', async () => {
  const { container } = render(<MyTable />)
  expect(await axe(container)).toHaveNoViolations()
})
```

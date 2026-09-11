# Responsive tables

Three strategies, chosen with `responsiveMode`, plus a fixed frame whose rows are the only
thing that scrolls.

## Horizontal scrolling (default)

```tsx
<DataTable responsiveMode="scroll" />
```

The table keeps its shape and the container scrolls. Combine with pinning so the identifying
column stays visible:

```tsx
{ accessorKey: 'name', header: 'Name', defaultPinned: 'left' }
```

## Card layout

```tsx
<DataTable responsiveMode="cards" />
```

Below the `md` breakpoint each row becomes a card and each cell prints its column name. This
is done entirely in CSS — the cell already carries `data-label`, and a media query does the
rest. There is no second render path, no resize listener, and nothing that can disagree with
the table version.

## Container-aware cards

```tsx
<DataTable responsiveMode="auto" />
```

Same card layout, different trigger: `auto` measures **the table's own container** with a CSS
container query, where `cards` measures the window. A table in a 380px side panel, a split
view or a dashboard tile becomes cards on a 27" monitor, which a media query can never do.
Use `auto` unless the table is the page.

Widths are published to cells as a custom property rather than an inline `width`, which is
what lets the card layout ignore them without `!important`.

Fine-tune what appears on a card:

```tsx
meta: {
  hideInCards: true,        // leave this column out of the card entirely
  hideLabelInCards: true,   // show the value without its column name
  label: 'Unit price',      // the name to print
}
```

## Responsive columns

Hide a column below or above a breakpoint:

```tsx
{
  accessorKey: 'lastActive',
  header: 'Last active',
  meta: { responsive: { hideBelow: 'md' } },
}
```

Breakpoints are `sm` (640), `md` (768), `lg` (1024), `xl` (1280), `2xl` (1536), matching
Tailwind's scale. This is also CSS — `sui-hide-below-md` — so it costs nothing at runtime and
works whether or not your app uses Tailwind.

Users can still bring a hidden column back through the **Columns** menu; responsive hiding is
about default density, not permission.

## A fixed frame with scrolling rows

```tsx
<DataTable maxHeight="60vh" />
```

`maxHeight` turns the table into a fixed frame: the header sticks to its top, the footer to
its bottom, and the rows are the only part that moves. Both are on by default inside a frame
(`stickyHeader`, `stickyFooter`), and a grouped header sticks row by row rather than stacking
every row at the top.

The chrome only reacts when there is something to react to. The header lifts off the rows —
a shadow — once they have scrolled under it, and a pinned column casts its shadow only while
the table is actually scrolled sideways. A table that fits its container looks like a table
that fits its container.

## Fixed or automatic column widths

```tsx
<DataTable tableLayout="fixed" />   // default: honour each column's `size`
<DataTable tableLayout="auto" />    // let the content decide
```

`fixed` is what makes resizing and pinned offsets exact, and it truncates cell text so one
long value cannot make a row three lines tall. Let a specific column wrap instead:

```tsx
{ accessorKey: 'notes', header: 'Notes', meta: { wrap: true } }
```

`auto` hands sizing back to the browser for data you cannot measure in advance; declared
sizes then become hints and pinned offsets approximate.

## What not to do

Do not render a different component on small screens. Two render paths drift, and the one you
look at least is the one that breaks. Card mode exists precisely so there is only ever one.

Do not give a table class name to a generic layout helper either. `display: flex` on a `<tr>`
detaches the body from the header's column widths, and because the two rules live in
different stylesheets the damage is invisible until you look at a rendered table.
`tests/styles.test.ts` fails the build if it happens again.

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

Below the `md` breakpoint each row becomes a card and each cell prints its column name. The
name is a real `.sui-td__label` element in the cell, not a `::before`, so a screen reader reads
it with the value. The table layout hides it, and a media query shows it. `data-label` remains
on the cell for styling only. There is no second render path, no resize listener, and nothing
that can disagree with the table version.

A custom `Cell` component must render its `children` to keep the label, because the label
arrives there with the cell's content.

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
  hideInCards: true,        // leave this column out of the card entirely, footer cell included
  hideLabelInCards: true,   // show the value without its column name (still read aloud)
  label: 'Unit price',      // the name to print
  responsive: { priority: 1 }, // cards list prioritised fields first, lowest first
}
```

Cards have no header row, so in either card mode a small bar above the cards takes over what
the header did: a **Sort by** picker with a direction toggle, and **Select all** when multiple
selection is on. It is shown by the same CSS that switches to cards, so it never appears
next to a table layout. Selection, hover and expanded details keep their styling on cards,
the checkbox and expander share the card's first line with its first field, and footer
totals get a card of their own, each labelled with its column.

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
Tailwind's scale, and work whether or not your app uses Tailwind.

Responsive hiding is a _default_, applied as table state: the column is removed from the
table (so pinned offsets and the column count stay correct), the **Columns** menu shows it as
hidden, and ticking it there brings it back at every width. The default is never written into
your `columnVisibility` state, so it follows the window as it resizes, and
`onColumnVisibilityChange` only reports what the user actually changed. The
`sui-hide-below-md` classes are still emitted, so a server render and the first paint already
match the viewport.

## A fixed frame with scrolling rows

```tsx
<DataTable maxHeight="60vh" />
```

`maxHeight` turns the table into a fixed frame: the header sticks to its top, the footer to
its bottom, and the rows are the only part that moves. Both are on by default inside a frame
(`stickyHeader`, `stickyFooter`), and a grouped header sticks row by row rather than stacking
every row at the top.

The header sticks to the table's own frame, so `stickyHeader` needs a `maxHeight` to do
anything: without one the rows scroll with the page, and the header goes with them.

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

## Touch screens

There is no hover on a touch screen, so the column menu (`⋮`) is always shown there, in space
reserved at the end of the header rather than drawn over the label, and the resize grip is
widened for a finger. In `auto` mode the toolbar and pagination also compact themselves by
the table's own width, not only the window's.

## What not to do

Do not render a different component on small screens. Two render paths drift, and the one you
look at least is the one that breaks. Card mode exists precisely so there is only ever one.

Do not give a table class name to a generic layout helper either. `display: flex` on a `<tr>`
detaches the body from the header's column widths, and because the two rules live in
different stylesheets the damage is invisible until you look at a rendered table.
`tests/styles.test.ts` fails the build if it happens again.

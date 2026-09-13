# Table

`Table` and its parts are thin wrappers over native `<table>` elements, styled with the same tokens
as `DataTable`. Use them for a fixed, small set of rows that needs no sorting, filtering, paging or
selection. The table sits in a wrapper that scrolls horizontally, so a wide table never makes the
page scroll sideways.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@shining-technologies/ui'
// or: from '@shining-technologies/ui/table'
```

**Server and client.** None of these modules has a `'use client'` directive. Every part is a
Server Component and can also be used in client code. Each part forwards its `ref` to the native
element it renders.

## Table or DataTable

| Use `Table` when                                          | Use [`DataTable`](../data-table.md) when                        |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| The rows are fixed and few (an invoice, a settings summary, a comparison) | Users sort, filter, search, paginate or select rows |
| You write the markup yourself, row by row                 | Rows come from data plus column definitions                     |
| The page should stay a Server Component with no client JavaScript | The data is server-paginated or driven by URL state     |
| You need `colSpan`, `rowSpan` or row headers in the body  | You need column visibility, resizing, pinning, CSV export or a card layout on phones |

Both read the same table tokens (`--sui-header-*`, `--sui-row-*`, `--sui-cell-padding-*`), so they
look alike on one page.

## Table

Renders a `<div data-slot="table-wrapper" class="sui-plain-table-wrap">` with horizontal
overflow, containing a `<table data-slot="table" class="sui-plain-table">`. The `ref` points at
the `<table>`.

```tsx
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@shining-technologies/ui'

export function InvoiceLines() {
  return (
    <Table density="compact" striped>
      <TableCaption>Invoice INV-2041</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead align="end">Qty</TableHead>
          <TableHead align="end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Site inspection</TableCell>
          <TableCell numeric>1</TableCell>
          <TableCell numeric>$480.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Labour (hours)</TableCell>
          <TableCell numeric>6</TableCell>
          <TableCell numeric>$720.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell numeric>$1,200.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
```

| Prop                 | Type                                                           | Default     | Description |
| -------------------- | -------------------------------------------------------------- | ----------- | ----------- |
| `density`            | `'compact' \| 'comfortable' \| 'spacious' \| 'default'`        | `'comfortable'` | Cell padding for header, body and footer cells. `'default'` is a deprecated alias of `'comfortable'`. See [Density](#density). |
| `striped`            | `boolean`                                                      | `false`     | Tint even rows in `TableBody` with `--sui-row-striped`. |
| `bordered`           | `boolean`                                                      | `false`     | Draw vertical hairlines between cells, as well as the horizontal ones. |
| `containerClassName` | `string`                                                       | —           | Classes for the scrolling wrapper, such as a max height, border or radius. |
| `containerProps`     | `HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }` | —         | Any other wrapper attributes, including a `ref`. Its `className` is merged with `containerClassName`. |

Other props are native `<table>` attributes (`TableHTMLAttributes<HTMLTableElement>`), applied to the
`<table>`. `className` is merged with the variant classes.

### Scrolling and keyboard access

A table wider than its container scrolls inside the wrapper. To let keyboard users scroll it, make
the wrapper a named, focusable region:

```tsx
<Table
  containerClassName="max-h-96"
  containerProps={{ role: 'region', 'aria-label': 'Invoice lines', tabIndex: 0 }}
>
  {/* … */}
</Table>
```

`max-h-96` is a Tailwind class. Any class or `style` that limits the height works.

### Density

The density names are the kit's `Density` vocabulary, shared with `DataTable` and
`data-sui-density`. Density changes rhythm only, never colour or behaviour.

| `density`       | Header cell padding (block, inline) | Body and footer cell padding (block, inline) |
| --------------- | ----------------------------------- | -------------------------------------------- |
| `'compact'`     | `0.375rem 0.625rem`                 | `0.3125rem 0.625rem`                         |
| `'comfortable'` | Inherited tokens                    | Inherited tokens                             |
| `'spacious'`    | `0.75rem 1.125rem`                  | `0.875rem 1.125rem`                          |

`'compact'` and `'spacious'` set `--sui-header-padding-y`, `--sui-header-padding-x`,
`--sui-cell-padding-y` and `--sui-cell-padding-x` on the table, so header and body cells stay
aligned. `'comfortable'` (the default, also accepted as the deprecated `'default'`) sets nothing,
so the table follows the tokens in scope: the comfortable defaults (header 0.5rem 0.875rem, cells
0.625rem 0.875rem), or whatever a `data-sui-density` ancestor sets:

```tsx
<section data-sui-density="compact">
  <Table>{/* compact, from the wrapper */}</Table>
</section>
```

### tableVariants

The class-variance-authority function behind `Table`, exported for applying the same classes to
your own `<table>` element:

```ts
tableVariants({ density: 'compact', striped: true, bordered: false })
// 'sui-plain-table sui-plain-table--compact sui-plain-table--striped'
```

## TableHeader, TableBody, TableFooter

Render `<thead>`, `<tbody>` and `<tfoot>` with `data-slot` values `table-header`, `table-body` and
`table-footer`. They accept native `HTMLAttributes<HTMLTableSectionElement>`.

- Rows in `TableBody` get the `--sui-row-hover` background on hover.
- `TableFooter` cells (`TableCell`) get a top border, a `--muted` background and medium weight.

## TableRow

Renders `<tr data-slot="table-row">`.

| Prop       | Type      | Default | Description |
| ---------- | --------- | ------- | ----------- |
| `selected` | `boolean` | —       | `true` sets `data-state="selected"` (painted with `--sui-row-selected`) and `aria-selected="true"`. `false` sets `aria-selected="false"`, marking a selectable row that is not selected. Leave it unset on rows that cannot be selected. |

Other props are native `HTMLAttributes<HTMLTableRowElement>`.

## TableHead

Renders `<th data-slot="table-head" scope="col">`.

| Prop    | Type                             | Default   | Description |
| ------- | -------------------------------- | --------- | ----------- |
| `align` | `'start' \| 'center' \| 'end'`   | `'start'` | Logical text alignment, written to `data-align`. It replaces the deprecated HTML `align` attribute, and `start`/`end` follow the writing direction. |

Other props are native `ThHTMLAttributes<HTMLTableCellElement>` (without `align`). `scope` defaults
to `"col"` and can be overridden. Use `scope="row"` for a row header inside `TableBody`:

```tsx
<TableRow>
  <TableHead scope="row">Plan</TableHead>
  <TableCell>Business</TableCell>
</TableRow>
```

Header cells use the `--sui-header-background`, `--sui-header-foreground`, `--sui-header-border`,
`--sui-header-font-size`, `--sui-header-font-weight`, `--sui-header-letter-spacing` and
`--sui-header-text-transform` tokens, and do not wrap.

## TableCell

Renders `<td data-slot="table-cell">`.

| Prop      | Type                             | Default                                  | Description |
| --------- | -------------------------------- | ---------------------------------------- | ----------- |
| `align`   | `'start' \| 'center' \| 'end'`   | `'end'` when `numeric`, else `'start'`   | Logical text alignment, written to `data-align`. |
| `numeric` | `boolean`                        | —                                        | Tabular figures (`font-variant-numeric: tabular-nums`) so amounts line up. Also right-aligns (end-aligns) unless `align` is set. |

Other props are native `TdHTMLAttributes<HTMLTableCellElement>` (without `align`), such as
`colSpan`.

## TableCaption

Renders `<caption data-slot="table-caption">`. The caption is drawn below the table
(`caption-side: bottom`), start-aligned in muted text. It accepts native
`HTMLAttributes<HTMLTableCaptionElement>`. Place it as the first child of `Table`, as HTML requires.

## Accessibility

- The parts render native table elements, so the table, row, column-header and cell roles come from
  HTML. No ARIA is added.
- Give every data table a name: a `TableCaption`, or `aria-label` / `aria-labelledby` on `Table`.
- `TableHead` sets `scope="col"`. Pass `scope="row"` for row headers.
- `selected` is exposed as `aria-selected`. `striped` is visual only. A plain table has no
  keyboard selection. For rows users select, use `DataTable`.
- When the table can overflow horizontally, give the wrapper `role="region"`, an `aria-label` and
  `tabIndex={0}` through `containerProps`, so keyboard users can scroll it.
- For interactive rows (selection, row actions, expansion), use [`DataTable`](../data-table.md),
  which handles the roles, keyboard support and announcements.

## Styling hooks

| Selector | Element |
| -------- | ------- |
| `[data-slot="table-wrapper"]`, `.sui-plain-table-wrap` | Scrolling wrapper |
| `[data-slot="table"]`, `.sui-plain-table`, `.sui-plain-table--compact`, `--spacious`, `--striped`, `--bordered` | `<table>` |
| `.sui-plain-table__head`, `.sui-plain-table__body`, `.sui-plain-table__foot` | Sections |
| `.sui-plain-table__row`, `[data-state="selected"]` | Rows |
| `.sui-plain-table__th`, `.sui-plain-table__td`, `.sui-plain-table__td--numeric`, `[data-align]` | Cells |
| `.sui-plain-table__caption` | Caption |

## Related

- [Data table](../data-table.md): sorting, filtering, pagination, selection and server mode
- [Theming](../theming.md): table tokens and density
- [Card](card.md): a surface to place a table in
- [Accessibility](../accessibility.md)

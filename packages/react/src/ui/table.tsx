import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type HTMLAttributes,
  type Ref,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react'
import { cn } from '../lib/cn'

export const tableVariants = cva('sui-plain-table', {
  variants: {
    /** Rhythm only — never colour or behaviour (§27). */
    density: {
      compact: 'sui-plain-table--compact',
      default: '',
      spacious: 'sui-plain-table--spacious',
    },
    /** Tint alternate rows, for a wide table read across rather than down. */
    striped: { true: 'sui-plain-table--striped', false: '' },
    /** Hairlines between columns as well as between rows. */
    bordered: { true: 'sui-plain-table--bordered', false: '' },
  },
  defaultVariants: { density: 'default', striped: false, bordered: false },
})

export interface TableProps
  extends TableHTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {
  /** Classes for the scrolling wrapper — a max height, a border, a radius. */
  containerClassName?: string
  /**
   * Anything else for the wrapper: `style`, a `ref`, `tabIndex={0}` and an
   * `aria-label` to make a wide table's scroll region keyboard-reachable.
   */
  containerProps?: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }
}

/**
 * A plain HTML table on the project's tokens.
 *
 * The `DataTable` is the answer when there is sorting, filtering, selection or
 * a server behind the rows; this is the answer when there is a fixed handful of
 * rows and all of that machinery would be ceremony. They share the same tokens,
 * so the two sit on one page without looking like two products.
 *
 * The wrapper scrolls, not the page: a table that is wider than its column must
 * not be what makes the whole document scroll sideways.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, density, striped, bordered, containerClassName, containerProps, ...props },
  ref,
) {
  return (
    <div
      data-slot="table-wrapper"
      {...containerProps}
      className={cn('sui-plain-table-wrap', containerProps?.className, containerClassName)}
    >
      <table
        ref={ref}
        data-slot="table"
        className={cn(tableVariants({ density, striped, bordered }), className)}
        {...props}
      />
    </div>
  )
})

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      data-slot="table-header"
      className={cn('sui-plain-table__head', className)}
      {...props}
    />
  )
})

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      data-slot="table-body"
      className={cn('sui-plain-table__body', className)}
      {...props}
    />
  )
})

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      data-slot="table-footer"
      className={cn('sui-plain-table__foot', className)}
      {...props}
    />
  )
})

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, selected, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      className={cn('sui-plain-table__row', className)}
      {...props}
    />
  )
})

export interface TableHeadProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /**
   * Logical alignment. The HTML `align` attribute is deliberately shadowed:
   * it is deprecated, and `start`/`end` are what a right-to-left layout needs.
   */
  align?: 'start' | 'center' | 'end'
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, align = 'start', ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      data-slot="table-head"
      data-align={align}
      scope="col"
      className={cn('sui-plain-table__th', className)}
      {...props}
    />
  )
})

export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  align?: 'start' | 'center' | 'end'
  /** Tabular figures, so a column of amounts lines up on the decimal point. */
  numeric?: boolean
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, align, numeric, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      data-slot="table-cell"
      data-align={align ?? (numeric ? 'end' : 'start')}
      className={cn('sui-plain-table__td', numeric && 'sui-plain-table__td--numeric', className)}
      {...props}
    />
  )
})

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      data-slot="table-caption"
      className={cn('sui-plain-table__caption', className)}
      {...props}
    />
  )
})

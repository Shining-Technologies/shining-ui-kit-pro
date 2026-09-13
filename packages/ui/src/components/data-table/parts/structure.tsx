import { cn } from '../../../lib/cn'
import type {
  BodyProps,
  ContainerProps,
  FooterProps,
  HeaderProps,
  HeaderRowProps,
  RootProps,
  TableProps,
} from '../types/components'

/**
 * The plain structural parts.
 *
 * Each one does exactly two things: spread its prop bag and render its children.
 * That is deliberate — it is the clearest possible statement of what a
 * replacement has to do (§29).
 */

export function DataTableRoot<TData>({ rootProps, children }: RootProps<TData>) {
  return <div {...rootProps}>{children}</div>
}

export function DataTableContainer<TData>({ containerProps, children }: ContainerProps<TData>) {
  return <div {...containerProps}>{children}</div>
}

export function DataTableTable<TData>({ tableProps, children }: TableProps<TData>) {
  return <table {...tableProps}>{children}</table>
}

export function DataTableHeader<TData>({ headerProps, children }: HeaderProps<TData>) {
  return <thead {...headerProps}>{children}</thead>
}

export function DataTableHeaderRow<TData>({ rowProps, children }: HeaderRowProps<TData>) {
  return <tr {...rowProps}>{children}</tr>
}

export function DataTableBody<TData>({ bodyProps, children }: BodyProps<TData>) {
  return <tbody {...bodyProps}>{children}</tbody>
}

export function DataTableFooter<TData>({ footerProps, children }: FooterProps<TData>) {
  return <tfoot {...footerProps}>{children}</tfoot>
}

/** Shared class helper so overrides can reuse the default look. */
export const partClass = cn

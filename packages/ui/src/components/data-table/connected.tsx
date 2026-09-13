'use client'

import type { Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { useDataTable } from './context'

/**
 * Context-connected versions of the composite parts.
 *
 * These are what you reach for when you want to lay the table out yourself:
 *
 * ```tsx
 * <DataTableToolbar>
 *   <DataTableSearch />
 *   <DataTableFilters />
 *   <DataTableViewOptions />
 *   <MyExportButton />
 * </DataTableToolbar>
 * ```
 *
 * Each one renders whatever is registered in `components`, so a user override
 * is honoured here exactly as it is inside `<DataTable />` (§46).
 */
interface Connected<TData> {
  /** Defaults to the table from context. */
  table?: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
  children,
}: Connected<TData> & { children?: ReactNode }) {
  const context = useDataTable<TData>()
  const Toolbar = context.components.Toolbar
  return <Toolbar table={table ?? context.table}>{children}</Toolbar>
}

export function DataTableSearch<TData>({ table }: Connected<TData>) {
  const context = useDataTable<TData>()
  const Search = context.components.Search
  return <Search table={table ?? context.table} />
}

export function DataTableFilters<TData>({ table }: Connected<TData>) {
  const context = useDataTable<TData>()
  const Filters = context.components.Filters
  return <Filters table={table ?? context.table} />
}

export function DataTableViewOptions<TData>({ table }: Connected<TData>) {
  const context = useDataTable<TData>()
  const ViewOptions = context.components.ViewOptions
  return <ViewOptions table={table ?? context.table} />
}

export function DataTablePagination<TData>({ table }: Connected<TData>) {
  const context = useDataTable<TData>()
  const Pagination = context.components.Pagination
  return <Pagination table={table ?? context.table} />
}

/** Free-form group for your own toolbar buttons, styled to match. */
export function DataTableActions({ children }: { children: ReactNode }) {
  return (
    <div className="sui-toolbar__actions" role="group" aria-label="Table actions">
      {children}
    </div>
  )
}

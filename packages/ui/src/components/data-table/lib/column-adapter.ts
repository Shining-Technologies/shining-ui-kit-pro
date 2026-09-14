import {
  DEFAULT_FILTER_CONFIG,
  createColumnFilterFn,
  getByPath,
  getSortEmptyCheck,
  resolveComparator,
  type ColumnFilterConfig,
  type ColumnPinningState,
  type ColumnResponsive,
  type VisibilityState,
} from '../../../core'
import type {
  CellContext as EngineCellContext,
  ColumnDef as EngineColumnDef,
  HeaderContext as EngineHeaderContext,
  SortingFn,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { CellContext, ColumnDef, GroupColumnDef, HeaderTemplate } from '../types/column'
import { registerSortEmptyCheck } from './sorted-row-model'

/**
 * The single place where our column API meets the engine's.
 *
 * Keeping the translation in one function is what lets the public column shape
 * evolve without the engine leaking into user code, and vice versa (§57).
 */
export interface AdaptedColumns<TData> {
  columns: EngineColumnDef<TData, unknown>[]
  /** Filter configuration by column id, consumed by the filter panel. */
  filters: Map<string, ColumnFilterConfig>
  /** Plain-text labels, used by the column picker and the mobile card layout. */
  labels: Map<string, string>
  initialVisibility: VisibilityState
  initialPinning: ColumnPinningState
  /** Leaf columns that hide below or above a breakpoint, by id. */
  responsive: Map<string, ColumnResponsive>

  /** Capabilities inferred from the definitions, so features can self-enable. */
  hints: { anyResizable: boolean; anyPinnable: boolean; anyFooter: boolean }
}

/** What the adapter needs to know about the table it is building columns for. */
export interface AdaptOptions {
  /** Locale for default date cells and for text sorting. */
  locale?: string
  /** Zone for default date cells and for date filters. */
  timeZone?: string
}

/** Render a value when the column declares no `cell`. */
function defaultCellContent(value: unknown, options: AdaptOptions): ReactNode {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return new Intl.DateTimeFormat(options.locale, {
      dateStyle: 'medium',
      timeZone: options.timeZone,
    }).format(value)
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function isGroup<TData>(def: ColumnDef<TData>): def is GroupColumnDef<TData> {
  return Array.isArray((def as GroupColumnDef<TData>).columns)
}

function resolveId<TData>(def: ColumnDef<TData>): string {
  if (def.id) return def.id
  const key = (def as { accessorKey?: string }).accessorKey
  if (key) return key
  throw new Error(
    '[shining-ui] A column needs an `id` when it has no `accessorKey`. ' +
      'Display columns and `accessorFn` columns must set one explicitly.',
  )
}

function plainTextLabel<TData>(header: HeaderTemplate<TData> | undefined, id: string) {
  return typeof header === 'string' ? header : id
}

function wrapHeader<TData>(template: HeaderTemplate<TData> | undefined) {
  if (template === undefined) return undefined
  // A plain string stays a string: `flexRender` renders it as-is, and code that
  // reads `columnDef.header` for a label — the CSV exporter, a custom picker —
  // gets the text instead of an opaque function.
  if (typeof template === 'string') return template
  if (typeof template !== 'function') return () => template as ReactNode
  const render = template as (context: unknown) => ReactNode
  return (context: EngineHeaderContext<TData, unknown>) =>
    render({
      header: context.header,
      column: context.column,
      table: context.table,
      meta: context.column.columnDef.meta,
    })
}

type AnyCellRenderer<TData> = (context: CellContext<TData, never>) => ReactNode

function wrapCell<TData>(cell: AnyCellRenderer<TData> | undefined, options: AdaptOptions) {
  return (context: EngineCellContext<TData, unknown>) => {
    const value = context.getValue()
    if (!cell) return defaultCellContent(value, options)
    return (cell as (context: CellContext<TData, unknown>) => ReactNode)({
      value,
      row: context.row,
      rowIndex: context.row.index,
      column: context.column,
      cell: context.cell,
      table: context.table,
      meta: context.column.columnDef.meta,
    })
  }
}

/**
 * Lift a value comparator into the engine's row comparator.
 *
 * Every column gets one — including the default `'auto'` — so the table sorts
 * with exactly the comparators `applyQuery` uses on a server, never with the
 * engine's own. Empty values never reach it: the sorted row model places them,
 * using the comparator's own empty rule (`getSortEmptyCheck`), as `sortRows` does.
 */
function wrapSortingFn<TData>(def: ColumnDef<TData>, options: AdaptOptions): SortingFn<TData> {
  const option = (def as { sortingFn?: unknown }).sortingFn
  const compare = resolveComparator(option as never, { locale: options.locale })
  return registerSortEmptyCheck<TData>(
    (rowA, rowB, columnId) => compare(rowA.getValue(columnId), rowB.getValue(columnId)),
    getSortEmptyCheck(compare),
  )
}

function adaptOne<TData>(
  def: ColumnDef<TData>,
  out: AdaptedColumns<TData>,
  options: AdaptOptions,
): EngineColumnDef<TData, unknown> {
  const id = resolveId(def)

  if (isGroup(def)) {
    out.labels.set(id, plainTextLabel(def.header, id))
    if (def.footer !== undefined) out.hints.anyFooter = true
    return {
      id,
      header: wrapHeader<TData>(def.header),
      footer: wrapHeader<TData>(def.footer),
      meta: def.meta,
      columns: def.columns.map((child) => adaptOne(child, out, options)),
    } as EngineColumnDef<TData, unknown>
  }

  const behavior = def as unknown as Record<string, unknown>
  const meta = def.meta
  out.labels.set(id, meta?.label ?? plainTextLabel(def.header, id))

  if (def.filter) out.filters.set(id, def.filter)
  if (behavior.enableResizing) out.hints.anyResizable = true
  if (behavior.enablePinning || behavior.defaultPinned) out.hints.anyPinnable = true
  if (def.footer !== undefined) out.hints.anyFooter = true
  if (behavior.defaultVisible === false) out.initialVisibility[id] = false
  if (behavior.defaultPinned === 'left') out.initialPinning.left?.push(id)
  if (behavior.defaultPinned === 'right') out.initialPinning.right?.push(id)
  if (meta?.responsive?.hideBelow || meta?.responsive?.hideAbove) {
    out.responsive.set(id, meta.responsive)
  }

  const column: Record<string, unknown> = {
    id,
    header: wrapHeader<TData>(def.header),
    footer: wrapHeader<TData>(def.footer),
    cell: wrapCell<TData>(def.cell as AnyCellRenderer<TData> | undefined, options),
    meta,
    enableSorting: behavior.enableSorting,
    enableColumnFilter: behavior.enableFiltering,
    enableGlobalFilter: behavior.enableGlobalFilter,
    enableHiding: behavior.enableHiding,
    enableResizing: behavior.enableResizing,
    enablePinning: behavior.enablePinning,
    sortDescFirst: behavior.sortDescFirst,
    size: behavior.size,
    minSize: behavior.minSize,
    maxSize: behavior.maxSize,
    sortingFn: wrapSortingFn(def, options),
    // A column without a `filter` config still filters as text, the same way
    // `applyQuery` treats it, rather than with the engine's own "auto" filter.
    // With filtering switched off, a filter set in code must not narrow the rows
    // either: the engine never checks `getCanFilter`, but `applyQuery` does.
    filterFn:
      behavior.enableFiltering === false
        ? () => true
        : createColumnFilterFn(def.filter ?? DEFAULT_FILTER_CONFIG, {
            timeZone: options.timeZone,
          }),
  }

  // Accessors are always compiled to a function so that `accessorPath` (and a
  // dotted `accessorKey`, should one slip through) behave identically.
  const accessorKey = behavior.accessorKey as string | undefined
  const accessorPath = behavior.accessorPath as string | undefined
  if (typeof behavior.accessorFn === 'function') {
    column.accessorFn = behavior.accessorFn
  } else if (accessorPath) {
    column.accessorFn = (row: TData) => getByPath(row, accessorPath)
  } else if (accessorKey) {
    column.accessorFn = accessorKey.includes('.')
      ? (row: TData) => getByPath(row, accessorKey)
      : (row: TData) => (row as Record<string, unknown>)[accessorKey]
  }

  for (const key of Object.keys(column)) {
    if (column[key] === undefined) delete column[key]
  }

  // One deliberate cast at the boundary: `column` is assembled dynamically, and
  // the engine's own ColumnDef is a discriminated union we have just satisfied.
  return column as unknown as EngineColumnDef<TData, unknown>
}

export function adaptColumns<TData>(
  defs: readonly ColumnDef<TData>[],
  options: AdaptOptions = {},
): AdaptedColumns<TData> {
  const out: AdaptedColumns<TData> = {
    columns: [],
    filters: new Map(),
    labels: new Map(),
    initialVisibility: {},
    initialPinning: { left: [], right: [] },
    responsive: new Map(),
    hints: { anyResizable: false, anyPinnable: false, anyFooter: false },
  }
  out.columns = defs.map((def) => adaptOne(def, out, options))
  return out
}

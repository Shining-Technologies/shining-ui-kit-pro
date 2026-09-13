import type { Table } from '@tanstack/react-table'

/** CSV and TSV serialisation of a table. Pure: runs in a browser or on a server. */

export interface CsvOptions<TData> {
  /** Field separator. Use `'\t'` for TSV. */
  delimiter?: string
  /** Include a header row built from the column labels. Defaults to `true`. */
  includeHeader?: boolean
  /**
   * Which rows to take.
   * - `'all'` — every row after filtering, ignoring pagination (the default)
   * - `'page'` — only what is on screen
   * - `'selected'` — only selected rows
   *
   * Without `data`, these are the rows the table holds. In server mode that is
   * one page: `'all'` is the loaded page and `'selected'` the selected rows
   * on it. Pass `data` to export beyond it.
   */
  rows?: 'all' | 'page' | 'selected'
  /**
   * Rows to export instead of the ones the table holds — typically the full
   * result a server-mode caller fetched for the export. They are serialised
   * through the table's own columns: the same header labels, accessors and
   * `formatValue`, in the order given.
   *
   * - `rows: 'all'` (the default) exports every entry.
   * - `rows: 'selected'` exports the entries whose id is selected in the
   *   table's `rowSelection` state, including selections made on pages that
   *   are no longer loaded. Ids come from the table's `getRowId` — which a
   *   server-mode table needs anyway — or, without one, from each entry's
   *   index in `data`.
   * - `rows: 'page'` ignores `data`: it is always what is on screen.
   */
  data?: readonly TData[]
  /** Restrict to these column ids, in this order. Defaults to visible columns. */
  columnIds?: readonly string[]
  /** Override how one cell is stringified. */
  formatValue?: (value: unknown, columnId: string, row: TData) => string
  /**
   * Prefix values that spreadsheet apps would execute as a formula with a
   * single quote. On by default — this is a real injection vector.
   */
  sanitizeFormulas?: boolean
  /** Prepend a UTF-8 BOM so Excel detects the encoding. Defaults to `true`. */
  bom?: boolean
}

const FORMULA_START = /^[=+\-@\t\r]/
/**
 * A plain number is data, not a formula: `-42` and `+1.5e3` cannot execute
 * anything, and prefixing them turned every negative amount into text.
 */
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

function defaultFormat(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Quote a field if it contains the delimiter, a quote, or a newline. */
export function escapeCsvField(value: string, delimiter: string, sanitize: boolean): string {
  let field = value
  if (sanitize && FORMULA_START.test(field) && !PLAIN_NUMBER.test(field)) field = `'${field}`
  const mustQuote = field.includes(delimiter) || field.includes('"') || /[\r\n]/.test(field)
  return mustQuote ? `"${field.replace(/"/g, '""')}"` : field
}

/** What the serialiser needs from a row: the engine's `Row` has exactly this. */
interface ExportRow<TData> {
  original: TData
  getValue: (columnId: string) => unknown
}

function pickRows<TData>(
  table: Table<TData>,
  mode: CsvOptions<TData>['rows'],
  data: readonly TData[] | undefined,
): readonly ExportRow<TData>[] {
  if (mode === 'page') return table.getRowModel().rows
  if (data) return externalRows(table, data, mode === 'selected')
  if (mode === 'selected') return table.getSelectedRowModel().rows
  return table.getPrePaginationRowModel().rows
}

/**
 * Rows the table does not hold, read through its columns' accessors. Only
 * the row id is needed from the engine, to match the selection state.
 */
function externalRows<TData>(
  table: Table<TData>,
  data: readonly TData[],
  selectedOnly: boolean,
): ExportRow<TData>[] {
  const getRowId = table.options.getRowId
  const selection = table.getState().rowSelection
  const accessors = new Map<string, ((row: TData, index: number) => unknown) | undefined>()
  const accessorFor = (columnId: string) => {
    if (!accessors.has(columnId)) accessors.set(columnId, table.getColumn(columnId)?.accessorFn)
    return accessors.get(columnId)
  }

  const out: ExportRow<TData>[] = []
  data.forEach((original, index) => {
    if (selectedOnly) {
      const id = getRowId ? getRowId(original, index) : String(index)
      if (!selection[id]) return
    }
    out.push({ original, getValue: (columnId) => accessorFor(columnId)?.(original, index) })
  })
  return out
}

function headerLabel<TData>(table: Table<TData>, columnId: string): string {
  const column = table.getColumn(columnId)
  const meta = column?.columnDef.meta as { label?: string } | undefined
  if (meta?.label) return meta.label
  const header = column?.columnDef.header
  return typeof header === 'string' ? header : columnId
}

/**
 * Serialise a table to CSV text.
 *
 * Reads the *engine's* row model, so it exports exactly what the user filtered
 * and sorted — without knowing anything about the UI. With `data`, it exports
 * those rows through the same columns instead.
 */
export function tableToCsv<TData>(table: Table<TData>, options: CsvOptions<TData> = {}): string {
  const {
    delimiter = ',',
    includeHeader = true,
    rows: rowMode = 'all',
    columnIds,
    formatValue,
    sanitizeFormulas = true,
    data,
  } = options

  const ids =
    columnIds ??
    table
      .getVisibleLeafColumns()
      .map((column) => column.id)
      // Structural columns hold checkboxes and buttons, not data.
      .filter((id) => !id.startsWith('sui-'))

  const lines: string[] = []

  if (includeHeader) {
    lines.push(
      ids
        .map((id) => escapeCsvField(headerLabel(table, id), delimiter, sanitizeFormulas))
        .join(delimiter),
    )
  }

  for (const row of pickRows(table, rowMode, data)) {
    lines.push(
      ids
        .map((id) => {
          const value = row.getValue(id)
          const text = formatValue ? formatValue(value, id, row.original) : defaultFormat(value)
          return escapeCsvField(text, delimiter, sanitizeFormulas)
        })
        .join(delimiter),
    )
  }

  return lines.join('\r\n')
}

/** Wrap CSV text in a `Blob` ready for download or upload. */
export function csvToBlob(csv: string, bom = true): Blob {
  const parts = bom ? ['﻿', csv] : [csv]
  return new Blob(parts, { type: 'text/csv;charset=utf-8;' })
}

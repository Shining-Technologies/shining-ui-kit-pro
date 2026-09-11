import type { Table } from '@tanstack/table-core'

/**
 * `@shining-ui-kit/export-csv`
 *
 * Export lives in its own package on purpose. Most tables never export
 * anything, and the main package should not carry code they will not run
 * (§42, §53). It has no runtime dependencies of its own.
 *
 * ```ts
 * import { downloadTableCsv } from '@shining-ui-kit/export-csv'
 * <Button onClick={() => downloadTableCsv(table, { filename: 'users.csv' })}>Export</Button>
 * ```
 */

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
   */
  rows?: 'all' | 'page' | 'selected'
  /** Restrict to these column ids, in this order. Defaults to visible columns. */
  columnIds?: string[]
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

function defaultFormat(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Quote a field if it contains the delimiter, a quote, or a newline. */
export function escapeCsvField(value: string, delimiter: string, sanitize: boolean): string {
  let field = value
  if (sanitize && FORMULA_START.test(field)) field = `'${field}`
  const mustQuote = field.includes(delimiter) || field.includes('"') || /[\r\n]/.test(field)
  return mustQuote ? `"${field.replace(/"/g, '""')}"` : field
}

function pickRows<TData>(table: Table<TData>, mode: CsvOptions<TData>['rows']) {
  if (mode === 'page') return table.getRowModel().rows
  if (mode === 'selected') return table.getSelectedRowModel().rows
  return table.getPrePaginationRowModel().rows
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
 * and sorted — without knowing anything about the UI.
 */
export function tableToCsv<TData>(table: Table<TData>, options: CsvOptions<TData> = {}): string {
  const {
    delimiter = ',',
    includeHeader = true,
    rows: rowMode = 'all',
    columnIds,
    formatValue,
    sanitizeFormulas = true,
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

  for (const row of pickRows(table, rowMode)) {
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

export interface DownloadOptions<TData> extends CsvOptions<TData> {
  filename?: string
}

/**
 * Serialise and hand the file to the browser.
 *
 * No-ops outside a browser rather than throwing, so it is safe to reference
 * from code that also renders on a server.
 */
export function downloadTableCsv<TData>(
  table: Table<TData>,
  options: DownloadOptions<TData> = {},
): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return

  const { filename = 'export.csv', bom = true, ...csvOptions } = options
  const url = URL.createObjectURL(csvToBlob(tableToCsv(table, csvOptions), bom))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Release on the next tick; Safari needs the URL alive during the click.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

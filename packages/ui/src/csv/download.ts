'use client'

import type { Table } from '@tanstack/react-table'
import { csvToBlob, tableToCsv, type CsvOptions } from './serialize'

export interface DownloadOptions<TData> extends CsvOptions<TData> {
  filename?: string
}

/**
 * Serialise and hand the file to the browser.
 *
 * The one browser-only part of CSV export, kept in its own client module so the
 * serialiser stays usable on a server (a route handler streaming a CSV).
 * No-ops outside a browser rather than throwing.
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

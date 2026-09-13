import type { Row, Table } from '@tanstack/react-table'

/**
 * Where each rendered row sits in the whole table, for `aria-rowcount` and
 * `aria-rowindex`.
 *
 * The ARIA row count is every row of the table — header rows, data rows,
 * detail rows and footer rows — not just the data. A page, or a virtualized
 * window, renders a slice of them, and a screen reader can only say "row 32
 * of 507" when each rendered row states its own 1-based position. Header rows
 * come first, then the data in order (offset by the page's start, in client
 * and server pagination alike), each open detail row straight after its row,
 * and the footer rows last.
 */
export interface RowIndexModel {
  /**
   * `aria-rowcount` for the table: `-1` when the server has not said how many
   * rows there are, `undefined` when no rows are being rendered at all (the
   * empty, loading and error states), where every row is already in the DOM.
   */
  rowCount: number | undefined
  /** `aria-rowindex` of a header row, by header group. */
  header: (groupIndex: number) => number | undefined
  /** `aria-rowindex` of a body row, by its index among the rendered rows. */
  body: (index: number) => number | undefined
  /** `aria-rowindex` of a footer row, by footer group. */
  footer: (groupIndex: number) => number | undefined
}

const NONE = () => undefined

/** The model for a table that is not rendering rows: nothing to index. */
export const NO_ROW_INDEX: RowIndexModel = {
  rowCount: undefined,
  header: NONE,
  body: NONE,
  footer: NONE,
}

export interface RowIndexOptions {
  /** Whether data rows are on screen: not an error, a first load or an empty result. */
  active: boolean
  /** Rows the `<tfoot>` renders; 0 without one. */
  footerRows: number
  /** Whether an expanded row renders a detail row beneath it. */
  hasDetails: boolean
  /** Server pagination: the page's rows are all the table holds. */
  serverPagination: boolean
  /** `rowCount`, when the application has given one: the server's total. */
  knownTotal: number | undefined
}

function countExpanded<TData>(rows: Row<TData>[], from: number, to: number): number {
  let count = 0
  for (let index = from; index < to; index++) if (rows[index]?.getIsExpanded()) count++
  return count
}

export function buildRowIndexModel<TData>(
  table: Table<TData>,
  options: RowIndexOptions,
): RowIndexModel {
  if (!options.active) return NO_ROW_INDEX

  const headerRows = table.getHeaderGroups().length
  const { pageIndex, pageSize } = table.getState().pagination
  const paginated = table.options.getPaginationRowModel !== undefined || options.serverPagination
  const pageStart = paginated ? pageIndex * pageSize : 0
  const page = table.getRowModel().rows

  // Detail rows are real rows, so they are counted and they push every row
  // after them down by one. Client-side, the rows before this page are known
  // and counted; in server pagination only this page is, so only its details
  // are. Nothing is walked unless a detail row is actually open.
  const expandedState = table.getState().expanded
  const anyOpen =
    options.hasDetails && (expandedState === true || Object.keys(expandedState).length > 0)
  let before = 0
  let details = 0
  let offsets: number[] | undefined
  if (anyOpen) {
    const source = options.serverPagination ? page : table.getPrePaginationRowModel().rows
    const start = options.serverPagination ? 0 : Math.min(pageStart, source.length)
    before = countExpanded(source, 0, start)
    details = before + countExpanded(source, start, source.length)
    offsets = new Array<number>(page.length)
    let running = before
    for (let index = 0; index < page.length; index++) {
      offsets[index] = running
      if (page[index]?.getIsExpanded()) running++
    }
  }

  // The same total the pagination bar reports. A total that disagrees with the
  // page in hand — a stale count, a server that sent an extra row — is
  // stretched to cover it, so no row claims a position past the end.
  const declared =
    options.knownTotal ??
    (options.serverPagination ? -1 : table.getPrePaginationRowModel().rows.length)
  const dataTotal = declared < 0 ? -1 : Math.max(declared, pageStart + page.length)
  const unknown = dataTotal < 0
  const bodyRows = dataTotal + details

  return {
    rowCount: unknown ? -1 : headerRows + bodyRows + options.footerRows,
    header: (groupIndex) => groupIndex + 1,
    body: (index) => headerRows + pageStart + index + (offsets?.[index] ?? before) + 1,
    // Without a total there is no telling where the footer sits.
    footer: (groupIndex) => (unknown ? undefined : headerRows + bodyRows + groupIndex + 1),
  }
}

import { resolveColumns } from '../columns'
import { isFilterActive, normalizeFilterValue } from '../filtering/filter-fn'
import { ALL_FILTER_OPERATORS, getOperator } from '../filtering/operators'
import type { QueryColumn } from '../types/column'
import type { FilterOperator, FilterValue } from '../types/filter'
import { isFilterValue } from '../types/filter'
import type { ColumnFiltersState, DataTableQuery, SortingState } from '../types/state'

/**
 * A table query in the URL.
 *
 * Keeping sort, filters, search and page in the address bar is what makes a
 * Next.js App Router table shareable, bookmarkable and renderable by a Server
 * Component. The format is short and readable:
 *
 * ```
 * ?page=2&size=25&sort=-createdAt,name&q=ann&f.status=includes:["active","paused"]
 * ```
 *
 * - `page` is 1-based; `size` the page size.
 * - `sort` lists column ids, `-` for descending.
 * - `q` is the search box.
 * - `f.<columnId>` is one filter:
 *   - `<operator>:<JSON value>` (`f.total=between:[10,200]`), or `<operator>:`
 *     for an operator without a value (`f.email=isEmpty:`);
 *   - otherwise a bare value meaning the column's default operator. A bare
 *     value that is valid JSON is read as JSON (`f.total=42` is the number
 *     42, `f.name="42"` the string "42"); anything else is text (`f.name=ann`).
 *     When writing, a string that would be misread that way — valid JSON, or
 *     starting with `<operator>:` — is written as a JSON string.
 *
 * Everything read from a URL is untrusted: pass `columns` and only those
 * columns can be sorted or filtered, only with operators valid for their
 * filter type, and page numbers are clamped.
 */

export type SearchParamsInput =
  | URLSearchParams
  | string
  | Readonly<Record<string, string | readonly string[] | undefined>>

export interface QuerySearchParamsOptions<TData = unknown> {
  /** Prefix every key, for more than one table on a page (`prefix: 'orders.'`). */
  prefix?: string
  /** Page size when the URL has none. Defaults to `10`. */
  defaultPageSize?: number
  /** Accept only these page sizes from a URL; anything else falls back to the default. */
  pageSizeOptions?: readonly number[]
  /** Upper bound for a page size read from a URL. Defaults to `500`. */
  maxPageSize?: number
  /**
   * The table's columns. When given, only sortable and filterable columns are
   * read or written, a filter's operator must be valid for the column's filter
   * type, and a filter is kept only while it is active.
   */
  columns?: readonly QueryColumn<TData>[]
}

function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (input instanceof URLSearchParams) return input
  if (typeof input === 'string') return new URLSearchParams(input)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (typeof value === 'string') params.append(key, value)
    else for (const entry of value) params.append(key, entry)
  }
  return params
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || !/^\d{1,9}$/.test(raw.trim())) return undefined
  return Number(raw.trim())
}

const OPERATOR_PREFIX = /^([A-Za-z]+):/

/** The operator a raw `f.` value starts with, if it starts with a known one. */
function operatorPrefix(raw: string): FilterOperator | undefined {
  const name = OPERATOR_PREFIX.exec(raw)?.[1]
  return name !== undefined && ALL_FILTER_OPERATORS.has(name as FilterOperator)
    ? (name as FilterOperator)
    : undefined
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function parseFilterValue(raw: string): unknown {
  const operator = operatorPrefix(raw)
  if (operator) {
    const body = raw.slice(operator.length + 1)
    if (body === '') return { operator, value: undefined }
    try {
      return { operator, value: JSON.parse(body) as unknown }
    } catch {
      return { operator, value: body }
    }
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    // A bare `{ "operator": … }` object stays text: the structured form is `operator:value`.
    return isFilterValue(parsed) ? raw : parsed
  } catch {
    return raw
  }
}

function writeStructured(filter: FilterValue): string {
  return `${filter.operator}:${filter.value === undefined ? '' : JSON.stringify(filter.value)}`
}

/** A bare value, written so that `parseFilterValue` reads back the same value. */
function writeBare(value: unknown): string {
  if (typeof value !== 'string') return JSON.stringify(value)
  return operatorPrefix(value) !== undefined || isJson(value) ? JSON.stringify(value) : value
}

/** Read a {@link DataTableQuery} from URL search params (or Next.js `searchParams`). */
export function parseQuerySearchParams<TData = unknown>(
  input: SearchParamsInput,
  options: QuerySearchParamsOptions<TData> = {},
): DataTableQuery {
  const params = toSearchParams(input)
  const prefix = options.prefix ?? ''
  const defaultPageSize = options.defaultPageSize ?? 10
  const known = options.columns ? resolveColumns(options.columns) : undefined

  const page = parsePositiveInt(params.get(`${prefix}page`))
  let pageSize = parsePositiveInt(params.get(`${prefix}size`)) ?? defaultPageSize
  if (pageSize < 1 || pageSize > (options.maxPageSize ?? 500)) pageSize = defaultPageSize
  if (options.pageSizeOptions && !options.pageSizeOptions.includes(pageSize)) {
    pageSize = defaultPageSize
  }

  const sorting: SortingState = []
  for (const token of (params.get(`${prefix}sort`) ?? '').split(',')) {
    const trimmed = token.trim()
    if (!trimmed) continue
    const desc = trimmed.startsWith('-')
    const id = desc ? trimmed.slice(1) : trimmed
    if (!id || sorting.some((sort) => sort.id === id)) continue
    const column = known?.get(id)
    if (known && !column?.canSort) continue
    sorting.push({ id, desc })
  }

  const columnFilters: ColumnFiltersState = []
  const filterPrefix = `${prefix}f.`
  for (const [key, raw] of params) {
    if (!key.startsWith(filterPrefix)) continue
    const id = key.slice(filterPrefix.length)
    if (!id || columnFilters.some((entry) => entry.id === id)) continue
    const column = known?.get(id)
    if (known && !column?.canFilter) continue
    const value = parseFilterValue(raw)
    if (column) {
      const type = column.filter.type
      if (isFilterValue(value) && !getOperator(type, value.operator)) continue
      if (!isFilterActive(value, type)) continue
    }
    columnFilters.push({ id, value })
  }

  return {
    pageIndex: page !== undefined && page > 0 ? page - 1 : 0,
    pageSize,
    sorting,
    columnFilters,
    globalFilter: params.get(`${prefix}q`) ?? '',
  }
}

/**
 * Write a {@link DataTableQuery} to URL search params. Defaults are omitted,
 * so an untouched table has a clean URL.
 *
 * Pass the current `URLSearchParams` as `base` to keep the page's other keys.
 * With `columns`, the same entries `parseQuerySearchParams` would drop are not
 * written: sorts on unknown or unsortable columns, filters on unknown or
 * unfilterable columns, operators invalid for the column and inactive filters.
 */
export function serializeQuerySearchParams<TData = unknown>(
  query: Partial<DataTableQuery>,
  options: QuerySearchParamsOptions<TData> & { base?: SearchParamsInput } = {},
): URLSearchParams {
  const prefix = options.prefix ?? ''
  const params = new URLSearchParams(options.base ? toSearchParams(options.base) : undefined)
  const known = options.columns ? resolveColumns(options.columns) : undefined

  for (const key of [...params.keys()]) {
    if (
      key === `${prefix}page` ||
      key === `${prefix}size` ||
      key === `${prefix}sort` ||
      key === `${prefix}q` ||
      key.startsWith(`${prefix}f.`)
    ) {
      params.delete(key)
    }
  }

  const pageIndex = query.pageIndex ?? 0
  if (pageIndex > 0) params.set(`${prefix}page`, String(pageIndex + 1))
  if (query.pageSize !== undefined && query.pageSize !== (options.defaultPageSize ?? 10)) {
    params.set(`${prefix}size`, String(query.pageSize))
  }

  const sort = (query.sorting ?? [])
    .filter((entry) => !known || known.get(entry.id)?.canSort)
    .map((entry) => `${entry.desc ? '-' : ''}${entry.id}`)
    .join(',')
  if (sort) params.set(`${prefix}sort`, sort)

  const search = query.globalFilter ?? ''
  if (search.trim()) params.set(`${prefix}q`, search)

  for (const entry of query.columnFilters ?? []) {
    if (entry.value === undefined || entry.value === null) continue
    let text: string
    if (known) {
      const column = known.get(entry.id)
      if (!column?.canFilter) continue
      const type = column.filter.type
      const value = normalizeFilterValue(entry.value, type)
      if (!getOperator(type, value.operator) || !isFilterActive(value, type)) continue
      text = writeStructured(value)
    } else if (isFilterValue(entry.value)) {
      // An operator the parser does not know could not be read back.
      if (!ALL_FILTER_OPERATORS.has(entry.value.operator)) continue
      text = writeStructured(entry.value)
    } else {
      text = writeBare(entry.value)
    }
    params.set(`${prefix}f.${entry.id}`, text)
  }

  return params
}

import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table,
} from '@tanstack/table-core'
import { describe, expect, it } from 'vitest'
import { escapeCsvField, tableToCsv } from '../index'

interface Row {
  name: string
  note: string
  amount: number
  when: Date
}

const rows: Row[] = [
  { name: 'Ada', note: 'plain', amount: 10, when: new Date('2024-01-15T00:00:00Z') },
  { name: 'Grace', note: 'has, comma', amount: 20, when: new Date('2024-02-15T00:00:00Z') },
  { name: 'Alan', note: 'has "quotes"', amount: 30, when: new Date('2024-03-15T00:00:00Z') },
]

/** Build a headless table instance — no React needed to test the exporter. */
function makeTable(overrides: Record<string, unknown> = {}): Table<Row> {
  let state: Record<string, unknown> = {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [],
    columnFilters: [],
    rowSelection: {},
  }
  const table: Table<Row> = createTable<Row>({
    data: rows,
    columns: [
      { id: 'name', accessorKey: 'name', header: 'Name' },
      { id: 'note', accessorKey: 'note', header: 'Note' },
      { id: 'amount', accessorKey: 'amount', header: 'Amount' },
      { id: 'when', accessorKey: 'when', header: 'When' },
      { id: 'sui-select', header: 'Selection' },
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state,
    onStateChange: (updater) => {
      state = (typeof updater === 'function'
        ? updater(state as never)
        : updater) as unknown as Record<string, unknown>
      table.setOptions((previous) => ({ ...previous, state: { ...previous.state, ...state } }))
    },
    renderFallbackValue: null,
    ...overrides,
  })
  table.setOptions((previous) => ({ ...previous, state }))
  return table
}

describe('escapeCsvField', () => {
  it('leaves ordinary values alone', () => {
    expect(escapeCsvField('plain', ',', true)).toBe('plain')
  })

  it('quotes delimiters, quotes and newlines', () => {
    expect(escapeCsvField('a,b', ',', true)).toBe('"a,b"')
    expect(escapeCsvField('say "hi"', ',', true)).toBe('"say ""hi"""')
    expect(escapeCsvField('line\nbreak', ',', true)).toBe('"line\nbreak"')
  })

  it('neutralises spreadsheet formulas', () => {
    expect(escapeCsvField('=1+1', ',', true)).toBe("'=1+1")
    expect(escapeCsvField('@SUM(A1)', ',', true)).toBe("'@SUM(A1)")
    expect(escapeCsvField('=1+1', ',', false)).toBe('=1+1')
  })

  it('does not quote a delimiter that is not in use', () => {
    expect(escapeCsvField('a,b', '\t', true)).toBe('a,b')
  })
})

describe('tableToCsv', () => {
  it('writes a header row and one line per row', () => {
    const csv = tableToCsv(makeTable())
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('Name,Note,Amount,When')
    expect(lines).toHaveLength(4)
    expect(lines[1]).toBe('Ada,plain,10,2024-01-15T00:00:00.000Z')
  })

  it('skips the library structural columns', () => {
    expect(tableToCsv(makeTable())).not.toContain('Selection')
  })

  it('escapes values that need it', () => {
    const csv = tableToCsv(makeTable())
    expect(csv).toContain('"has, comma"')
    expect(csv).toContain('"has ""quotes"""')
  })

  it('honours the delimiter and header options', () => {
    const csv = tableToCsv(makeTable(), { delimiter: '\t', includeHeader: false })
    expect(csv.split('\r\n')).toHaveLength(3)
    expect(csv.split('\r\n')[0]).toBe('Ada\tplain\t10\t2024-01-15T00:00:00.000Z')
  })

  it('restricts and orders columns on request', () => {
    const csv = tableToCsv(makeTable(), { columnIds: ['amount', 'name'] })
    expect(csv.split('\r\n')[0]).toBe('Amount,Name')
    expect(csv.split('\r\n')[1]).toBe('10,Ada')
  })

  it('uses a custom value formatter', () => {
    const csv = tableToCsv(makeTable(), {
      columnIds: ['amount'],
      formatValue: (value) => `$${String(value)}`,
    })
    expect(csv).toContain('$10')
  })

  it('exports every filtered row, not just the visible page', () => {
    const table = makeTable()
    table.setPageSize(1)
    expect(tableToCsv(table).split('\r\n')).toHaveLength(4)
    expect(tableToCsv(table, { rows: 'page' }).split('\r\n')).toHaveLength(2)
  })
})

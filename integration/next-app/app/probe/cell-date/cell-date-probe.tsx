'use client'

import { CellDate, DataTable, type ColumnDef } from '@shining-technologies/ui'

interface Row {
  id: string
  createdAt: string
  lastLogin: string
}

const rows: Row[] = [{ id: 'r1', createdAt: '2025-10-13', lastLogin: '2026-03-10T03:54:46.000Z' }]

// The natural usage: the table is told its zone and locale; the cell is not.
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ value }) => <CellDate value={value} /> },
  { accessorKey: 'lastLogin', header: 'Last login', cell: ({ value }) => <CellDate value={value} /> },
]

export function CellDateProbe() {
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      timeZone="Australia/Sydney"
      locale="en-AU"
      label="CellDate probe"
    />
  )
}

import { Button, DataTable, applyQuery as rootApplyQuery, type ColumnDef } from '@shining-technologies/ui'
import { applyQuery, type ColumnMeta, type DataTableQuery } from '@shining-technologies/ui/core'
import { createThemeCss, THEME_PRESETS, contrastRatio } from '@shining-technologies/ui/theme'
import { TrendChart, DonutChart, type ChartSeries } from '@shining-technologies/ui/charts'
import { tableToCsv, type CsvOptions } from '@shining-technologies/ui/csv'
import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'
import { Button as FamilyButton, type ButtonProps } from '@shining-technologies/ui/button'
import { DataTable as FamilyDataTable } from '@shining-technologies/ui/data-table'

declare module '@shining-technologies/ui/core' {
  interface ColumnMeta {
    currency?: string
  }
}

interface Row {
  id: string
  name: string
  total: number
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ value }) => value.toUpperCase(),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { currency: 'AUD' },
    cell: ({ value, meta, column }) => {
      const n: number = value
      // @ts-expect-error value is inferred as number, so a string method is an error
      value.toUpperCase()
      const currency: string | undefined = meta?.currency
      const viaColumnDef: string | undefined = column.columnDef.meta?.currency
      // @ts-expect-error doesNotExist is not part of ColumnMeta
      meta?.doesNotExist
      return `${n} ${currency ?? ''} ${viaColumnDef ?? ''}`
    },
  },
]

const metaCheck: ColumnMeta = { currency: 'NZD', align: 'right' }
const query: Partial<DataTableQuery> = { pageIndex: 0, pageSize: 10 }
const rows: Row[] = [{ id: '1', name: 'a', total: 1 }]
const result = applyQuery(rows, query, { columns })
const rootResult = rootApplyQuery(rows, query, { columns })
const firstName: string | undefined = result.rows[0]?.name
const total: number = rootResult.total
const css: string = createThemeCss({ primary: '#be123c' })
const presets = THEME_PRESETS
const ratio: number = contrastRatio('#000000', '#ffffff')
const series: ChartSeries[] = [{ key: 'total' }]
const csvOptions: CsvOptions<Row> = { delimiter: ';', rows: 'all' }
const buttonProps: ButtonProps = { variant: 'outline' }

export function Demo() {
  return (
    <div>
      <Button {...buttonProps}>Root</Button>
      <FamilyButton>Family</FamilyButton>
      <DataTable data={rows} columns={columns} locale="en-AU" slots={{ toolbarActions: ({ table }) => <span>{tableToCsv(table, csvOptions)}</span> }} />
      <FamilyDataTable data={rows} columns={columns} />
      <VirtualizedDataTable data={rows} columns={columns} maxHeight={400} />
      <TrendChart data={[{ m: 'Jan', total: 1 }]} xKey="m" series={series} />
      <DonutChart data={[{ key: 'a', value: 1 }]} />
      <output>{[metaCheck.currency, firstName, total, css.length, presets.length, ratio].join()}</output>
    </div>
  )
}

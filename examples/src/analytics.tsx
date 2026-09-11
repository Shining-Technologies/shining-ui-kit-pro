import {
  CellNumber,
  CellText,
  DataTable,
  createColumnHelper,
  type ColumnDef,
} from '@shining-ui-kit/react'
import { metrics, type Metric } from './data'

/**
 * Analytics summary.
 *
 * Shows: computed delta columns, a hand-written trend cell, unit-aware
 * formatting, the `minimal` variant, and a table with no pagination.
 */
const column = createColumnHelper<Metric>()

function formatByUnit(value: number, unit: Metric['unit']) {
  if (unit === 'currency') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (unit === 'percent') return `${value.toFixed(1)}%`
  return new Intl.NumberFormat().format(value)
}

/** A small sparkline-ish trend arrow. Decorative: the change column has the number. */
function Trend({ delta }: { delta: number }) {
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  return (
    <span className={`ex-trend ex-trend--${direction}`} aria-hidden="true">
      {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—'}
    </span>
  )
}

export const metricColumns: ColumnDef<Metric>[] = [
  column.accessor('metric', {
    header: 'Metric',
    size: 240,
    enableHiding: false,
    cell: ({ value, row }) => (
      <span className="ex-stack">
        <CellText>{value}</CellText>
        <span className="ex-muted">{row.original.segment}</span>
      </span>
    ),
    filter: { type: 'text' },
  }),
  column.accessor('current', {
    header: 'Current',
    size: 140,
    meta: { align: 'right' },
    cell: ({ value, row }) => (
      <span className="sui-tabular">{formatByUnit(value, row.original.unit)}</span>
    ),
    filter: { type: 'number' },
  }),
  column.accessor('previous', {
    header: 'Previous',
    size: 140,
    meta: { align: 'right', responsive: { hideBelow: 'md' } },
    cell: ({ value, row }) => (
      <span className="sui-tabular ex-muted">{formatByUnit(value, row.original.unit)}</span>
    ),
  }),
  column.computed('change', (row) => (row.current - row.previous) / row.previous, {
    header: 'Change',
    size: 130,
    meta: { align: 'right' },
    sortingFn: 'number',
    cell: ({ value }) => (
      <span className={value >= 0 ? 'ex-positive' : 'ex-negative'}>
        <CellNumber
          value={value}
          options={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }}
        />
      </span>
    ),
  }),
  column.computed('trend', (row) => row.current - row.previous, {
    header: 'Trend',
    size: 90,
    meta: { align: 'center' },
    enableSorting: false,
    cell: ({ value }) => <Trend delta={value} />,
  }),
  column.computed('progress', (row) => row.current / row.target, {
    header: 'To target',
    size: 130,
    meta: { align: 'right', responsive: { hideBelow: 'lg' } },
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'percent', maximumFractionDigits: 0 }} />
    ),
  }),
]

export function AnalyticsTable() {
  return (
    <DataTable
      data={metrics}
      columns={metricColumns}
      label="Key metrics"
      getRowId={(row) => row.id}
      variant="minimal"
      density="spacious"
      features={{ pagination: { enabled: false } }}
      defaultSorting={[{ id: 'change', desc: true }]}
    />
  )
}

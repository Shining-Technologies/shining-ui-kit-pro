import {
  CellBadge,
  CellDate,
  CellNumber,
  CellPerson,
  CellProgress,
  CellText,
  DataTable,
  type ColumnDef,
} from '@shining-ui-kit/react'
import { accounts, type Account } from './data'

/**
 * CRM pipeline.
 *
 * Shows: grouped headers, a probability meter, a currency column sorted
 * descending by default, and a custom row class that dims lost deals.
 */
const STAGE_TONE = {
  Lead: 'neutral',
  Qualified: 'info',
  Proposal: 'accent',
  Negotiation: 'warning',
  Won: 'success',
  Lost: 'danger',
} as const

export const accountColumns: ColumnDef<Account>[] = [
  {
    id: 'who',
    header: 'Account',
    columns: [
      {
        accessorKey: 'contact',
        header: 'Contact',
        size: 220,
        enableHiding: false,
        cell: ({ value, row }) => <CellPerson name={value} description={row.original.email} />,
        filter: { type: 'text' },
      },
      {
        accessorKey: 'company',
        header: 'Company',
        size: 160,
        cell: ({ value }) => <CellText>{value}</CellText>,
        filter: { type: 'text' },
      },
    ],
  },
  {
    id: 'deal',
    header: 'Deal',
    columns: [
      {
        accessorKey: 'stage',
        header: 'Stage',
        size: 140,
        cell: ({ value }) => <CellBadge tone={STAGE_TONE[value]}>{value}</CellBadge>,
        filter: {
          type: 'multiSelect',
          options: (['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const).map(
            (value) => ({ label: value, value }),
          ),
        },
      },
      {
        accessorKey: 'value',
        header: 'Value',
        size: 130,
        meta: { align: 'right' },
        cell: ({ value }) => (
          <CellNumber
            value={value}
            options={{ style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }}
          />
        ),
        filter: { type: 'number', defaultOperator: 'greaterThanOrEqual' },
      },
      {
        accessorKey: 'probability',
        header: 'Probability',
        size: 160,
        meta: { responsive: { hideBelow: 'lg' } },
        cell: ({ value }) => <CellProgress label="Win probability" value={value} />,
        filter: { type: 'number' },
      },
    ],
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    size: 120,
    meta: { responsive: { hideBelow: 'md' } },
    filter: { type: 'text' },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 140,
    meta: { responsive: { hideBelow: 'xl' } },
    cell: ({ value }) => <CellDate value={value} />,
    filter: { type: 'date' },
  },
]

export function CrmTable() {
  return (
    <DataTable
      data={accounts}
      columns={accountColumns}
      label="Sales pipeline"
      getRowId={(row) => row.id}
      pageSize={10}
      defaultSorting={[{ id: 'value', desc: true }]}
      rowClassName={(row) => (row.original.stage === 'Lost' ? 'ex-row-lost' : undefined)}
      renderExpandedRow={(row) => (
        <div className="ex-details">
          <div>
            <dt>Next step</dt>
            <dd>{row.original.nextStep}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{row.original.owner}</dd>
          </div>
        </div>
      )}
    />
  )
}

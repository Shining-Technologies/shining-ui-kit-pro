import {
  CellBadge,
  CellDate,
  CellEmpty,
  CellLink,
  CellNumber,
  CellPerson,
  CellStack,
  CellText,
  DataTable,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  type ColumnDef,
} from '@shining-technologies/ui-kit-react'
import { orders, type Order } from './data'

/**
 * Orders — the dense operational table.
 *
 * This is the one to copy. It shows the whole vocabulary a back-office list
 * needs: a title and a description that say what the list is, inline filters
 * with a way out of each one, an identifier stacked with its status, a person
 * cell carrying contact and ownership, links out to related records, a
 * right-aligned money column that totals itself, and a column of icon actions
 * frozen to the right edge.
 */
const PAYMENT_TONE = {
  paid: 'success',
  pending: 'warning',
  refunded: 'info',
  failed: 'danger',
} as const

const STATUS_TONE = {
  fulfilled: 'success',
  processing: 'info',
  cancelled: 'neutral',
} as const

const title = (value: string) => value[0]!.toUpperCase() + value.slice(1)

export const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'reference',
    header: 'Order',
    size: 130,
    enableHiding: false,
    // The identifier and its state are always read together, so they are one
    // column rather than two that have to be scanned side by side.
    cell: ({ value, row }) => (
      <CellStack
        secondary={
          <CellBadge tone={STATUS_TONE[row.original.status]}>
            {title(row.original.status)}
          </CellBadge>
        }
      >
        <span className="ex-mono">{value}</span>
      </CellStack>
    ),
    filter: { type: 'text', label: 'Order reference' },
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    size: 250,
    cell: ({ value, row }) => (
      <CellPerson
        name={value}
        description={row.original.email}
        seed={row.original.id}
        caption={
          row.original.handler ? (
            `Handled by ${row.original.handler}`
          ) : (
            <span className="ex-warning">Unassigned</span>
          )
        }
      />
    ),
    filter: { type: 'text' },
  },
  {
    id: 'services',
    header: 'Services',
    size: 220,
    accessorFn: (row: Order) => row.services.join(', '),
    cell: ({ row }) => (
      <CellStack
        secondary={
          row.original.extras > 0 ? (
            <CellBadge tone="neutral">
              +{row.original.extras} {row.original.extras === 1 ? 'extra' : 'extras'}
            </CellBadge>
          ) : null
        }
      >
        <CellText title={row.original.services.join(', ')}>
          {row.original.services.join(', ')}
        </CellText>
      </CellStack>
    ),
    filter: { type: 'text', label: 'Service' },
  },
  {
    id: 'quote',
    header: 'Quote',
    size: 150,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.quoteId ? (
        <CellLink href={`#/quotes/${row.original.quoteId}`} external>
          View quote
        </CellLink>
      ) : (
        <CellEmpty>N/A</CellEmpty>
      ),
  },
  {
    accessorKey: 'placedAt',
    header: 'Placed',
    size: 150,
    meta: { responsive: { hideBelow: 'lg' } },
    cell: ({ value }) => <CellDate value={value} />,
    filter: { type: 'date', defaultOperator: 'between' },
  },
  {
    accessorKey: 'payment',
    header: 'Payment',
    size: 130,
    cell: ({ value }) => <CellBadge tone={PAYMENT_TONE[value]}>{title(value)}</CellBadge>,
    filter: {
      type: 'select',
      options: (['paid', 'pending', 'refunded', 'failed'] as const).map((value) => ({
        label: title(value),
        value,
      })),
    },
  },
  {
    accessorKey: 'items',
    header: 'Items',
    size: 90,
    meta: { align: 'right', responsive: { hideBelow: 'md' } },
    filter: { type: 'number' },
  },
  {
    accessorKey: 'amount',
    header: 'Total price',
    size: 140,
    meta: { align: 'right' },
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'currency', currency: 'AUD' }} />
    ),
    footer: ({ table }) => {
      const total = table
        .getRowModel()
        .rows.reduce((sum, row) => sum + (row.getValue<number>('amount') ?? 0), 0)
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
      }).format(total)
    },
    filter: { type: 'number', label: 'Order amount', defaultOperator: 'between' },
  },
]

export function OrdersTable() {
  return (
    <DataTable
      data={orders}
      columns={orderColumns}
      title="Orders"
      description="Every order placed through the portal. Cancelled orders stay in the list — they are still owed a reason."
      getRowId={(row) => row.id}
      density="compact"
      filterLayout="inline"
      responsiveMode="auto"
      pageSize={15}
      maxHeight={560}
      defaultSorting={[{ id: 'placedAt', desc: true }]}
      // Described, not rendered: the table builds the buttons, their tooltips
      // and their accessible names from this list.
      rowActions={(row) => [
        { icon: EyeIcon, label: 'View order', href: `#/orders/${row.original.id}` },
        { icon: PencilIcon, label: 'Edit order', onClick: () => {} },
        {
          icon: TrashIcon,
          label: 'Cancel order',
          destructive: true,
          disabled: row.original.status === 'cancelled',
          onClick: () => {},
        },
      ]}
    />
  )
}

import {
  CellBadge,
  CellNumber,
  CellProgress,
  CellText,
  DataTable,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  createColumnHelper,
  type ColumnDef,
} from '@shining-technologies/ui-kit-react'
import { products, type Product } from './data'

/**
 * E-commerce catalogue.
 *
 * Shows: a computed margin column with an inferred value type, currency and
 * numeric formatting, a stock meter, pinned identity and action columns, and
 * column resizing.
 */
const column = createColumnHelper<Product>()

const STOCK_TONE = (stock: number) => (stock === 0 ? 'danger' : stock < 20 ? 'warning' : 'success')

export const productColumns: ColumnDef<Product>[] = [
  column.accessor('name', {
    header: 'Product',
    size: 260,
    enableHiding: false,
    enableResizing: true,
    defaultPinned: 'left',
    cell: ({ value, row }) => (
      <div className="ex-product">
        <span className="ex-thumb" aria-hidden="true">
          {value.slice(0, 1)}
        </span>
        <span className="ex-product__text">
          <CellText>{value}</CellText>
          <span className="ex-muted">{row.original.sku}</span>
        </span>
      </div>
    ),
    filter: { type: 'text', label: 'Product name' },
  }),
  column.accessor('category', {
    header: 'Category',
    size: 140,
    enableResizing: true,
    filter: {
      type: 'multiSelect',
      options: [
        { label: 'Audio', value: 'Audio' },
        { label: 'Wearables', value: 'Wearables' },
        { label: 'Computers', value: 'Computers' },
        { label: 'Accessories', value: 'Accessories' },
      ],
    },
  }),
  column.accessor('price', {
    header: 'Price',
    size: 120,
    meta: { align: 'right' },
    enableResizing: true,
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'currency', currency: 'AUD' }} />
    ),
    footer: ({ table }) => {
      const total = table
        .getRowModel()
        .rows.reduce((sum, row) => sum + (row.getValue<number>('price') ?? 0), 0)
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
      }).format(total)
    },
    filter: { type: 'number', label: 'Price' },
  }),
  column.computed('margin', (row) => (row.price - row.cost) / row.price, {
    header: 'Margin',
    size: 110,
    meta: { align: 'right' },
    // `value` is a number, inferred from the accessor above.
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'percent', maximumFractionDigits: 0 }} />
    ),
  }),
  column.accessor('stock', {
    header: 'Stock',
    size: 180,
    meta: { responsive: { hideBelow: 'md' } },
    cell: ({ value }) => (
      <CellProgress
        label="Stock level"
        value={Math.min(value, 100)}
        tone={STOCK_TONE(value)}
        showValue={false}
      />
    ),
    filter: { type: 'number' },
  }),
  column.accessor('status', {
    header: 'Status',
    size: 120,
    cell: ({ value }) => (
      <CellBadge tone={value === 'live' ? 'success' : value === 'draft' ? 'neutral' : 'warning'}>
        {value[0]!.toUpperCase() + value.slice(1)}
      </CellBadge>
    ),
    filter: {
      type: 'select',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  }),
]

export function EcommerceTable() {
  return (
    <DataTable
      data={products}
      columns={productColumns}
      label="Product catalogue"
      getRowId={(row) => row.id}
      enableRowSelection
      pageSize={10}
      features={{ resizing: { enabled: true }, pinning: { enabled: true } }}
      defaultSorting={[{ id: 'name', desc: false }]}
      rowActions={(row) => [
        { icon: EyeIcon, label: `View ${row.original.name}`, onClick: () => {} },
        { icon: PencilIcon, label: `Edit ${row.original.name}`, onClick: () => {} },
        {
          icon: TrashIcon,
          label: `Archive ${row.original.name}`,
          destructive: true,
          onClick: () => {},
        },
      ]}
    />
  )
}

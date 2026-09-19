import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  CalendarIcon,
  CellBadge,
  CellDate,
  CellLink,
  CellNumber,
  CellPerson,
  CellProgress,
  CellStack,
  CellText,
  CopyIcon,
  DataTable,
  Empty,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  RowActions,
  StatusBadge,
  StatusRegistryProvider,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  TrashIcon,
  createColumnHelper,
  type BadgeProps,
  type ColumnDef,
  type RowActionSpec,
} from '@shining-technologies/ui'
import {
  applyQuery,
  type DataTableQuery,
  type Density,
  type ResponsiveMode,
  type TableSurface,
  type TableVariant,
} from '@shining-technologies/ui/core'
import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'
import { INVOICES, PEOPLE, STATUS_REGISTRY, WORK_ORDER_STATUSES } from '../data'
import { Demo } from './Demo'

const LOCALE = 'en-AU'
const TIME_ZONE = 'Australia/Sydney'

/* ------------------------------------------------------------ work orders */

type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES

interface WorkOrder {
  id: string
  customer: string
  suburb: string
  technician: string
  role: string
  status: WorkOrderStatus
  /** A calendar day, `yyyy-mm-dd`: it shows and filters as that day in every zone. */
  scheduled: string
  value: number
  progress: number
}

const CUSTOMERS = [
  'Harbourside Property',
  'Rosewood Estates',
  'Kingsley Group',
  'Northline Facilities',
  'Bayview Strata',
  'Cedar & Stone',
  'Meridian Health',
  'Oakridge Schools',
  'Greenway Council',
]
const SUBURBS = ['Parramatta', 'Chatswood', 'Surry Hills', 'Newtown', 'Manly', 'Penrith', 'Ryde']
const STATUS_KEYS = Object.keys(WORK_ORDER_STATUSES) as WorkOrderStatus[]
const DAY = 86_400_000

function progressFor(status: WorkOrderStatus, i: number): number {
  switch (status) {
    case 'requested':
    case 'cancelled':
      return 0
    case 'scheduled':
      return 10
    case 'in_progress':
      return 30 + ((i * 13) % 60)
    case 'on_hold':
      return 20 + ((i * 11) % 40)
    default:
      return 100
  }
}

/** Generated, but deterministic — the same rows on every reload. */
function makeWorkOrders(count: number): WorkOrder[] {
  const start = Date.UTC(2026, 6, 1)
  return Array.from({ length: count }, (_, i) => {
    const status = STATUS_KEYS[(i * 5 + 3) % STATUS_KEYS.length]!
    const person = PEOPLE[(i * 3) % PEOPLE.length]!
    return {
      id: `WO-${4100 + i}`,
      customer: CUSTOMERS[(i * 7) % CUSTOMERS.length]!,
      suburb: SUBURBS[i % SUBURBS.length]!,
      technician: person.name,
      role: person.role,
      status,
      scheduled: new Date(start + ((i * 17) % 92) * DAY).toISOString().slice(0, 10),
      value: 180 + ((i * 7919) % 9400),
      progress: progressFor(status, i),
    }
  })
}

const WORK_ORDERS = makeWorkOrders(40)

const workOrderColumns: ColumnDef<WorkOrder>[] = [
  {
    accessorKey: 'id',
    header: 'Work order',
    size: 140,
    cell: ({ value, row }) => <CellStack secondary={row.original.suburb}>{value}</CellStack>,
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    size: 200,
    filter: { type: 'text' },
    cell: ({ value }) => <CellText>{value}</CellText>,
  },
  {
    accessorKey: 'technician',
    header: 'Technician',
    size: 210,
    filter: {
      type: 'select',
      options: PEOPLE.map((person) => ({ label: person.name, value: person.name })),
    },
    cell: ({ value, row }) => <CellPerson name={value} description={row.original.role} />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    filter: {
      type: 'multiSelect',
      options: STATUS_KEYS.map((key) => ({ label: WORK_ORDER_STATUSES[key].label, value: key })),
    },
    cell: ({ value }) => <StatusBadge status={value} statuses={WORK_ORDER_STATUSES} size="sm" />,
  },
  {
    accessorKey: 'scheduled',
    header: 'Scheduled',
    size: 130,
    sortingFn: 'datetime',
    filter: { type: 'date' },
    cell: ({ value }) => <CellDate value={value} />,
  },
  {
    accessorKey: 'progress',
    header: 'Progress',
    size: 160,
    sortingFn: 'number',
    enableGlobalFilter: false,
    cell: ({ value, row }) => (
      <CellProgress
        value={value}
        label={`Progress for ${row.original.id}`}
        tone={
          row.original.status === 'on_hold'
            ? 'warning'
            : value === 100
              ? 'success'
              : 'accent'
        }
      />
    ),
  },
  {
    accessorKey: 'value',
    header: 'Value',
    size: 120,
    sortingFn: 'number',
    filter: { type: 'number' },
    meta: { align: 'right' },
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }} />
    ),
    // Totals the rows that survive the filters, not just the visible page.
    footer: ({ table }) => (
      <CellNumber
        value={table.getFilteredRowModel().rows.reduce((sum, row) => sum + row.original.value, 0)}
        options={{ style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }}
      />
    ),
  },
]

/** The lean set, for demos where the columns are not the point. */
const leanColumns: ColumnDef<WorkOrder>[] = workOrderColumns.filter((column) =>
  ['id', 'customer', 'status', 'scheduled', 'value'].includes(
    'accessorKey' in column ? String(column.accessorKey) : '',
  ),
)

function FullDataTable() {
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div className="stack-sm">
      <DataTable
        title="Work orders"
        description="Everything booked for the quarter. Cancelled orders stay listed but cannot be selected."
        data={WORK_ORDERS}
        columns={workOrderColumns}
        getRowId={(row) => row.id}
        locale={LOCALE}
        timeZone={TIME_ZONE}
        filterLayout="inline"
        pageSize={8}
        enableRowSelection
        isRowDisabled={(row) => row.status === 'cancelled'}
        defaultSorting={[{ id: 'scheduled', desc: false }]}
        renderExpandedRow={(row) => (
          <div className="grid-3">
            <div>
              <div className="muted">Site</div>
              {row.original.customer}, {row.original.suburb}
            </div>
            <div>
              <div className="muted">Assigned</div>
              {row.original.technician} · {row.original.role}
            </div>
            <div>
              <div className="muted">Status</div>
              {WORK_ORDER_STATUSES[row.original.status].label}, {row.original.progress}% done
            </div>
          </div>
        )}
        rowActions={(row): RowActionSpec[] => [
          { icon: EyeIcon, label: `View ${row.original.id}`, onClick: () => setLastAction(`View ${row.original.id}`) },
          { icon: PencilIcon, label: `Edit ${row.original.id}`, onClick: () => setLastAction(`Edit ${row.original.id}`) },
          {
            icon: TrashIcon,
            label: `Delete ${row.original.id}`,
            destructive: true,
            // Invoiced work cannot be deleted — hidden keeps the icon's slot, so the column stays aligned.
            hidden: row.original.status === 'invoiced',
            onClick: () => setLastAction(`Delete ${row.original.id}`),
          },
        ]}
      />
      <p className="muted">{lastAction ? `Last action: ${lastAction}` : 'Row actions report here.'}</p>
    </div>
  )
}

/* ---------------------------------------------------------- column layout */

const LAYOUT_KEY = 'gallery-column-layout'
const LAYOUT_SLICES = ['columnPinning', 'columnSizing', 'columnVisibility'] as const

/**
 * Pin, resize or hide a column, then reload the page: the table comes back as
 * it was left. Reset clears what the browser stored.
 */
function ColumnLayoutDemo() {
  const [generation, setGeneration] = useState(0)
  const reset = () => {
    for (const slice of LAYOUT_SLICES) {
      window.localStorage.removeItem(`sui-data-table:${LAYOUT_KEY}:${slice}`)
    }
    setGeneration((value) => value + 1)
  }

  return (
    <div className="stack-sm">
      <DataTable
        key={generation}
        title="Work orders"
        description="Drag a header's right edge to resize. Pin or hide from the ⋮ menu."
        data={WORK_ORDERS}
        columns={leanColumns}
        getRowId={(row) => row.id}
        locale={LOCALE}
        timeZone={TIME_ZONE}
        pageSize={5}
        features={{ resizing: { enabled: true }, pinning: { enabled: true } }}
        persist={{ key: LAYOUT_KEY, state: LAYOUT_SLICES }}
        headingActions={
          <Button size="sm" variant="outline" onClick={reset}>
            Reset layout
          </Button>
        }
      />
    </div>
  )
}

/* --------------------------------------------------------- inline filters */

type FrameWidth = 'full' | 'tablet' | 'phone'
const FRAME_WIDTHS: FrameWidth[] = ['full', 'tablet', 'phone']

function InlineFiltersDemo() {
  const [width, setWidth] = useState<FrameWidth>('full')

  return (
    <div className="stack-sm">
      <Choice label="Width" options={FRAME_WIDTHS} value={width} onChange={setWidth} />
      <div className="width-frame" data-width={width}>
        <DataTable
          label="Work orders with inline filters"
          data={WORK_ORDERS}
          columns={workOrderColumns}
          getRowId={(row) => row.id}
          locale={LOCALE}
          timeZone={TIME_ZONE}
          filterLayout="inline"
          // Measured by its own width, so the frame above drives the layout.
          responsiveMode="auto"
          pageSize={5}
          showFooter={false}
          defaultColumnFilters={[
            { id: 'status', value: { operator: 'includes', value: ['scheduled', 'in_progress'] } },
          ]}
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- products */

type Category = 'Filters' | 'Pumps' | 'Valves' | 'Sensors'

interface Product {
  sku: string
  name: string
  category: Category
  price: number
  cost: number
  stock: number
  capacity: number
  reorderAt: number
  supplier: string
}

const PRODUCTS: Product[] = [
  { sku: 'FLT-100', name: 'Cartridge filter 100µm', category: 'Filters', price: 48, cost: 21, stock: 140, capacity: 200, reorderAt: 40, supplier: 'Aquaflo' },
  { sku: 'FLT-250', name: 'Sand filter media 25kg', category: 'Filters', price: 36, cost: 22, stock: 18, capacity: 120, reorderAt: 30, supplier: 'Aquaflo' },
  { sku: 'PMP-075', name: 'Circulation pump 0.75kW', category: 'Pumps', price: 689, cost: 402, stock: 12, capacity: 30, reorderAt: 6, supplier: 'Davey' },
  { sku: 'PMP-150', name: 'Booster pump 1.5kW', category: 'Pumps', price: 1149, cost: 811, stock: 4, capacity: 20, reorderAt: 5, supplier: 'Davey' },
  { sku: 'VLV-032', name: 'Ball valve 32mm', category: 'Valves', price: 29, cost: 9, stock: 310, capacity: 400, reorderAt: 80, supplier: 'Reliance' },
  { sku: 'VLV-050', name: 'Check valve 50mm', category: 'Valves', price: 74, cost: 38, stock: 66, capacity: 150, reorderAt: 40, supplier: 'Reliance' },
  { sku: 'VLV-TMV', name: 'Thermostatic mixing valve', category: 'Valves', price: 219, cost: 131, stock: 27, capacity: 60, reorderAt: 15, supplier: 'Enware' },
  { sku: 'SNS-PH1', name: 'pH probe', category: 'Sensors', price: 159, cost: 61, stock: 35, capacity: 80, reorderAt: 20, supplier: 'Hanna' },
  { sku: 'SNS-FLW', name: 'Flow sensor 25mm', category: 'Sensors', price: 98, cost: 57, stock: 9, capacity: 60, reorderAt: 12, supplier: 'Hanna' },
  { sku: 'SNS-PRS', name: 'Pressure transducer', category: 'Sensors', price: 245, cost: 118, stock: 22, capacity: 40, reorderAt: 10, supplier: 'Wika' },
]

const CATEGORY_TONE: Record<Category, BadgeProps['tone']> = {
  Filters: 'info',
  Pumps: 'primary',
  Valves: 'neutral',
  Sensors: 'success',
}

const product = createColumnHelper<Product>()

const productColumns = [
  product.accessor('name', {
    header: 'Product',
    size: 240,
    defaultPinned: 'left',
    cell: ({ value, row }) => <CellStack secondary={row.original.sku}>{value}</CellStack>,
  }),
  product.accessor('category', {
    header: 'Category',
    size: 120,
    filter: {
      type: 'select',
      options: (Object.keys(CATEGORY_TONE) as Category[]).map((c) => ({ label: c, value: c })),
    },
    cell: ({ value }) => <CellBadge tone={CATEGORY_TONE[value]}>{value}</CellBadge>,
  }),
  product.accessor('price', {
    header: 'Price',
    size: 110,
    sortingFn: 'number',
    meta: { align: 'right' },
    cell: ({ value }) => <CellNumber value={value} options={{ style: 'currency', currency: 'AUD' }} />,
  }),
  // `computed` keeps the derived value typed: `value` below is a number, not unknown.
  product.computed('margin', (row) => (row.price - row.cost) / row.price, {
    header: 'Margin',
    size: 100,
    sortingFn: 'number',
    meta: { align: 'right' },
    cell: ({ value }) => (
      <CellNumber value={value} options={{ style: 'percent', maximumFractionDigits: 1 }} />
    ),
  }),
  product.accessor('stock', {
    header: 'Stock',
    size: 170,
    sortingFn: 'number',
    cell: ({ value, row }) => (
      <CellProgress
        value={value}
        max={row.original.capacity}
        label={`Stock of ${row.original.name}`}
        tone={value <= row.original.reorderAt ? 'danger' : 'accent'}
      />
    ),
  }),
  product.accessor('supplier', {
    header: 'Supplier',
    size: 130,
    cell: ({ value }) => (
      <CellLink href={`https://example.com/suppliers/${value.toLowerCase()}`} external>
        {value}
      </CellLink>
    ),
  }),
]

/* ---------------------------------------------------------- appearance */

const VARIANTS: TableVariant[] = ['default', 'minimal', 'compact', 'borderless', 'striped', 'dashboard']
const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious']
const RESPONSIVE: ResponsiveMode[] = ['scroll', 'cards', 'auto']
const SURFACES: TableSurface[] = ['card', 'plain']

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="choice">
      <span className="muted">{label}</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        aria-label={label}
        value={value}
        // Radix reports '' when the pressed item is clicked again; keep the current choice.
        onValueChange={(next) => {
          if (next) onChange(next as T)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option}>
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function AppearanceDemo() {
  const [variant, setVariant] = useState<TableVariant>('default')
  const [density, setDensity] = useState<Density>('comfortable')
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>('auto')
  const [surface, setSurface] = useState<TableSurface>('card')

  return (
    <div className="stack-sm">
      <div className="stack-sm">
        <Choice label="Variant" options={VARIANTS} value={variant} onChange={setVariant} />
        <Choice label="Density" options={DENSITIES} value={density} onChange={setDensity} />
        <Choice label="Responsive" options={RESPONSIVE} value={responsiveMode} onChange={setResponsiveMode} />
        <Choice label="Surface" options={SURFACES} value={surface} onChange={setSurface} />
      </div>
      <DataTable
        label="Appearance preview"
        data={WORK_ORDERS}
        columns={leanColumns}
        getRowId={(row) => row.id}
        locale={LOCALE}
        timeZone={TIME_ZONE}
        pageSize={5}
        variant={variant}
        density={density}
        responsiveMode={responsiveMode}
        surface={surface}
      />
    </div>
  )
}

/* ------------------------------------------------------------- states */

function StatesDemo() {
  const [attempts, setAttempts] = useState(0)

  return (
    <Tabs defaultValue="loading" appearance="underline">
      <TabsList>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
      </TabsList>
      <TabsContent value="loading">
        <DataTable
          label="Loading work orders"
          data={WORK_ORDERS.slice(0, 4)}
          columns={leanColumns}
          locale={LOCALE}
          loading
          loadingRowCount={4}
        />
      </TabsContent>
      <TabsContent value="empty">
        <div className="grid-2">
          <DataTable
            label="No work orders"
            data={[]}
            columns={leanColumns}
            locale={LOCALE}
            emptyState={
              <Empty
                icon={<CalendarIcon />}
                title="No work orders this week"
                description="Nothing is booked between Monday and Sunday. New bookings show up here as soon as they are scheduled."
                actions={
                  <Button size="sm">
                    <PlusIcon aria-hidden="true" />
                    New work order
                  </Button>
                }
              />
            }
          />
          <DataTable
            label="Work orders, default empty state"
            data={[]}
            columns={leanColumns}
            locale={LOCALE}
          />
        </div>
      </TabsContent>
      <TabsContent value="error">
        <div className="stack-sm">
          <DataTable
            label="Work orders that failed to load"
            data={[]}
            columns={leanColumns}
            locale={LOCALE}
            error={new Error('The work-order service did not respond.')}
            onRetry={() => setAttempts((n) => n + 1)}
          />
          <p className="muted">Retry pressed {attempts} {attempts === 1 ? 'time' : 'times'}.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

/* -------------------------------------------------------------- server */

const SERVER_ROWS = makeWorkOrders(240)
const INITIAL_QUERY: DataTableQuery = {
  pageIndex: 0,
  pageSize: 8,
  sorting: [],
  columnFilters: [],
  globalFilter: '',
}

function ServerModeDemo() {
  const [query, setQuery] = useState<DataTableQuery>(INITIAL_QUERY)
  const [page, setPage] = useState(() =>
    applyQuery(SERVER_ROWS, INITIAL_QUERY, { columns: leanColumns, locale: LOCALE, timeZone: TIME_ZONE }),
  )
  const [loading, setLoading] = useState(false)

  // A stand-in for a fetch: the same `applyQuery` a route handler would run, after a delay.
  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => {
      setPage(applyQuery(SERVER_ROWS, query, { columns: leanColumns, locale: LOCALE, timeZone: TIME_ZONE }))
      setLoading(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  return (
    <div className="stack-sm">
      <DataTable
        title="240 work orders, one page at a time"
        mode="server"
        data={page.rows}
        rowCount={page.total}
        columns={leanColumns}
        getRowId={(row) => row.id}
        locale={LOCALE}
        timeZone={TIME_ZONE}
        pageSize={INITIAL_QUERY.pageSize}
        loading={loading}
        // The footer total would only cover the page the server sent.
        showFooter={false}
        onQueryChange={setQuery}
      />
      <pre className="code-block">{JSON.stringify(query, null, 2)}</pre>
    </div>
  )
}

/* ---------------------------------------------------------- virtualized */

function VirtualizedDemo() {
  const rows = useMemo(() => makeWorkOrders(5000), [])
  return (
    <VirtualizedDataTable
      title="5,000 work orders"
      data={rows}
      columns={leanColumns}
      getRowId={(row) => row.id}
      locale={LOCALE}
      timeZone={TIME_ZONE}
      maxHeight={420}
    />
  )
}

/* ------------------------------------------------------------------ page */

const INVOICE_TOTAL = INVOICES.reduce((sum, invoice) => sum + invoice.amount, 0)

export function Tables() {
  return (
    <div className="stack">
      <Demo
        title="Data table"
        note="Search, inline filters, sorting, selection, expandable rows and icon row actions from one component. Dates are calendar days, so a row shows and filters as the same day in every time zone; the footer totals the filtered rows, not just this page."
        inline={false}
      >
        <FullDataTable />
      </Demo>

      <Demo
        title="Inline filters"
        note="The search box and the filters share one line and wrap control by control as space runs out; Clear filters follows the last filter. Every option list — Technician, Status — shows a checkbox that ticks when picked, and every panel ends with the same foot: its state on the left, Clear on the right. Switch the width to see the toolbar at tablet and phone sizes."
        inline={false}
      >
        <InlineFiltersDemo />
      </Demo>

      <Demo
        title="Column helper and the cell toolkit"
        note="createColumnHelper keeps computed columns typed — the margin cell receives a number, not unknown. The product column is pinned, and a row with many actions falls back to a ⋮ menu."
        inline={false}
      >
        <DataTable
          title="Parts catalogue"
          data={PRODUCTS}
          columns={productColumns}
          getRowId={(row) => row.sku}
          locale={LOCALE}
          variant="striped"
          density="compact"
          features={{ pagination: { enabled: false }, resizing: { enabled: true } }}
          rowActionsHeader={false}
          rowActionsWidth={64}
          rowActions={(row) => (
            <RowActions
              label={`Actions for ${row.original.name}`}
              items={[
                { label: 'Edit', icon: <PencilIcon />, onSelect: () => {} },
                { label: 'Duplicate', icon: <CopyIcon />, onSelect: () => {} },
                { label: 'Archive', icon: <TrashIcon />, onSelect: () => {}, destructive: true, separatorBefore: true },
              ]}
            />
          )}
        />
      </Demo>

      <Demo
        title="Column layout"
        note="Resizing never re-renders the table: the drag rewrites the column widths on the table element each frame and commits once on release, so the edge stays under the pointer even while the table is stretched to fill its frame. Every table remembers pinned columns in the browser by default; this one also remembers widths and hidden columns. Pin, resize or hide, then reload."
        inline={false}
      >
        <ColumnLayoutDemo />
      </Demo>

      <Demo
        title="Appearance"
        note="Every one of these switches is rhythm or chrome. None of them changes what the table does."
        inline={false}
      >
        <AppearanceDemo />
      </Demo>

      <Demo
        title="Loading, empty and error"
        note="Each state takes the body's place inside the same frame, so the page does not jump when the data arrives."
        inline={false}
      >
        <StatesDemo />
      </Demo>

      <Demo
        title="Server mode"
        note="The table renders what it is given and reports a query. Here applyQuery from /core answers it — the same predicates and comparators the client-side table uses — so a server gets exactly the rows the browser would have shown."
        inline={false}
      >
        <ServerModeDemo />
      </Demo>

      <Demo
        title="Virtualized"
        note="Thousands of rows without pagination. Only the rows in view are rendered; spacer rows carry the scroll height, so the column grid stays a real table."
        inline={false}
      >
        <VirtualizedDemo />
      </Demo>

      <Demo
        title="Plain table"
        note="For a fixed handful of rows, where sorting and filtering would be ceremony. Same tokens as the data table, so the two sit on one page as one thing. Status words come from the application's registry, not the library."
        inline={false}
      >
        <StatusRegistryProvider registry={STATUS_REGISTRY}>
          <Table striped>
            <TableCaption>Invoices due this month</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="end">Amount</TableHead>
                <TableHead align="end">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell>
                    <StatusBadge type="invoice" status={invoice.status} size="sm" />
                  </TableCell>
                  <TableCell numeric>${invoice.amount.toLocaleString('en-AU')}</TableCell>
                  <TableCell align="end">{invoice.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell numeric>${INVOICE_TOTAL.toLocaleString('en-AU')}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </StatusRegistryProvider>
      </Demo>
    </div>
  )
}

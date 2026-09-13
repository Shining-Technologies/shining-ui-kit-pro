import './column-meta'
import { useMemo, useState } from 'react'
import {
  Button,
  ColorModeToggle,
  Combobox,
  DataTable,
  DateField,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PencilIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToastProvider,
  Toaster,
  TrashIcon,
  useToast,
  type ColumnDef,
  type RowActionSpec,
} from '@shining-technologies/ui'
import { TrendChart, DonutChart } from '@shining-technologies/ui/charts'
import { VirtualizedDataTable } from '@shining-technologies/ui/virtualized'
import { downloadTableCsv, tableToCsv } from '@shining-technologies/ui/csv'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'refunded'

export interface Order {
  id: string
  customer: string
  status: OrderStatus
  total: number
  placedAt: string
}

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'refunded']

function makeOrders(count: number): Order[] {
  const start = Date.UTC(2026, 0, 1)
  return Array.from({ length: count }, (_, i) => ({
    id: `ord-${i + 1}`,
    customer: `Customer ${i + 1}`,
    status: STATUSES[i % STATUSES.length]!,
    total: (i * 37) % 1000,
    placedAt: new Date(start + i * 86_400_000).toISOString(),
  }))
}

const orderColumns: ColumnDef<Order>[] = [
  { accessorKey: 'customer', header: 'Customer', filter: { type: 'text' } },
  {
    accessorKey: 'status',
    header: 'Status',
    filter: {
      type: 'multiSelect',
      options: STATUSES.map((s) => ({ label: s[0]!.toUpperCase() + s.slice(1), value: s })),
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    sortingFn: 'number',
    filter: { type: 'number' },
    meta: { currency: 'AUD', align: 'right' },
    cell: ({ value, meta, column }) => {
      const currency = meta?.currency ?? column.columnDef.meta?.currency ?? 'AUD'
      return (
        <span data-testid="total-cell" data-value={value}>
          {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(value)}
        </span>
      )
    },
  },
  { accessorKey: 'placedAt', header: 'Placed', filter: { type: 'date' } },
]

const bigColumns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'total', header: 'Total', sortingFn: 'number' },
]

const trendData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
  month,
  revenue: 1000 + i * 250,
  cost: 800 + i * 120,
}))

function ToastButton() {
  const { toast } = useToast()
  return <Button onClick={() => toast({ title: 'Saved', tone: 'success' })}>Show toast</Button>
}

export function App() {
  const orders = useMemo(() => makeOrders(300), [])
  const bigRows = useMemo(() => makeOrders(5000), [])
  const [csvLines, setCsvLines] = useState<number | null>(null)
  const [fruit, setFruit] = useState<string>('')
  const [country, setCountry] = useState<string | null>(null)
  const [date, setDate] = useState<string | undefined>(undefined)

  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
        <header className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Shining UI V2 in Vite</h1>
          <p data-testid="tw-muted" className="text-muted-foreground">
            muted text
          </p>
          <ColorModeToggle defaultMode="light" data-testid="color-toggle" />
        </header>

        <section className="flex flex-wrap items-center gap-4" aria-label="Tailwind overrides">
          <Button data-testid="btn-default">Default</Button>
          <Button data-testid="btn-red" className="bg-red-600">
            Red
          </Button>
          <div data-testid="ref-red" className="bg-red-600 h-6 w-6" />
          <div data-testid="tw-primary" className="bg-primary h-6 w-6" />
        </section>

        <section className="flex flex-wrap items-center gap-4" aria-label="Overlays and fields">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Test dialog</DialogTitle>
              <DialogDescription>Dialog body</DialogDescription>
              <DialogClose asChild>
                <Button>Close dialog</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit item</DropdownMenuItem>
              <DropdownMenuItem destructive>Delete item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={fruit} onValueChange={setFruit}>
            <SelectTrigger aria-label="Fruit" className="w-40">
              <SelectValue placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectContent>
          </Select>
          <output data-testid="fruit-value">{fruit}</output>

          <Combobox
            aria-label="Country"
            placeholder="Pick a country"
            value={country}
            onValueChange={setCountry}
            options={[
              { value: 'au', label: 'Australia' },
              { value: 'nz', label: 'New Zealand' },
            ]}
          />
          <output data-testid="country-value">{country ?? ''}</output>

          <DateField label="Start date" value={date} onChange={setDate} locale="en-AU" />
          <output data-testid="date-value">{date ?? ''}</output>

          <ToastButton />
        </section>

        <section aria-label="Orders">
          <DataTable
            title="Orders"
            data={orders}
            columns={orderColumns}
            getRowId={(row) => row.id}
            locale="en-AU"
            timeZone="Australia/Sydney"
            filterLayout="inline"
            enableRowSelection
            pageSize={10}
            renderExpandedRow={(row) => (
              <div data-testid="expanded-content">Details for {row.original.customer}</div>
            )}
            rowActions={(row): RowActionSpec[] => [
              { icon: PencilIcon, label: `Edit ${row.original.id}`, onClick: () => {} },
              { icon: TrashIcon, label: `Delete ${row.original.id}`, destructive: true },
            ]}
            slots={{
              toolbarActions: ({ table }) => (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvLines(tableToCsv(table, { bom: false }).trim().split(/\r?\n/).length)
                    downloadTableCsv(table, { filename: 'orders.csv' })
                  }}
                >
                  CSV
                </Button>
              ),
            }}
          />
          <output data-testid="csv-lines">{csvLines ?? ''}</output>
        </section>

        <section className="grid gap-6 md:grid-cols-2" aria-label="Charts">
          <div data-testid="trend-chart">
            <TrendChart title="Revenue" data={trendData} xKey="month" series={[{ key: 'revenue', label: 'Revenue' }, { key: 'cost', label: 'Cost' }]} />
          </div>
          <div data-testid="donut-chart">
            <DonutChart
              title="Status mix"
              data={STATUSES.map((s, i) => ({ key: s, label: s, value: 10 + i * 5 }))}
            />
          </div>
        </section>

        <section data-testid="virtualized" aria-label="Virtualized">
          <VirtualizedDataTable
            title="5,000 rows"
            data={bigRows}
            columns={bigColumns}
            getRowId={(row) => row.id}
            maxHeight={400}
            locale="en-AU"
            features={{ pagination: { enabled: false } }}
          />
        </section>
      </main>
      <Toaster />
    </ToastProvider>
  )
}

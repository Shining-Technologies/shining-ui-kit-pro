import {
  AnalyticsTable,
  CrmTable,
  EcommerceTable,
  OrdersTable,
  UserManagementTable,
} from '@shining-technologies/ui-kit-examples'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
  StatusRegistryProvider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shining-technologies/ui-kit-react'
import { INVOICES, STATUS_REGISTRY } from '../data'
import { Playground } from '../Playground'
import { QuickStart } from '../QuickStart'
import { Demo } from './Demo'

const EXAMPLES = [
  {
    value: 'users',
    label: 'Users',
    title: 'User management',
    description:
      'Person cells, status badges, selection, expandable detail rows, row action icons and a card layout on small screens.',
    render: () => <UserManagementTable />,
  },
  {
    value: 'ecommerce',
    label: 'Products',
    title: 'E-commerce',
    description:
      'A computed margin column with an inferred value type, currency formatting, a stock meter, pinned columns and column resizing.',
    render: () => <EcommerceTable />,
  },
  {
    value: 'orders',
    label: 'Orders',
    title: 'Orders',
    description:
      'Compact and striped, two independent status columns, and a footer that totals the filtered rows.',
    render: () => <OrdersTable />,
  },
  {
    value: 'crm',
    label: 'Pipeline',
    title: 'CRM pipeline',
    description: 'Grouped headers, a probability meter, and a row class that dims lost deals.',
    render: () => <CrmTable />,
  },
  {
    value: 'analytics',
    label: 'Analytics',
    title: 'Analytics',
    description: 'Numeric alignment, sparkline-style deltas and server-shaped totals.',
    render: () => <AnalyticsTable />,
  },
]

export function Tables() {
  return (
    <div className="stack">
      <Demo
        title="Quick start"
        note="Two props in, a finished table out — and it is painted from the same tokens as every other component."
        inline={false}
      >
        <QuickStart />
      </Demo>

      <Demo title="Examples" inline={false}>
        <Tabs defaultValue="users" appearance="underline">
          <TabsList>
            {EXAMPLES.map((example) => (
              <TabsTrigger key={example.value} value={example.value}>
                {example.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {EXAMPLES.map((example) => (
            <TabsContent key={example.value} value={example.value}>
              <Card>
                <CardHeader>
                  <CardTitle>{example.title}</CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent>{example.render()}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </Demo>

      <StatusRegistryProvider registry={STATUS_REGISTRY}>
        <Demo
          title="Plain table"
          note="For a fixed handful of rows. Same tokens as the data table, so the two sit on one page as one thing."
          inline={false}
        >
          <Table striped>
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
                  <TableCell numeric>${invoice.amount.toLocaleString()}</TableCell>
                  <TableCell align="end">{invoice.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Demo>
      </StatusRegistryProvider>

      <Demo
        title="Playground"
        note="Every appearance knob, live. None of these switches touch behaviour."
        inline={false}
      >
        <Playground />
      </Demo>
    </div>
  )
}

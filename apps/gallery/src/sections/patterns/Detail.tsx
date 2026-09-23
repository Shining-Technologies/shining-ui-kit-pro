import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  MailIcon,
  MetricGrid,
  MetricTile,
  MoreIcon,
  PageHeader,
  PencilIcon,
  StatusBadge,
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
  Timeline,
  TimelineItem,
  UserAvatar,
} from '@shining-technologies/ui'
import { Demo } from '../Demo'

const INVOICES = [
  { id: 'INV-2041', date: 'Sep 12, 2026', amount: '$4,280.00', status: 'paid' },
  { id: 'INV-1987', date: 'Aug 12, 2026', amount: '$4,280.00', status: 'paid' },
  { id: 'INV-1930', date: 'Jul 12, 2026', amount: '$3,960.00', status: 'overdue' },
]

const INVOICE_STATUSES = {
  paid: { label: 'Paid', tone: 'success' as const },
  overdue: { label: 'Overdue', tone: 'destructive' as const },
}

function DetailPage() {
  return (
    <div className="pattern-frame stack">
      <PageHeader
        as="h2"
        eyebrow={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#pattern-crud">Customers</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Northwind Traders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={
          <span className="pattern-title">
            Northwind Traders
            <StatusBadge status="active" statuses={{ active: { label: 'Active', tone: 'success' } }} />
          </span>
        }
        description="Team plan · 24 seats · customer since March 2024"
        actions={
          <>
            <Button variant="outline">
              <MailIcon />
              Email
            </Button>
            <Button>
              <PencilIcon />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions for Northwind Traders">
                  <MoreIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Change plan</DropdownMenuItem>
                <DropdownMenuItem>Export data</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>Close account</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <MetricGrid columns={4}>
        <MetricTile label="Monthly revenue" value="$4,280" delta="+8%" trend="up" hint="vs last month" />
        <MetricTile label="Seats used" value="22 / 24" hint="2 invitations pending" />
        <MetricTile label="Open tickets" value="3" delta="−2" trend="up" />
        <MetricTile label="Balance due" value="$3,960" hint="1 invoice overdue" />
      </MetricGrid>

      <Tabs defaultValue="activity" appearance="underline">
        <TabsList aria-label="Customer sections">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardContent>
              <Timeline aria-label="Northwind Traders activity">
                <TimelineItem
                  icon={<CheckIcon />}
                  tone="success"
                  title="Invoice INV-2041 paid"
                  time="Sep 12, 10:04"
                  dateTime="2026-09-12T10:04"
                />
                <TimelineItem
                  icon={<UserAvatar name="Priya Raman" size="sm" />}
                  title="Priya Raman added 4 seats"
                  time="Sep 3, 14:20"
                  dateTime="2026-09-03T14:20"
                >
                  “Onboarding the new depot team.”
                </TimelineItem>
                <TimelineItem
                  tone="warning"
                  title="Invoice INV-1930 overdue"
                  time="Aug 11"
                  dateTime="2026-08-11"
                />
              </Timeline>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pattern-num">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} statuses={INVOICE_STATUSES} />
                    </TableCell>
                    <TableCell className="pattern-num">{invoice.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="grid-2">
            {[
              ['Priya Raman', 'Operations lead · owner'],
              ['Tom Whitfield', 'Finance · billing contact'],
            ].map(([name, role]) => (
              <Card key={name}>
                <CardHeader>
                  <div className="pattern-person">
                    <UserAvatar name={name!} />
                    <div>
                      <CardTitle as="h3">{name}</CardTitle>
                      <p className="muted">{role}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function DetailPattern() {
  return (
    <div className="stack">
      <Demo
        title="Customer detail"
        note="Breadcrumb in the header's eyebrow; the status beside the title; one primary action, a secondary and the rest in a menu; the headline figures; then tabs for activity, related records and people."
        inline={false}
        code={`
<PageHeader
  eyebrow={<Breadcrumb>…</Breadcrumb>}
  title={<>Northwind Traders <StatusBadge status="active" /></>}
  actions={<><Button variant="outline">Email</Button><Button>Edit</Button><DropdownMenu>…</DropdownMenu></>}
/>
<MetricGrid columns={4}>…</MetricGrid>
<Tabs defaultValue="activity" appearance="underline">
  <TabsList aria-label="Customer sections">…</TabsList>
  <TabsContent value="activity"><Timeline>…</Timeline></TabsContent>
  <TabsContent value="invoices"><Table>…</Table></TabsContent>
</Tabs>`}
      >
        <DetailPage />
      </Demo>
    </div>
  )
}

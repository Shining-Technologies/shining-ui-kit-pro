import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Pagination,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shining-technologies/ui-kit-react'
import { useState } from 'react'
import { Demo } from './Demo'

export function Navigation() {
  const [page, setPage] = useState(4)

  return (
    <div className="stack">
      <Demo title="Breadcrumb" inline={false}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Jobs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>JOB-4812</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Demo>

      <Demo
        title="Tabs — pills"
        note="A control: filters or views of the same thing."
        inline={false}
      >
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="progress">In progress</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
            <TabsTrigger value="archive" disabled>
              Archive
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <Card variant="flat">
              <CardContent>18 jobs scheduled in the next seven days.</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="progress">
            <Card variant="flat">
              <CardContent>4 crews are on site now.</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="done">
            <Card variant="flat">
              <CardContent>612 jobs completed this quarter.</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Demo>

      <Demo title="Tabs — underline" note="Navigation: sections of a page." inline={false}>
        <Tabs defaultValue="details" appearance="underline">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <p className="muted">
              The active tab is marked with a two-pixel rule; the inactive ones carry a transparent
              rule of the same width, so switching does not shift the labels.
            </p>
          </TabsContent>
          <TabsContent value="history">
            <p className="muted">Twelve status changes since the job was created.</p>
          </TabsContent>
          <TabsContent value="billing">
            <p className="muted">Invoice INV-2291, paid 4 March.</p>
          </TabsContent>
        </Tabs>
      </Demo>

      <Demo title="Accordion" inline={false}>
        <div className="grid-2">
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a">
              <AccordionTrigger>What does a deep clean include?</AccordionTrigger>
              <AccordionContent>
                Everything in a regular clean, plus oven interiors, window tracks, skirting boards
                and inside all cupboards.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Can I reschedule?</AccordionTrigger>
              <AccordionContent>Up to 24 hours before the booking, at no charge.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Do I need to be home?</AccordionTrigger>
              <AccordionContent>No — leave access instructions on the booking.</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="multiple" appearance="separated" defaultValue={['x']}>
            <AccordionItem value="x">
              <AccordionTrigger>Separated</AccordionTrigger>
              <AccordionContent>
                Each item gets its own card instead of a shared rule.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="y">
              <AccordionTrigger>Multiple</AccordionTrigger>
              <AccordionContent>More than one panel can be open at a time.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Demo>

      <Demo title="Collapsible" inline={false}>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Advanced options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card variant="flat" style={{ marginTop: '0.75rem' }}>
              <CardContent>Retry policy, webhook URL and idempotency key.</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </Demo>

      <Demo
        title="Pagination"
        note="Always the same number of slots, so the control never changes width."
        inline={false}
      >
        <Pagination page={page} pageCount={24} onPageChange={setPage} />
      </Demo>
    </div>
  )
}

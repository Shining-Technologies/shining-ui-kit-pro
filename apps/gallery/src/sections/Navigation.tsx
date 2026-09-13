import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  ChevronDownIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  InboxIcon,
  Pagination,
  SectionTabs,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from './Demo'

const JOB_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks', count: 12 },
  { id: 'invoices', label: 'Invoices', count: 3 },
  { id: 'files', label: 'Files' },
  { id: 'audit', label: 'Audit log', disabled: true },
]

const INBOX_FILTERS = [
  { id: 'open', label: 'Open', count: 14, icon: <InboxIcon /> },
  { id: 'waiting', label: 'Waiting', count: 9 },
  { id: 'resolved', label: 'Resolved', count: 61 },
]

export function Navigation() {
  const [page, setPage] = useState(4)
  const [shortPage, setShortPage] = useState(1)
  const [section, setSection] = useState('tasks')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <div className="stack">
      <Demo
        title="Breadcrumb"
        note="Markup only, so it renders as a Server Component. The current page is marked, not linked — it goes nowhere."
        inline={false}
      >
        <div className="stack-sm">
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

          <Breadcrumb aria-label="Breadcrumb (collapsed)">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Invoices</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>INV-2291</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
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
              The active tab is marked with a rule; the inactive ones carry a transparent rule of
              the same width, so switching does not shift the labels.
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

      <Demo
        title="Tabs — vertical"
        note="Radix switches the arrow keys to up and down when the orientation is vertical."
        inline={false}
      >
        <Tabs defaultValue="profile" orientation="vertical">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <p className="muted">Name, contact details and time zone.</p>
          </TabsContent>
          <TabsContent value="team">
            <p className="muted">Seven members across two crews.</p>
          </TabsContent>
          <TabsContent value="notifications">
            <p className="muted">Email for new jobs; SMS for escalations.</p>
          </TabsContent>
        </Tabs>
      </Demo>

      <Demo
        title="Section tabs"
        note="Not Tabs: these usually change the route, so they are buttons with aria-current rather than a tablist that promises panels it does not own."
        inline={false}
      >
        <div className="stack-sm">
          <SectionTabs
            aria-label="Job sections"
            tabs={JOB_SECTIONS}
            value={section}
            onValueChange={setSection}
          />
          <p className="muted">Current section: {section}</p>
        </div>
      </Demo>

      <Demo
        title="Section tabs — pills, fill"
        note="Pills read as a filter; fill stretches a short set across the row."
        inline={false}
      >
        <SectionTabs
          aria-label="Ticket filters"
          appearance="pills"
          fill
          tabs={INBOX_FILTERS}
          defaultValue="open"
        />
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
              <AccordionContent>Each item gets its own card instead of a shared rule.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="y">
              <AccordionTrigger>Multiple</AccordionTrigger>
              <AccordionContent>More than one panel can be open at a time.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Demo>

      <Demo
        title="Collapsible"
        note="Unstyled Radix trigger — pass your own button with asChild."
        inline={false}
      >
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {advancedOpen ? 'Hide' : 'Show'} advanced options
              <ChevronDownIcon
                style={{ transform: advancedOpen ? 'rotate(180deg)' : undefined }}
              />
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
        note="Always the same number of slots, so the control never changes width. The window comes from getPageNumbers in core — the same one the data table uses."
        inline={false}
      >
        <div className="stack-sm">
          <Pagination page={page} pageCount={24} onPageChange={setPage} />
          <Pagination
            page={page}
            pageCount={24}
            onPageChange={setPage}
            siblings={2}
            labels={{ previous: 'Previous', next: 'Next', label: 'Results pages' }}
          />
          <Pagination
            page={shortPage}
            pageCount={3}
            onPageChange={setShortPage}
            labels={{ label: 'Short list pages' }}
          />
          <p className="muted">
            Page {page} of 24 · short list page {shortPage} of 3
          </p>
        </div>
      </Demo>
    </div>
  )
}

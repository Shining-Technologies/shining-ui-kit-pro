import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  CalendarIcon,
  ColumnsIcon,
  InboxIcon,
  LayoutIcon,
  ListIcon,
  Pagination,
  SectionTabs,
  SegmentedControl,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

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

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
]

const VIEWS = [
  { value: 'list', label: 'List', icon: <ListIcon /> },
  { value: 'board', label: 'Board', icon: <ColumnsIcon /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { value: 'timeline', label: 'Timeline', icon: <LayoutIcon />, disabled: true },
]

const JOBS_BY_PERIOD: Record<string, number> = { day: 6, week: 38, month: 164, quarter: 481 }

export function LinksAndTabs() {
  const [page, setPage] = useState(4)
  const [shortPage, setShortPage] = useState(1)
  const [section, setSection] = useState('tasks')
  const [period, setPeriod] = useState('week')

  return (
    <div className="stack">
      <Demo
        title="Breadcrumb"
        note="Markup only, so it renders as a Server Component. The current page is marked but not linked, because a link to the page you are on goes nowhere."
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
        note="A control, for filters or different views of the same thing."
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

      <Demo title="Tabs — underline" note="Navigation between sections of a page." inline={false}>
        <Tabs defaultValue="details" appearance="underline">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <p className="muted">
              The active tab is marked with a rule. The inactive ones have a transparent rule of the
              same width, so switching does not shift the labels.
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
        note="When the orientation is vertical, Radix moves between tabs with the up and down arrow keys."
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
        title="Segmented control"
        note="One choice out of a few, always visible. It is a radio group, so exactly one segment is selected and the arrow keys move the selection. It has no panels of its own: the page decides what the choice changes."
        inline={false}
      >
        <div className="stack-sm">
          <SegmentedControl
            aria-label="Period"
            options={PERIODS}
            value={period}
            onValueChange={setPeriod}
          />
          <p className="muted">
            {JOBS_BY_PERIOD[period]} jobs this {period}.
          </p>
        </div>
      </Demo>

      <Demo
        title="Segmented control — icons, small, icon-only"
        note="An icon-only segment takes its name from aria-label. A disabled segment is skipped by the arrow keys."
      >
        <SegmentedControl aria-label="View" options={VIEWS} defaultValue="board" />
        <SegmentedControl
          aria-label="Density"
          size="sm"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
          ]}
        />
        <SegmentedControl
          aria-label="Layout"
          size="sm"
          options={[
            { value: 'list', label: null, icon: <ListIcon />, 'aria-label': 'List' },
            { value: 'columns', label: null, icon: <ColumnsIcon />, 'aria-label': 'Columns' },
            { value: 'grid', label: null, icon: <LayoutIcon />, 'aria-label': 'Grid' },
          ]}
        />
      </Demo>

      <Demo
        title="Segmented control — fill"
        note="Stretches a two- or three-way choice across its container, for example in a form or a narrow panel."
        inline={false}
      >
        <div style={{ maxWidth: '26rem' }}>
          <SegmentedControl
            aria-label="Billing"
            fill
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly (save 20%)' },
            ]}
          />
        </div>
      </Demo>

      <Demo
        title="Section tabs"
        note="Not Tabs. These usually change the route, so they are buttons with aria-current rather than a tablist, which would promise panels it does not own."
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
        note="Pills read as a filter. fill stretches a short set across the row."
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

      <Demo
        title="Pagination"
        note="Always the same number of slots, so the control never changes width. The page window comes from getPageNumbers in core, the same function the data table uses."
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

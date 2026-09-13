import {
  AppShell,
  AppShellBottomNav,
  AppShellContent,
  AppShellHeader,
  Badge,
  BottomNavItem,
  Button,
  CalendarIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CreditCardIcon,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  FileIcon,
  GlobeIcon,
  InboxIcon,
  InfoIcon,
  Kbd,
  LayoutIcon,
  LinkIcon,
  ListIcon,
  MailIcon,
  PageHeader,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  ScrollToTop,
  SearchIcon,
  SectionTabs,
  Sidebar,
  SidebarBrand,
  SidebarMenuItem,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarTrigger,
  SidebarUser,
  SkipToContent,
  SlidersIcon,
  StatsCard,
  Switch,
  TagIcon,
  UserAvatar,
  getSidebarTrail,
  type SidebarNavEntry,
} from '@shining-technologies/ui'
import { useState, type MouseEvent, type ReactNode } from 'react'
import { PEOPLE } from '../data'
import { Demo } from './Demo'
import './Shell.css'

/* ------------------------------------------------------------------ glyphs */

/* The package ships the icons its own controls need; these few fill the gaps. */
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const glyph = {
  target: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Glyph>
  ),
  message: (
    <Glyph>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Glyph>
  ),
  briefcase: (
    <Glyph>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Glyph>
  ),
  home: (
    <Glyph>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 22V12h6v10" />
    </Glyph>
  ),
  building: (
    <Glyph>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </Glyph>
  ),
  bot: (
    <Glyph>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 8V4M8 14h.01M16 14h.01M9 18h6" />
    </Glyph>
  ),
}

/** A skip link inside a preview must not change the gallery's URL: focus the target instead. */
function skipTo(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById(id)?.focus()
  }
}

/* -------------------------------------------------------- shared identities */

function Brand({ name = 'Northwind Services', description = 'Operations workspace' }) {
  return (
    <SidebarBrand
      logo={<span className="shell-demo__logo" aria-hidden="true" />}
      name={name}
      description={description}
      menu={
        <>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuItem>Operations workspace</DropdownMenuItem>
          <DropdownMenuItem>Finance workspace</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Create workspace…</DropdownMenuItem>
        </>
      }
    />
  )
}

function Account() {
  return (
    <SidebarUser
      name="Priya Raman"
      description="priya@northwind.example"
      status="online"
      menu={
        <>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>Sign out</DropdownMenuItem>
        </>
      }
    />
  )
}

/* ---------------------------------------------------------------- app shell */

const APP_NAV: SidebarNavEntry[] = [
  {
    type: 'section',
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
      { id: 'jobs', label: 'Jobs', icon: <ListIcon />, badge: 12 },
      { id: 'schedule', label: 'Schedule', icon: <CalendarIcon /> },
    ],
  },
  {
    type: 'section',
    id: 'money',
    label: 'Money',
    items: [
      { id: 'invoices', label: 'Invoices', icon: <CreditCardIcon />, badge: 3, badgeTone: 'warning' },
      { id: 'quotes', label: 'Quotes', icon: <FileIcon /> },
    ],
  },
]

function loadTone(load: number) {
  if (load >= 90) return 'destructive' as const
  if (load >= 70) return 'warning' as const
  return 'success' as const
}

/** The shell, rendered inside the gallery page rather than around it. */
function AppShellPreview() {
  const [active, setActive] = useState('jobs')
  const [content, setContent] = useState<HTMLElement | null>(null)
  const trail = getSidebarTrail(APP_NAV, active)

  return (
    <div className="shell-preview shell-frame">
      <SkipToContent targetId="shell-demo-main" onClick={skipTo('shell-demo-main')} />
      <SidebarProvider>
        <AppShell>
          <Sidebar header={<Brand />} footer={<Account />}>
            <SidebarNav items={APP_NAV} activeId={active} onSelect={(item) => setActive(item.id)} />
          </Sidebar>

          <AppShellHeader
            start={<SidebarTrigger />}
            center={
              <span className="muted shell-demo__crumbs">
                {trail.map((item) => item.label).join(' / ')}
              </span>
            }
            end={<Badge tone="primary">Preview</Badge>}
          />

          <AppShellContent id="shell-demo-main" ref={setContent}>
            <PageHeader
              as="h2"
              title={trail.at(-1)?.label ?? 'Jobs'}
              description="Everything scheduled for this week, across every crew."
              eyebrow={<span>Northwind Services</span>}
              actions={
                <Button size="sm">
                  <PlusIcon />
                  New
                </Button>
              }
            >
              <SectionTabs
                aria-label="Views"
                tabs={[
                  { id: 'all', label: 'All', count: 128 },
                  { id: 'today', label: 'Today', count: 14 },
                  { id: 'unassigned', label: 'Unassigned', count: 3 },
                  { id: 'archive', label: 'Archive', disabled: true },
                ]}
              />
            </PageHeader>

            <div className="grid-3 shell-demo__gap">
              <StatsCard size="sm" label="Scheduled" value="128" />
              <StatsCard size="sm" label="In progress" value="41" />
              <StatsCard size="sm" label="Overdue" value="3" change="+2" trend="down" />
            </div>

            <Card className="shell-demo__gap">
              <CardHeader>
                <CardTitle as="h3">Crew load</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="shell-demo__people">
                  {PEOPLE.map((person) => (
                    <li key={person.name} className="shell-demo__person">
                      <UserAvatar name={person.name} size="sm" />
                      <span className="shell-demo__person-text">
                        <strong>{person.name}</strong>
                        <span>{person.role}</span>
                      </span>
                      <Badge tone={loadTone(person.load)}>{person.load}%</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <ScrollToTop target={content} threshold={160} />
          </AppShellContent>
        </AppShell>
      </SidebarProvider>
    </div>
  )
}

/* ---------------------------------------------------------- dashboard sidebar */

function AddButton({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label}>
      <PlusIcon />
    </Button>
  )
}

/*
 * Four levels deep under Residential → Orders → Completed, which is the point:
 * the component has no depth limit, and the data decides.
 */
const DASHBOARD_NAV: SidebarNavEntry[] = [
  {
    type: 'section',
    id: 'growth',
    label: 'Growth · Marketing',
    icon: glyph.target,
    tone: 'chart-4',
    items: [
      { id: 'mkt-dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
      {
        id: 'leads',
        label: 'Leads',
        icon: <InboxIcon />,
        badge: 12,
        badgeTone: 'info',
        actions: <AddButton label="New lead" />,
      },
      {
        id: 'campaigns',
        label: 'Campaigns',
        icon: <MailIcon />,
        children: [
          { id: 'email', label: 'Email', icon: <MailIcon /> },
          { id: 'sms', label: 'SMS', icon: glyph.message, badge: 'New', badgeTone: 'success' },
          { id: 'calls', label: 'Telemarketing', icon: <PhoneIcon />, keywords: ['phone', 'calls'] },
        ],
      },
      { id: 'connections', label: 'Connections', icon: <LinkIcon /> },
      { id: 'signatures', label: 'Signatures', icon: <PencilIcon /> },
    ],
  },
  {
    type: 'section',
    id: 'seo',
    label: 'SEO',
    icon: <SearchIcon />,
    tone: 'warning',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: 'keywords', label: 'Keywords', icon: <SearchIcon /> },
      { id: 'audit', label: 'Site audit', icon: <FileIcon /> },
    ],
  },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    icon: glyph.briefcase,
    tone: 'success',
    action: <AddButton label="New job" />,
    items: [
      { id: 'status-guide', label: 'Status guide', icon: <InfoIcon /> },
      {
        id: 'residential',
        label: 'Residential',
        icon: glyph.home,
        children: [
          { id: 'res-dashboard', label: 'Dashboard', icon: <LayoutIcon /> },
          { id: 'res-requests', label: 'Quote requests', icon: <InboxIcon />, badge: 3 },
          { id: 'res-assistant', label: 'Quote assistant', icon: glyph.bot },
          { id: 'res-quotes', label: 'Quotes', icon: <FileIcon /> },
          {
            id: 'res-orders',
            label: 'Orders',
            icon: <TagIcon />,
            children: [
              { id: 'res-orders-open', label: 'Open', badge: 8 },
              { id: 'res-orders-scheduled', label: 'Scheduled' },
              {
                id: 'res-orders-done',
                label: 'Completed',
                children: [
                  { id: 'res-orders-month', label: 'This month' },
                  { id: 'res-orders-archive', label: 'Archive' },
                ],
              },
            ],
          },
          { id: 'res-invoices', label: 'Invoices', icon: <CreditCardIcon /> },
          { id: 'res-calendar', label: 'Order calendar', icon: <CalendarIcon /> },
        ],
      },
      {
        id: 'commercial',
        label: 'Commercial',
        icon: glyph.building,
        children: [
          { id: 'com-sites', label: 'Sites', icon: glyph.building },
          { id: 'com-contracts', label: 'Contracts', icon: <FileIcon /> },
          { id: 'com-billing', label: 'Billing', icon: <CreditCardIcon />, disabled: true },
        ],
      },
    ],
  },
  { type: 'separator' },
  { id: 'settings', label: 'Settings', icon: <SlidersIcon /> },
  {
    id: 'docs',
    label: 'Help centre',
    icon: <GlobeIcon />,
    href: 'https://example.com',
    external: true,
  },
]

function Option({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="choice">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  )
}

/** The full dashboard sidebar, with its options as switches above it. */
function DashboardSidebarPreview() {
  const [active, setActive] = useState('res-quotes')
  const [accordion, setAccordion] = useState(false)
  const [searchable, setSearchable] = useState(true)
  const [primary, setPrimary] = useState(false)
  const trail = getSidebarTrail(DASHBOARD_NAV, active)

  return (
    <div className="stack-sm">
      <div className="shell-demo__options">
        <Option label="Search" checked={searchable} onChange={setSearchable} />
        <Option label="Accordion" checked={accordion} onChange={setAccordion} />
        <Option label="Primary highlight" checked={primary} onChange={setPrimary} />
      </div>

      <div className="shell-preview shell-frame shell-frame--tall">
        <SidebarProvider mobileBreakpoint={false} shortcut="b">
          <AppShell>
            <Sidebar
              header={<Brand />}
              footer={<Account />}
              appearance={primary ? 'primary' : 'subtle'}
            >
              <SidebarNav
                items={DASHBOARD_NAV}
                activeId={active}
                accordion={accordion}
                searchable={searchable}
                searchPlaceholder="Search pages…"
                onSelect={(item) => setActive(item.id)}
              />
            </Sidebar>

            <AppShellHeader
              start={<SidebarTrigger />}
              center={
                <span className="muted shell-demo__crumbs">
                  {trail.map((item) => item.label).join(' / ')}
                </span>
              }
              end={
                <span className="shell-demo__keys" aria-label="Shortcut: Control or Command plus B">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>B</Kbd>
                </span>
              }
            />

            <AppShellContent id="sidebar-demo-main">
              <PageHeader
                as="h2"
                title={trail.at(-1)?.label ?? 'Dashboard'}
                description="Pick anything in the sidebar — the breadcrumb above is getSidebarTrail() over the same tree."
              />
              <div className="grid-3 shell-demo__gap">
                <StatsCard size="sm" label="Open" value="128" />
                <StatsCard size="sm" label="Scheduled" value="41" />
                <StatsCard size="sm" label="Overdue" value="3" change="+2" trend="down" />
              </div>
            </AppShellContent>
          </AppShell>
        </SidebarProvider>
      </div>
    </div>
  )
}

/* -------------------------------------------------------- hand-written sidebar */

function ComposedSidebarPreview() {
  const [active, setActive] = useState('my-jobs')
  const [synced, setSynced] = useState(false)

  const item = (id: string) => ({ active: active === id, onSelect: () => setActive(id) })

  return (
    <div className="shell-preview shell-frame shell-frame--column">
      <Sidebar
        mobileBreakpoint={false}
        header={<Brand name="Fieldwork" description="Crew app" />}
        footer={<Account />}
      >
        <SidebarNav aria-label="Crew">
          <SidebarSection label="Today" icon={<CalendarIcon />} tone="chart-3">
            <SidebarMenuItem label="My jobs" icon={<ListIcon />} badge={4} {...item('my-jobs')} />
            <SidebarMenuItem label="Route" icon={<GlobeIcon />} {...item('route')} />
            <SidebarMenuItem label="Messages" icon={glyph.message} badge={2} badgeTone="info" {...item('messages')} />
          </SidebarSection>

          <div className="shell-demo__callout" role="status">
            <span>{synced ? 'Everything is synced.' : 'Offline — 3 changes waiting.'}</span>
            {synced ? null : (
              <Button size="sm" variant="outline" onClick={() => setSynced(true)}>
                Sync now
              </Button>
            )}
          </div>

          <SidebarSection label="Records" icon={<FileIcon />} tone="chart-1" collapsible>
            <SidebarMenuItem label="Clients" icon={glyph.building} defaultExpanded>
              <SidebarMenuItem label="Active" {...item('clients-active')} />
              <SidebarMenuItem label="Archived" {...item('clients-archived')} />
            </SidebarMenuItem>
            <SidebarMenuItem label="Timesheets" icon={<CalendarIcon />} {...item('timesheets')} />
          </SidebarSection>
        </SidebarNav>
      </Sidebar>

      <div className="shell-demo__canvas">
        <span className="muted">Current page</span>
        <strong>{active}</strong>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- phone */

const BOTTOM_NAV = [
  { id: 'jobs', label: 'Jobs', icon: <ListIcon />, badge: 4 },
  { id: 'map', label: 'Map', icon: <GlobeIcon /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 2 },
  { id: 'schedule', label: 'Schedule', icon: <CalendarIcon /> },
]

/** The same shell on a phone: the sidebar is a drawer, and a bottom bar carries the essentials. */
function PhoneShellPreview() {
  const [page, setPage] = useState('jobs')
  const [tab, setTab] = useState('jobs')

  return (
    <div className="shell-preview shell-frame shell-frame--phone">
      <SidebarProvider mobileBreakpoint="1000rem">
        <AppShell hasBottomNav>
          <Sidebar header={<Brand name="Fieldwork" description="Crew app" />} footer={<Account />}>
            <SidebarNav items={APP_NAV} activeId={page} onSelect={(item) => setPage(item.id)} />
          </Sidebar>

          <AppShellHeader
            start={
              <>
                <SidebarTrigger />
                <strong>Fieldwork</strong>
              </>
            }
            end={<UserAvatar name="Priya Raman" size="sm" status="online" />}
          />

          <AppShellContent id="shell-phone-main">
            <PageHeader as="h2" title="Today" description="4 jobs, 2 crews." />
            <div className="shell-demo__pair">
              <StatsCard size="sm" label="Done" value="2" />
              <StatsCard size="sm" label="Left" value="2" />
            </div>
          </AppShellContent>

          <AppShellBottomNav>
            {BOTTOM_NAV.map((entry) => (
              <BottomNavItem
                key={entry.id}
                icon={entry.icon}
                badge={entry.badge}
                label={entry.label}
                active={entry.id === tab}
                onClick={() => setTab(entry.id)}
              />
            ))}
          </AppShellBottomNav>
        </AppShell>
      </SidebarProvider>
    </div>
  )
}

/* --------------------------------------------------------------------- page */

export function ShellSection() {
  return (
    <div className="stack">
      <Demo
        title="App shell"
        note="Sidebar, header, content and bottom bar as slots rather than props — one skeleton, filled differently by a field app and an admin console. The header's trigger narrows the sidebar to an icon rail; only the content scrolls."
        inline={false}
      >
        <div className="stack-sm">
          <AppShellPreview />
          <p className="muted shell-demo__hint">
            Tab into the preview: the first stop is a skip link past the navigation. Scroll the
            content and a back-to-top button appears — ScrollToTop is watching that element, not
            the window.
          </p>
        </div>
      </Demo>

      <Demo
        title="Dashboard sidebar"
        note="Sections with their own hue, destinations nested to any depth, hover actions, badges and a filter. Collapse it: the rail keeps every page reachable through tooltips and flyouts. Arrow keys walk the tree."
        inline={false}
      >
        <DashboardSidebarPreview />
      </Demo>

      <Demo
        title="Hand-written sidebar"
        note="SidebarNav renders with SidebarSection and SidebarMenuItem, and both are exported: compose them by hand and you get the same markup, with room for anything between two sections."
        inline={false}
      >
        <ComposedSidebarPreview />
      </Demo>

      <Demo
        title="Drawer and bottom bar"
        note="Below its breakpoint the sidebar leaves the grid and becomes a modal drawer — forced on here so it shows on a desktop. Escape, the backdrop or choosing a page closes it. The bottom bar is the same shell, not a second component."
        inline={false}
      >
        <PhoneShellPreview />
      </Demo>

      <Demo
        title="Page header"
        note="Where you are, what it is, and what you can do here. The heading level is a prop, so a header inside a section does not open a second h1."
        inline={false}
      >
        <PageHeader
          as="h2"
          bordered
          title="Rosewood Estates"
          description="14 properties · 3 open jobs · account manager Ana Ortiz"
          eyebrow={<Badge tone="success">Active client</Badge>}
          onBack={() => undefined}
          actions={
            <>
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">Edit client</Button>
            </>
          }
        >
          <SectionTabs
            aria-label="Client sections"
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'jobs', label: 'Jobs', count: 3 },
              { id: 'invoices', label: 'Invoices', count: 11 },
              { id: 'notes', label: 'Notes' },
            ]}
          />
        </PageHeader>
      </Demo>
    </div>
  )
}

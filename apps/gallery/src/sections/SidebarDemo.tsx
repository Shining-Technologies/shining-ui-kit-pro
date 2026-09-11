import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  Badge,
  Button,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  PageHeader,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
  SidebarUser,
  StatsCard,
  Switch,
  getSidebarTrail,
  type SidebarNavEntry,
} from '@shining-technologies/ui-kit-react'
import { useState, type ReactNode } from 'react'

/* A few line icons, drawn here so the gallery does not need an icon library. */
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

const icon = {
  grid: (
    <Glyph>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Glyph>
  ),
  target: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Glyph>
  ),
  magnet: (
    <Glyph>
      <path d="M6 15V9a6 6 0 0 1 12 0v6M6 15h4M14 15h4M6 11h4M14 11h4" />
    </Glyph>
  ),
  phone: (
    <Glyph>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </Glyph>
  ),
  message: (
    <Glyph>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Glyph>
  ),
  mail: (
    <Glyph>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </Glyph>
  ),
  plug: (
    <Glyph>
      <path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8Z" />
    </Glyph>
  ),
  pen: (
    <Glyph>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Glyph>
  ),
  search: (
    <Glyph>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Glyph>
  ),
  briefcase: (
    <Glyph>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Glyph>
  ),
  help: (
    <Glyph>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
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
  file: (
    <Glyph>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </Glyph>
  ),
  cart: (
    <Glyph>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </Glyph>
  ),
  receipt: (
    <Glyph>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Glyph>
  ),
  calendar: (
    <Glyph>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Glyph>
  ),
  bot: (
    <Glyph>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 8V4M8 14h.01M16 14h.01M9 18h6" />
    </Glyph>
  ),
  settings: (
    <Glyph>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Glyph>
  ),
  plus: (
    <Glyph>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  ),
}

/** A small "+" for hover actions and section headings. */
function AddButton({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} onClick={(e) => e.stopPropagation()}>
      {icon.plus}
    </Button>
  )
}

/*
 * The tree. Four levels deep under Residential → Orders → Completed, which is
 * the point: the component has no depth limit, and the data decides.
 */
const NAV: SidebarNavEntry[] = [
  {
    type: 'section',
    id: 'growth',
    label: 'Growth · Marketing',
    icon: icon.target,
    tone: 'chart-4',
    items: [
      { id: 'mkt-dashboard', label: 'Dashboard', icon: icon.grid },
      {
        id: 'leads',
        label: 'Leads',
        icon: icon.magnet,
        badge: 12,
        badgeTone: 'info',
        actions: <AddButton label="New lead" />,
      },
      {
        id: 'campaigns',
        label: 'Campaigns',
        icon: icon.mail,
        children: [
          { id: 'email', label: 'Email', icon: icon.mail },
          { id: 'sms', label: 'SMS', icon: icon.message, badge: 'New', badgeTone: 'success' },
          { id: 'calls', label: 'Telemarketing', icon: icon.phone, keywords: ['phone', 'calls'] },
        ],
      },
      { id: 'connections', label: 'Connections', icon: icon.plug },
      { id: 'signatures', label: 'Signatures', icon: icon.pen },
    ],
  },
  {
    type: 'section',
    id: 'seo',
    label: 'SEO',
    icon: icon.search,
    tone: 'warning',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: 'keywords', label: 'Keywords', icon: icon.search },
      { id: 'audit', label: 'Site audit', icon: icon.file },
    ],
  },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    icon: icon.briefcase,
    tone: 'success',
    action: <AddButton label="New job" />,
    items: [
      { id: 'status-guide', label: 'Status guide', icon: icon.help },
      {
        id: 'residential',
        label: 'Residential',
        icon: icon.home,
        children: [
          { id: 'res-dashboard', label: 'Dashboard', icon: icon.grid },
          { id: 'res-requests', label: 'Quote requests', icon: icon.help, badge: 3 },
          { id: 'res-assistant', label: 'Quote assistant', icon: icon.bot },
          { id: 'res-quotes', label: 'Quotes', icon: icon.file },
          {
            id: 'res-orders',
            label: 'Orders',
            icon: icon.cart,
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
          { id: 'res-invoices', label: 'Invoices', icon: icon.receipt },
          { id: 'res-calendar', label: 'Order calendar', icon: icon.calendar },
          { id: 'res-jobs', label: 'Jobs', icon: icon.briefcase },
        ],
      },
      {
        id: 'commercial',
        label: 'Commercial',
        icon: icon.building,
        children: [
          { id: 'com-sites', label: 'Sites', icon: icon.building },
          { id: 'com-contracts', label: 'Contracts', icon: icon.file },
          { id: 'com-billing', label: 'Billing', icon: icon.receipt, disabled: true },
        ],
      },
    ],
  },
  { type: 'separator' },
  { id: 'settings', label: 'Settings', icon: icon.settings },
  {
    id: 'docs',
    label: 'Help centre',
    icon: icon.help,
    href: 'https://example.com',
    external: true,
  },
]

function Brand() {
  return (
    <SidebarBrand
      logo={<span className="sidebar-demo__logo" aria-hidden="true" />}
      name="Northwind Services"
      description="Operations workspace"
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
      name="Admin User"
      description="admin@example.com"
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
    <label className="sidebar-demo__option">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  )
}

/** The full dashboard sidebar, with its options as switches above it. */
export function DashboardSidebarPreview() {
  const [active, setActive] = useState('res-quotes')
  const [accordion, setAccordion] = useState(false)
  const [searchable, setSearchable] = useState(true)
  const [primary, setPrimary] = useState(false)
  const trail = getSidebarTrail(NAV, active)

  return (
    <div className="stack-sm">
      <div className="sidebar-demo__options">
        <Option label="Search" checked={searchable} onChange={setSearchable} />
        <Option label="Accordion" checked={accordion} onChange={setAccordion} />
        <Option label="Primary highlight" checked={primary} onChange={setPrimary} />
      </div>

      <div className="shell-preview sidebar-demo">
        <SidebarProvider mobileBreakpoint={false} shortcut="b">
          <AppShell>
            <Sidebar
              header={<Brand />}
              footer={<Account />}
              appearance={primary ? 'primary' : 'subtle'}
            >
              <SidebarNav
                items={NAV}
                activeId={active}
                accordion={accordion}
                searchable={searchable}
                searchPlaceholder="Search pages…"
                onSelect={(item) => setActive(item.id)}
              />
            </Sidebar>

            <AppShellHeader
              start={
                <>
                  <SidebarTrigger />
                  <span className="muted">{trail.map((item) => item.label).join(' / ')}</span>
                </>
              }
              end={<Badge variant="soft">⌘/Ctrl + B</Badge>}
            />

            <AppShellContent id="sidebar-demo-main">
              <PageHeader
                as="h2"
                title={trail.at(-1)?.label ?? 'Dashboard'}
                description="Pick anything in the sidebar — the breadcrumb above is getSidebarTrail() over the same tree."
              />
              <div className="grid-3" style={{ marginTop: '1.25rem' }}>
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

/** The same sidebar forced into drawer mode, to show it without a phone. */
export function DrawerSidebarPreview() {
  const [active, setActive] = useState('leads')

  return (
    <SidebarProvider mobileBreakpoint="1000rem">
      <SidebarTrigger variant="outline" size="default">
        Open the drawer
      </SidebarTrigger>
      <Sidebar header={<Brand />} footer={<Account />}>
        <SidebarNav items={NAV} activeId={active} onSelect={(item) => setActive(item.id)} />
      </Sidebar>
    </SidebarProvider>
  )
}

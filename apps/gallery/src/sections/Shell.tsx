import {
  AppShell,
  AppShellBottomNav,
  AppShellContent,
  AppShellHeader,
  AppShellSidebar,
  Badge,
  BottomNavItem,
  Button,
  ConfirmDialog,
  CopyButton,
  HoldButton,
  PageHeader,
  SectionTabs,
  SidebarGroup,
  SidebarItem,
  SkipToContent,
  StatsCard,
  Toaster,
  ToastProvider,
  UserAvatar,
  useToast,
} from '@shining-technologies/ui-kit-react'
import { useState } from 'react'
import { Demo } from './Demo'
import { DashboardSidebarPreview, DrawerSidebarPreview } from './SidebarDemo'

const NAV = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '◧' },
      { id: 'jobs', label: 'Jobs', icon: '▤', badge: 12 },
      { id: 'schedule', label: 'Schedule', icon: '◷' },
    ],
  },
  {
    label: 'Money',
    items: [
      { id: 'invoices', label: 'Invoices', icon: '◫', badge: 3 },
      { id: 'quotes', label: 'Quotes', icon: '◨' },
    ],
  },
]

/** The shell, rendered inside the gallery page rather than around it. */
function ShellPreview() {
  const [active, setActive] = useState('jobs')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="shell-preview">
      <AppShell collapsed={collapsed}>
        <AppShellSidebar
          header={
            <>
              <span className="shell-preview__mark" aria-hidden="true" />
              {!collapsed ? <strong>Fieldwork</strong> : null}
            </>
          }
          footer={
            <div className="shell-preview__account">
              <UserAvatar name="Priya Raman" size="sm" status="online" />
              {!collapsed ? <span>Priya Raman</span> : null}
            </div>
          }
        >
          {NAV.map((group) => (
            <SidebarGroup key={group.label} label={group.label}>
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  badge={item.badge}
                  active={item.id === active}
                  onClick={() => setActive(item.id)}
                >
                  {item.label}
                </SidebarItem>
              ))}
            </SidebarGroup>
          ))}
        </AppShellSidebar>

        <AppShellHeader
          start={<Badge variant="soft">Preview</Badge>}
          end={
            <Button variant="outline" size="sm" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? 'Expand' : 'Collapse'} sidebar
            </Button>
          }
        />

        <AppShellContent id="shell-preview-main">
          <PageHeader
            title="Jobs"
            description="Everything scheduled for this week, across every crew."
            eyebrow={<span>Operations / Jobs</span>}
            actions={<Button size="sm">New job</Button>}
          >
            <SectionTabs
              tabs={[
                { id: 'all', label: 'All', count: 128 },
                { id: 'today', label: 'Today', count: 14 },
                { id: 'unassigned', label: 'Unassigned', count: 3 },
                { id: 'archive', label: 'Archive', disabled: true },
              ]}
            />
          </PageHeader>

          <div className="grid-3" style={{ marginTop: '1.25rem' }}>
            <StatsCard size="sm" label="Scheduled" value="128" />
            <StatsCard size="sm" label="In progress" value="41" />
            <StatsCard size="sm" label="Overdue" value="3" change="+2" trend="down" />
          </div>
        </AppShellContent>
      </AppShell>
    </div>
  )
}

/** The same shell on a phone: no rail, a bottom bar instead. */
function MobileShellPreview() {
  const [active, setActive] = useState('jobs')

  return (
    <div className="shell-preview shell-preview--mobile">
      <AppShell hasBottomNav>
        <AppShellHeader
          start={<strong>Fieldwork</strong>}
          end={<UserAvatar name="Priya Raman" size="sm" />}
        />
        <AppShellContent id="mobile-preview-main">
          <PageHeader as="h2" title="Today" description="4 jobs, 2 crews." />
          <div className="grid-2" style={{ marginTop: '1rem' }}>
            <StatsCard size="sm" label="Done" value="2" />
            <StatsCard size="sm" label="Left" value="2" />
          </div>
        </AppShellContent>
        <AppShellBottomNav>
          {[
            { id: 'jobs', label: 'Jobs', icon: '▤', badge: 4 },
            { id: 'map', label: 'Map', icon: '◈' },
            { id: 'chat', label: 'Chat', icon: '◎', badge: 2 },
            { id: 'me', label: 'Me', icon: '◉' },
          ].map((item) => (
            <BottomNavItem
              key={item.id}
              icon={item.icon}
              badge={item.badge}
              label={item.label}
              active={item.id === active}
              onClick={() => setActive(item.id)}
            />
          ))}
        </AppShellBottomNav>
      </AppShell>
    </div>
  )
}

/** Toasts need a provider above them, so this half of the page has its own. */
function ToastDemo() {
  const { toast, dismissAll } = useToast()

  return (
    <>
      <Button
        variant="outline"
        onClick={() => toast({ title: 'Job created', description: 'JOB-4182 is on the board.' })}
      >
        Neutral
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: 'success',
            title: 'Invoice sent',
            description: 'INV-2042 to Rosewood Estates.',
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: 'warning',
            title: 'Crew running late',
            description: 'Two jobs may slip past 5pm.',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: 'destructive',
            title: 'Sync failed',
            description: 'The scheduler could not reach the server.',
            action: { label: 'Retry', onClick: () => undefined },
            duration: 0,
          })
        }
      >
        With an action, no timeout
      </Button>
      <Button variant="ghost" onClick={dismissAll}>
        Dismiss all
      </Button>
      <Toaster position="bottom-right" />
    </>
  )
}

export function Shell() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="stack">
      <Demo
        title="App shell"
        note="Sidebar, header, content and bottom bar as slots rather than props — one skeleton, filled differently by a field app and an admin console."
        inline={false}
      >
        <ShellPreview />
      </Demo>

      <Demo
        title="Dashboard sidebar"
        note="Sections with their own hue, destinations nested to any depth, hover actions, badges and a filter. Collapse it: the rail keeps every page reachable through tooltips and flyouts. Arrow keys walk the tree."
        inline={false}
      >
        <DashboardSidebarPreview />
      </Demo>

      <Demo
        title="Sidebar drawer"
        note="Below its breakpoint the same sidebar becomes an off-canvas drawer — forced on here so it shows on a desktop. Escape, the backdrop or choosing a page closes it."
      >
        <DrawerSidebarPreview />
      </Demo>

      <Demo
        title="Bottom navigation"
        note="Below 48rem the rail is gone and the same destinations move to a bottom bar, clear of the home indicator. Both are the same shell — nothing switches components."
        inline={false}
      >
        <MobileShellPreview />
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
          eyebrow={<span>Clients / Rosewood Estates</span>}
          onBack={() => undefined}
          actions={
            <>
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">Edit client</Button>
            </>
          }
        />
      </Demo>

      <Demo
        title="Section tabs"
        note="Not a tablist: these usually change the route, and claiming a tab/panel relationship the app does not deliver misleads a screen reader."
        inline={false}
      >
        <div className="stack-sm">
          <SectionTabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'jobs', label: 'Jobs', count: 3 },
              { id: 'invoices', label: 'Invoices', count: 11 },
              { id: 'notes', label: 'Notes' },
            ]}
          />
          <SectionTabs
            appearance="pills"
            fill
            tabs={[
              { id: 'week', label: 'This week' },
              { id: 'month', label: 'This month' },
              { id: 'quarter', label: 'This quarter' },
            ]}
          />
        </div>
      </Demo>

      <Demo
        title="Confirm dialog"
        note="Actions may be async: the dialog holds itself open, disables every choice and shows the pending one as busy."
      >
        <Button variant="outline" onClick={() => setConfirming(true)}>
          Archive client
        </Button>
        <Button variant="destructive" onClick={() => setDeleting(true)}>
          Delete client
        </Button>

        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Archive Rosewood Estates?"
          description="Archived clients keep their history but stop appearing in search."
          confirmLabel="Archive"
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))}
        />

        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          destructive
          title="Delete Rosewood Estates?"
          description="This removes 14 properties and 11 invoices. It cannot be undone."
          confirmLabel="Delete permanently"
        />
      </Demo>

      <Demo
        title="Copy and hold"
        note="Two ways to be sure: a confirmation you can see, and friction in the gesture rather than in a second screen."
      >
        <CopyButton value="INV-2043" />
        <CopyButton value="hello@example.com" variant="outline">
          Copy email
        </CopyButton>
        <HoldButton onHoldComplete={() => undefined} holdingLabel="Keep holding…">
          Hold to delete
        </HoldButton>
      </Demo>

      <Demo
        title="Toasts"
        note="The store is per-provider, not a module singleton: two providers on one page get two independent stacks."
      >
        <ToastDemo />
      </Demo>

      <Demo
        title="Skip to content"
        note="Invisible until focused. Tab into this demo to see it — for someone on a keyboard it is the difference between reaching the content and tabbing through forty nav links."
      >
        <SkipToContent targetId="gallery-main" />
        <span className="muted">Press Tab with this panel focused.</span>
      </Demo>
    </div>
  )
}

/** The section is wrapped so the toast demo has a provider above it. */
export function ShellSection() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}

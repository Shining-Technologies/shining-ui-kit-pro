import {
  Badge,
  Button,
  CalendarIcon,
  Card,
  CardContent,
  CreditCardIcon,
  FileIcon,
  GlobeIcon,
  InboxIcon,
  LayoutIcon,
  MailIcon,
  NavigationRail,
  NavigationRailItem,
  PlusIcon,
  SlidersIcon,
  StarIcon,
  TagIcon,
  UserAvatar,
  VerticalNav,
  VerticalNavItem,
  VerticalNavSection,
} from '@shining-technologies/ui'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Demo } from '../Demo'

interface SettingsPage {
  id: string
  label: string
  icon: ReactNode
  badge?: ReactNode
  blurb: string
}

const SETTINGS: { title: string; pages: SettingsPage[] }[] = [
  {
    title: 'Account',
    pages: [
      {
        id: 'profile',
        label: 'Profile',
        icon: <LayoutIcon />,
        blurb: 'Name, photo and time zone.',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <MailIcon />,
        badge: 2,
        blurb: 'Email for new jobs, SMS for escalations.',
      },
      {
        id: 'language',
        label: 'Language & region',
        icon: <GlobeIcon />,
        blurb: 'English (Australia), dd/mm/yyyy.',
      },
    ],
  },
  {
    title: 'Workspace',
    pages: [
      {
        id: 'billing',
        label: 'Billing',
        icon: <CreditCardIcon />,
        badge: <Badge tone="warning">Due</Badge>,
        blurb: 'Pro plan, next invoice on 1 April.',
      },
      {
        id: 'services',
        label: 'Services & pricing',
        icon: <TagIcon />,
        blurb: '14 services across 3 categories.',
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: <SlidersIcon />,
        blurb: 'Xero and Stripe are connected.',
      },
    ],
  },
]

const DOCS = [
  'Introduction',
  'Installation',
  'Theming',
  'Server Components',
  'Data table',
  'Migration',
]

const RAIL: {
  id: string
  label: string
  icon: ReactNode
  badge?: ReactNode
  badgeLabel?: string
}[] = [
  { id: 'home', label: 'Home', icon: <LayoutIcon /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 12 },
  { id: 'schedule', label: 'Schedule', icon: <CalendarIcon /> },
  { id: 'files', label: 'Files', icon: <FileIcon /> },
  { id: 'starred', label: 'Starred', icon: <StarIcon />, badge: 'New', badgeLabel: 'new items' },
]

export function AppNavigation() {
  const [page, setPage] = useState('notifications')
  const [doc, setDoc] = useState('Theming')
  const [destination, setDestination] = useState('inbox')
  const current = SETTINGS.flatMap((s) => s.pages).find((p) => p.id === page)!

  return (
    <div className="stack">
      <Demo
        title="Vertical navigation"
        note="Links within one area of the app, such as settings or an account. Each item is its own page, so it has aria-current instead of tab semantics. It is markup only and renders as a Server Component. Use asChild to render your router's link."
        inline={false}
      >
        <div className="nav-demo__settings">
          <VerticalNav aria-label="Settings">
            {SETTINGS.map((section) => (
              <VerticalNavSection key={section.title} title={section.title}>
                {section.pages.map((item) => (
                  <VerticalNavItem
                    key={item.id}
                    icon={item.icon}
                    badge={item.badge}
                    active={item.id === page}
                    onClick={() => setPage(item.id)}
                  >
                    {item.label}
                  </VerticalNavItem>
                ))}
              </VerticalNavSection>
            ))}
            <VerticalNavSection>
              <VerticalNavItem icon={<SlidersIcon />} disabled>
                Advanced (admins only)
              </VerticalNavItem>
            </VerticalNavSection>
          </VerticalNav>
          <Card variant="flat">
            <CardContent>
              <p className="nav-demo__step-title">{current.label}</p>
              <p className="muted">{current.blurb}</p>
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo
        title="Vertical navigation — line"
        note="A rule down the start edge, with the current page's stretch of it coloured. It is quieter than pills, which suits a docs table of contents beside long text."
        inline={false}
      >
        <div className="nav-demo__settings">
          <VerticalNav aria-label="Documentation" appearance="line">
            <VerticalNavSection title="Guides">
              {DOCS.map((title) => (
                <VerticalNavItem
                  key={title}
                  href={`#${title.toLowerCase().replace(/\s+/g, '-')}`}
                  active={title === doc}
                  onClick={(event) => {
                    event.preventDefault()
                    setDoc(title)
                  }}
                >
                  {title}
                </VerticalNavItem>
              ))}
            </VerticalNavSection>
          </VerticalNav>
          <p className="muted">Reading: {doc}</p>
        </div>
      </Demo>

      <Demo
        title="Navigation rail"
        note="Three to seven top-level destinations, each an icon with its label underneath. It suits tablet widths, and apps too small to need a sidebar. Badges on an icon are read after the label: “Inbox (12)”."
        inline={false}
      >
        <div className="nav-demo__rail-frame">
          <NavigationRail
            aria-label="Main"
            header={
              <Button size="icon" aria-label="New job">
                <PlusIcon />
              </Button>
            }
            footer={<UserAvatar name="Priya Shah" size="sm" status="online" />}
          >
            {RAIL.map((item) => (
              <NavigationRailItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                badgeLabel={item.badgeLabel}
                active={item.id === destination}
                onClick={() => setDestination(item.id)}
              />
            ))}
            <NavigationRailItem icon={<SlidersIcon />} label="Admin" disabled />
          </NavigationRail>
          <div className="nav-demo__rail-content">
            <p className="nav-demo__step-title">
              {RAIL.find((item) => item.id === destination)?.label}
            </p>
            <p className="muted">
              The rail is the whole height of its container. Its header holds a primary action and
              its footer is pinned to the bottom.
            </p>
          </div>
        </div>
      </Demo>

      <Demo
        title="Sidebar, sidebar groups and mobile bottom navigation"
        note="These are already part of the app shell, and they are demonstrated in a full frame on that page."
        inline={false}
      >
        <div className="grid-3">
          {[
            {
              title: 'Collapsible sidebar',
              body: 'Sidebar with SidebarTrigger. It narrows to an icon rail on desktop and becomes a drawer on mobile. The optional shortcut prop adds a key that toggles it.',
            },
            {
              title: 'Sidebar groups',
              body: 'SidebarSection, or a section entry in the SidebarNav items. A section can have a label, an icon and a tone, and can be collapsible.',
            },
            {
              title: 'Mobile bottom navigation',
              body: 'AppShellBottomNav with BottomNavItem. It shows below 48rem, where the sidebar becomes a drawer.',
            },
          ].map((card) => (
            <Card key={card.title} variant="flat">
              <CardContent>
                <p className="nav-demo__step-title">{card.title}</p>
                <p className="muted">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => (window.location.hash = 'shell')}>
            Open App shell & sidebar
          </Button>
        </div>
      </Demo>
    </div>
  )
}

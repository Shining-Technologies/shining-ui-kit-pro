// @vitest-environment node
/*
 * Server rendering. Every test here runs with no `window`, no `document` and no
 * `localStorage`, the environment a Next.js App Router renders client
 * components in on the server. A throw here is a 500 on the first request.
 *
 * Ported from V1 `tests/audit-ssr.test.tsx` without any provider: V2 has none.
 * The theme is CSS, so nothing about it is rendered into HTML any more.
 */
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  ColorModeScript,
  ColorModeToggle,
  DataTable,
  DropdownMenuItem,
  Pagination,
  ScrollToTop,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
  SidebarUser,
  SkipToContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getColorModeScript,
  type ColumnDef,
  type SidebarNavEntry,
} from '@shining-technologies/ui'
import * as core from '@shining-technologies/ui/core'
import * as theme from '@shining-technologies/ui/theme'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeUsers, userColumns, users } from './fixtures'

const NAV: SidebarNavEntry[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    collapsible: true,
    items: [
      {
        id: 'orders',
        label: 'Orders',
        href: '/orders',
        children: [{ id: 'open', label: 'Open', href: '/orders/open' }],
      },
    ],
  },
]

function Dashboard({ collapsed }: { collapsed?: boolean }) {
  return (
    <SidebarProvider storageKey="ssr-nav" shortcut="b" defaultCollapsed={collapsed}>
      <SkipToContent />
      <AppShell>
        <Sidebar
          header={<SidebarBrand name="Acme" menu={<DropdownMenuItem>Switch</DropdownMenuItem>} />}
          footer={<SidebarUser name="Ana Ortiz" menu={<DropdownMenuItem>Sign out</DropdownMenuItem>} />}
        >
          <SidebarNav items={NAV} currentPath="/orders/open?tab=1" searchable />
        </Sidebar>
        <AppShellHeader start={<SidebarTrigger />} end={<ColorModeToggle />} />
        <AppShellContent>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Open</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">A</TabsTrigger>
            </TabsList>
            <TabsContent value="a">Tab A</TabsContent>
          </Tabs>
          <Pagination page={2} pageCount={9} onPageChange={() => {}} />
          <ScrollToTop />
        </AppShellContent>
      </AppShell>
    </SidebarProvider>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('server rendering', () => {
  it('has no DOM to lean on', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(typeof localStorage).toBe('undefined')
  })

  it('renders a whole dashboard shell with no provider', () => {
    const html = renderToString(<Dashboard />)
    expect(html).toContain('aria-current="page"')
    // The branch holding the current page is open in the server HTML already.
    expect(html).toContain('Open')
    expect(html).toContain('data-slot="sidebar"')
    // A phone gets the closed drawer from CSS until script can measure.
    expect(html).toContain('data-breakpoint-pending="true"')
    // The default breakpoint is in the stylesheet: no extra <style> for it.
    expect(html).not.toContain('data-sui-breakpoint')
    // The theme is CSS: nothing about colour or mode is rendered into the HTML.
    expect(html).not.toContain('<style')
    expect(html).not.toContain('prefers-color-scheme')
    expect(html).not.toMatch(/--(sui-)?primary/)
    // With nothing to read on a server, the toggle offers dark (it paints light).
    expect(html).toContain('aria-label="Switch to dark mode"')
  })

  it('renders the rail on the server', () => {
    expect(renderToString(<Dashboard collapsed />)).toContain('data-collapsed="true"')
  })

  it('does not claim the default breakpoint for a custom one', () => {
    const html = renderToString(<Sidebar mobileBreakpoint="60rem" />)
    expect(html).not.toContain('data-breakpoint-pending')
  })

  it('ships a scoped media query for a custom breakpoint, with the nonce passed to Sidebar', () => {
    const html = renderToString(
      <SidebarProvider mobileBreakpoint="60rem">
        <AppShell>
          <Sidebar nonce="r4nd0m" />
          <AppShellContent>page</AppShellContent>
        </AppShell>
      </SidebarProvider>,
    )
    const scope = /data-breakpoint-scope="([^"]+)"/.exec(html)?.[1]
    expect(scope).toBeTruthy()
    expect(html).toMatch(/<style data-sui-breakpoint="" nonce="r4nd0m">@media \(max-width: 60rem\)\{/)
    // Scoped to this sidebar, for both the drawer and the shell's column.
    expect(html).toContain(`.sui-sidebar[data-breakpoint-scope="${scope}"]{position:fixed`)
    expect(html).toContain(`.sui-shell:has(> .sui-sidebar[data-breakpoint-scope="${scope}"])`)
    expect(html).toContain('visibility:hidden')
  })

  it('takes the breakpoint and the nonce on a standalone Sidebar too', () => {
    const html = renderToString(<Sidebar mobileBreakpoint="60rem" nonce="abc" />)
    expect(html).toMatch(/<style data-sui-breakpoint="" nonce="abc">@media \(max-width: 60rem\)/)
  })

  it('keeps a custom breakpoint working without a nonce', () => {
    const html = renderToString(<Sidebar mobileBreakpoint="60rem" />)
    expect(html).toMatch(/<style data-sui-breakpoint="">@media \(max-width: 60rem\)/)
  })

  it('never lets a breakpoint end the stylesheet or the rule', () => {
    for (const hostile of [
      '1px){}</style><script>alert(1)</script>',
      '1px){body{display:none}',
      '1px;}</style>',
      '60rem"',
    ]) {
      const html = renderToString(<Sidebar mobileBreakpoint={hostile} nonce="n" />)
      expect(html, hostile).not.toContain('<script>')
      expect(html, hostile).not.toContain('data-sui-breakpoint')
    }
    // A math function is fine.
    const calc = renderToString(<Sidebar mobileBreakpoint="calc(40rem + 1px)" />)
    expect(calc).toContain('@media (max-width: calc(40rem + 1px))')
  })

  it('never lets a nonce break out of its attribute', () => {
    const html = renderToString(<Sidebar mobileBreakpoint="60rem" nonce={'"><script>alert(1)</script>'} />)
    expect(html).not.toContain('<script>')
  })
})

describe('DataTable on a server', () => {
  interface Event {
    id: string
    name: string
    when: Date
  }

  // Sydney is UTC+11 in March; Los Angeles is UTC-8.
  const events: Event[] = [
    { id: 'a', name: 'Evening in UTC', when: new Date('2024-03-04T20:00:00Z') }, // Sydney: 5 Mar 07:00
    { id: 'b', name: 'Morning in UTC', when: new Date('2024-03-05T10:00:00Z') }, // Sydney: 5 Mar 21:00
    { id: 'c', name: 'Afternoon in UTC', when: new Date('2024-03-05T14:00:00Z') }, // Sydney: 6 Mar 01:00
  ]
  const columns: ColumnDef<Event>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'when', header: 'When', filter: { type: 'date' } },
  ]

  const render = () =>
    renderToString(
      <DataTable
        data={events}
        columns={columns}
        label="Events"
        timeZone="Australia/Sydney"
        defaultColumnFilters={[{ id: 'when', value: { operator: 'on', value: '2024-03-05' } }]}
      />,
    )

  function withTZ<T>(zone: string, fn: () => T): T {
    const previous = process.env.TZ
    process.env.TZ = zone
    try {
      return fn()
    } finally {
      if (previous === undefined) delete process.env.TZ
      else process.env.TZ = previous
    }
  }

  it('renders the same HTML whatever time zone the server runs in', () => {
    const utc = withTZ('UTC', () => {
      // Guard: the runtime zone really is what the test says it is.
      expect(new Date('2024-03-05T10:00:00Z').getHours()).toBe(10)
      return render()
    })
    const la = withTZ('America/Los_Angeles', () => {
      expect(new Date('2024-03-05T10:00:00Z').getHours()).toBe(2)
      return render()
    })
    expect(la).toBe(utc)

    // And it is the table's zone that decides: 5 March in Sydney.
    expect(utc).toContain('Evening in UTC')
    expect(utc).toContain('Morning in UTC')
    expect(utc).not.toContain('Afternoon in UTC')
    expect(utc.match(/Mar 5, 2024/g)?.length).toBeGreaterThanOrEqual(2)
    expect(utc).not.toContain('Mar 4, 2024')
  })

  /** A server whose default locale is `locale`, for every `Intl` formatter that is not told one. */
  function runtimeLocale(locale: string) {
    const real = Intl
    // A `function`, not an arrow: the components call these with `new`.
    const withDefault = <C extends new (locales?: string | string[], options?: object) => object>(Ctor: C) =>
      function (locales?: string | string[], options?: object) {
        return new Ctor(locales ?? locale, options)
      }
    const NumberFormat = Object.assign(withDefault(real.NumberFormat), real.NumberFormat)
    const DateTimeFormat = Object.assign(withDefault(real.DateTimeFormat), real.DateTimeFormat)
    const stub = Object.create(real, {
      NumberFormat: { value: NumberFormat },
      DateTimeFormat: { value: DateTimeFormat },
    })
    vi.stubGlobal('Intl', stub)
    expect(new Intl.NumberFormat().format(1240)).toBe(new real.NumberFormat(locale).format(1240))
  }

  it('groups pagination numbers in en-US by default, even on a German server', () => {
    runtimeLocale('de-DE')
    const html = renderToString(<DataTable data={makeUsers(1240)} columns={userColumns} label="Users" />)
    expect(html).toContain('1,240')
    expect(html).not.toContain('1.240')
  })

  it('groups pagination numbers in de-DE with locale="de-DE", even on a US server', () => {
    runtimeLocale('en-US')
    const html = renderToString(
      <DataTable data={makeUsers(1240)} columns={userColumns} label="Users" locale="de-DE" />,
    )
    expect(html).toContain('1.240')
    expect(html).not.toContain('1,240')
  })
})

describe('ColorModeScript on a server', () => {
  it('renders one inline script with the nonce and the default key and mode', () => {
    const html = renderToString(<ColorModeScript nonce="r4nd0m" />)
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(html.match(/<\/script>/g)).toHaveLength(1)
    expect(html).toMatch(/^<script nonce="r4nd0m">/)
    expect(html).toContain('"sui-color-mode"')
    expect(html).toContain('m="system"')
    expect(html).not.toContain('prefers-color-scheme: light')
  })

  it('never lets the storage key close the element', () => {
    for (const storageKey of [
      '</script><script>alert(1)</script>',
      '</SCRIPT><script>alert(1)',
      '<!--<script>',
      '"+alert(1)+"',
    ]) {
      const html = renderToString(<ColorModeScript storageKey={storageKey} />)
      expect(html.match(/<script/gi), storageKey).toHaveLength(1)
      expect(html.match(/<\/script/gi), storageKey).toHaveLength(1)
      expect(html.endsWith('</script>')).toBe(true)
      // The key is still a JavaScript string literal, not code.
      const script = /^<script[^>]*>([\s\S]*)<\/script>$/.exec(html)![1]!
      expect(() => new Function(script)).not.toThrow()
    }
  })

  it('falls back to system for a mode it does not know', () => {
    const script = getColorModeScript({ defaultMode: '"+alert(1)+"' as never })
    expect(script).toContain('m="system"')
    expect(script).not.toContain('alert')
  })
})

describe('server-only entry points', () => {
  const functions = (mod: Record<string, unknown>) =>
    Object.entries(mod).filter(([, value]) => typeof value === 'function')

  it('import in node with no DOM and export functions', () => {
    expect(functions(core).length).toBeGreaterThan(10)
    expect(functions(theme).length).toBeGreaterThan(10)
    expect(typeof window).toBe('undefined')
  })

  it('runs applyQuery and parseQuerySearchParams', () => {
    const query = core.parseQuerySearchParams('page=1&size=2', { columns: userColumns })
    expect(query.pageIndex).toBe(0)
    expect(query.pageSize).toBe(2)
    const result = core.applyQuery(
      users,
      { ...query, sorting: [{ id: 'score', desc: true }] },
      { columns: userColumns, timeZone: 'Australia/Sydney' },
    )
    expect(result.total).toBe(users.length)
    expect(result.rows.map((row) => row.name)).toEqual(['Ada Lovelace', 'Katherine Johnson'])
  })

  it('runs createThemeCss and the colour utilities', () => {
    const css = theme.createThemeCss({ primary: '#e11d48' }, { layer: 'tenant' })
    expect(css).toContain('@layer tenant {')
    expect(theme.contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(theme.parseColor('not a colour')).toBeNull()
    expect(theme.getThemePreset('shining')?.id).toBe('shining')
    expect(Object.keys(theme.generateColors({ primary: '#06b6d4' }, 'subtle', 'dark')).length).toBeGreaterThan(30)
  })
})

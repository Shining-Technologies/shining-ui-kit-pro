// @vitest-environment node
/*
 * Server rendering. Every test here runs with no `window`, no `document` and no
 * `localStorage` — the environment a Next.js App Router server component tree
 * renders client components in. A throw here is a 500 on the first request.
 */
import { ProjectRegistry, createProject } from '@shining-technologies/ui-kit-core'
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  ColorModeToggle,
  DropdownMenuItem,
  Pagination,
  ProjectEditor,
  ProjectSwitcher,
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
  TokenSwatchGrid,
  UIKitProvider,
  type SidebarNavEntry,
} from '@shining-technologies/ui-kit-react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

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
          footer={
            <SidebarUser name="Ana Ortiz" menu={<DropdownMenuItem>Sign out</DropdownMenuItem>} />
          }
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

describe('server rendering', () => {
  it('has no DOM to lean on', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })

  it('renders a provider with zero props', () => {
    const html = renderToString(
      <UIKitProvider>
        <p>hello</p>
      </UIKitProvider>,
    )
    expect(html).toContain('data-sui-project="shining"')
    expect(html).toContain('--sui-primary')
  })

  it('renders a whole dashboard shell in local scope', () => {
    const html = renderToString(
      <UIKitProvider preset="darwind" brand="#be123c" defaultMode="system">
        <Dashboard />
      </UIKitProvider>,
    )
    expect(html).toContain('aria-current="page"')
    // The branch holding the current page is open in the server HTML already.
    expect(html).toContain('Open')
    expect(html).toContain('data-slot="sidebar"')
    // 'system' has nothing to follow on a server: the wrapper claims neither
    // mode, and a scoped stylesheet carries both palettes.
    expect(html).not.toContain('data-sui-mode=')
    expect(html).toContain('@media (prefers-color-scheme: dark)')
    // A phone gets the closed drawer from CSS until script can measure.
    expect(html).toContain('data-breakpoint-pending="true"')
    // The default breakpoint is in the stylesheet: no extra <style> for it.
    expect(html).not.toContain('data-sui-breakpoint')
  })

  it('does not claim the default breakpoint for a custom one', () => {
    const html = renderToString(
      <UIKitProvider>
        <Sidebar mobileBreakpoint="60rem" />
      </UIKitProvider>,
    )
    expect(html).not.toContain('data-breakpoint-pending')
  })

  it('ships a scoped media query for a custom breakpoint, with the nonce', () => {
    const html = renderToString(
      <UIKitProvider mode="light" nonce="r4nd0m">
        <AppShell>
          <Sidebar mobileBreakpoint="60rem" />
          <AppShellContent>page</AppShellContent>
        </AppShell>
      </UIKitProvider>,
    )
    const scope = /data-breakpoint-scope="([^"]+)"/.exec(html)?.[1]
    expect(scope).toBeTruthy()
    expect(html).toMatch(
      /<style data-sui-breakpoint="" nonce="r4nd0m">@media \(max-width: 60rem\)\{/,
    )
    // Scoped to this sidebar, for both the drawer and the shell's column.
    expect(html).toContain(`.sui-sidebar[data-breakpoint-scope="${scope}"]{position:fixed`)
    expect(html).toContain(`.sui-shell:has(> .sui-sidebar[data-breakpoint-scope="${scope}"])`)
    expect(html).toContain('visibility:hidden')
  })

  it('never lets a breakpoint end the stylesheet or the rule', () => {
    const html = renderToString(
      <UIKitProvider>
        <Sidebar mobileBreakpoint="1px){}</style><script>alert(1)</script>" />
      </UIKitProvider>,
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('data-sui-breakpoint')
    // A math function is fine.
    const calc = renderToString(
      <UIKitProvider>
        <Sidebar mobileBreakpoint="calc(40rem + 1px)" />
      </UIKitProvider>,
    )
    expect(calc).toContain('@media (max-width: calc(40rem + 1px))')
  })

  it('keeps a custom breakpoint without a provider working, just without a nonce', () => {
    const html = renderToString(<Sidebar mobileBreakpoint="60rem" />)
    expect(html).toMatch(/<style data-sui-breakpoint="">@media \(max-width: 60rem\)/)
  })

  it('renders the rail on the server', () => {
    const html = renderToString(
      <UIKitProvider>
        <Dashboard collapsed />
      </UIKitProvider>,
    )
    expect(html).toContain('data-collapsed="true"')
  })

  it('renders global scope without touching <html>', () => {
    const html = renderToString(
      <UIKitProvider preset="unn" scope="global" mode="dark">
        <Dashboard />
      </UIKitProvider>,
    )
    expect(html).toContain('data-slot="app-shell"')
  })

  it('stamps a CSP nonce on the server stylesheet', () => {
    const html = renderToString(
      <UIKitProvider preset="unn" scope="global" mode="light" nonce="r4nd0m">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(html).toMatch(/<style data-sui-root="" nonce="r4nd0m">/)
  })

  it('ships the global tokens in the HTML, so the first paint is not the default palette', () => {
    const dark = renderToString(
      <UIKitProvider preset="unn" scope="global" mode="dark">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(dark).toMatch(/<style data-sui-root="">:root:root:root:root\{--sui-/)
    expect(dark).toContain('color-scheme:dark')
    expect(dark).not.toContain('prefers-color-scheme')

    // 'system' cannot be resolved on a server: both halves, behind the query.
    const system = renderToString(
      <UIKitProvider preset="unn" scope="global">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(system).toContain('@media (prefers-color-scheme: dark)')
    expect(system).toContain('color-scheme:light')
    expect(system).toContain('color-scheme:dark')
  })

  it('never lets a stored token value close the <style> element', () => {
    const hostile = createProject({
      name: 'Hostile',
      seed: { primary: '#7c3aed' },
      overrides: { colors: { headerBackground: '</style><script>alert(1)</script>' } },
    })
    const html = renderToString(
      <UIKitProvider project={hostile} scope="global">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toMatch(/<\/style><script/)
  })

  it('keeps an explicit mode in local scope inline on the wrapper, with no stylesheet', () => {
    for (const mode of ['light', 'dark'] as const) {
      const html = renderToString(
        <UIKitProvider preset="unn" mode={mode}>
          <p>page</p>
        </UIKitProvider>,
      )
      expect(html).not.toContain('<style')
      expect(html).toContain(`data-sui-mode="${mode}"`)
      expect(html).toMatch(/<div[^>]*style="[^"]*--sui-primary/)
    }
  })

  it('ships both palettes for local scope in system mode, scoped to the wrapper', () => {
    const html = renderToString(
      <UIKitProvider preset="unn" nonce="r4nd0m" style={{ minHeight: 10 }}>
        <p>page</p>
      </UIKitProvider>,
    )
    const id = /data-sui-scope-id="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    const selector = `.sui-scope[data-sui-scope-id="${id}"]`
    expect(html).toContain(`<style data-sui-scope-sheet="" nonce="r4nd0m">${selector}{--sui-`)
    expect(html).toContain(`@media (prefers-color-scheme: dark){${selector}{--sui-`)
    expect(html).toContain('color-scheme:light')
    expect(html).toContain('color-scheme:dark')
    // The tokens are not inline, where they would outrank the media query;
    // the app's own style still is.
    expect(html).toMatch(/<div[^>]*style="min-height:10px"/)
    expect(html).not.toContain('data-sui-mode=')
    expect(html).not.toMatch(/class="sui-scope dark/)
  })

  it('never lets a stored token value close the local scope <style> either', () => {
    const hostile = createProject({
      name: 'Hostile',
      seed: { primary: '#7c3aed' },
      overrides: { colors: { headerBackground: '</style><script>alert(1)</script>' } },
    })
    const html = renderToString(
      <UIKitProvider project={hostile}>
        <p>page</p>
      </UIKitProvider>,
    )
    expect(html).toContain('data-sui-scope-sheet')
    expect(html).not.toContain('<script>')
  })

  it('carries a global provider style in the server stylesheet', () => {
    const html = renderToString(
      <UIKitProvider preset="unn" scope="global" mode="light" style={{ scrollPaddingTop: 64 }}>
        <p>page</p>
      </UIKitProvider>,
    )
    expect(html).toContain('scroll-padding-top:64px')
  })

  it('renders the project UI with a registry, which has no storage on a server', () => {
    const registry = new ProjectRegistry()
    registry.create(createProject({ name: 'Acme', seed: { primary: '#7c3aed' } }))
    const html = renderToString(
      <UIKitProvider registry={registry}>
        <ProjectSwitcher footer={<DropdownMenuItem>New</DropdownMenuItem>} />
        <ProjectEditor />
        <TokenSwatchGrid />
      </UIKitProvider>,
    )
    expect(html).toContain('Create project')
  })
})

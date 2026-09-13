/*
 * Regression tests from the audit of the shell and the sidebar: hydration,
 * stored state that has gone bad, URL matching, and keyboard handling in the
 * drawer and the rail.
 *
 * V2 has no provider, project registry or theme editor; the tests that only
 * exercised those are gone, and the rest render without a provider wrapper.
 */
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  ColorModeToggle,
  Sidebar,
  SidebarBrand,
  SidebarNav,
  SidebarProvider,
  SidebarTrigger,
  SidebarUser,
  matchSidebarPath,
  type SidebarLinkProps,
  type SidebarNavEntry,
} from '@shining-technologies/ui'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

const NAV: SidebarNavEntry[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    items: [
      {
        id: 'orders',
        label: 'Orders',
        href: '/orders',
        children: [
          { id: 'open', label: 'Open', href: '/orders/open' },
          { id: 'closed', label: 'Closed', href: '/orders/closed' },
        ],
      },
      { id: 'billing', label: 'Billing', children: [{ id: 'invoices', label: 'Invoices' }] },
    ],
  },
]

const roots: Root[] = []

/**
 * Render `ui` to a string as a server would — before `prepare` puts anything
 * in the browser's storage — then hydrate it, and report every hydration
 * complaint React makes.
 */
function hydrate(ui: ReactElement, prepare: () => void = () => {}) {
  const html = renderToString(ui)
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  prepare()
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  act(() => {
    roots.push(hydrateRoot(container, ui, { onRecoverableError: (e) => console.error(e) }))
  })
  const complaints = error.mock.calls
    .map((call) => call.map(String).join(' '))
    .filter((message) => /hydrat|did not match|server HTML/i.test(message))
  error.mockRestore()
  return { container, complaints }
}

afterEach(() => {
  // V2 portals overlays into <body> rather than a provider scope, so unmount
  // before emptying the body, or React cannot find the portal's nodes.
  cleanup()
  act(() => roots.splice(0).forEach((root) => root.unmount()))
  document.body.innerHTML = ''
  window.localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.className = ''
  vi.restoreAllMocks()
})

/* --------------------------------------------------------------- hydration */

describe('hydrating server HTML', () => {
  it('restores the remembered rail and branches without a hydration mismatch', () => {
    const ui = (
      <Sidebar storageKey="nav">
        <SidebarNav items={NAV} />
      </Sidebar>
    )
    const { container, complaints } = hydrate(ui, () => {
      window.localStorage.setItem('nav:collapsed', 'true')
      window.localStorage.setItem('nav:expanded', '["billing"]')
    })
    expect(complaints).toEqual([])
    // The stored state still arrives, straight after hydration.
    const panel = container.querySelector('[data-slot="sidebar"]')
    expect(panel).toHaveAttribute('data-collapsed')
    expect(panel).not.toHaveAttribute('data-breakpoint-pending')
  })

  it('opens remembered branches once hydrated', () => {
    const ui = (
      <SidebarProvider storageKey="nav">
        <SidebarNav items={NAV} />
      </SidebarProvider>
    )
    const { container, complaints } = hydrate(ui, () => {
      window.localStorage.setItem('nav:expanded', '["billing"]')
    })
    expect(complaints).toEqual([])
    expect(within(container).getByRole('button', { name: 'Billing' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})

/* ------------------------------------------------------------ stored state */

describe('stored state that has gone bad', () => {
  it('ignores a remembered rail value that is not a boolean', () => {
    window.localStorage.setItem('nav:collapsed', '"yes"')
    window.localStorage.setItem('nav:expanded', '{"not":"an array"}')
    render(
      <Sidebar storageKey="nav">
        <SidebarNav items={NAV} />
      </Sidebar>,
    )
    expect(screen.getByRole('complementary')).not.toHaveAttribute('data-collapsed')
    expect(screen.getByRole('button', { name: 'Billing' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

/* ------------------------------------------------------------ URL matching */

describe('matchSidebarPath', () => {
  const entries: SidebarNavEntry[] = [
    { id: 'placeholder', label: 'Soon', href: '#' },
    { id: 'tab', label: 'Tab', href: '?tab=2' },
    { id: 'root', label: 'Home', href: '/' },
    { id: 'orders', label: 'Orders', href: '/orders/' },
    { id: 'open', label: 'Open', href: '/orders/open?status=open' },
    { id: 'hash', label: 'Hash', href: '#/reports' },
  ]

  it('never matches every page through a `#` or query-only href', () => {
    expect(matchSidebarPath(entries, '/settings')).toBeUndefined()
  })

  it('normalises trailing slashes, queries, fragments and a full URL', () => {
    expect(matchSidebarPath(entries, '/orders')).toBe('orders')
    expect(matchSidebarPath(entries, '/orders//')).toBe('orders')
    expect(matchSidebarPath(entries, '/orders/open/')).toBe('open')
    expect(matchSidebarPath(entries, '/orders/42?x=1#top')).toBe('orders')
    expect(matchSidebarPath(entries, 'https://app.test/orders/open?y')).toBe('open')
    expect(matchSidebarPath(entries, 'https://app.test')).toBe('root')
    expect(matchSidebarPath(entries, '/')).toBe('root')
    expect(matchSidebarPath(entries, '/?q=1')).toBe('root')
  })

  it('matches hash routes', () => {
    expect(matchSidebarPath(entries, '#/reports/2024')).toBe('hash')
  })
})

/* ------------------------------------------------------------------- rail */

describe('the rail', () => {
  it('reaches the page of a branch that is also a link, from its flyout', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar collapsed>
        <SidebarNav items={NAV} currentPath="/orders" />
      </Sidebar>,
    )
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    const flyout = await screen.findByRole('dialog')
    expect(within(flyout).getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/orders')
    expect(within(flyout).getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('moves through a flyout with the arrows instead of jumping back to the rail', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar collapsed>
        <SidebarNav items={NAV} />
      </Sidebar>,
    )
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    const flyout = await screen.findByRole('dialog')
    const [self, open, closed] = within(flyout).getAllByRole('link')
    self!.focus()
    fireEvent.keyDown(self!, { key: 'ArrowDown' })
    expect(open).toHaveFocus()
    fireEvent.keyDown(open!, { key: 'ArrowDown' })
    expect(closed).toHaveFocus()
    fireEvent.keyDown(closed!, { key: 'Home' })
    expect(self).toHaveFocus()
  })
})

/* ----------------------------------------------------------------- drawer */

describe('the drawer', () => {
  function mobile() {
    return vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    )
  }

  it('keeps Tab inside while open, and returns focus to the trigger on close', async () => {
    mobile()
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <SidebarNav items={NAV} />
        </Sidebar>
        <button type="button">Behind the backdrop</button>
      </SidebarProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    // Open, it is a modal dialog rather than a landmark.
    const aside = screen.getByRole('dialog', { name: 'Navigation' })
    expect(aside).toHaveFocus()

    const links = within(aside).getAllByRole('link')
    const tabbable = within(aside).getAllByRole('button').concat(links)
    const last = within(aside).getByRole('button', { name: 'Billing' })
    last.focus()
    await user.tab()
    expect(aside.contains(document.activeElement)).toBe(true)
    expect(tabbable).toContain(document.activeElement)
    expect(screen.getByRole('button', { name: 'Behind the backdrop' })).not.toHaveFocus()

    await user.tab({ shift: true })
    expect(last).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(aside).not.toHaveAttribute('data-open')
    expect(trigger).toHaveFocus()
  })

  function Shell({ label }: { label?: string }) {
    return (
      <SidebarProvider>
        <a href="#main">Skip</a>
        <AppShell>
          <Sidebar aria-label={label} header={<SidebarBrand name="Acme" />}>
            <SidebarNav items={NAV} />
          </Sidebar>
          <AppShellHeader start={<SidebarTrigger />} />
          <AppShellContent>
            <button type="button">In the page</button>
          </AppShellContent>
        </AppShell>
      </SidebarProvider>
    )
  }

  it('is a named modal dialog while open, and a landmark again once closed', async () => {
    mobile()
    const user = userEvent.setup()
    const { rerender } = render(<Shell />)
    const aside = screen.getByRole('complementary', { name: 'Sidebar' })
    expect(aside).not.toHaveAttribute('aria-modal')

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(aside).toHaveAttribute('role', 'dialog')
    expect(aside).toHaveAttribute('aria-modal', 'true')
    // Named after the brand in its header.
    expect(screen.getByRole('dialog', { name: 'Acme' })).toBe(aside)
    expect(await axe(document.body)).toHaveNoViolations()

    // An explicit label wins over the brand.
    rerender(<Shell label="Site menu" />)
    expect(screen.getByRole('dialog', { name: 'Site menu' })).toBe(aside)

    await user.keyboard('{Escape}')
    expect(aside).toHaveAttribute('role', 'complementary')
    expect(aside).not.toHaveAttribute('aria-modal')
  })

  it('makes the rest of the page inert and locks body scroll, then restores both exactly', async () => {
    mobile()
    const user = userEvent.setup()
    document.body.style.overflow = 'clip'
    const { container } = render(<Shell />)
    const header = container.querySelector('.sui-shell__header')!
    const content = container.querySelector('main')!
    const skip = screen.getByRole('link', { name: 'Skip' })
    // Something the app had made inert already stays the app's.
    const appInert = document.createElement('div')
    appInert.setAttribute('inert', '')
    document.body.append(appInert)

    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    const aside = screen.getByRole('dialog')
    for (const outside of [header, content, skip]) expect(outside).toHaveAttribute('inert')
    expect(aside).not.toHaveAttribute('inert')
    expect(aside.closest('[inert]')).toBeNull()
    // The backdrop must still take the click that closes.
    const backdrop = container.querySelector('.sui-sidebar__backdrop')!
    expect(backdrop).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(backdrop)
    expect(aside).not.toHaveAttribute('data-open')
    for (const outside of [header, content, skip]) expect(outside).not.toHaveAttribute('inert')
    expect(appInert).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('clip')
    expect(trigger).toHaveFocus()
    document.body.style.removeProperty('overflow')
  })

  it('releases the page when it unmounts while open', async () => {
    mobile()
    const user = userEvent.setup()
    const { container, unmount } = render(<Shell />)
    const content = container.querySelector('main')!
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(content).toHaveAttribute('inert')
    unmount()
    expect(content).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
  })

  it('returns focus to the trigger even when opening it did not focus it', () => {
    mobile()
    render(<Shell />)
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    // Safari does not focus a clicked button.
    act(() => trigger.click())
    expect(document.activeElement).not.toBe(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveFocus()
  })

  it('leaves the desktop layout alone: no dialog role, nothing inert, no scroll lock', () => {
    render(<Shell />)
    const aside = screen.getByRole('complementary', { name: 'Sidebar' })
    expect(aside).not.toHaveAttribute('aria-modal')
    expect(document.querySelector('[inert]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})

/* ---------------------------------------------------------------- shortcut */

describe('the shortcut', () => {
  it('ignores a keydown with no key, which Chrome autofill dispatches', () => {
    render(<Sidebar shortcut="b" />)
    const errors: unknown[] = []
    const onError = (event: ErrorEvent) => errors.push(event.error)
    window.addEventListener('error', onError)
    const event = new KeyboardEvent('keydown', { ctrlKey: true })
    Object.defineProperty(event, 'key', { value: undefined })
    expect(() => window.dispatchEvent(event)).not.toThrow()
    window.removeEventListener('error', onError)
    expect(errors).toEqual([])
  })
})

/* ------------------------------------------------------- colour mode toggle */

/*
 * V1's ColorModeToggle was a light/dark/system radio group driven by
 * UIKitProvider, and these tests covered its roving tab stop. V2's is a single
 * provider-free button, so they now cover that button, in the shell header.
 */
describe('ColorModeToggle keyboard', () => {
  function renderToggle(props: Parameters<typeof ColorModeToggle>[0] = {}) {
    render(
      <SidebarProvider>
        <AppShell>
          <AppShellHeader end={<ColorModeToggle {...props} />} />
          <AppShellContent>page</AppShellContent>
        </AppShell>
      </SidebarProvider>,
    )
  }

  it('is a single tab stop, named for what it will do', async () => {
    const user = userEvent.setup()
    renderToggle({ defaultMode: 'light' })
    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' })
    await user.tab()
    expect(toggle).toHaveFocus()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('switches with Enter and Space, puts .dark on <html>, and remembers the choice', async () => {
    const user = userEvent.setup()
    renderToggle({ defaultMode: 'light' })
    const root = document.documentElement
    screen.getByRole('button', { name: 'Switch to dark mode' }).focus()

    await user.keyboard('{Enter}')
    const toggle = screen.getByRole('button', { name: 'Switch to light mode' })
    expect(toggle).toHaveFocus()
    expect(root.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('sui-color-mode')).toBe('dark')

    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toHaveFocus()
    expect(root.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('sui-color-mode')).toBe('light')
  })

  it('only reports the next mode when it is controlled', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    renderToggle({ mode: 'dark', onModeChange, labels: { toLight: 'Go light' } })
    await user.click(screen.getByRole('button', { name: 'Go light' }))
    expect(onModeChange).toHaveBeenCalledWith('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('sui-color-mode')).toBeNull()
    expect(screen.getByRole('button', { name: 'Go light' })).toBeInTheDocument()
  })
})

/* ------------------------------------------------- Sidebar under a provider */

describe('Sidebar under a SidebarProvider', () => {
  it('warns in development about the state props it ignores', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <SidebarProvider>
        <Sidebar storageKey="nav" collapsed>
          <SidebarNav items={NAV} />
        </Sidebar>
      </SidebarProvider>,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]![0])).toMatch(/collapsed, storageKey ignored/)
    // The provider stays the source of truth.
    expect(screen.getByRole('complementary')).not.toHaveAttribute('data-collapsed')
  })

  it('does not warn for a standalone Sidebar, or for props that are not state', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Sidebar storageKey="nav" collapsed />)
    cleanup()
    render(
      <SidebarProvider>
        <Sidebar nonce="n" width="18rem" aria-label="Site" />
      </SidebarProvider>,
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("applies the nonce with the provider's breakpoint", () => {
    const html = renderToString(
      <SidebarProvider mobileBreakpoint="60rem">
        <Sidebar nonce="abc" />
      </SidebarProvider>,
    )
    expect(html).toMatch(/<style data-sui-breakpoint="" nonce="abc">@media \(max-width: 60rem\)/)
  })
})

/* -------------------------------------------------------- nav: accordion */

describe('SidebarNav accordion mode', () => {
  const AREAS: SidebarNavEntry[] = [
    {
      type: 'section',
      id: 'a',
      label: 'Area A',
      items: [
        { id: 'a1', label: 'A one', children: [{ id: 'a1x', label: 'A one child' }] },
        { id: 'a2', label: 'A two', children: [{ id: 'a2x', label: 'A two child' }] },
      ],
    },
    {
      type: 'section',
      id: 'b',
      label: 'Area B',
      items: [{ id: 'b1', label: 'B one', children: [{ id: 'b1x', label: 'B one child' }] }],
    },
  ]

  it('keeps one branch open per section, not one per nav', async () => {
    const user = userEvent.setup()
    render(<SidebarNav items={AREAS} accordion />)
    const branch = (name: string) => screen.getByRole('button', { name })
    await user.click(branch('A one'))
    await user.click(branch('B one'))
    expect(branch('A one')).toHaveAttribute('aria-expanded', 'true')
    expect(branch('B one')).toHaveAttribute('aria-expanded', 'true')

    await user.click(branch('A two'))
    expect(branch('A one')).toHaveAttribute('aria-expanded', 'false')
    expect(branch('A two')).toHaveAttribute('aria-expanded', 'true')
    expect(branch('B one')).toHaveAttribute('aria-expanded', 'true')
  })
})

/* ------------------------------------------------ nav: trail opens sections */

describe('the active trail and folded sections', () => {
  const FOLDED: SidebarNavEntry[] = [
    { id: 'home', label: 'Home', href: '/' },
    {
      type: 'section',
      id: 'admin',
      label: 'Admin',
      collapsible: true,
      defaultCollapsed: true,
      items: [{ id: 'users', label: 'Users', href: '/admin/users' }],
    },
  ]

  it('opens a folded section holding the current page, in server HTML too', () => {
    expect(renderToString(<SidebarNav items={FOLDED} currentPath="/admin/users" />)).toContain(
      'href="/admin/users"',
    )
    render(<SidebarNav items={FOLDED} currentPath="/" />)
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('opens it when the current page moves into it, once', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SidebarNav items={FOLDED} currentPath="/" />)
    rerender(<SidebarNav items={[...FOLDED]} currentPath="/admin/users" />)
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Admin' }))
    rerender(<SidebarNav items={[...FOLDED]} currentPath="/admin/users" />)
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })
})

/* ---------------------------------------------------- nav: search announces */

describe('SidebarNav search announcements', () => {
  it('announces through a live region that exists before anything is typed', async () => {
    const user = userEvent.setup()
    render(<SidebarNav items={NAV} searchable />)
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'open')
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('1 result')

    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(status).toHaveTextContent('Nothing matches')
    expect(screen.getAllByRole('status')).toHaveLength(1)

    await user.clear(screen.getByRole('searchbox'))
    expect(status).toBeEmptyDOMElement()
  })

  it('takes a custom results message', async () => {
    const user = userEvent.setup()
    render(<SidebarNav items={NAV} searchable resultsMessage={(count) => `${count} pages found`} />)
    await user.type(screen.getByRole('searchbox'), 'o')
    expect(screen.getByRole('status')).toHaveTextContent(/^\d+ pages found$/)
  })
})

/* ------------------------------------------------- Sidebar renderLink */

describe('Sidebar renderLink', () => {
  const routerLink = ({ href, ...props }: SidebarLinkProps) => <a data-router="" href={href} {...props} />

  it('renders the brand, the account and the nav links through it', () => {
    render(
      <Sidebar
        renderLink={routerLink}
        header={<SidebarBrand name="Acme" href="/" />}
        footer={<SidebarUser name="Ana Ortiz" href="/account" />}
      >
        <SidebarNav items={NAV} />
      </Sidebar>,
    )
    expect(screen.getByRole('link', { name: /Acme/ })).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: /Ana Ortiz/ })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('link', { name: /Ana Ortiz/ })).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router')
  })

  it("gives way to a SidebarNav's own renderLink, and leaves plain anchors without one", () => {
    render(
      <Sidebar renderLink={routerLink} header={<SidebarBrand name="Acme" href="/" />}>
        <SidebarNav items={NAV} renderLink={(props) => <a data-nav="" {...props} />} />
      </Sidebar>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-nav')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('data-router')
    cleanup()
    render(<Sidebar header={<SidebarBrand name="Acme" href="/" />} />)
    expect(screen.getByRole('link', { name: /Acme/ })).not.toHaveAttribute('data-router')
  })
})

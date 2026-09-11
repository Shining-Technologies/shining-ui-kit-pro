/*
 * Regression tests from the audit of the shell, the sidebar and the project
 * system: hydration, shared `<html>`, stored state that has gone bad, URL
 * matching, and keyboard handling in the drawer and the rail.
 */
import {
  ProjectRegistry,
  createProject,
  paletteById,
  resolveProject,
  type ProjectStorage,
} from '@shining-technologies/ui-kit-core'
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
  UIKitProvider,
  matchSidebarPath,
  useUIKit,
  type ColorModePreference,
  type SidebarNavEntry,
} from '@shining-technologies/ui-kit-react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
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

function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

function memoryStorage(initial: Record<string, string> = {}): ProjectStorage {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

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
  act(() => roots.splice(0).forEach((root) => root.unmount()))
  document.body.innerHTML = ''
  window.localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.className = ''
  for (const key of ['suiMode', 'suiProject', 'suiDensity'])
    delete document.documentElement.dataset[key]
  vi.restoreAllMocks()
})

/* --------------------------------------------------------------- hydration */

describe('hydrating server HTML', () => {
  it('restores the remembered rail and branches without a hydration mismatch', () => {
    const ui = (
      <Themed>
        <Sidebar storageKey="nav">
          <SidebarNav items={NAV} />
        </Sidebar>
      </Themed>
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
      <Themed>
        <SidebarProvider storageKey="nav">
          <SidebarNav items={NAV} />
        </SidebarProvider>
      </Themed>
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

  it('paints the registry project restored from storage without a mismatch', () => {
    const storage = memoryStorage()
    const seeded = new ProjectRegistry({ storage })
    seeded.setActive('unn')

    // The server has no storage; the browser's registry restores `unn`.
    const server = new ProjectRegistry({ storage: null })
    const browser = new ProjectRegistry({ storage })
    expect(browser.getActiveId()).toBe('unn')
    expect(browser.getInitialActiveId()).toBe(server.getActiveId())

    const html = renderToString(
      <UIKitProvider registry={server}>
        <p>page</p>
      </UIKitProvider>,
    )
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    act(() => {
      roots.push(
        hydrateRoot(
          container,
          <UIKitProvider registry={browser}>
            <p>page</p>
          </UIKitProvider>,
        ),
      )
    })
    expect(error.mock.calls.map(String).filter((m) => /did not match/i.test(m))).toEqual([])
    expect(container.querySelector('.sui-scope')).toHaveAttribute('data-sui-project', 'unn')
  })

  it('drops the server stylesheet after hydrating global scope, and never renders it client-only', () => {
    const ui = (
      <UIKitProvider preset="unn" scope="global">
        <p>page</p>
      </UIKitProvider>
    )
    const { container, complaints } = hydrate(ui)
    expect(complaints).toEqual([])
    expect(container.querySelector('style')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--sui-radius')).toBe('1.25rem')

    const { container: client } = render(ui)
    expect(client.querySelector('style')).toBeNull()
  })
})

/* ----------------------------------------------------- global scope sharing */

describe('several global providers', () => {
  function Mode() {
    return <span data-testid="mode">{useUIKit().colorMode}</span>
  }

  it('lets the innermost win, and hands <html> back to the outer one on unmount', () => {
    const root = document.documentElement
    const outer = (inner: boolean) => (
      <UIKitProvider preset="darwind" scope="global" mode="light">
        {inner ? (
          <UIKitProvider preset="unn" scope="global" mode="dark">
            <Mode />
          </UIKitProvider>
        ) : (
          <Mode />
        )}
      </UIKitProvider>
    )
    const { rerender, unmount } = render(outer(true))
    expect(root).toHaveAttribute('data-sui-project', 'unn')
    expect(root.classList.contains('dark')).toBe(true)

    rerender(outer(false))
    expect(root).toHaveAttribute('data-sui-project', 'darwind')
    expect(root.classList.contains('dark')).toBe(false)
    // The outer provider's tokens are back, not merely absent.
    expect(root.style.getPropertyValue('--sui-primary')).toBe(
      resolveProject(paletteById.darwind!).light.colors!.primary,
    )

    unmount()
    expect(root.style.getPropertyValue('--sui-primary')).toBe('')
    expect(root.classList.contains('sui-scope')).toBe(false)
    expect(root).not.toHaveAttribute('data-sui-project')
  })

  it('restores what <html> had before, rather than deleting it', () => {
    const root = document.documentElement
    root.style.setProperty('--sui-radius', '3px')
    root.classList.add('dark')
    root.dataset.suiProject = 'app-owned'

    const { unmount } = render(
      <UIKitProvider preset="unn" scope="global" mode="light">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(root.style.getPropertyValue('--sui-radius')).toBe('1.25rem')
    expect(root.classList.contains('dark')).toBe(false)

    unmount()
    expect(root.style.getPropertyValue('--sui-radius')).toBe('3px')
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.dataset.suiProject).toBe('app-owned')
  })

  it('releases <html> when a provider switches from global to local scope', () => {
    const root = document.documentElement
    const { rerender } = render(
      <UIKitProvider preset="unn" scope="global">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(root.classList.contains('sui-scope')).toBe(true)
    rerender(
      <UIKitProvider preset="unn" scope="local">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(root.classList.contains('sui-scope')).toBe(false)
    expect(root.style.getPropertyValue('--sui-radius')).toBe('')
  })
})

/* ------------------------------------------------------------ stored state */

describe('stored state that has gone bad', () => {
  it('ignores a remembered rail value that is not a boolean', () => {
    window.localStorage.setItem('nav:collapsed', '"yes"')
    window.localStorage.setItem('nav:expanded', '{"not":"an array"}')
    render(
      <Themed>
        <Sidebar storageKey="nav">
          <SidebarNav items={NAV} />
        </Sidebar>
      </Themed>,
    )
    expect(screen.getByRole('complementary')).not.toHaveAttribute('data-collapsed')
    expect(screen.getByRole('button', { name: 'Billing' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('fills in a stored project that lacks a shape, and drops one with no usable colour', () => {
    const storage = memoryStorage({
      'shining-ui-kit:projects': JSON.stringify({
        version: 1,
        activeId: 'legacy',
        projects: [
          { id: 'legacy', seed: { primary: '#7c3aed', accent: 42 } },
          { id: 'broken', seed: { primary: 7 } },
          { id: 'odd', name: 'Odd', seed: { primary: '#123456' }, shape: { elevation: 'huge' } },
        ],
      }),
    })
    const registry = new ProjectRegistry({ storage })
    const legacy = registry.get('legacy')!
    expect(legacy.name).toBe('legacy')
    expect(legacy.shape.density).toBe('comfortable')
    expect(legacy.seed.accent).toBeUndefined()
    expect(registry.get('broken')).toBeUndefined()
    expect(() => resolveProject(legacy)).not.toThrow()
    expect(() => resolveProject(registry.get('odd')!)).not.toThrow()

    // And the provider renders it rather than taking the page down.
    render(
      <UIKitProvider registry={registry}>
        <p>page</p>
      </UIKitProvider>,
    )
    expect(document.querySelector('.sui-scope')).toHaveAttribute('data-sui-project', 'legacy')
  })

  it('falls back to the first preset for an unreadable active id', () => {
    const storage = memoryStorage({
      'shining-ui-kit:projects': JSON.stringify({ version: 1, projects: [], activeId: 5 }),
    })
    const registry = new ProjectRegistry({ storage })
    expect(registry.getActiveId()).toBe(registry.getInitialActiveId())
  })

  it('keeps imported ids unique within one import', () => {
    const registry = new ProjectRegistry({ storage: null })
    const imported = registry.import(
      JSON.stringify({
        version: 1,
        activeId: '',
        projects: [
          createProject({ id: 'acme', name: 'Acme', seed: { primary: '#111111' } }),
          createProject({ id: 'acme', name: 'Acme', seed: { primary: '#222222' } }),
        ],
      }),
    )
    expect(imported.map((p) => p.id)).toEqual(['acme', 'acme-2'])
  })

  it('does not rename imports to dodge projects that `replace` is discarding', () => {
    const registry = new ProjectRegistry({ storage: null })
    registry.create({ id: 'acme', name: 'Acme', seed: { primary: '#111111' } })
    const imported = registry.import(
      JSON.stringify({
        version: 1,
        activeId: '',
        projects: [createProject({ id: 'acme', name: 'Acme', seed: { primary: '#222222' } })],
      }),
      { replace: true },
    )
    expect(imported[0]!.id).toBe('acme')
    expect(registry.list().filter((p) => !p.builtIn)).toHaveLength(1)
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
      <Themed>
        <Sidebar collapsed>
          <SidebarNav items={NAV} currentPath="/orders" />
        </Sidebar>
      </Themed>,
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
      <Themed>
        <Sidebar collapsed>
          <SidebarNav items={NAV} />
        </Sidebar>
      </Themed>,
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
      <Themed>
        <SidebarProvider>
          <SidebarTrigger />
          <Sidebar>
            <SidebarNav items={NAV} />
          </Sidebar>
          <button type="button">Behind the backdrop</button>
        </SidebarProvider>
      </Themed>,
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
      <Themed>
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
      </Themed>
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
    render(
      <Themed>
        <Sidebar shortcut="b" />
      </Themed>,
    )
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

/* -------------------------------------------------------- project precedence */

describe('which project the provider paints', () => {
  function Picker() {
    const { setProject } = useUIKit()
    return (
      <button type="button" onClick={() => setProject('unn')}>
        Pick UNN
      </button>
    )
  }

  const painted = () => document.querySelector('.sui-scope')?.getAttribute('data-sui-project')

  it("restores the user's pick after a reload, even with a preset configured", async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    const first = render(
      <UIKitProvider registry={new ProjectRegistry({ storage })} preset="darwind">
        <Picker />
      </UIKitProvider>,
    )
    expect(painted()).toBe('darwind')
    await user.click(screen.getByRole('button', { name: 'Pick UNN' }))
    expect(painted()).toBe('unn')
    first.unmount()

    // A reload: a new registry over the same storage, the same props.
    render(
      <UIKitProvider registry={new ProjectRegistry({ storage })} preset="darwind" brand="#be123c">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(painted()).toBe('unn')
  })

  it('starts a first visit from preset and brand, or defaultProject', () => {
    const { unmount } = render(
      <UIKitProvider
        registry={new ProjectRegistry({ storage: memoryStorage() })}
        preset="unn"
        brand="#be123c"
      >
        <p>page</p>
      </UIKitProvider>,
    )
    expect(painted()).toBe('unn-custom')
    unmount()

    render(
      <UIKitProvider
        registry={new ProjectRegistry({ storage: memoryStorage(), initialProjectId: 'unn' })}
        defaultProject="darwind"
      >
        <p>page</p>
      </UIKitProvider>,
    )
    expect(painted()).toBe('darwind')
  })

  it('does not mistake a persisted default for a pick', () => {
    const storage = memoryStorage()
    // Writing for any other reason persists the state, but not as a choice.
    new ProjectRegistry({ storage }).create({ name: 'Acme', seed: { primary: '#7c3aed' } })
    const reloaded = new ProjectRegistry({ storage })
    expect(reloaded.getChosenActiveId()).toBeUndefined()
    render(
      <UIKitProvider registry={reloaded} preset="darwind">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(painted()).toBe('darwind')
  })

  it('still lets the `project` prop win over a persisted pick', () => {
    const storage = memoryStorage()
    new ProjectRegistry({ storage }).setActive('unn')
    render(
      <UIKitProvider registry={new ProjectRegistry({ storage })} project="darwind">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(painted()).toBe('darwind')
  })

  it('hydrates what the server painted for the preset, then restores the pick', () => {
    const storage = memoryStorage()
    new ProjectRegistry({ storage }).setActive('unn')
    const server = new ProjectRegistry({ storage: null })
    const browser = new ProjectRegistry({ storage })

    const html = renderToString(
      <UIKitProvider registry={server} preset="darwind">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(html).toContain('data-sui-project="darwind"')
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    act(() => {
      roots.push(
        hydrateRoot(
          container,
          <UIKitProvider registry={browser} preset="darwind">
            <p>page</p>
          </UIKitProvider>,
        ),
      )
    })
    expect(error.mock.calls.map(String).filter((m) => /did not match|hydrat/i.test(m))).toEqual([])
    expect(container.querySelector('.sui-scope')).toHaveAttribute('data-sui-project', 'unn')
  })
})

describe('ProjectRegistry initial project', () => {
  it('applies initialProjectId on first load only, not over a restored pick', () => {
    const storage = memoryStorage()
    const first = new ProjectRegistry({ storage, initialProjectId: 'darwind' })
    expect(first.getActiveId()).toBe('darwind')
    expect(first.getChosenActiveId()).toBeUndefined()
    first.setActive('unn')

    const reloaded = new ProjectRegistry({ storage, initialProjectId: 'darwind' })
    expect(reloaded.getActiveId()).toBe('unn')
    expect(reloaded.getChosenActiveId()).toBe('unn')
    expect(reloaded.getInitialActiveId()).toBe('darwind')
  })

  it('counts re-selecting the initial project as a pick', () => {
    const storage = memoryStorage()
    new ProjectRegistry({ storage, initialProjectId: 'darwind' }).setActive('darwind')
    expect(new ProjectRegistry({ storage }).getActiveId()).toBe('darwind')
  })

  it('falls back to initialProjectId for a restored id that no longer exists', () => {
    const storage = memoryStorage({
      'shining-ui-kit:projects': JSON.stringify({ version: 1, projects: [], activeId: 'gone' }),
    })
    const registry = new ProjectRegistry({ storage, initialProjectId: 'unn' })
    expect(registry.getActiveId()).toBe('unn')
    expect(registry.getActive().id).toBe('unn')
  })

  it('reset() and remove() go back to the initial project, not the first built-in', () => {
    const registry = new ProjectRegistry({ storage: null, initialProjectId: 'unn' })
    const acme = registry.create({ name: 'Acme', seed: { primary: '#7c3aed' } })
    registry.setActive(acme.id)
    registry.remove(acme.id)
    expect(registry.getActiveId()).toBe('unn')
    expect(registry.getChosenActiveId()).toBeUndefined()

    registry.setActive('darwind')
    registry.reset()
    expect(registry.getActiveId()).toBe('unn')
    expect(registry.getChosenActiveId()).toBeUndefined()
  })
})

/* ----------------------------------------------- className/style in global */

describe('className and style in global scope', () => {
  const root = () => document.documentElement

  it('puts them on <html>, and takes back only what it added', () => {
    root().classList.add('app-owned')
    root().style.setProperty('padding', '1px')
    const style = { backgroundColor: 'red', padding: 4, opacity: 0.5, '--brand-x': '1' }
    const { unmount } = render(
      <UIKitProvider
        preset="unn"
        scope="global"
        className="themed app-owned"
        style={style as CSSProperties}
      >
        <p>page</p>
      </UIKitProvider>,
    )
    expect(root().classList.contains('themed')).toBe(true)
    expect(root().style.getPropertyValue('background-color')).toBe('red')
    expect(root().style.getPropertyValue('padding')).toBe('4px')
    expect(root().style.getPropertyValue('opacity')).toBe('0.5')
    expect(root().style.getPropertyValue('--brand-x')).toBe('1')

    unmount()
    expect(root().classList.contains('themed')).toBe(false)
    // The app set this one before the provider did; it is still the app's.
    expect(root().classList.contains('app-owned')).toBe(true)
    expect(root().style.getPropertyValue('background-color')).toBe('')
    expect(root().style.getPropertyValue('padding')).toBe('1px')
    expect(root().style.getPropertyValue('--brand-x')).toBe('')
  })

  it('updates them individually when the props change', () => {
    const ui = (className: string, style: CSSProperties) => (
      <UIKitProvider preset="unn" scope="global" className={className} style={style}>
        <p>page</p>
      </UIKitProvider>
    )
    const { rerender } = render(ui('one', { color: 'red', margin: '2px' }))
    expect(root().style.getPropertyValue('margin')).toBe('2px')
    rerender(ui('two', { color: 'blue' }))
    expect(root().classList.contains('one')).toBe(false)
    expect(root().classList.contains('two')).toBe(true)
    expect(root().style.getPropertyValue('color')).toBe('blue')
    expect(root().style.getPropertyValue('margin')).toBe('')
  })

  it('lets the innermost global provider win, and hands back to the outer one', () => {
    const tree = (inner: boolean) => (
      <UIKitProvider preset="darwind" scope="global" className="outer" style={{ color: 'red' }}>
        {inner ? (
          <UIKitProvider preset="unn" scope="global" className="inner" style={{ color: 'blue' }}>
            <p>page</p>
          </UIKitProvider>
        ) : (
          <p>page</p>
        )}
      </UIKitProvider>
    )
    const { rerender, unmount } = render(tree(true))
    expect(root().classList.contains('inner')).toBe(true)
    expect(root().classList.contains('outer')).toBe(false)
    expect(root().style.getPropertyValue('color')).toBe('blue')

    rerender(tree(false))
    expect(root().classList.contains('inner')).toBe(false)
    expect(root().classList.contains('outer')).toBe(true)
    expect(root().style.getPropertyValue('color')).toBe('red')

    unmount()
    expect(root().classList.contains('outer')).toBe(false)
    expect(root().style.getPropertyValue('color')).toBe('')
  })

  it('cannot use className to take the mode classes away from the provider', () => {
    const { unmount } = render(
      <UIKitProvider preset="unn" scope="global" mode="light" className="dark">
        <p>page</p>
      </UIKitProvider>,
    )
    expect(root().classList.contains('dark')).toBe(false)
    unmount()
    expect(root().classList.contains('sui-scope')).toBe(false)
  })
})

/* ------------------------------------------------------- colour mode toggle */

describe('ColorModeToggle keyboard', () => {
  function renderToggle(modes?: ColorModePreference[], defaultMode: ColorModePreference = 'light') {
    render(
      <UIKitProvider preset="unn" defaultMode={defaultMode}>
        <ColorModeToggle modes={modes} />
      </UIKitProvider>,
    )
    const radio = (name: string) => screen.queryByRole('radio', { name })!
    return { light: radio('Light'), dark: radio('Dark'), system: radio('System') }
  }

  it('is a single tab stop, on the checked radio', () => {
    const { light, dark, system } = renderToggle()
    expect(light).toHaveAttribute('tabindex', '0')
    expect(dark).toHaveAttribute('tabindex', '-1')
    expect(system).toHaveAttribute('tabindex', '-1')
  })

  it('moves and selects with the arrows, wrapping, and jumps with Home and End', () => {
    const { light, dark, system } = renderToggle()
    light.focus()
    fireEvent.keyDown(light, { key: 'ArrowRight' })
    expect(dark).toHaveFocus()
    expect(dark).toHaveAttribute('aria-checked', 'true')
    expect(dark).toHaveAttribute('tabindex', '0')
    expect(light).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(dark, { key: 'ArrowDown' })
    expect(system).toHaveFocus()
    expect(system).toHaveAttribute('aria-checked', 'true')

    fireEvent.keyDown(system, { key: 'ArrowRight' })
    expect(light).toHaveFocus()
    expect(light).toHaveAttribute('aria-checked', 'true')

    fireEvent.keyDown(light, { key: 'ArrowLeft' })
    expect(system).toHaveFocus()
    fireEvent.keyDown(system, { key: 'Home' })
    expect(light).toHaveFocus()
    fireEvent.keyDown(light, { key: 'End' })
    expect(system).toHaveFocus()
    expect(system).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(system, { key: 'ArrowUp' })
    expect(dark).toHaveFocus()
    expect(dark).toHaveAttribute('aria-checked', 'true')
  })

  it('puts the tab stop on the first radio when the current mode is not offered', () => {
    const { light, dark } = renderToggle(['light', 'dark'], 'system')
    expect(light).toHaveAttribute('tabindex', '0')
    expect(dark).toHaveAttribute('tabindex', '-1')
  })
})

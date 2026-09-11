import {
  DropdownMenuItem,
  Sidebar,
  SidebarBrand,
  SidebarMenu,
  SidebarMenuItem,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarTrigger,
  SidebarUser,
  UIKitProvider,
  getSidebarTrail,
  matchSidebarPath,
  type SidebarNavEntry,
} from '@shining-technologies/ui-kit-react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

const NAV: SidebarNavEntry[] = [
  { id: 'home', label: 'Home', href: '/', icon: '⌂' },
  {
    type: 'section',
    id: 'marketing',
    label: 'Marketing',
    tone: 'chart-2',
    items: [
      { id: 'leads', label: 'Leads', href: '/leads', badge: 4 },
      { id: 'email', label: 'Email', href: '/email', keywords: ['newsletter'] },
    ],
  },
  { type: 'separator' },
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    collapsible: true,
    items: [
      {
        id: 'residential',
        label: 'Residential',
        children: [
          { id: 'res-dash', label: 'Dashboard', href: '/residential' },
          {
            id: 'res-orders',
            label: 'Orders',
            children: [
              {
                id: 'res-orders-open',
                label: 'Open orders',
                href: '/residential/orders/open',
                children: [{ id: 'res-deep', label: 'Deepest', href: '/residential/deep' }],
              },
            ],
          },
        ],
      },
      { id: 'commercial', label: 'Commercial', children: [{ id: 'com-jobs', label: 'Jobs' }] },
      { id: 'archived', label: 'Archived', disabled: true },
    ],
  },
]

afterEach(() => window.localStorage.clear())

describe('tree helpers', () => {
  it('finds the trail from the root to an item', () => {
    expect(getSidebarTrail(NAV, 'res-orders-open').map((item) => item.id)).toEqual([
      'residential',
      'res-orders',
      'res-orders-open',
    ])
    expect(getSidebarTrail(NAV, 'missing')).toEqual([])
  })

  it('matches a path to the exact or the longest enclosing href', () => {
    expect(matchSidebarPath(NAV, '/leads')).toBe('leads')
    expect(matchSidebarPath(NAV, '/leads/42?tab=notes')).toBe('leads')
    expect(matchSidebarPath(NAV, '/residential/orders/open/7')).toBe('res-orders-open')
    expect(matchSidebarPath(NAV, '/')).toBe('home')
    // "/" is exact-only, or it would claim every unknown page.
    expect(matchSidebarPath(NAV, '/nowhere')).toBeUndefined()
  })
})

describe('SidebarNav', () => {
  it('renders sections, a separator and nested branches closed by default', () => {
    render(
      <Themed>
        <SidebarNav items={NAV} />
      </Themed>,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
    const branch = screen.getByRole('button', { name: 'Residential' })
    expect(branch).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('opens branches to any depth', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Residential' }))
    await user.click(screen.getByRole('button', { name: 'Orders' }))
    // A branch that is also a link gets its own open/close button.
    await user.click(screen.getByRole('button', { name: 'Expand Open orders' }))
    expect(screen.getByRole('link', { name: 'Deepest' })).toHaveAttribute(
      'href',
      '/residential/deep',
    )
    expect(screen.getByRole('button', { name: 'Collapse Open orders' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('marks the current page and opens the branch it is in', () => {
    render(
      <Themed>
        <SidebarNav items={NAV} currentPath="/residential/deep" />
      </Themed>,
    )
    expect(screen.getByRole('link', { name: 'Deepest' })).toHaveAttribute('aria-current', 'page')
    const trail = screen.getByRole('button', { name: 'Residential' }).closest('li')
    expect(trail).toHaveAttribute('data-active-trail')
  })

  it('lets the user close the branch holding the current page', async () => {
    const user = userEvent.setup()
    // An inline tree: a new array every render must not force the branch open again.
    function Harness() {
      const [, force] = useState(0)
      return (
        <>
          <button onClick={() => force((n) => n + 1)}>rerender</button>
          <SidebarNav items={[...NAV]} activeId="res-dash" />
        </>
      )
    }
    render(
      <Themed>
        <Harness />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Residential' }))
    await user.click(screen.getByRole('button', { name: 'rerender' }))
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('in accordion mode, opening a branch closes its siblings', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} accordion />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Residential' }))
    await user.click(screen.getByRole('button', { name: 'Commercial' }))
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Commercial' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('supports controlled expansion', async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    render(
      <Themed>
        <SidebarNav items={NAV} expanded={['commercial']} onExpandedChange={onExpandedChange} />
      </Themed>,
    )
    expect(screen.getByRole('button', { name: 'Jobs' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Residential' }))
    expect(onExpandedChange).toHaveBeenCalledWith(['commercial', 'residential'])
    // Still controlled: nothing opened until the parent says so.
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('folds a collapsible section', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} />
      </Themed>,
    )
    const heading = screen.getByRole('button', { name: 'Operations' })
    await user.click(heading)
    expect(heading).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Residential' })).not.toBeInTheDocument()
  })

  it('calls onSelect with the item, and disables what is disabled', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Themed>
        <SidebarNav items={NAV} onSelect={onSelect} expanded={['commercial']} />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Jobs' }))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'com-jobs' }),
      expect.anything(),
    )
    expect(screen.getByRole('button', { name: 'Archived' })).toBeDisabled()
  })

  it('renders links through renderLink', () => {
    render(
      <Themed>
        <SidebarNav
          items={NAV}
          renderLink={({ href, ...props }) => <a data-router={href} href={href} {...props} />}
        />
      </Themed>,
    )
    expect(screen.getByRole('link', { name: /Leads/ })).toHaveAttribute('data-router', '/leads')
  })
})

describe('search', () => {
  it('keeps matches and their ancestors, opened, and highlights the match', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} searchable />
      </Themed>,
    )
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'deep')
    // happy-dom lays `<mark>` out as a block, which puts a space in the name.
    expect(screen.getByRole('link', { name: /^Deep\s?est$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.queryByText('Leads')).not.toBeInTheDocument()
    expect(document.querySelector('mark')).toHaveTextContent('Deep')
  })

  it('matches keywords, says when nothing matches, and clears on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} searchable emptyMessage="No pages" />
      </Themed>,
    )
    const box = screen.getByRole('searchbox')
    await user.type(box, 'newsletter')
    expect(screen.getByRole('link', { name: 'Email' })).toBeInTheDocument()

    await user.clear(box)
    await user.type(box, 'zzz')
    expect(screen.getByRole('status')).toHaveTextContent('No pages')

    await user.keyboard('{Escape}')
    expect(box).toHaveValue('')
    expect(screen.getByText('Leads')).toBeInTheDocument()
  })
})

describe('keyboard', () => {
  it('moves with the arrows, opens with → and closes with ←', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav items={NAV} />
      </Themed>,
    )
    screen.getByRole('link', { name: 'Home' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('link', { name: /Leads/ })).toHaveFocus()
    await user.keyboard('{End}')
    // The disabled item is skipped.
    expect(screen.getByRole('button', { name: 'Commercial' })).toHaveFocus()

    screen.getByRole('button', { name: 'Residential' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Residential' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

describe('Sidebar', () => {
  it('collapses to the rail from a trigger outside it, keeping accessible names', async () => {
    const user = userEvent.setup()
    const onCollapsedChange = vi.fn()
    render(
      <Themed>
        <SidebarProvider onCollapsedChange={onCollapsedChange}>
          <SidebarTrigger />
          <Sidebar header={<SidebarBrand name="Acme" description="Ops" />}>
            <SidebarNav items={NAV} />
          </Sidebar>
        </SidebarProvider>
      </Themed>,
    )
    const trigger = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(onCollapsedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-controls',
      screen.getByRole('complementary').id,
    )
    // Labels are hidden visually, not removed.
    expect(screen.getByRole('link', { name: /Leads/ })).toBeInTheDocument()
    // Rail branches never inline their children; they open a flyout instead.
    await user.click(screen.getByRole('button', { name: 'Residential' }))
    const flyout = await screen.findByRole('dialog')
    expect(within(flyout).getByText('Residential')).toBeInTheDocument()
    expect(within(flyout).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('remembers the rail and open branches under storageKey', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <Themed>
        <Sidebar storageKey="test-nav">
          <SidebarTrigger />
          <SidebarNav items={NAV} />
        </Sidebar>
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Commercial' }))
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    unmount()

    expect(JSON.parse(window.localStorage.getItem('test-nav:collapsed')!)).toBe(true)
    expect(JSON.parse(window.localStorage.getItem('test-nav:expanded')!)).toEqual(['commercial'])

    render(
      <Themed>
        <Sidebar storageKey="test-nav">
          <SidebarNav items={NAV} />
        </Sidebar>
      </Themed>,
    )
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed')
  })

  it('becomes a drawer below the breakpoint that Escape closes', async () => {
    const user = userEvent.setup()
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    )
    render(
      <Themed>
        <SidebarProvider>
          <SidebarTrigger />
          <Sidebar>
            <SidebarNav items={NAV} />
          </Sidebar>
        </SidebarProvider>
      </Themed>,
    )
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveAttribute('data-mobile')
    expect(aside).not.toHaveAttribute('data-open')

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(aside).toHaveAttribute('data-open')
    expect(aside).toHaveFocus()

    // Choosing a destination closes the drawer.
    await user.click(screen.getByRole('link', { name: /Leads/ }))
    expect(aside).not.toHaveAttribute('data-open')

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(aside).not.toHaveAttribute('data-open')
    matchMedia.mockRestore()
  })

  it('toggles with the opt-in shortcut, but not while typing', () => {
    render(
      <Themed>
        <Sidebar shortcut="b">
          <input aria-label="notes" />
        </Sidebar>
      </Themed>,
    )
    const aside = screen.getByRole('complementary')
    fireEvent.keyDown(screen.getByLabelText('notes'), { key: 'b', ctrlKey: true })
    expect(aside).not.toHaveAttribute('data-collapsed')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(aside).toHaveAttribute('data-collapsed')
  })

  it('opens the account menu from the footer', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <Sidebar
          footer={
            <SidebarUser
              name="Ana Ortiz"
              description="ana@example.com"
              menu={<DropdownMenuItem>Sign out</DropdownMenuItem>}
            />
          }
        />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: /Ana Ortiz/ }))
    expect(await screen.findByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
  })
})

describe('composable parts', () => {
  it('nest by hand, keeping their own open state', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SidebarNav>
          <SidebarSection label="Hand-written" icon="★" tone="success">
            <SidebarMenuItem label="Level 1" defaultExpanded>
              <SidebarMenuItem label="Level 2">
                <SidebarMenuItem label="Level 3" href="/l3" active />
              </SidebarMenuItem>
            </SidebarMenuItem>
          </SidebarSection>
          <SidebarMenu>
            <SidebarMenuItem label="Loose" href="/loose" />
          </SidebarMenu>
        </SidebarNav>
      </Themed>,
    )
    expect(screen.getByText('Hand-written').closest('.sui-sidebar-section')).toHaveClass(
      'sui-tone--success',
    )
    await user.click(screen.getByRole('button', { name: 'Level 2' }))
    expect(screen.getByRole('link', { name: 'Level 3' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('list', { name: 'Hand-written' })).toBeInTheDocument()
  })
})

describe('accessibility', () => {
  it('has no axe violations, open or in the rail', async () => {
    const { container, rerender } = render(
      <Themed>
        <Sidebar
          header={<SidebarBrand name="Acme" description="Ops" />}
          footer={<SidebarUser name="Ana Ortiz" description="ana@example.com" />}
        >
          <SidebarNav items={NAV} currentPath="/residential" searchable />
        </Sidebar>
      </Themed>,
    )
    expect(await axe(container)).toHaveNoViolations()

    rerender(
      <Themed>
        <Sidebar collapsed>
          <SidebarNav items={NAV} currentPath="/residential" searchable />
        </Sidebar>
      </Themed>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

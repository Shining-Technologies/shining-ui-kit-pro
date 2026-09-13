/*
 * Regression tests from the audit of the layout and navigation families:
 * accessible names that could not be reached or changed, heading levels,
 * refs, and reduced motion.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AppShellBottomNav,
  BottomNavItem,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Pagination,
  ScrollToTop,
  SectionTabs,
  type AccordionProps,
} from '@shining-technologies/ui'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('BottomNavItem', () => {
  it('puts the badge in the accessible name', () => {
    render(
      <AppShellBottomNav>
        <BottomNavItem icon="□" label="Orders" badge={3} />
        <BottomNavItem icon="□" label="Inbox" badge={<span className="dot" />} badgeLabel="new messages" />
        <BottomNavItem icon="□" label="Home" />
        <BottomNavItem icon="□" label="Alerts" badge={<span className="dot" />} />
      </AppShellBottomNav>,
    )
    expect(screen.getByRole('button', { name: /^Orders\s+\(3\)$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Inbox\s+\(new messages\)$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    // A badge with no text and no badgeLabel adds nothing to announce.
    expect(screen.getByRole('button', { name: 'Alerts' })).toBeInTheDocument()
  })
})

describe('ScrollToTop', () => {
  function scroller() {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollTop', { value: 1000, configurable: true })
    const scrollTo = vi.fn()
    element.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']
    document.body.append(element)
    return { element, scrollTo }
  }

  function motion(reduce: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: reduce && query.includes('prefers-reduced-motion: reduce'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    )
  }

  it.each([
    [true, 'auto'],
    [false, 'smooth'],
  ] as const)('with reduced motion %s, scrolls with behavior "%s"', async (reduce, behavior) => {
    motion(reduce)
    const { element, scrollTo } = scroller()
    const user = userEvent.setup()
    render(<ScrollToTop target={element} />)
    await user.click(screen.getByRole('button', { name: 'Back to top' }))
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior })
  })
})

describe('Pagination labels', () => {
  it('names the landmark and every button through labels', () => {
    render(
      <Pagination
        page={2}
        pageCount={3}
        onPageChange={() => {}}
        labels={{
          label: 'Seiten',
          previousPage: 'Vorherige Seite',
          nextPage: 'Nächste Seite',
          page: (page) => `Seite ${page}`,
        }}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'Seiten' })
    expect(within(nav).getByRole('button', { name: 'Vorherige Seite' })).toBeEnabled()
    expect(within(nav).getByRole('button', { name: 'Nächste Seite' })).toBeEnabled()
    expect(within(nav).getByRole('button', { name: 'Seite 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps the English names by default, whatever the visible labels are', () => {
    render(
      <Pagination page={1} pageCount={2} onPageChange={() => {}} labels={{ previous: 'Prev', next: 'Next' }} />,
    )
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('SectionTabs', () => {
  it('is a group its aria-label names, with no axe violations', async () => {
    const { container } = render(
      <SectionTabs
        aria-label="Job sections"
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'today', label: 'Today', count: 4 },
          { id: 'archived', label: 'Archived', disabled: true },
        ]}
      />,
    )
    const group = screen.getByRole('group', { name: 'Job sections' })
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Accordion', () => {
  it('puts the trigger in an h3 by default, and at the level asked for', () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two to five days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger headingLevel={2}>Returns</AccordionTrigger>
          <AccordionContent>Thirty days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Shipping' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Returns' })).toBeInTheDocument()
  })

  it('types AccordionProps with the Radix Root props', () => {
    const props: AccordionProps = { type: 'multiple', defaultValue: ['a'], appearance: 'separated' }
    const { container } = render(
      <Accordion {...props}>
        <AccordionItem value="a">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Two to five days.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    expect(container.firstElementChild).toHaveClass('sui-accordion--separated')
    expect(screen.getByText('Two to five days.')).toBeVisible()
  })
})

describe('Breadcrumb', () => {
  it('gives the ellipsis a text alternative, and forwards refs from the separator and ellipsis', () => {
    const separator = createRef<HTMLLIElement>()
    const ellipsis = createRef<HTMLSpanElement>()
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator ref={separator} />
          <BreadcrumbItem>
            <BreadcrumbEllipsis ref={ellipsis} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis label="Weitere Ebenen" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order #1042</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(ellipsis.current).toHaveTextContent('More')
    expect(ellipsis.current).not.toHaveAttribute('aria-hidden')
    expect(within(nav).getByText('Weitere Ebenen')).toBeInTheDocument()
    expect(separator.current?.tagName).toBe('LI')
    expect(separator.current).toHaveAttribute('aria-hidden', 'true')
  })
})

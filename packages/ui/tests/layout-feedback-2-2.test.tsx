/*
 * Layout primitives, resizable panels, the feedback additions (Empty status,
 * CircularProgress, Banner), the full-screen dialog and EventCalendar — the
 * rest of what 2.2 added.
 */
import {
  Banner,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Empty,
  EventCalendar,
  Grid,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Stack,
  type CalendarEvent,
} from '@shining-technologies/ui'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

/* ---------------------------------------------------------------- layout */

describe('Stack, Grid and Container', () => {
  it('render classes from the spacing scale and forward refs', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Stack ref={ref} as="section" direction="horizontal" gap="lg" align="center" justify="between" wrap>
        <span>a</span>
      </Stack>,
    )
    expect(ref.current?.tagName).toBe('SECTION')
    expect(ref.current).toHaveClass(
      'sui-layout-stack',
      'sui-layout-stack--horizontal',
      'sui-gap--lg',
      'sui-align--center',
      'sui-justify--between',
      'sui-layout-stack--wrap',
    )
  })

  it('defaults a stack to a vertical md gap', () => {
    render(<Stack data-testid="stack" />)
    expect(screen.getByTestId('stack')).toHaveClass('sui-layout-stack', 'sui-gap--md')
    expect(screen.getByTestId('stack')).not.toHaveClass('sui-layout-stack--horizontal')
  })

  it('sets a grid by column count or by minimum width', () => {
    render(
      <>
        <Grid data-testid="columns" columns={3} gap="sm" />
        <Grid data-testid="fill" minItemWidth="16rem" columns={3} style={{ color: 'red' }} />
      </>,
    )
    const columns = screen.getByTestId('columns')
    expect(columns).toHaveAttribute('data-layout', 'columns')
    expect(columns.style.getPropertyValue('--sui-grid-columns')).toBe('3')
    const fill = screen.getByTestId('fill')
    expect(fill).toHaveAttribute('data-layout', 'fill')
    expect(fill.style.getPropertyValue('--sui-grid-min')).toBe('16rem')
    expect(fill.style.getPropertyValue('--sui-grid-columns')).toBe('')
    expect(fill.style.color).toBe('red')
  })

  it('sizes a container', () => {
    render(<Container data-testid="c" size="sm" as="main" />)
    expect(screen.getByTestId('c').tagName).toBe('MAIN')
    expect(screen.getByTestId('c')).toHaveClass('sui-layout-container', 'sui-layout-container--sm')
  })

  it('render on a server with no client JavaScript needed', () => {
    const html = renderToString(
      <Container>
        <Grid columns={2}>
          <Stack>x</Stack>
        </Grid>
      </Container>,
    )
    expect(html).toContain('sui-layout-grid')
  })
})

/* ------------------------------------------------------------- resizable */

function Split(props: { onSizesChange?: (sizes: number[]) => void; sizes?: number[] }) {
  return (
    <ResizablePanelGroup {...props} style={{ width: 1000 }}>
      <ResizablePanel defaultSize={30} minSize={20} maxSize={60}>
        List
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize list" />
      <ResizablePanel>Detail</ResizablePanel>
    </ResizablePanelGroup>
  )
}

describe('ResizablePanelGroup', () => {
  it('shares what is left between panels without a default size', async () => {
    const { container } = render(<Split />)
    const [list, detail] = container.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')
    expect(list!.style.flex).toMatch(/^30 1 0(px)?$/)
    expect(detail!.style.flex).toMatch(/^70 1 0(px)?$/)
    const handle = screen.getByRole('separator', { name: 'Resize list' })
    expect(handle).toHaveAttribute('aria-valuenow', '30')
    expect(handle).toHaveAttribute('aria-valuemin', '20')
    expect(handle).toHaveAttribute('aria-valuemax', '60')
    expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    expect(handle).toHaveAttribute('aria-controls', list!.id)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('resizes from the keyboard within the limits', async () => {
    const user = userEvent.setup()
    const onSizesChange = vi.fn()
    render(<Split onSizesChange={onSizesChange} />)
    const handle = screen.getByRole('separator')
    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(onSizesChange).toHaveBeenLastCalledWith([35, 65])
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(onSizesChange).toHaveBeenLastCalledWith([34, 66])
    await user.keyboard('{End}')
    expect(handle).toHaveAttribute('aria-valuenow', '60')
    await user.keyboard('{Home}')
    expect(handle).toHaveAttribute('aria-valuenow', '20')
    await user.keyboard('{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '20')
  })

  it('follows the pointer while dragging', () => {
    render(<Split />)
    const group = document.querySelector<HTMLElement>('[data-slot="resizable-group"]')!
    group.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 1000, height: 400, right: 1000, bottom: 400 }) as DOMRect
    const handle = screen.getByRole('separator')
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '40')
    fireEvent.pointerUp(handle, { pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 500, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '40')
  })

  it('keeps controlled sizes', async () => {
    const user = userEvent.setup()
    const onSizesChange = vi.fn()
    render(<Split sizes={[50, 50]} onSizesChange={onSizesChange} />)
    screen.getByRole('separator').focus()
    await user.keyboard('{ArrowRight}')
    expect(onSizesChange).toHaveBeenCalledWith([55, 45])
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '50')
  })
})

/* ---------------------------------------------------------- empty states */

describe('Empty status', () => {
  it('keeps a plain empty panel unchanged: no role, no glyph', () => {
    render(<Empty title="No invoices" />)
    const panel = screen.getByText('No invoices').parentElement!
    expect(panel).not.toHaveAttribute('role')
    expect(panel).not.toHaveAttribute('data-status')
    expect(panel.querySelector('.sui-empty__media')).toBeNull()
  })

  it('announces an error and offers a retry', async () => {
    const onRetry = vi.fn()
    const { container } = render(
      <Empty
        status="error"
        title="Could not load invoices"
        description="The server did not answer."
        actions={<button onClick={onRetry}>Retry</button>}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load invoices')
    expect(screen.getByRole('alert')).toHaveClass('sui-tone--destructive')
    expect(container.querySelector('.sui-empty__media svg')).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('marks loading busy, and success and offline as status', () => {
    render(
      <>
        <Empty status="loading" title="Loading invoices" />
        <Empty status="success" title="All caught up" />
        <Empty status="offline" title="You are offline" icon={null} />
      </>,
    )
    const [loading, success, offline] = screen.getAllByRole('status')
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(loading!.querySelector('.sui-spinner')).not.toBeNull()
    expect(success).toHaveAttribute('data-status', 'success')
    expect(offline!.querySelector('.sui-empty__media')).toBeNull()
  })
})

/* ------------------------------------------------------- circular progress */

describe('CircularProgress', () => {
  it('is a progressbar with its percentage', async () => {
    const { container } = render(<CircularProgress value={30} max={120} showValue size="lg" aria-label="Storage" />)
    const bar = screen.getByRole('progressbar', { name: 'Storage' })
    expect(bar).toHaveAttribute('aria-valuenow', '30')
    expect(bar).toHaveAttribute('aria-valuemax', '120')
    expect(bar).toHaveAttribute('aria-valuetext', '25%')
    expect(bar).toHaveTextContent('25%')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('clamps, and spins when the value is unknown', () => {
    render(
      <>
        <CircularProgress aria-label="over" value={400} />
        <CircularProgress aria-label="busy" value={null} showValue />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'over' })).toHaveAttribute('data-state', 'complete')
    const busy = screen.getByRole('progressbar', { name: 'busy' })
    expect(busy).toHaveAttribute('data-state', 'indeterminate')
    expect(busy).not.toHaveAttribute('aria-valuenow')
    expect(busy).toHaveTextContent('')
  })
})

/* ------------------------------------------------------------------ banner */

describe('Banner', () => {
  it('hides itself when dismissed without a handler', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Banner tone="warning" title="Maintenance" dismissible action={<a href="#status">Status page</a>}>
        Tonight 22:00–23:00.
      </Banner>,
    )
    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent('Maintenance Tonight 22:00–23:00.')
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reports the dismissal to a handler and stays until told', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <Banner tone="destructive" onDismiss={onDismiss} dismissLabel="Hide notice">
        Payment failed.
      </Banner>,
    )
    await user.click(screen.getByRole('button', { name: 'Hide notice' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

/* -------------------------------------------------------- full-size dialog */

describe('Dialog size="full"', () => {
  it('adds the full-screen class', async () => {
    render(
      <Dialog open>
        <DialogContent size="full">
          <DialogTitle>Edit contract</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(await screen.findByRole('dialog', { name: 'Edit contract' })).toHaveClass('sui-dialog--full')
  })
})

/* ------------------------------------------------------------ event calendar */

const EVENTS: CalendarEvent[] = [
  { id: 'e1', date: '2026-09-03', title: 'Board meeting', time: '09:30', tone: 'info' },
  { id: 'e2', date: '2026-09-10', end: '2026-09-12', title: 'Offsite' },
  { id: 'e3', date: '2026-09-10', title: 'Payroll' },
  { id: 'e4', date: '2026-09-10', title: 'Audit' },
  { id: 'e5', date: '2026-09-10', title: 'Release' },
]

describe('EventCalendar', () => {
  it('lays the month out as a grid of days with their events', async () => {
    const { container } = render(<EventCalendar events={EVENTS} defaultMonth="2026-09-15" />)
    const grid = screen.getByRole('grid', { name: 'September 2026' })
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7)
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveTextContent('Mon')
    expect(screen.getByRole('button', { name: 'Thursday, September 3, 2026, 1 event' })).toBeInTheDocument()
    // A spanning event shows on each of its days.
    expect(screen.getAllByText('Offsite')).toHaveLength(3)
    // Three a day, then a count.
    expect(screen.getByText('+1 more')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('moves by day and by month from the keyboard, and activates a day', async () => {
    const user = userEvent.setup()
    const onDateClick = vi.fn()
    const onMonthChange = vi.fn()
    render(
      <EventCalendar
        events={EVENTS}
        // A month in the past, so the tab stop is not today.
        defaultMonth="2020-03-01"
        onDateClick={onDateClick}
        onMonthChange={onMonthChange}
        weekStartsOn={0}
      />,
    )
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Sun')
    const first = screen.getByRole('button', { name: /^Sunday, March 1, 2020/ })
    expect(first).toHaveAttribute('tabindex', '0')
    first.focus()
    await user.keyboard('{ArrowDown}')
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)))
    expect(screen.getByRole('button', { name: /^Sunday, March 8, 2020/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDateClick).toHaveBeenLastCalledWith('2020-03-08')
    await user.keyboard('{PageDown}')
    expect(onMonthChange).toHaveBeenLastCalledWith('2020-04-01')
    expect(screen.getByRole('grid', { name: 'April 2020' })).toBeInTheDocument()
  })

  it('navigates months with the header buttons, and events report clicks', async () => {
    const user = userEvent.setup()
    const onEventClick = vi.fn()
    render(<EventCalendar events={EVENTS} defaultMonth="2026-09-01" onEventClick={onEventClick} />)
    await user.click(screen.getByRole('button', { name: '09:30 Board meeting' }))
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByRole('grid', { name: 'August 2026' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
  })

  it('renders the same month on a server without marking today', () => {
    const html = renderToString(<EventCalendar events={EVENTS} month="2026-09-01" />)
    expect(html).toContain('September 2026')
    expect(html).not.toContain('data-today')
  })
})

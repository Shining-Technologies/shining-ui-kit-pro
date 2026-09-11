/**
 * Regression tests for defects found auditing the actions, surfaces, feedback,
 * overlays and composites. Each `describe` names the component; each `it` names
 * the behaviour that used to be wrong.
 */
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AvatarGroup,
  BreakdownList,
  Button,
  CardTitle,
  ConfirmDialog,
  CopyButton,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoldButton,
  SectionTabs,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  Skeleton,
  StatsCard,
  StatusFlow,
  StepCard,
  SummaryCard,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Toaster,
  ToastProvider,
  Tooltip,
  TooltipProvider,
  UIKitProvider,
  UserAvatar,
  useToast,
  type ToastOptions,
} from '@shining-technologies/ui-kit-react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type ComponentProps, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

/* -------------------------------------------------------------------- toasts */

function ToastHarness({ options }: { options: ToastOptions[] }) {
  const { toast } = useToast()
  return (
    <>
      {options.map((option, index) => (
        <button key={index} type="button" onClick={() => toast(option)}>
          {`raise-${index}`}
        </button>
      ))}
      <Toaster />
    </>
  )
}

function renderToasts(options: ToastOptions[], duration?: number) {
  return render(
    <Themed>
      <ToastProvider duration={duration}>
        <ToastHarness options={options} />
      </ToastProvider>
    </Themed>,
  )
}

describe('toasts', () => {
  it('still auto-dismisses when `duration` is passed as undefined', () => {
    vi.useFakeTimers()
    renderToasts([{ title: 'Saved', duration: undefined }], 1000)

    fireEvent.click(screen.getByText('raise-0'))
    expect(screen.getByText('Saved')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1100))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('holds the clock while a toast is hovered, and resumes on leave', () => {
    vi.useFakeTimers()
    renderToasts([{ title: 'Invoice sent' }], 1000)

    fireEvent.click(screen.getByText('raise-0'))
    const toast = screen.getByText('Invoice sent').closest('.sui-toast')!

    act(() => vi.advanceTimersByTime(400))
    fireEvent.pointerEnter(toast)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText('Invoice sent')).toBeInTheDocument()

    fireEvent.pointerLeave(toast)
    // What was left on the clock, not a fresh full duration.
    act(() => vi.advanceTimersByTime(650))
    expect(screen.queryByText('Invoice sent')).not.toBeInTheDocument()
  })

  it('does not stay paused after the hovered toast is dismissed', () => {
    vi.useFakeTimers()
    renderToasts([{ title: 'First', duration: 0 }, { title: 'Second' }], 1000)

    fireEvent.click(screen.getByText('raise-0'))
    const first = screen.getByText('First').closest('.sui-toast')!
    fireEvent.pointerEnter(first)
    fireEvent.focus(first.querySelector('button')!)
    // Removed under the pointer and with focus inside: no leave or blur arrives.
    fireEvent.click(first.querySelector('[aria-label="Dismiss"]')!)
    expect(screen.queryByText('First')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('raise-1'))
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.queryByText('Second')).not.toBeInTheDocument()
  })

  it('replaces a toast with the same id in place rather than moving it', () => {
    renderToasts([
      { id: 'save', title: 'Saving…', duration: 0 },
      { title: 'Other', duration: 0 },
      { id: 'save', title: 'Saved', duration: 0 },
    ])

    fireEvent.click(screen.getByText('raise-0'))
    fireEvent.click(screen.getByText('raise-1'))
    fireEvent.click(screen.getByText('raise-2'))

    const titles = [...document.querySelectorAll('.sui-toast__title')].map(
      (node) => node.textContent,
    )
    expect(titles).toEqual(['Saved', 'Other'])
  })

  it('announces through a live region that exists before any toast', () => {
    renderToasts([{ title: 'Hello', duration: 0 }])
    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(region).toHaveAttribute('aria-live', 'polite')

    fireEvent.click(screen.getByText('raise-0'))
    expect(region).toHaveTextContent('Hello')
  })
})

/* ------------------------------------------------------------- confirm dialog */

function ConfirmHarness(props: Partial<Parameters<typeof ConfirmDialog>[0]>) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete client?"
      confirmLabel="Delete"
      {...props}
    />
  )
}

describe('confirm dialog', () => {
  it('stays open and re-enables the choices when the action rejects', async () => {
    const onError = vi.fn()
    const failure = new Error('network down')
    const user = userEvent.setup()
    render(
      <Themed>
        <ConfirmHarness onConfirm={() => Promise.reject(failure)} onError={onError} />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure, expect.anything()))
    expect(screen.getByText('Delete client?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
  })

  it('runs the action once on a double-click', async () => {
    let resolve!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((done) => (resolve = done)))
    render(
      <Themed>
        <ConfirmHarness onConfirm={onConfirm} />
      </Themed>,
    )

    const confirm = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(confirm).toHaveAttribute('aria-busy', 'true')

    await act(async () => resolve())
    await waitFor(() => expect(screen.queryByText('Delete client?')).not.toBeInTheDocument())
  })

  it('waits for any thenable, not only a native Promise', async () => {
    let settle!: () => void
    const thenable = {
      then(onFulfilled: () => void) {
        settle = onFulfilled
      },
    }
    render(
      <Themed>
        <ConfirmHarness onConfirm={() => thenable as unknown as Promise<void>} />
      </Themed>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    // Still open, and the other choice is locked while it is pending.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled())
    expect(screen.getByText('Delete client?')).toBeInTheDocument()

    await act(async () => settle())
    await waitFor(() => expect(screen.queryByText('Delete client?')).not.toBeInTheDocument())
  })
})

/* ---------------------------------------------------------------- copy button */

describe('copy button', () => {
  function withClipboard(clipboard: unknown) {
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
  }

  it('keeps copying when the caller adds its own onClick', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    withClipboard({ writeText })
    const onClick = vi.fn()
    render(
      <Themed>
        <CopyButton value="INV-1" onClick={onClick} />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledWith('INV-1')
  })

  it('falls back to the copy command where the async clipboard is missing', async () => {
    const user = userEvent.setup()
    withClipboard(undefined)
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
    const onCopied = vi.fn()
    render(
      <Themed>
        <CopyButton value="secret" onCopied={onCopied} />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(onCopied).toHaveBeenCalledWith('secret'))
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('reports a refused copy through onCopyError', async () => {
    const user = userEvent.setup()
    const denied = new Error('denied')
    withClipboard({ writeText: vi.fn().mockRejectedValue(denied) })
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true })
    const onCopyError = vi.fn()
    render(
      <Themed>
        <CopyButton value="x" onCopyError={onCopyError} />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(onCopyError).toHaveBeenCalledWith(denied))
    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument()
  })
})

/* ---------------------------------------------------------------- hold button */

describe('hold button', () => {
  it('fires once per keyboard hold, however long the key stays down', () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    const onHoldComplete = vi.fn()
    render(
      <Themed>
        <HoldButton onHoldComplete={onHoldComplete} duration={500}>
          Hold to delete
        </HoldButton>
      </Themed>,
    )
    const button = screen.getByRole('button', { name: 'Hold to delete' })

    fireEvent.keyDown(button, { key: ' ' })
    act(() => vi.advanceTimersByTime(600))
    expect(onHoldComplete).toHaveBeenCalledOnce()

    // The OS keeps sending repeats while the key is held.
    for (let i = 0; i < 20; i += 1) {
      fireEvent.keyDown(button, { key: ' ', repeat: true })
      act(() => vi.advanceTimersByTime(50))
    }
    expect(onHoldComplete).toHaveBeenCalledOnce()
  })

  it('composes the caller’s handlers and style instead of replacing its own', () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    const onHoldComplete = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <Themed>
        <HoldButton
          onHoldComplete={onHoldComplete}
          onKeyDown={onKeyDown}
          duration={300}
          style={{ minWidth: 100 }}
        >
          Hold
        </HoldButton>
      </Themed>,
    )
    const button = screen.getByRole('button', { name: 'Hold' })
    expect(button.style.getPropertyValue('--sui-hold-progress')).toBe('0%')
    expect(button.style.minWidth).toBe('100px')

    fireEvent.keyDown(button, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(400))
    expect(onKeyDown).toHaveBeenCalled()
    expect(onHoldComplete).toHaveBeenCalledOnce()
  })

  it('ignores a secondary-button press', () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    const onHoldComplete = vi.fn()
    render(
      <Themed>
        <HoldButton onHoldComplete={onHoldComplete} duration={200}>
          Hold
        </HoldButton>
      </Themed>,
    )
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hold' }), { button: 2 })
    act(() => vi.advanceTimersByTime(400))
    expect(onHoldComplete).not.toHaveBeenCalled()
  })
})

/* -------------------------------------------------------------------- tooltip */

describe('tooltip', () => {
  it('works with no provider mounted', async () => {
    render(
      <Themed>
        <Tooltip content="Archive the job" defaultOpen>
          <button type="button">Archive</button>
        </Tooltip>
      </Themed>,
    )
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Archive the job')
  })

  it('defers to a surrounding TooltipProvider’s delay', () => {
    vi.useFakeTimers()
    render(
      <Themed>
        <TooltipProvider delayDuration={0}>
          <Tooltip content="Now">
            <button type="button">Trigger</button>
          </Tooltip>
        </TooltipProvider>
      </Themed>,
    )
    fireEvent.pointerMove(screen.getByRole('button', { name: 'Trigger' }), {
      pointerType: 'mouse',
    })
    // The old nested provider imposed its own 300ms on every tooltip.
    act(() => vi.advanceTimersByTime(20))
    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  })

  it('renders just the trigger when there is nothing to say', () => {
    render(
      <Themed>
        <Tooltip content={null} defaultOpen>
          <button type="button">Plain</button>
        </Tooltip>
      </Themed>,
    )
    expect(screen.getByRole('button', { name: 'Plain' })).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

/* --------------------------------------------------------------- user avatar */

describe('user avatar', () => {
  it('speaks the name once, not the initials or the image as well', () => {
    const { container } = render(
      <Themed>
        <UserAvatar name="Ana Ortiz" status="online" />
      </Themed>,
    )
    const avatar = container.querySelector('[data-slot="avatar"]')!
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.sui-user-avatar__presence')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByText('Ana Ortiz, online')).toBeInTheDocument()
  })
})

/* -------------------------------------------------------------- avatar group */

describe('avatar group', () => {
  it('honours `max` with a +n chip that names the rest', () => {
    render(
      <AvatarGroup max={2}>
        <span className="sui-avatar">A</span>
        <span className="sui-avatar">B</span>
        <span className="sui-avatar">C</span>
        <span className="sui-avatar">D</span>
      </AvatarGroup>,
    )
    expect(screen.queryByText('C')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2')
  })
})

/* -------------------------------------------------------------- section tabs */

describe('section tabs', () => {
  it('marks the first tab current when the tabs arrive after the first render', () => {
    const { rerender } = render(<SectionTabs tabs={[]} aria-label="Sections" />)
    rerender(
      <SectionTabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'mine', label: 'Mine' },
        ]}
        aria-label="Sections"
      />,
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-current', 'page')
  })
})

/* --------------------------------------------------------------- status flow */

describe('status flow', () => {
  it('renders every step when a status repeats', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<StatusFlow steps={['draft', 'review', 'draft', 'sent']} />)
    expect(container.querySelectorAll('.sui-status-flow__chip')).toHaveLength(4)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})

/* ------------------------------------------------------------- breakdown list */

describe('breakdown list', () => {
  it('keeps a share bar inside its track when `total` is smaller than a bucket', () => {
    const { container } = render(
      <BreakdownList total={10} showShare showPercent items={[{ label: 'Open', value: 25 }]} />,
    )
    const fill = container.querySelector<HTMLElement>('.sui-breakdown__share-fill')!
    expect(fill.style.transform).toBe('scaleX(1)')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------ heading levels */

describe('card headings', () => {
  it('lets CardTitle, SummaryCard and StepCard render a real heading', () => {
    render(
      <Themed>
        <CardTitle as="h2">Revenue</CardTitle>
        <SummaryCard title="Support queue" titleAs="h3" />
        <StepCard step={1} title="Review" titleAs="h4" />
      </Themed>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Revenue' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Support queue' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: /Review/ })).toBeInTheDocument()
  })

  it('keeps a div by default', () => {
    render(<CardTitle>Plain</CardTitle>)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------- refs */

describe('primitive refs', () => {
  it('forwards refs from Separator and Skeleton', () => {
    const separator = createRef<HTMLDivElement>()
    const skeleton = createRef<HTMLDivElement>()
    render(
      <>
        <Separator ref={separator} />
        <Skeleton ref={skeleton} />
      </>,
    )
    expect(separator.current).toBeInstanceOf(HTMLElement)
    expect(skeleton.current).toHaveClass('sui-skeleton')
  })
})

/* ------------------------------------------------ hold button: no-hold path */

describe('hold button without a hold', () => {
  function renderHold(props: Partial<ComponentProps<typeof HoldButton>> = {}) {
    const onHoldComplete = vi.fn()
    render(
      <Themed>
        <HoldButton onHoldComplete={onHoldComplete} duration={300} {...props}>
          Hold to delete
        </HoldButton>
      </Themed>,
    )
    return { onHoldComplete, button: screen.getByRole('button', { name: 'Hold to delete' }) }
  }

  const fakeClock = () =>
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })

  it('asks in a dialog when activated by a bare click, and confirming fires once', async () => {
    const { onHoldComplete, button } = renderHold()
    // Screen-reader browse mode and voice control: a click, no press, detail 0.
    fireEvent.click(button)

    const dialog = await screen.findByRole('alertdialog', { name: 'Delete?' })
    expect(onHoldComplete).not.toHaveBeenCalled()
    const confirm = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(onHoldComplete).toHaveBeenCalledOnce()
  })

  it('does nothing when the dialog is cancelled', async () => {
    const { onHoldComplete, button } = renderHold({
      confirmTitle: 'Remove the crew?',
      confirmLabel: 'Remove',
    })
    fireEvent.click(button)
    await screen.findByRole('alertdialog', { name: 'Remove the crew?' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(onHoldComplete).not.toHaveBeenCalled()
  })

  it('still completes a real pointer hold, with no dialog', () => {
    fakeClock()
    const { onHoldComplete, button } = renderHold()
    fireEvent.pointerDown(button, { button: 0 })
    act(() => vi.advanceTimersByTime(400))
    fireEvent.pointerUp(button, { button: 0 })
    fireEvent.click(button, { detail: 1 })

    expect(onHoldComplete).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('treats a short press as a slip, not as a request for the dialog', () => {
    fakeClock()
    const { onHoldComplete, button } = renderHold()
    fireEvent.pointerDown(button, { button: 0 })
    act(() => vi.advanceTimersByTime(50))
    fireEvent.pointerUp(button, { button: 0 })
    fireEvent.click(button, { detail: 1 })
    act(() => vi.advanceTimersByTime(50))

    expect(onHoldComplete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('still completes a keyboard hold, even where Space clicks on keyup', () => {
    fakeClock()
    const { onHoldComplete, button } = renderHold()
    fireEvent.keyDown(button, { key: ' ' })
    act(() => vi.advanceTimersByTime(400))
    fireEvent.keyUp(button, { key: ' ' })
    fireEvent.click(button) // Firefox: the keyup's own click, detail 0

    expect(onHoldComplete).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('tells assistive tech how to use it, and composes a caller’s description', () => {
    render(
      <>
        <span id="hint">Deletes the job</span>
        <HoldButton onHoldComplete={() => {}} aria-describedby="hint">
          Hold to delete
        </HoldButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Hold to delete' })).toHaveAccessibleDescription(
      'Deletes the job Press and hold to confirm, or activate to confirm in a dialog.',
    )
  })

  it('ignores a bare click with `confirmOnClick={false}`', () => {
    const { onHoldComplete, button } = renderHold({ confirmOnClick: false })
    fireEvent.click(button)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onHoldComplete).not.toHaveBeenCalled()
    expect(button).toHaveAccessibleDescription('Press and hold to confirm.')
  })
})

/* ------------------------------------------------ phrasing content in buttons */

describe('clickable stats card', () => {
  it('puts no block elements inside its button, loading or not', () => {
    const { rerender } = render(
      <StatsCard
        label="Crews"
        value="24"
        change="+2"
        description="vs last week"
        chart={<svg />}
        onClick={() => {}}
      />,
    )
    expect(screen.getByRole('button').querySelectorAll('div, p')).toHaveLength(0)

    rerender(<StatsCard label="Crews" value="24" loading onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.querySelectorAll('div, p')).toHaveLength(0)
    expect(button.querySelector('.sui-skeleton')).toBeInTheDocument()
  })
})

/* ---------------------------------------------- status flow: alternate state */

describe('status flow current', () => {
  const steps = ['draft', 'sent', 'seen', 'accepted']
  const alternates = ['changes_requested', 'rejected']

  const states = (container: HTMLElement) =>
    [...container.querySelectorAll('.sui-status-flow__step')].map((item) => [
      item.querySelector('.sui-status-flow__chip')!.getAttribute('data-status'),
      item.getAttribute('data-state'),
    ])

  it('accepts a status value as well as an index', () => {
    const byIndex = render(<StatusFlow steps={steps} current={2} />)
    const expected = states(byIndex.container)
    byIndex.unmount()
    const { container } = render(<StatusFlow steps={steps} current="seen" />)
    expect(states(container)).toEqual(expected)
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Seen')
  })

  it('marks an alternate as the current state, with the path before it done', () => {
    const { container } = render(
      <StatusFlow steps={steps} alternates={alternates} current="rejected" />,
    )
    expect(states(container)).toEqual([
      ['draft', 'done'],
      ['sent', 'done'],
      ['seen', 'done'],
      ['accepted', 'upcoming'],
      ['changes_requested', null],
      ['rejected', 'current'],
    ])
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Rejected')
  })

  it('takes `reached` for where the record left the main path', () => {
    const { container } = render(
      <StatusFlow steps={steps} alternates={alternates} current="rejected" reached="sent" />,
    )
    expect(states(container).slice(0, 4)).toEqual([
      ['draft', 'done'],
      ['sent', 'done'],
      ['seen', 'upcoming'],
      ['accepted', 'upcoming'],
    ])
  })
})

/* ------------------------------------------------------------ overlay refs */

describe('dialog part refs', () => {
  it('forwards refs from the header, body and footer parts', () => {
    const header = createRef<HTMLDivElement>()
    const body = createRef<HTMLDivElement>()
    const footer = createRef<HTMLDivElement>()
    const sheetHeader = createRef<HTMLDivElement>()
    const alertFooter = createRef<HTMLDivElement>()
    render(
      <Themed>
        <Dialog open>
          <DialogContent>
            <DialogHeader ref={header}>
              <DialogTitle>Edit</DialogTitle>
            </DialogHeader>
            <DialogBody ref={body} />
            <DialogFooter ref={footer} />
          </DialogContent>
        </Dialog>
        <Sheet open>
          <SheetContent aria-label="Filters">
            <SheetHeader ref={sheetHeader} />
          </SheetContent>
        </Sheet>
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Sure?</AlertDialogTitle>
            <AlertDialogFooter ref={alertFooter} />
          </AlertDialogContent>
        </AlertDialog>
      </Themed>,
    )
    expect(header.current).toHaveClass('sui-dialog__header')
    expect(body.current).toHaveClass('sui-dialog__body')
    expect(footer.current).toHaveClass('sui-dialog__footer')
    expect(sheetHeader.current).toHaveClass('sui-dialog__header')
    expect(alertFooter.current).toHaveClass('sui-dialog__footer')
  })
})

/* ------------------------------------------------------------ table wrapper */

describe('plain table wrapper', () => {
  it('takes containerClassName and containerProps', () => {
    const wrapper = createRef<HTMLDivElement>()
    render(
      <Table
        containerClassName="max-h-64"
        containerProps={{ ref: wrapper, tabIndex: 0, 'aria-label': 'Invoices' }}
      >
        <TableBody>
          <TableRow>
            <TableCell>INV-1</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    const region = screen.getByLabelText('Invoices')
    expect(region).toBe(wrapper.current)
    expect(region).toHaveClass('sui-plain-table-wrap', 'max-h-64')
    expect(region).toHaveAttribute('tabindex', '0')
  })
})

/* --------------------------------------------------- breakdown: duplicate keys */

describe('breakdown list keys', () => {
  it('renders every row when two buckets share a label and no key', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <BreakdownList
        showSummary
        items={[
          { label: 'Other', value: 2 },
          { label: 'Other', value: 5 },
        ]}
      />,
    )
    expect(container.querySelectorAll('.sui-breakdown__item')).toHaveLength(2)
    expect(container.querySelectorAll('.sui-segmented-bar__segment')).toHaveLength(2)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})

/* ------------------------------------------------------- dialog focus return */

describe('dialog focus return', () => {
  function MenuThenDialog() {
    const [open, setOpen] = useState(false)
    return (
      <Themed>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setOpen(true)}>Rename</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Rename job</DialogTitle>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </Themed>
    )
  }

  it('returns focus to the menu trigger after a dialog opened from a menu item', async () => {
    const user = userEvent.setup()
    render(<MenuThenDialog />)
    const trigger = screen.getByRole('button', { name: 'Actions' })

    await user.click(trigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    await screen.findByRole('dialog', { name: 'Rename job' })

    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('returns focus to the opener of a dialog that has no trigger', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <Themed>
          <Button onClick={() => setOpen(true)}>Archive</Button>
          <ConfirmDialog open={open} onOpenChange={setOpen} title="Archive it?" />
        </Themed>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Archive' })

    await user.click(opener)
    await screen.findByRole('alertdialog', { name: 'Archive it?' })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('lets the caller’s onCloseAutoFocus take over', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <Themed>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <input aria-label="Elsewhere" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                screen.getByLabelText('Elsewhere').focus()
              }}
            >
              <DialogTitle>Custom</DialogTitle>
              <DialogClose asChild>
                <Button>Close it</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </Themed>
      )
    }
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(await screen.findByRole('button', { name: 'Close it' }))
    await waitFor(() => expect(screen.getByLabelText('Elsewhere')).toHaveFocus())
  })
})

/* ------------------------------------------------------ unnamed dialog warning */

describe('unnamed dialog warning', () => {
  it('warns in development when a dialog panel has no accessible name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Themed>
        <Dialog open>
          <DialogContent>
            <p>No title here</p>
          </DialogContent>
        </Dialog>
      </Themed>,
    )
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/<DialogContent> has no accessible name/),
      ),
    )
    warn.mockRestore()
  })

  it('stays quiet for a titled dialog, a labelled sheet and a titled alert dialog', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Themed>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Edit job</DialogTitle>
          </DialogContent>
        </Dialog>
        <Sheet open>
          <SheetContent aria-label="Filters" />
        </Sheet>
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      </Themed>,
    )
    await act(() => new Promise((done) => setTimeout(done, 20)))
    expect(warn).not.toHaveBeenCalledWith(expect.stringMatching(/accessible name/))
    warn.mockRestore()
  })
})

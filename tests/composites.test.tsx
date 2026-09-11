import {
  AppShell,
  AppShellContent,
  AppShellSidebar,
  Combobox,
  ConfirmDialog,
  CopyButton,
  FileUpload,
  FloatingFormActions,
  MultiCombobox,
  PageHeader,
  PasswordStrengthIndicator,
  SectionTabs,
  SidebarGroup,
  SidebarItem,
  SkipToContent,
  StatsCard,
  StatusBadge,
  StatusRegistryProvider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toaster,
  ToastProvider,
  UIKitProvider,
  UserAvatar,
  formatBytes,
  scorePassword,
  tintIndexFor,
  useToast,
  type StatusRegistry,
} from '@shining-technologies/ui-kit-react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

/** Every component is meant to be used under a provider; test them that way. */
function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

const STATUSES: StatusRegistry = {
  job: {
    in_progress: { label: 'In progress', tone: 'primary' },
    complete: { label: 'Complete', tone: 'success' },
  },
}

const OPTIONS = [
  { value: 'syd', label: 'Sydney' },
  { value: 'mel', label: 'Melbourne' },
  { value: 'per', label: 'Perth', disabled: true },
]

describe('status badge', () => {
  it('renders the label from the registry vocabulary', () => {
    render(
      <Themed>
        <StatusRegistryProvider registry={STATUSES}>
          <StatusBadge type="job" status="in_progress" />
        </StatusRegistryProvider>
      </Themed>,
    )
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('renders a readable label for a status nobody defined', () => {
    render(
      <Themed>
        <StatusRegistryProvider registry={STATUSES}>
          <StatusBadge type="job" status="escalated_to_legal" />
        </StatusRegistryProvider>
      </Themed>,
    )
    expect(screen.getByText('Escalated to legal')).toBeInTheDocument()
  })

  it('lets a local vocabulary win over the registry', () => {
    render(
      <Themed>
        <StatusRegistryProvider registry={STATUSES}>
          <StatusBadge
            type="job"
            status="complete"
            statuses={{ complete: { label: 'Signed off', tone: 'info' } }}
          />
        </StatusRegistryProvider>
      </Themed>,
    )
    expect(screen.getByText('Signed off')).toBeInTheDocument()
  })
})

describe('stats card', () => {
  it('shows the figure, the change and the footnote', () => {
    render(
      <Themed>
        <StatsCard label="Jobs" value="8,241" change="+12.4%" trend="up" description="vs Q3" />
      </Themed>,
    )
    expect(screen.getByText('8,241')).toBeInTheDocument()
    expect(screen.getByText('+12.4%')).toBeInTheDocument()
    expect(screen.getByText('vs Q3')).toBeInTheDocument()
  })

  it('hides the figure while loading', () => {
    render(
      <Themed>
        <StatsCard label="Revenue" value="$1.4M" loading />
      </Themed>,
    )
    expect(screen.queryByText('$1.4M')).not.toBeInTheDocument()
  })

  it('becomes a real button when it is clickable', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Themed>
        <StatsCard label="Crews" value="24" onClick={onClick} />
      </Themed>,
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('page header', () => {
  it('renders at the requested heading level', () => {
    render(
      <Themed>
        <PageHeader as="h2" title="Rosewood Estates" description="14 properties" />
      </Themed>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Rosewood Estates' })).toBeInTheDocument()
  })

  it('restores the document title when it unmounts', () => {
    document.title = 'Gallery'
    const view = render(
      <Themed>
        <PageHeader title="Jobs" documentTitle />
      </Themed>,
    )
    expect(document.title).toBe('Jobs')
    view.unmount()
    expect(document.title).toBe('Gallery')
  })
})

describe('section tabs', () => {
  it('marks the active tab with aria-current and switches on click', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <SectionTabs
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today', count: 4 },
          ]}
        />
      </Themed>,
    )
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: /Today/ }))
    expect(screen.getByRole('button', { name: /Today/ })).toHaveAttribute('aria-current', 'page')
  })
})

describe('copy button', () => {
  it('writes to the clipboard and confirms', async () => {
    // `userEvent.setup()` installs a clipboard stub of its own, so ours has to
    // go in after it or it is quietly replaced.
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(
      <Themed>
        <CopyButton value="INV-2043" />
      </Themed>,
    )
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith('INV-2043')
    await waitFor(() => expect(screen.getByText('Copied to clipboard')).toBeInTheDocument())
  })
})

describe('combobox', () => {
  it('filters locally and reports the pick', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Themed>
        <Combobox options={OPTIONS} onValueChange={onValueChange} />
      </Themed>,
    )

    await user.click(screen.getByRole('combobox'))
    await user.type(await screen.findByPlaceholderText('Search…'), 'mel')
    await user.click(await screen.findByRole('option', { name: 'Melbourne' }))
    expect(onValueChange).toHaveBeenCalledWith('mel')
  })

  it('keeps picking in the multi variant without closing', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Themed>
        <MultiCombobox options={OPTIONS} value={['syd']} onValueChange={onValueChange} />
      </Themed>,
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Melbourne' }))
    expect(onValueChange).toHaveBeenCalledWith(['syd', 'mel'])
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

describe('confirm dialog', () => {
  it('runs the action and closes', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Archive client?"
          confirmLabel="Archive"
          onConfirm={onConfirm}
        />
      )
    }

    render(
      <Themed>
        <Harness />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Archive' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByText('Archive client?')).not.toBeInTheDocument())
  })
})

describe('toasts', () => {
  it('shows a toast and dismisses it again', async () => {
    const user = userEvent.setup()

    function Harness() {
      const { toast } = useToast()
      return (
        <>
          <button type="button" onClick={() => toast({ title: 'Invoice sent', duration: 0 })}>
            Notify
          </button>
          <Toaster />
        </>
      )
    }

    render(
      <Themed>
        <ToastProvider>
          <Harness />
        </ToastProvider>
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Notify' }))
    expect(await screen.findByText('Invoice sent')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByText('Invoice sent')).not.toBeInTheDocument())
  })
})

describe('file upload', () => {
  it('accepts a file and lists it', async () => {
    const onFilesAccepted = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Themed>
        <FileUpload onFilesAccepted={onFilesAccepted} />
      </Themed>,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'report.pdf', { type: 'application/pdf' }))

    expect(onFilesAccepted).toHaveBeenCalledOnce()
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
  })

  it('rejects a file that is over the size limit', async () => {
    const onFileRejected = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Themed>
        <FileUpload maxSize={4} onFileRejected={onFileRejected} />
      </Themed>,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['far too long'], 'big.pdf', { type: 'application/pdf' }))

    expect(onFileRejected).toHaveBeenCalledWith(expect.any(File), 'size')
    expect(screen.queryByText('big.pdf')).not.toBeInTheDocument()
  })

  it('formats sizes the way a file manager does', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1_536_000)).toBe('1.5 MB')
  })
})

describe('password strength', () => {
  it('scores length above decoration', () => {
    // Four characters using three classes must not beat a long passphrase.
    expect(scorePassword('a1!A').score).toBeLessThan(scorePassword('correct horse battery').score)
  })

  it('announces the verdict as text', () => {
    render(
      <Themed>
        <PasswordStrengthIndicator password="Sup3rSecret!Passphrase" />
      </Themed>,
    )
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })
})

describe('user avatar', () => {
  it('gives the same name the same tint every time', () => {
    expect(tintIndexFor('Priya Raman')).toBe(tintIndexFor('Priya Raman'))
  })

  it('exposes the name to assistive tech', () => {
    render(
      <Themed>
        <UserAvatar name="Ana Ortiz" status="online" />
      </Themed>,
    )
    expect(screen.getByText(/Ana Ortiz/)).toBeInTheDocument()
  })
})

describe('floating form actions', () => {
  it('is absent rather than merely hidden when there is nothing to save', () => {
    render(
      <Themed>
        <FloatingFormActions visible={false} onSubmit={() => undefined} />
      </Themed>,
    )
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })
})

describe('the plain table', () => {
  it('renders semantic table markup', () => {
    render(
      <Themed>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead align="end">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV-2041</TableCell>
              <TableCell numeric>4,820</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Themed>,
    )

    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Invoice' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: 'INV-2041' })).toBeInTheDocument()
  })
})

describe('the application shell', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <Themed>
        <div>
          <SkipToContent targetId="main" />
          <AppShell>
            <AppShellSidebar header={<strong>Fieldwork</strong>}>
              <SidebarGroup label="Operations">
                <SidebarItem active>Dashboard</SidebarItem>
                <SidebarItem badge={4}>Jobs</SidebarItem>
              </SidebarGroup>
            </AppShellSidebar>
            <AppShellContent>
              <PageHeader title="Dashboard" />
            </AppShellContent>
          </AppShell>
        </div>
      </Themed>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('marks the current destination', () => {
    render(
      <Themed>
        <AppShell>
          <AppShellSidebar>
            <SidebarGroup>
              <SidebarItem active>Dashboard</SidebarItem>
              <SidebarItem>Jobs</SidebarItem>
            </SidebarGroup>
          </AppShellSidebar>
        </AppShell>
      </Themed>,
    )
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders a link when given an href', () => {
    render(
      <Themed>
        <AppShell>
          <AppShellSidebar>
            <SidebarGroup>
              <SidebarItem href="/jobs">Jobs</SidebarItem>
            </SidebarGroup>
          </AppShellSidebar>
        </AppShell>
      </Themed>,
    )
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute('href', '/jobs')
  })
})

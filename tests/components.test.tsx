import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  BarChart,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Empty,
  Field,
  Input,
  LineChart,
  Pagination,
  PieChart,
  Progress,
  Sparkline,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  UIKitProvider,
} from '@shining-ui-kit/react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

const DATA = [
  { month: 'Jan', a: 10, b: 4 },
  { month: 'Feb', a: 24, b: 9 },
  { month: 'Mar', a: 18, b: 14 },
]
const SERIES = [
  { key: 'a', label: 'Bookings' },
  { key: 'b', label: 'Cancellations' },
]

/** Every component is meant to be used under a provider; test them that way. */
function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

describe('buttons and badges', () => {
  it('renders each variant with its own class and reports its variant', () => {
    render(
      <Themed>
        <Button variant="default">Save</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Cancel</Button>
      </Themed>,
    )

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('sui-btn--primary')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('sui-btn--destructive')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('sui-btn--outline')
  })

  it('keeps the earlier variant names working', () => {
    render(
      <Themed>
        <Button variant="solid">Legacy solid</Button>
        <Button variant="danger" size="md">
          Legacy danger
        </Button>
      </Themed>,
    )
    expect(screen.getByRole('button', { name: 'Legacy solid' })).toHaveClass('sui-btn--primary')
    expect(screen.getByRole('button', { name: 'Legacy danger' })).toHaveClass(
      'sui-btn--destructive',
    )
  })

  it('renders as a link when asked, without a nested button', () => {
    render(
      <Themed>
        <Button asChild>
          <a href="/jobs">All jobs</a>
        </Button>
      </Themed>,
    )
    const link = screen.getByRole('link', { name: 'All jobs' })
    expect(link).toHaveClass('sui-btn')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('drives badge colour from a token, not a shipped hex', () => {
    render(
      <Themed>
        <Badge tone="success">Paid</Badge>
      </Themed>,
    )
    expect(screen.getByText('Paid')).toHaveClass('sui-badge--success', 'sui-badge--soft')
  })
})

describe('card', () => {
  it('composes a titled panel', () => {
    render(
      <Themed>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>$248,120</CardContent>
        </Card>
      </Themed>,
    )
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$248,120')).toBeInTheDocument()
  })
})

describe('alert', () => {
  it('interrupts for an error and stays quiet otherwise', () => {
    render(
      <Themed>
        <Alert tone="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>The card was declined.</AlertDescription>
        </Alert>
        <Alert tone="info">
          <AlertTitle>Maintenance</AlertTitle>
        </Alert>
      </Themed>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed')
    expect(screen.getByRole('note')).toHaveTextContent('Maintenance')
  })
})

describe('field', () => {
  it('wires the label, description and error to the control', () => {
    render(
      <Themed>
        <Field label="Email" description="We never share it." error="Already in use." required>
          <Input defaultValue="a@b.com" />
        </Field>
      </Themed>,
    )

    const input = screen.getByLabelText(/Email/)
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('We never share it. Already in use.')
  })

  it('reaches a textarea and a switch the same way', () => {
    render(
      <Themed>
        <Field label="Notes">
          <Textarea />
        </Field>
        <Field label="Notify me" orientation="horizontal">
          <Switch />
        </Field>
      </Themed>,
    )

    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Notify me' })).toBeInTheDocument()
  })

  it('propagates disabled from the field to the control', () => {
    render(
      <Themed>
        <Field label="Locked" disabled>
          <Input />
        </Field>
      </Themed>,
    )
    expect(screen.getByLabelText('Locked')).toBeDisabled()
  })
})

describe('tabs and accordion', () => {
  it('switches panels', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel</TabsContent>
          <TabsContent value="two">Second panel</TabsContent>
        </Tabs>
      </Themed>,
    )

    expect(screen.getByText('First panel')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Second panel')).toBeInTheDocument()
  })

  it('gives each accordion trigger a heading to sit in', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>Shipping</AccordionTrigger>
            <AccordionContent>Two to five days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Themed>,
    )

    const heading = screen.getByRole('heading', { name: 'Shipping' })
    await user.click(within(heading).getByRole('button'))
    expect(screen.getByText('Two to five days.')).toBeInTheDocument()
  })
})

describe('dialog', () => {
  it('opens, names itself and closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Themed>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit job</DialogTitle>
            <DialogDescription>Change the reference.</DialogDescription>
          </DialogContent>
        </Dialog>
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit job' })
    expect(dialog).toHaveAccessibleDescription('Change the reference.')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('pagination', () => {
  it('keeps a stable number of slots and reports the current page', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [page, setPage] = useState(1)
      return <Pagination page={page} pageCount={40} onPageChange={setPage} />
    }

    render(
      <Themed>
        <Harness />
      </Themed>,
    )

    const initialButtons = screen.getAllByRole('button').length
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('button')).toHaveLength(initialButtons)
  })
})

describe('feedback', () => {
  it('reports determinate and indeterminate progress distinctly', () => {
    render(
      <Themed>
        <Progress value={40} aria-label="Upload" />
        <Progress value={null} aria-label="Syncing" />
      </Themed>,
    )

    expect(screen.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    )
    expect(screen.getByRole('progressbar', { name: 'Syncing' })).not.toHaveAttribute(
      'aria-valuenow',
    )
  })

  it('lets a spinner be decorative when its context already says "loading"', () => {
    render(
      <Themed>
        <Spinner />
        <Button>
          <Spinner label={null} />
          Saving
        </Button>
      </Themed>,
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('renders an empty state with its actions', () => {
    render(
      <Themed>
        <Empty title="No jobs" description="Nothing scheduled." actions={<Button>Add</Button>} />
      </Themed>,
    )
    expect(screen.getByText('No jobs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})

describe('charts', () => {
  it('draws a line per series and a legend entry per series', () => {
    const { container } = render(
      <Themed>
        <LineChart data={DATA} xKey="month" series={SERIES} />
      </Themed>,
    )

    expect(container.querySelectorAll('.sui-chart__line')).toHaveLength(2)
    expect(screen.getByText('Bookings')).toBeInTheDocument()
    expect(screen.getByText('Cancellations')).toBeInTheDocument()
  })

  it('hides a series when its legend entry is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Themed>
        <LineChart data={DATA} xKey="month" series={SERIES} />
      </Themed>,
    )

    await user.click(screen.getByRole('button', { name: /Bookings/ }))
    expect(container.querySelectorAll('.sui-chart__line')).toHaveLength(1)
  })

  it('draws one bar per series per datum', () => {
    const { container } = render(
      <Themed>
        <BarChart data={DATA} xKey="month" series={SERIES} />
      </Themed>,
    )
    expect(container.querySelectorAll('.sui-chart__bar')).toHaveLength(DATA.length * SERIES.length)
  })

  it('draws one slice per datum and never emits a NaN path', () => {
    const { container } = render(
      <Themed>
        <PieChart
          data={[
            { key: 'a', value: 3 },
            { key: 'b', value: 1 },
          ]}
        />
      </Themed>,
    )

    const slices = container.querySelectorAll('.sui-chart__slice')
    expect(slices).toHaveLength(2)
    for (const slice of slices) {
      expect(slice.getAttribute('d')).not.toMatch(/NaN/)
    }
  })

  it('shows a message rather than an empty box when there is nothing to plot', () => {
    render(
      <Themed>
        <LineChart data={[]} xKey="month" series={SERIES} emptyMessage="No activity" />
      </Themed>,
    )
    expect(screen.getByText('No activity')).toBeInTheDocument()
  })

  it('renders a sparkline on the first paint, with no measurement needed', () => {
    const { container } = render(
      <Themed>
        <Sparkline data={[1, 5, 3, 9, 7]} area />
      </Themed>,
    )
    const path = container.querySelector('.sui-chart__line')
    expect(path).toBeTruthy()
    expect(path!.getAttribute('d')).not.toMatch(/NaN/)
  })
})

describe('accessibility', () => {
  it('has no axe violations across a page of components', async () => {
    const { container } = render(
      <Themed>
        <main>
          <Card>
            <CardHeader>
              <CardTitle>Book a service</CardTitle>
              <CardDescription>Tell us where and when.</CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Address" description="Street and suburb." required>
                <Input />
              </Field>
              <Field label="Notes">
                <Textarea />
              </Field>
              <Progress value={60} aria-label="Completion" />
              <Alert tone="warning">
                <AlertTitle>Licence expiring</AlertTitle>
                <AlertDescription>Renew before 14 March.</AlertDescription>
              </Alert>
              <Badge tone="success">Confirmed</Badge>
              <Button>Submit</Button>
            </CardContent>
          </Card>
        </main>
      </Themed>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

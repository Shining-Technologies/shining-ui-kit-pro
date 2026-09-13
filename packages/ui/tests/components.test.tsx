import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
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
  Pagination,
  Progress,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@shining-technologies/ui'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

describe('buttons and badges', () => {
  it('renders each variant with its own class and reports its variant', () => {
    render(
      <>
        <Button variant="default">Save</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Cancel</Button>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('sui-btn--primary')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('sui-btn--destructive')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('sui-btn--outline')
  })

  it('renders as a link when asked, without a nested button', () => {
    render(
      <>
        <Button asChild>
          <a href="/jobs">All jobs</a>
        </Button>
      </>,
    )
    const link = screen.getByRole('link', { name: 'All jobs' })
    expect(link).toHaveClass('sui-btn')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('drives badge colour from a token, not a shipped hex', () => {
    render(
      <>
        <Badge tone="success">Paid</Badge>
      </>,
    )
    expect(screen.getByText('Paid')).toHaveClass('sui-badge--success', 'sui-badge--soft')
  })
})

describe('card', () => {
  it('composes a titled panel', () => {
    render(
      <>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>$248,120</CardContent>
        </Card>
      </>,
    )
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$248,120')).toBeInTheDocument()
  })
})

describe('alert', () => {
  it('interrupts for an error and stays quiet otherwise', () => {
    render(
      <>
        <Alert tone="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>The card was declined.</AlertDescription>
        </Alert>
        <Alert tone="info">
          <AlertTitle>Maintenance</AlertTitle>
        </Alert>
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed')
    expect(screen.getByRole('note')).toHaveTextContent('Maintenance')
  })
})

describe('field', () => {
  it('wires the label, description and error to the control', () => {
    render(
      <>
        <Field label="Email" description="We never share it." error="Already in use." required>
          <Input defaultValue="a@b.com" />
        </Field>
      </>,
    )

    const input = screen.getByLabelText(/Email/)
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('We never share it. Already in use.')
  })

  it('reaches a textarea and a switch the same way', () => {
    render(
      <>
        <Field label="Notes">
          <Textarea />
        </Field>
        <Field label="Notify me" orientation="horizontal">
          <Switch />
        </Field>
      </>,
    )

    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Notify me' })).toBeInTheDocument()
  })

  it('propagates disabled from the field to the control', () => {
    render(
      <>
        <Field label="Locked" disabled>
          <Input />
        </Field>
      </>,
    )
    expect(screen.getByLabelText('Locked')).toBeDisabled()
  })
})

describe('tabs and accordion', () => {
  it('switches panels', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel</TabsContent>
          <TabsContent value="two">Second panel</TabsContent>
        </Tabs>
      </>,
    )

    expect(screen.getByText('First panel')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Second panel')).toBeInTheDocument()
  })

  it('gives each accordion trigger a heading to sit in', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>Shipping</AccordionTrigger>
            <AccordionContent>Two to five days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </>,
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
      <>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit job</DialogTitle>
            <DialogDescription>Change the reference.</DialogDescription>
          </DialogContent>
        </Dialog>
      </>,
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
      <>
        <Harness />
      </>,
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
      <>
        <Progress value={40} aria-label="Upload" />
        <Progress value={null} aria-label="Syncing" />
      </>,
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
      <>
        <Spinner />
        <Button>
          <Spinner label={null} />
          Saving
        </Button>
      </>,
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('renders an empty state with its actions', () => {
    render(
      <>
        <Empty title="No jobs" description="Nothing scheduled." actions={<Button>Add</Button>} />
      </>,
    )
    expect(screen.getByText('No jobs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})

describe('accessibility', () => {
  it('has no axe violations across a page of components', async () => {
    const { container } = render(
      <>
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
      </>,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

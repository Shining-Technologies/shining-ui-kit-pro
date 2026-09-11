import {
  BreakdownList,
  Card,
  CardHeader,
  CardIcon,
  CardTitle,
  Empty,
  MetricGrid,
  MetricTile,
  SegmentedBar,
  StatusDot,
  StatusFlow,
  StatusRegistryProvider,
  StepCard,
  SummaryCard,
  UIKitProvider,
  type StatusRegistry,
} from '@shining-technologies/ui-kit-react'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

function Themed({ children }: { children: ReactNode }) {
  return (
    <UIKitProvider project="shining" mode="light">
      {children}
    </UIKitProvider>
  )
}

const ITEMS = [
  { key: 'open', label: 'Open', value: 3, tone: 'info' as const },
  { key: 'rejected', label: 'Rejected', value: 0, tone: 'destructive' as const },
  { key: 'done', label: 'Done', value: 1, tone: 'success' as const },
]

describe('card icon', () => {
  it('is decorative and carries its tone', () => {
    render(
      <Themed>
        <Card>
          <CardHeader>
            <CardIcon tone="warning" data-testid="icon">
              ★
            </CardIcon>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
        </Card>
      </Themed>,
    )
    const icon = screen.getByTestId('icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveClass('sui-tone--warning')
  })
})

describe('metric tile', () => {
  it('shows the figure, the delta and the hint', () => {
    render(
      <Themed>
        <MetricGrid columns={3}>
          <MetricTile label="Total" value="49" delta="+4" trend="up" hint="this month" />
        </MetricGrid>
      </Themed>,
    )
    expect(screen.getByText('49')).toBeInTheDocument()
    expect(screen.getByText('+4')).toHaveClass('sui-metric-tile__delta--up')
    expect(screen.getByText('this month')).toBeInTheDocument()
  })

  it('hides the figure while loading and spans the row when asked', () => {
    render(
      <Themed>
        <MetricTile label="Revenue" value="$1.4M" loading span="full" data-testid="tile" />
      </Themed>,
    )
    expect(screen.queryByText('$1.4M')).not.toBeInTheDocument()
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('tile')).toHaveClass('sui-metric-tile--full')
  })
})

describe('breakdown list', () => {
  it('renders a row per bucket, zeros included, named by its title', () => {
    render(
      <Themed>
        <BreakdownList title="By status" items={ITEMS} showPercent />
      </Themed>,
    )
    const list = screen.getByRole('list', { name: 'By status' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveAttribute('data-empty', 'true')
    expect(rows[0]).toHaveTextContent('75%')
  })

  it('does not divide by zero when every bucket is empty', () => {
    render(
      <Themed>
        <BreakdownList items={[{ label: 'Open', value: 0 }]} showPercent showShare />
      </Themed>,
    )
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('says so in one line when there are no buckets', () => {
    render(
      <Themed>
        <BreakdownList title="By status" items={[]} empty="Nothing yet." />
      </Themed>,
    )
    expect(screen.getByText('Nothing yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('segmented bar', () => {
  it('is one image named with the counts, and skips empty segments', () => {
    const { container } = render(
      <Themed>
        <SegmentedBar label="Requests" segments={ITEMS} />
      </Themed>,
    )
    expect(screen.getByRole('img')).toHaveAccessibleName('Requests: Open 3, Rejected 0, Done 1')
    expect(container.querySelectorAll('.sui-segmented-bar__segment')).toHaveLength(2)
  })
})

describe('status dot', () => {
  it('is decorative without a label, and named when given one', () => {
    render(
      <Themed>
        <StatusDot tone="success" data-testid="bare" />
        <StatusDot tone="warning" aria-label="Degraded" />
        <StatusDot tone="info" label="Syncing" pulse />
      </Themed>,
    )
    expect(screen.getByTestId('bare')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: 'Degraded' })).toBeInTheDocument()
    expect(screen.getByText('Syncing')).toBeInTheDocument()
  })
})

describe('inline empty', () => {
  it('uses the inline variant class', () => {
    render(
      <Themed>
        <Empty variant="inline" title="No records yet." data-testid="empty" />
      </Themed>,
    )
    expect(screen.getByTestId('empty')).toHaveClass('sui-empty--inline')
  })
})

describe('status flow', () => {
  const REGISTRY: StatusRegistry = {
    order: {
      pending: { label: 'Pending', tone: 'warning' },
      sent: { label: 'Sent', tone: 'info' },
      paid: { label: 'Paid', tone: 'success' },
    },
  }

  it('resolves the steps through the status registry', () => {
    render(
      <Themed>
        <StatusRegistryProvider registry={REGISTRY}>
          <StatusFlow type="order" label="Order" steps={['pending', 'sent', 'paid']} />
        </StatusRegistryProvider>
      </Themed>,
    )
    const list = screen.getByRole('list', { name: 'Order' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Pending')).toHaveClass('sui-status-badge--warning')
  })

  it('tracks the current step', () => {
    render(
      <Themed>
        <StatusFlow
          statuses={REGISTRY.order}
          steps={['pending', 'sent', 'paid']}
          alternates={['cancelled']}
          current={1}
        />
      </Themed>,
    )
    const [done, current, upcoming] = screen.getAllByRole('listitem')
    expect(done).toHaveAttribute('data-state', 'done')
    expect(done).toHaveTextContent('(done)')
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(upcoming!.firstElementChild).toHaveClass('sui-status-badge--neutral')
    // An unknown alternate still renders, prettified.
    expect(screen.getByText('Or:')).toBeInTheDocument()
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })
})

describe('step card', () => {
  it('renders the step, the body and the condition', () => {
    render(
      <Themed>
        <StepCard step={2} title="Quote" description="We send a price." condition="It is accepted.">
          <p>Body</p>
        </StepCard>
      </Themed>,
    )
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Moves on when:')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('marks the current and finished steps', () => {
    render(
      <Themed>
        <StepCard step={1} state="done" title="Intake" />
        <StepCard step={2} state="current" title="Review" data-testid="current" />
      </Themed>,
    )
    expect(screen.getByText(/Step 1, done/)).toBeInTheDocument()
    expect(screen.getByTestId('current')).toHaveAttribute('aria-current', 'step')
  })
})

describe('summary card', () => {
  it('assembles the header, the figures and the breakdown', async () => {
    const { container } = render(
      <Themed>
        <SummaryCard
          icon="★"
          title="Partner pipeline"
          description="Applications"
          metrics={[
            { label: 'Total', value: 49 },
            { label: 'New', value: 48 },
          ]}
          breakdown={ITEMS}
        />
      </Themed>,
    )
    expect(screen.getByText('Partner pipeline')).toBeInTheDocument()
    expect(screen.getByText('49')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'By status' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('puts every figure into its loading state', () => {
    render(
      <Themed>
        <SummaryCard
          title="Queue"
          metrics={[{ label: 'Total', value: 12 }]}
          breakdown={ITEMS}
          loading
        />
      </Themed>,
    )
    expect(screen.queryByText('12')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

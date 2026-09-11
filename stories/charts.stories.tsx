import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent } from '@shining-technologies/ui-kit-react'
import {
  BarChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline,
  StatTile,
  TrendChart,
} from '@shining-technologies/ui-kit-react/recharts'

/**
 * # Charts
 *
 * Six forms on Recharts, sharing one frame, one palette, one tooltip and one
 * set of responsive rules. Series colours come from `--sui-chart-1..5`, so a
 * chart follows a project switch exactly like a button does — try the project
 * switcher with any story below open.
 *
 * Every chart measures **its own container**, not the viewport: the panel
 * stories below resize the card, not the browser, and the charts respond to
 * that. Drag the Storybook preview narrower to see labels thin, axes drop and
 * the bar chart flip to horizontal.
 */
const meta = {
  title: 'Components/Charts',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const months = [
  { month: 'Jan', booked: 118, completed: 96, cancelled: 12 },
  { month: 'Feb', booked: 148, completed: 131, cancelled: 9 },
  { month: 'Mar', booked: 96, completed: 88, cancelled: 6 },
  { month: 'Apr', booked: 162, completed: 140, cancelled: 14 },
  { month: 'May', booked: 187, completed: 171, cancelled: 8 },
  { month: 'Jun', booked: 204, completed: 189, cancelled: 11 },
]

const jobSeries = [
  { key: 'booked', label: 'Booked' },
  { key: 'completed', label: 'Completed' },
]

const suburbs = [
  { suburb: 'Brunswick East', jobs: 142 },
  { suburb: 'Carlton North', jobs: 118 },
  { suburb: 'Fitzroy', jobs: 96 },
  { suburb: 'Northcote', jobs: 74 },
  { suburb: 'Preston', jobs: 51 },
]

const statuses = [
  { key: 'completed', label: 'Completed', value: 412 },
  { key: 'active', label: 'In progress', value: 96 },
  { key: 'scheduled', label: 'Scheduled', value: 64 },
  { key: 'blocked', label: 'Blocked', value: 18 },
]

const quotes = [
  { client: 'Acme Facilities', days: 4, value: 2400, channel: 'Web' },
  { client: 'Borden Group', days: 11, value: 5200, channel: 'Referral' },
  { client: 'Crane & Co', days: 6, value: 3100, channel: 'Web' },
  { client: 'Delta Retail', days: 18, value: 8600, channel: 'Referral' },
  { client: 'Eastwood', days: 3, value: 1400, channel: 'Web' },
  { client: 'Fairmont', days: 14, value: 6900, channel: 'Outbound' },
  { client: 'Gladstone', days: 9, value: 4100, channel: 'Outbound' },
]

/** A chart is normally dropped into a card; that is the surface it is drawn for. */
function Panel({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <Card style={width ? { width, maxWidth: '100%' } : undefined}>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** Change over time. `variant="area"` fills beneath the line for volume. */
export const Trend: Story = {
  render: () => (
    <Panel>
      <TrendChart
        title="Bookings"
        description="Booked against completed, last six months"
        data={months}
        xKey="month"
        series={jobSeries}
        smooth
      />
    </Panel>
  ),
}

export const Area: Story = {
  render: () => (
    <Panel>
      <TrendChart
        title="Job volume"
        description="Stacked by outcome"
        data={months}
        xKey="month"
        series={[...jobSeries, { key: 'cancelled', label: 'Cancelled' }]}
        variant="area"
        stacked
        smooth
      />
    </Panel>
  ),
}

/** A reference line turns a trend into a chart about whether a target is met. */
export const AgainstATarget: Story = {
  render: () => (
    <Panel>
      <TrendChart
        title="Completed jobs"
        data={months}
        xKey="month"
        series={[{ key: 'completed', label: 'Completed' }]}
        variant="area"
        reference={{ value: 150, label: 'Target' }}
        showPoints
      />
    </Panel>
  ),
}

/** Magnitude across categories. `sort` makes it a ranked chart. */
export const Bars: Story = {
  render: () => (
    <Panel>
      <BarChart
        title="Jobs by suburb"
        description="Completed in the last quarter"
        data={suburbs}
        xKey="suburb"
        series={[{ key: 'jobs', label: 'Jobs' }]}
        sort="desc"
        showValues
      />
    </Panel>
  ),
}

export const StackedBars: Story = {
  render: () => (
    <Panel>
      <BarChart
        title="Outcome by month"
        data={months}
        xKey="month"
        series={[...jobSeries, { key: 'cancelled', label: 'Cancelled' }]}
        stacked
      />
    </Panel>
  ),
}

export const HundredPercent: Story = {
  render: () => (
    <Panel>
      <BarChart
        title="Share of outcomes"
        description="The table view keeps the underlying counts"
        data={months}
        xKey="month"
        series={[...jobSeries, { key: 'cancelled', label: 'Cancelled' }]}
        stacked="percent"
      />
    </Panel>
  ),
}

/** Part of a whole, with the whole stated in the hole. */
export const Donut: Story = {
  render: () => (
    <Panel width={420}>
      <DonutChart
        title="Jobs by status"
        description="Current quarter"
        data={statuses}
        centerLabel="jobs"
      />
    </Panel>
  ),
}

/** One measure against what it is aiming at. */
export const Gauge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Panel width={260}>
        <GaugeChart title="On-time arrival" value={94.2} centerLabel="of target" />
      </Panel>
      <Panel width={260}>
        <GaugeChart
          title="Contractor utilisation"
          value={61}
          thresholds={{ good: 0.8, warning: 0.6 }}
          centerLabel="of capacity"
        />
      </Panel>
    </div>
  ),
}

/** Whether two measures move together — the one question a line chart fudges. */
export const Scatter: Story = {
  render: () => (
    <Panel>
      <ScatterChart
        title="Quote value against time to close"
        description="Each point is a quote"
        data={quotes}
        xKey="days"
        yKey="value"
        groupKey="channel"
        labelKey="client"
        xLabel="Days to close"
        yLabel="Quote value"
      />
    </Panel>
  ),
}

/** When the answer is one number, a tile beats a chart with one bar in it. */
export const Figures: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}
    >
      <Panel>
        <StatTile
          label="Revenue"
          value={128400}
          delta={{ value: 12.4, period: 'vs last month' }}
          trend={[92, 104, 98, 116, 121, 118, 128]}
        />
      </Panel>
      <Panel>
        <StatTile
          label="Cancellation rate"
          value="4.1%"
          delta={{ value: 0.8, period: 'vs last month', upIsGood: false }}
          trend={[3.1, 3.4, 3.2, 3.8, 3.9, 4.0, 4.1]}
        />
      </Panel>
      <Panel>
        <StatTile label="Active contractors" value={86} delta={{ value: 0, period: 'flat' }} />
      </Panel>
    </div>
  ),
}

export const SparklineOnly: Story = {
  name: 'Sparkline',
  render: () => (
    <Panel width={220}>
      <Sparkline data={[3, 7, 5, 12, 9, 14, 18]} ariaLabel="Rising over seven weeks" />
    </Panel>
  ),
}

/**
 * The same chart at four container widths.
 *
 * Nothing here is a viewport query — each card is a different width on the
 * same screen, and each chart reads its own box. Watch the value axis leave at
 * the narrowest size and the labels thin before they angle.
 */
export const Responsive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {[280, 380, 520, 760].map((width) => (
        <Panel key={width} width={width}>
          <TrendChart title={`${width}px`} data={months} xKey="month" series={jobSeries} smooth />
        </Panel>
      ))}
    </div>
  ),
}

/**
 * The bar chart flips to horizontal when the labels stop fitting under a
 * column — a long suburb name reads fine down the side and never fits below.
 */
export const OrientationFlips: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {[300, 720].map((width) => (
        <Panel key={width} width={width}>
          <BarChart
            title={`${width}px`}
            data={suburbs}
            xKey="suburb"
            series={[{ key: 'jobs', label: 'Jobs' }]}
            sort="desc"
          />
        </Panel>
      ))}
    </div>
  ),
}

/** Empty and loading are part of the component, not something to build around it. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Panel width={340}>
        <TrendChart title="Loading" data={months} xKey="month" series={jobSeries} loading />
      </Panel>
      <Panel width={340}>
        <TrendChart
          title="No data"
          data={[]}
          xKey="month"
          series={jobSeries}
          emptyMessage="No bookings in this range"
        />
      </Panel>
    </div>
  ),
}

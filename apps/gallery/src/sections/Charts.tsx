import type { ReactNode } from 'react'
import { Card, CardContent, StatsCard } from '@shining-technologies/ui'
import {
  BarChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline,
  TrendChart,
  type ChartDatum,
  type ChartSeries,
} from '@shining-technologies/ui/charts'
import { CHANNEL_SPLIT, CHART_MONTHS, SPARK_SERIES } from '../data'
import { Demo } from './Demo'

/*
 * Series lists live at module scope: the charts memoise on the array's
 * identity, and a literal in JSX would be a new array on every render.
 */
const SERIES: ChartSeries[] = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]
const SERIES_TWO = SERIES.slice(0, 2)
const COMPLETED_ONLY: ChartSeries[] = [{ key: 'completed', label: 'Completed' }]
const LAST_HALF = CHART_MONTHS.slice(-6)

const CHANNEL_ROWS: ChartDatum[] = CHANNEL_SPLIT.map((slice) => ({
  channel: slice.label,
  customers: slice.value,
}))
const CUSTOMERS: ChartSeries[] = [{ key: 'customers', label: 'Customers' }]

const JOBS_BY_SUBURB: ChartDatum[] = [
  { suburb: 'Surry Hills', jobs: 96 },
  { suburb: 'Parramatta', jobs: 184 },
  { suburb: 'Chatswood', jobs: 131 },
  { suburb: 'Brunswick East', jobs: 58 },
  { suburb: 'Newtown', jobs: 77 },
  { suburb: 'Penrith', jobs: 142 },
  { suburb: 'Manly', jobs: 44 },
]
const JOBS: ChartSeries[] = [{ key: 'jobs', label: 'Jobs' }]

/** Quotes: value against days to close, by channel, sized by crew hours. */
const QUOTES: ChartDatum[] = [
  { client: 'Harbourside Property', days: 4, value: 4820, hours: 18, channel: 'Referral' },
  { client: 'Rosewood Estates', days: 9, value: 1290, hours: 6, channel: 'Organic search' },
  { client: 'Kingsley Group', days: 21, value: 7355, hours: 30, channel: 'Paid' },
  { client: 'Northline Facilities', days: 14, value: 640, hours: 4, channel: 'Paid' },
  { client: 'Bayview Strata', days: 6, value: 3120, hours: 12, channel: 'Referral' },
  { client: 'Cedar & Stone', days: 11, value: 2480, hours: 10, channel: 'Organic search' },
  { client: 'Meridian Health', days: 27, value: 9860, hours: 42, channel: 'Paid' },
  { client: 'Oakridge Schools', days: 18, value: 5410, hours: 22, channel: 'Organic search' },
  { client: 'Luna Park Events', days: 3, value: 880, hours: 5, channel: 'Referral' },
  { client: 'Greenway Council', days: 32, value: 12400, hours: 56, channel: 'Paid' },
  { client: 'Wattle Dental', days: 8, value: 1760, hours: 8, channel: 'Referral' },
  { client: 'Summit Logistics', days: 16, value: 4390, hours: 20, channel: 'Organic search' },
  { client: 'Marlow Hotels', days: 24, value: 6970, hours: 28, channel: 'Paid' },
  { client: 'Seaside Aquatics', days: 5, value: 2210, hours: 9, channel: 'Referral' },
  { client: 'Ironbark Joinery', days: 12, value: 1540, hours: 7, channel: 'Organic search' },
  { client: 'Coral Bay Resort', days: 29, value: 10150, hours: 48, channel: 'Paid' },
]

const CANCELLATIONS = [...SPARK_SERIES].reverse()

const STATS = [
  {
    label: 'Sessions',
    value: '52.4k',
    change: '+18.2%',
    trend: 'up' as const,
    data: SPARK_SERIES,
    color: 'var(--chart-1)',
    variant: 'area' as const,
  },
  {
    label: 'Conversions',
    value: '3,180',
    change: '+9.6%',
    trend: 'up' as const,
    data: SPARK_SERIES.map((v, i) => v + ((i * 7) % 9)),
    color: 'var(--chart-3)',
    variant: 'line' as const,
  },
  {
    label: 'Cancellations',
    value: '41',
    change: '−22%',
    // A fall in cancellations is good news, so the trend says "up".
    trend: 'up' as const,
    data: CANCELLATIONS,
    color: 'var(--chart-5)',
    variant: 'area' as const,
  },
]

/** Charts draw on `--sui-chart-surface`, which defaults to the card colour. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function Charts() {
  return (
    <div className="stack">
      <Demo
        title="Trend: line and area"
        note="One component for both, because an area is a line with the space beneath it filled. Colours come from --chart-1..5 in a non-adjacent order, so two or three series never land on neighbouring hues. Click a legend item to hide a series."
        inline={false}
      >
        <div className="grid-2">
          <Panel>
            <TrendChart
              title="Bookings"
              description="Straight segments; points appear only while they are sparse enough to read."
              data={CHART_MONTHS}
              xKey="month"
              series={SERIES}
            />
          </Panel>
          <Panel>
            <TrendChart
              title="Smoothed area"
              description="A monotone curve, so it never overshoots below zero between two positive months."
              data={CHART_MONTHS}
              xKey="month"
              series={SERIES_TWO}
              variant="area"
              smooth
            />
          </Panel>
        </div>
      </Demo>

      <Demo
        title="Stacked and with a target"
        note="Stacked areas are opaque so they read as parts of a total; a reference line marks a target without being mistaken for a series."
        inline={false}
      >
        <div className="grid-2">
          <Panel>
            <TrendChart
              title="Stacked volume"
              data={CHART_MONTHS}
              xKey="month"
              series={SERIES_TWO}
              variant="area"
              stacked
            />
          </Panel>
          <Panel>
            <TrendChart
              title="Completed against target"
              description="One series needs no legend — the title already says what is plotted."
              data={CHART_MONTHS}
              xKey="month"
              series={COMPLETED_ONLY}
              reference={{ value: 700, label: 'Target' }}
              unit=" jobs"
            />
          </Panel>
        </div>
      </Demo>

      <Demo
        title="Bar"
        note="Columns flip to horizontal bars when the container is too narrow for the category labels. Stacks are separated by a gap in the surface colour, not by a border."
        inline={false}
      >
        <div className="grid-2">
          <Panel>
            <BarChart title="Grouped" data={LAST_HALF} xKey="month" series={SERIES} />
          </Panel>
          <Panel>
            <BarChart title="Stacked" data={LAST_HALF} xKey="month" series={SERIES} stacked />
          </Panel>
          <Panel>
            <BarChart
              title="Share of bookings"
              description="Percent stacking normalises a copy; the tooltip and table keep the real counts."
              data={LAST_HALF}
              xKey="month"
              series={SERIES}
              stacked="percent"
            />
          </Panel>
          <Panel>
            <BarChart
              title="Jobs by suburb"
              description="Sorted and horizontal: long labels read down the side, and values print on the bar ends."
              data={JOBS_BY_SUBURB}
              xKey="suburb"
              series={JOBS}
              orientation="bars"
              sort="desc"
              showValues
            />
          </Panel>
        </div>
      </Demo>

      <Demo
        title="Donut and pie"
        note="Prefer the donut: the eye compares arc lengths better than areas, and the hole gives the total somewhere to live. Past about six slices, a ranked bar chart reads better."
        inline={false}
      >
        <div className="grid-2">
          <Panel>
            <DonutChart title="Customers by channel" data={CHANNEL_SPLIT} centerLabel="customers" />
          </Panel>
          <Panel>
            <DonutChart title="Pie" data={CHANNEL_SPLIT} variant="pie" />
          </Panel>
          <Panel>
            <BarChart
              title="The same split, ranked"
              data={CHANNEL_ROWS}
              xKey="channel"
              series={CUSTOMERS}
              orientation="bars"
              sort="desc"
              showValues
            />
          </Panel>
        </div>
      </Demo>

      <Demo
        title="Gauge"
        note="One measure against a target. Severity colour is opt-in through thresholds — most gauges are a neutral share with no opinion attached."
        inline={false}
      >
        <div className="grid-3">
          <Panel>
            <GaugeChart title="Crew utilisation" value={78} centerLabel="of rostered hours" />
          </Panel>
          <Panel>
            <GaugeChart
              title="On-time SLA"
              value={96.4}
              thresholds={{ good: 0.95, warning: 0.85 }}
              centerLabel="on time"
            />
          </Panel>
          <Panel>
            <GaugeChart
              title="First-time fix"
              value={71}
              thresholds={{ good: 0.9, warning: 0.8 }}
              centerLabel="fixed on first visit"
            />
          </Panel>
        </div>
      </Demo>

      <Demo
        title="Scatter"
        note="The one form that answers whether two measures move together. Point size encodes area, not radius, so a doubled value does not look four times as big."
        inline={false}
      >
        <Panel>
          <ScatterChart
            title="Quote value against time to close"
            description="Grouped by channel, sized by crew hours."
            data={QUOTES}
            xKey="days"
            yKey="value"
            groupKey="channel"
            sizeKey="hours"
            labelKey="client"
            xLabel="Days to close"
            yLabel="Quote value"
          />
        </Panel>
      </Demo>

      <Demo
        title="Sparkline"
        note="Shape without magnitude: no axes, no tooltip. The figure beside it says how much; the line only says which way and how steadily."
        inline={false}
      >
        <div className="grid-3">
          {STATS.map((stat) => (
            <StatsCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              description="vs last month"
              chart={<Sparkline data={stat.data} color={stat.color} variant={stat.variant} />}
            />
          ))}
        </div>
      </Demo>

      <Demo
        title="Loading and empty"
        note="While loading, the plot is a shimmer and the data table is withheld — whatever is in data then is not the answer yet."
        inline={false}
      >
        <div className="grid-2">
          <Panel>
            <TrendChart title="Loading" data={CHART_MONTHS} xKey="month" series={SERIES} loading />
          </Panel>
          <Panel>
            <BarChart
              title="Empty"
              data={[]}
              xKey="month"
              series={SERIES}
              emptyMessage="No activity in this period"
            />
          </Panel>
        </div>
      </Demo>
    </div>
  )
}

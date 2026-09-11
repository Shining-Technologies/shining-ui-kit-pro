import {
  BarChart,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LineChart,
  PieChart,
  Sparkline,
  Stat,
} from '@shining-technologies/ui-kit-react'
import { CHANNEL_SPLIT, CHART_MONTHS, SPARK_SERIES } from '../data'
import { Demo } from './Demo'

const SERIES = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function Charts() {
  return (
    <div className="stack">
      <Demo
        title="Line and area"
        note="Series colours come from --sui-chart-1..5, which the project derives from your brand colours. Click a legend item to hide a series."
        inline={false}
      >
        <div className="grid-2">
          <Card>
            <CardHeader>
              <CardTitle>Line</CardTitle>
              <CardDescription>Straight segments, points on hover.</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={CHART_MONTHS} xKey="month" series={SERIES} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Smoothed area</CardTitle>
              <CardDescription>
                Control points follow the local slope, so the curve never overshoots below zero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={CHART_MONTHS} xKey="month" series={SERIES.slice(0, 2)} area smooth />
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo title="Bar" inline={false}>
        <div className="grid-2">
          <Card>
            <CardHeader>
              <CardTitle>Grouped</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={CHART_MONTHS.slice(-6)} xKey="month" series={SERIES} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stacked</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={CHART_MONTHS.slice(-6)} xKey="month" series={SERIES} stacked />
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo title="Pie and donut" inline={false}>
        <div className="grid-2">
          <Card>
            <CardHeader>
              <CardTitle>Donut</CardTitle>
              <CardDescription>
                Easier to read than a pie — the eye compares arc lengths better than areas — and the
                hole gives the total somewhere to live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={CHANNEL_SPLIT} centerLabel="4,812" centerCaption="customers" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pie</CardTitle>
              <CardDescription>Starts at twelve o'clock, like every clock face.</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={CHANNEL_SPLIT} innerRadius={0} />
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo
        title="Sparkline"
        note="Sized in its own viewBox rather than measured, so it paints correctly on the first frame inside a table cell."
        inline={false}
      >
        <div className="grid-3">
          {(['chart-1', 'chart-3', 'chart-5'] as const).map((token, i) => (
            <Card key={token}>
              <CardContent className="stack-sm">
                <Stat
                  label={['Sessions', 'Conversions', 'Revenue'][i]!}
                  value={['52.4k', '3,180', '$248k'][i]!}
                  delta="+18.2%"
                  trend="up"
                />
                <Sparkline data={SPARK_SERIES} color={`var(--sui-${token})`} area />
              </CardContent>
            </Card>
          ))}
        </div>
      </Demo>

      <Demo title="Empty" inline={false}>
        <Card>
          <CardContent>
            <LineChart
              data={[]}
              xKey="month"
              series={SERIES}
              emptyMessage="No activity in this period"
            />
          </CardContent>
        </Card>
      </Demo>
    </div>
  )
}

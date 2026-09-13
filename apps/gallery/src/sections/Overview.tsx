import {
  Alert,
  AlertDescription,
  AlertTitle,
  AvatarGroup,
  Badge,
  BreakdownList,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  MetricGrid,
  MetricTile,
  Progress,
  StatsCard,
  UserAvatar,
} from '@shining-technologies/ui'
import { BarChart, DonutChart, Sparkline, TrendChart } from '@shining-technologies/ui/charts'
import { CHANNEL_SPLIT, CHART_MONTHS, PEOPLE, SPARK_SERIES } from '../data'
import { useGalleryTheme } from '../theme'
import './Overview.css'

/**
 * The landing page: a dashboard assembled from the package.
 *
 * A single realistic screen makes the point that a gallery of isolated
 * components cannot — that these parts were designed against each other, and
 * that one theme switch recolours all of them coherently.
 */
export function Overview() {
  const { theme } = useGalleryTheme()
  const lastSix = CHART_MONTHS.slice(-6)
  const completed = CHART_MONTHS.reduce((sum, point) => sum + point.completed, 0)
  const cancelled = CHART_MONTHS.reduce((sum, point) => sum + point.cancelled, 0)
  const booked = CHART_MONTHS.reduce((sum, point) => sum + point.bookings, 0)

  return (
    <div className="stack">
      <div className="grid-4">
        <StatsCard
          label="Revenue"
          value="$248,120"
          change="+12.4%"
          trend="up"
          description="vs last month"
          badge={<Badge variant="soft">30d</Badge>}
          chart={<Sparkline data={SPARK_SERIES} />}
        />
        <StatsCard
          label="Active jobs"
          value="1,284"
          change="+3.1%"
          trend="up"
          description="vs last month"
        />
        <StatsCard
          label="Avg. response"
          value="4m 12s"
          change="−18s"
          trend="up"
          description="faster than last month"
        />
        <StatsCard
          label="Churn"
          value="2.1%"
          change="+0.4%"
          trend="down"
          description="vs last month"
        />
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Bookings and completions</CardTitle>
            <CardDescription>Rolling twelve months.</CardDescription>
            <CardAction>
              <Badge tone="success">+106% YoY</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={CHART_MONTHS}
              xKey="month"
              variant="area"
              smooth
              height={240}
              legend="interactive"
              series={[
                { key: 'bookings', label: 'Bookings' },
                { key: 'completed', label: 'Completed' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Acquisition channel</CardTitle>
            <CardDescription>Share of new customers this quarter.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={CHANNEL_SPLIT}
              height={240}
              centerValue="4,812"
              centerLabel="new customers"
              showShare
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Jobs by region</CardTitle>
            <CardDescription>Last six months, stacked.</CardDescription>
          </CardHeader>
          <CardContent className="stack-sm">
            <MetricGrid columns={3}>
              <MetricTile label="Booked" value={booked.toLocaleString()} tone="primary" />
              <MetricTile
                label="Completed"
                value={completed.toLocaleString()}
                delta="+4.2%"
                trend="up"
                tone="success"
              />
              <MetricTile
                label="Cancelled"
                value={cancelled.toLocaleString()}
                delta="+0.8%"
                trend="down"
                tone="destructive"
              />
            </MetricGrid>
            <BarChart
              data={lastSix}
              xKey="month"
              stacked
              height={200}
              series={[
                { key: 'bookings', label: 'Metro' },
                { key: 'completed', label: 'Regional' },
                { key: 'cancelled', label: 'Remote' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Team</CardTitle>
            <CardDescription>Capacity across the on-call roster.</CardDescription>
            <CardAction>
              <AvatarGroup max={4}>
                {PEOPLE.map((person) => (
                  <UserAvatar key={person.name} name={person.name} size="sm" />
                ))}
              </AvatarGroup>
            </CardAction>
          </CardHeader>
          <CardContent className="stack-sm">
            {PEOPLE.map((person) => (
              <div key={person.name} className="overview-capacity">
                <span className="overview-capacity__name">
                  <UserAvatar
                    name={person.name}
                    size="xs"
                    status={person.load > 85 ? 'busy' : person.load > 40 ? 'online' : 'away'}
                  />
                  {person.name}
                </span>
                <Progress
                  value={person.load}
                  size="sm"
                  aria-label={`${person.name} capacity`}
                  tone={
                    person.load > 85 ? 'destructive' : person.load > 65 ? 'warning' : 'primary'
                  }
                />
                <span className="overview-capacity__value">{person.load}%</span>
              </div>
            ))}
            <BreakdownList
              title="Open jobs by status"
              showSummary
              items={[
                { key: 'scheduled', label: 'Scheduled', value: 42, tone: 'info' },
                { key: 'in-progress', label: 'In progress', value: 31, tone: 'primary' },
                { key: 'awaiting', label: 'Awaiting parts', value: 9, tone: 'warning' },
                { key: 'overdue', label: 'Overdue', value: 3, tone: 'destructive' },
              ]}
            />
          </CardContent>
          <CardFooter bordered>
            <Badge tone="warning" variant="soft">
              1 over capacity
            </Badge>
            <Button variant="ghost" size="sm" className="overview-footer-actions">
              Manage roster
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Alert tone="info">
        <AlertTitle>Everything above is one theme</AlertTitle>
        <AlertDescription>
          This page is painted by the <strong>{theme.name}</strong> preset: a handful of seed
          colours turned into shadcn-named CSS variables. Switch theme in the bar above, or compare
          every preset on the Themes page, and every component here repaints.
        </AlertDescription>
      </Alert>
    </div>
  )
}

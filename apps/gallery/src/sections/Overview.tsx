import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  BarChart,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  LineChart,
  PieChart,
  Progress,
  Stat,
  TokenSwatchGrid,
  initialsFrom,
  useUIKit,
} from '@shining-technologies/ui-kit-react'
import { CHART_MONTHS, CHANNEL_SPLIT, PEOPLE } from '../data'
import { Demo } from './Demo'

/**
 * The landing page: a dashboard assembled from the kit.
 *
 * A single realistic screen makes the point that a gallery of isolated
 * components cannot — that these parts were designed against each other, and
 * that one project switch recolours all of them coherently.
 */
export function Overview() {
  const { project, colorMode } = useUIKit()

  return (
    <div className="stack">
      <div className="grid-4">
        <Card>
          <CardContent>
            <Stat label="Revenue" value="$248,120" delta="+12.4% vs last month" trend="up" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat label="Active jobs" value="1,284" delta="+3.1%" trend="up" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat label="Avg. response" value="4m 12s" delta="-18s" trend="up" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Stat label="Churn" value="2.1%" delta="+0.4%" trend="down" />
          </CardContent>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings and completions</CardTitle>
            <CardDescription>Rolling twelve months. Click a series to hide it.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={CHART_MONTHS}
              xKey="month"
              area
              smooth
              height={240}
              series={[
                { key: 'bookings', label: 'Bookings' },
                { key: 'completed', label: 'Completed' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acquisition channel</CardTitle>
            <CardDescription>Share of new customers this quarter.</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={CHANNEL_SPLIT}
              height={240}
              centerLabel="4,812"
              centerCaption="new customers"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by region</CardTitle>
            <CardDescription>Stacked, in thousands.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={CHART_MONTHS.slice(-6)}
              xKey="month"
              stacked
              height={220}
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
            <CardTitle>Team</CardTitle>
            <CardDescription>Capacity across the on-call roster.</CardDescription>
          </CardHeader>
          <CardContent className="stack-sm">
            <AvatarGroup>
              {PEOPLE.slice(0, 5).map((person) => (
                <Avatar key={person.name}>
                  <AvatarFallback>{initialsFrom(person.name)}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>

            {PEOPLE.slice(0, 4).map((person) => (
              <div key={person.name} className="capacity">
                <span className="capacity__name">{person.name}</span>
                <Progress
                  value={person.load}
                  tone={person.load > 85 ? 'destructive' : person.load > 65 ? 'warning' : 'primary'}
                />
                <span className="capacity__value">{person.load}%</span>
              </div>
            ))}
          </CardContent>
          <CardFooter bordered>
            <Badge tone="success" variant="soft">
              Roster healthy
            </Badge>
            <Button variant="ghost" size="sm" style={{ marginInlineStart: 'auto' }}>
              Manage
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Alert tone="info">
        <AlertTitle>Everything above is one project</AlertTitle>
        <AlertDescription>
          The palette below was generated from {Object.keys(project.seed).length} seed colours in
          the <strong>{project.name}</strong> project, in {colorMode} mode. Switch project in the
          bar above and every component on this page repaints.
        </AlertDescription>
      </Alert>

      <Demo
        title="Generated palette"
        note="Every token is available as a --sui-* custom property."
        inline={false}
      >
        <TokenSwatchGrid />
      </Demo>
    </div>
  )
}

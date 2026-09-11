import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
  Progress,
  Separator,
  Skeleton,
  Sparkline,
  Spinner,
  Stat,
  StatsCard,
  UserAvatar,
  initialsFrom,
} from '@shining-ui-kit/react'
import { PEOPLE, SPARK_SERIES } from '../data'
import { Demo } from './Demo'

export function Surfaces() {
  return (
    <div className="stack">
      <Demo
        title="Card"
        note="Header, content and footer own their own padding, so a chart can go full-bleed."
        inline={false}
      >
        <div className="grid-3">
          <Card>
            <CardHeader>
              <CardTitle>Standard</CardTitle>
              <CardDescription>Border, surface fill and resting elevation.</CardDescription>
              <CardAction>
                <Badge tone="success" variant="soft">
                  Live
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="muted">
                The action sits at the top right and spans both title rows, so it does not get
                dragged down by a long description.
              </p>
            </CardContent>
            <CardFooter bordered>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </CardFooter>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <CardTitle>Flat</CardTitle>
              <CardDescription>Same box, no shadow.</CardDescription>
            </CardHeader>
            <CardContent>
              <Sparkline data={SPARK_SERIES} area height={48} />
            </CardContent>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>
                Hover it — the affordance is only present when the card actually does something.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stat label="Open tickets" value="18" delta="-4 today" trend="up" />
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo
        title="Stats card"
        note="The whole tile: figure, trend, footnote and loading state. Trend is explicit — a fall in churn is an up, and only you know that."
        inline={false}
      >
        <div className="grid-4">
          <StatsCard
            label="Jobs completed"
            value="8,241"
            change="+12.4%"
            trend="up"
            description="vs last quarter"
          />
          <StatsCard
            label="Average response"
            value="41 min"
            change="−6 min"
            trend="up"
            description="faster than target"
            badge={
              <Badge tone="success" variant="soft">
                On track
              </Badge>
            }
          />
          <StatsCard
            label="Cancellations"
            value="2.9%"
            change="+0.4pt"
            trend="down"
            description="watch this"
          />
          <StatsCard label="Revenue" value="$1.42M" loading />
        </div>
      </Demo>

      <Demo title="Stats card sizes, icons and a full-bleed chart" inline={false}>
        <div className="grid-3">
          <StatsCard size="sm" label="Open tickets" value="37" change="−4" trend="up" />
          <StatsCard
            label="Bookings"
            value="868"
            change="+8.2%"
            trend="up"
            chart={<Sparkline data={SPARK_SERIES} height={44} />}
          />
          <StatsCard
            size="lg"
            label="Crews on shift"
            value="24"
            description="Click through for the roster"
            onClick={() => undefined}
          />
        </div>
      </Demo>

      <Demo title="Alert" inline={false}>
        <div className="stack-sm">
          <Alert tone="info">
            <AlertTitle>Scheduled maintenance</AlertTitle>
            <AlertDescription>
              Dispatch will be read-only on Sunday between 02:00 and 04:00 ACST.
            </AlertDescription>
          </Alert>
          <Alert tone="success">
            <AlertTitle>Invoice sent</AlertTitle>
            <AlertDescription>The customer has been emailed a copy.</AlertDescription>
          </Alert>
          <Alert tone="warning">
            <AlertTitle>Contractor licence expires in 9 days</AlertTitle>
            <AlertDescription>
              Jobs after 14 March cannot be assigned until it is renewed.
            </AlertDescription>
          </Alert>
          <Alert tone="destructive">
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>
              The card on file was declined. This one uses <code>role="alert"</code>; the others do
              not, because interrupting a screen reader is right for an error and rude for a tip.
            </AlertDescription>
          </Alert>
        </div>
      </Demo>

      <Demo title="Avatar">
        <Avatar size="sm">
          <AvatarFallback>PR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>TW</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>AO</AvatarFallback>
        </Avatar>
        <Avatar size="xl">
          <AvatarFallback>KM</AvatarFallback>
        </Avatar>
        <Separator orientation="vertical" style={{ height: '2.5rem' }} />
        <AvatarGroup>
          {PEOPLE.map((person) => (
            <Avatar key={person.name}>
              <AvatarFallback>{initialsFrom(person.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      </Demo>

      <Demo
        title="User avatar"
        note="The tint is derived from the name, so the same person is the same colour on every page — and it is a chart token, so it repaints with the project."
      >
        {PEOPLE.map((person) => (
          <UserAvatar key={person.name} name={person.name} />
        ))}
        <UserAvatar name="Priya Raman" size="lg" status="online" />
        <UserAvatar name="Tom Whitfield" size="lg" status="away" />
        <UserAvatar name="Ana Ortiz" size="lg" status="busy" />
        <UserAvatar name="Kofi Mensah" size="lg" status="offline" />
        <UserAvatar name="No Tint" size="lg" muted />
      </Demo>

      <Demo title="Progress" inline={false}>
        <div className="stack-sm" style={{ maxWidth: '28rem' }}>
          <Progress value={72} />
          <Progress value={45} tone="warning" />
          <Progress value={91} tone="destructive" size="lg" />
          <Progress value={null} />
          <p className="muted">
            The last one is indeterminate — no value to show, so it shows activity.
          </p>
        </div>
      </Demo>

      <Demo title="Loading and empty" inline={false}>
        <div className="grid-2">
          <Card>
            <CardContent className="stack-sm">
              <Skeleton style={{ width: '60%' }} />
              <Skeleton />
              <Skeleton style={{ width: '80%' }} />
              <div className="demo__body demo__body--inline">
                <Spinner />
                <span className="muted">Loading jobs…</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <Empty
              icon="◷"
              title="No jobs scheduled"
              description="Nothing is booked for this crew today. Assign a job or change the date filter."
              actions={
                <>
                  <Button variant="outline" size="sm">
                    Change date
                  </Button>
                  <Button size="sm">Assign job</Button>
                </>
              }
            />
          </Card>
        </div>
      </Demo>
    </div>
  )
}

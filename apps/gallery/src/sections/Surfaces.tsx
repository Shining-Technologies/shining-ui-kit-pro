import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
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
  CardIcon,
  CardTitle,
  CheckCircleIcon,
  ClockIcon,
  Empty,
  InboxIcon,
  Kbd,
  ListIcon,
  MetricGrid,
  MetricTile,
  Progress,
  SegmentedBar,
  Separator,
  Skeleton,
  Spinner,
  StatsCard,
  StatusDot,
  StatusFlow,
  StepCard,
  SummaryCard,
  Toaster,
  ToastProvider,
  TrendUpIcon,
  UserAvatar,
  initialsFrom,
  useToast,
} from '@shining-technologies/ui'
import { Sparkline } from '@shining-technologies/ui/charts'
import {
  FLEET_BREAKDOWN,
  PEOPLE,
  SPARK_SERIES,
  TICKET_BREAKDOWN,
  WORK_ORDER_STATUSES,
} from '../data'
import { Demo } from './Demo'

const WORK_ORDER_PATH = ['requested', 'scheduled', 'in_progress', 'completed', 'invoiced']

/** Buttons that raise toasts. A child of the provider, because `useToast` throws outside one. */
function ToastButtons() {
  const { toast, dismissAll } = useToast()

  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Job saved', description: 'JOB-4812 was updated.', tone: 'success' })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Crew running late',
            description: 'North crew is 20 minutes behind schedule.',
            tone: 'warning',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Invoice deleted',
            tone: 'destructive',
            duration: 8000,
            action: { label: 'Undo', onClick: () => toast({ title: 'Invoice restored' }) },
          })
        }
      >
        With undo
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({ id: 'sync', title: 'Syncing timesheets…', tone: 'info', duration: 0 })
          window.setTimeout(
            () => toast({ id: 'sync', title: 'Timesheets synced', tone: 'success' }),
            1500,
          )
        }}
      >
        Replace in place
      </Button>
      <Button variant="ghost" onClick={dismissAll}>
        Dismiss all
      </Button>
    </>
  )
}

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
              <CardDescription>Same box, no shadow. The sparkline is not in CardContent.</CardDescription>
            </CardHeader>
            <Sparkline data={SPARK_SERIES} height={56} />
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>
                Hover it — the affordance is only present when the card actually does something.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetricTile label="Open tickets" value="18" delta="−4 today" trend="up" />
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

      <Demo
        title="Stats card sizes, icons and a full-bleed chart"
        note="Passing onClick turns the tile into a real button, so it is reachable by keyboard without anyone adding a tabIndex."
        inline={false}
      >
        <div className="grid-3">
          <StatsCard
            size="sm"
            label="Open tickets"
            value="37"
            change="−4"
            trend="up"
            icon={<InboxIcon />}
          />
          <StatsCard
            label="Bookings"
            value="868"
            change="+8.2%"
            trend="up"
            icon={<TrendUpIcon />}
            chart={<Sparkline data={SPARK_SERIES} height={44} />}
          />
          <StatsCard
            size="lg"
            label="Crews on shift"
            value="24"
            description="Click through for the roster"
            icon={<ClockIcon />}
            onClick={() => undefined}
          />
        </div>
      </Demo>

      <Demo
        title="Summary card"
        note="Icon header, a strip of headline figures and a count per status — the block every module's dashboard ends up with. Zero buckets still render, stepped back, and an empty list says so in one quiet line."
        inline={false}
      >
        <div className="grid-2">
          <SummaryCard
            icon={<InboxIcon />}
            iconTone="info"
            title="Support queue"
            description="Tickets raised by customers and crews"
            action={
              <Badge tone="neutral" variant="soft">
                30 days
              </Badge>
            }
            metrics={[
              { label: 'Total tickets', value: 87 },
              { label: 'New (7d)', value: 12, delta: '+4', trend: 'down' },
            ]}
            breakdown={TICKET_BREAKDOWN}
            breakdownProps={{ showSummary: true }}
          />

          <SummaryCard
            icon={<CheckCircleIcon />}
            iconTone="warning"
            title="Compliance checks"
            description="Licences and insurance awaiting review"
            metrics={[
              { label: 'Total checks', value: 0 },
              { label: 'Due this week', value: 0 },
              { label: 'Contractors with lapsed documents', value: 0, span: 'full' },
            ]}
            breakdown={[]}
            breakdownProps={{ empty: 'Nothing waiting for review.' }}
          />

          <SummaryCard
            icon={<ListIcon />}
            title="Work orders"
            description="Loading — every figure and row holds its place"
            metrics={[
              { label: 'Open', value: 0 },
              { label: 'Overdue', value: 0 },
            ]}
            breakdown={TICKET_BREAKDOWN}
            loading
            footer={
              <Button size="sm" variant="ghost">
                View all work orders
              </Button>
            }
          />

          <Card>
            <CardHeader>
              <CardIcon tone="primary">
                <ClockIcon />
              </CardIcon>
              <CardTitle>Field crews</CardTitle>
              <CardDescription>Composed from the parts, with shares and percentages</CardDescription>
              <CardAction>
                <StatusDot tone="success" label="Live" pulse />
              </CardAction>
            </CardHeader>
            <CardContent className="stack-sm">
              <MetricGrid columns={3}>
                <MetricTile label="Rostered" value={42} />
                <MetricTile label="Utilisation" value="71%" delta="+6pt" trend="up" />
                <MetricTile label="Late starts" value={3} tone="destructive" />
              </MetricGrid>
              <BreakdownList title="Right now" items={FLEET_BREAKDOWN} showShare showPercent />
            </CardContent>
          </Card>
        </div>
      </Demo>

      <Demo
        title="Metric tiles"
        note="Filled rather than bordered, for figures that live inside a card. A tone paints an accent rule on the leading edge; span='full' takes a whole row."
        inline={false}
      >
        <Card>
          <CardContent>
            <MetricGrid columns={4}>
              <MetricTile label="Quotes sent" value="128" hint="this month" />
              <MetricTile label="Accepted" value="74" delta="+9" trend="up" tone="success" />
              <MetricTile label="Changes requested" value="11" tone="warning" />
              <MetricTile label="Win rate" value="58%" loading />
              <MetricTile
                label="Average time to accept"
                value="2.4 days"
                delta="−0.6 days"
                trend="up"
                hint="faster than last quarter"
                span="full"
              />
            </MetricGrid>
          </CardContent>
        </Card>
      </Demo>

      <Demo
        title="Status flow"
        note="A lifecycle, drawn with the same vocabulary as StatusBadge, so a workflow's documentation cannot drift from its chips. Set current and it becomes a tracker: done steps get a check, what is still to come is outlined."
        inline={false}
      >
        <div className="stack-sm">
          <StatusFlow
            label="Work order lifecycle"
            statuses={WORK_ORDER_STATUSES}
            steps={WORK_ORDER_PATH}
            alternates={['on_hold', 'cancelled']}
          />
          <Separator />
          <StatusFlow
            label="Work order WO-3318"
            statuses={WORK_ORDER_STATUSES}
            steps={WORK_ORDER_PATH}
            current={2}
          />
          <Separator />
          <StatusFlow
            label="Work order WO-3290, cancelled after scheduling"
            statuses={WORK_ORDER_STATUSES}
            steps={WORK_ORDER_PATH}
            alternates={['on_hold', 'cancelled']}
            current="cancelled"
            reached="scheduled"
          />
          <Separator />
          <StatusFlow
            size="sm"
            steps={[
              { status: 'draft', tone: 'neutral' },
              { status: 'review', label: 'In review', tone: 'info' },
              { status: 'published', tone: 'success' },
            ]}
            alternates={[{ status: 'archived', tone: 'neutral' }]}
            alternatesLabel="Also:"
          />
        </div>
      </Demo>

      <Demo
        title="Step cards"
        note="One stage of a process and the rule that ends it. The condition is pinned to the bottom, so a row of steps lines their rules up whatever the copy length."
        inline={false}
      >
        <div className="stack">
          <div className="grid-3">
            <StepCard
              step={1}
              title="Intake"
              description="A customer or a crew reports the job."
              condition="A coordinator books a visit."
            >
              <StatusFlow
                statuses={WORK_ORDER_STATUSES}
                steps={['requested', 'scheduled']}
                alternates={['cancelled']}
              />
            </StepCard>
            <StepCard
              step={2}
              title="On site"
              description="The crew does the work and logs parts and hours against it."
              condition="The crew signs the job off with photos."
            >
              <StatusFlow
                statuses={WORK_ORDER_STATUSES}
                steps={['in_progress', 'completed']}
                alternates={['on_hold']}
              />
            </StepCard>
            <StepCard
              step={3}
              title="Billing"
              description="Accounts raises the invoice."
              condition="Payment clears and the order closes."
            >
              <StatusFlow statuses={WORK_ORDER_STATUSES} steps={['invoiced']} />
            </StepCard>
          </div>

          <div className="grid-3">
            <StepCard
              step={1}
              state="done"
              title="Documents uploaded"
              description="Licence, insurance and ABN on file."
            />
            <StepCard
              step={2}
              state="current"
              title="Compliance review"
              description="Someone in operations checks each document."
              condition="Every document is approved."
            />
            <StepCard
              step={3}
              state="upcoming"
              title="Induction"
              description="A site walkthrough with a supervisor."
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="Status dot and segmented bar"
        note="The smallest state marker, and a whole split by share. The bar is one image to a screen reader, named with the counts spelled out."
        inline={false}
      >
        <div className="stack-sm" style={{ maxWidth: '32rem' }}>
          <div className="demo__body--inline">
            <StatusDot tone="success" label="Operational" />
            <StatusDot tone="warning" label="Degraded" />
            <StatusDot tone="destructive" label="Outage" />
            <StatusDot tone="neutral" label="Paused" />
            <StatusDot tone="info" label="Syncing" pulse />
            <StatusDot tone="chart-1" size="lg" label="Recording" pulse />
            <StatusDot tone="success" size="sm" aria-label="Online" />
          </div>
          <SegmentedBar label="Tickets by status" segments={TICKET_BREAKDOWN} />
          <SegmentedBar size="lg" label="Crews by state" segments={FLEET_BREAKDOWN} />
          <SegmentedBar size="sm" label="Nothing yet" segments={[]} />
        </div>
      </Demo>

      <Demo
        title="Alert"
        note="Each tone brings its own glyph; pass icon={null} to go without."
        inline={false}
      >
        <div className="stack-sm">
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              Neutral has no default glyph — it is a remark, not a state.
            </AlertDescription>
          </Alert>
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
              The card on file was declined. This one uses <code>role="alert"</code>; the others use{' '}
              <code>role="note"</code>, because interrupting a screen reader is right for an error
              and rude for a tip.
            </AlertDescription>
          </Alert>
          <Alert tone="info" icon={null}>
            <AlertDescription>A single line with the glyph suppressed.</AlertDescription>
          </Alert>
        </div>
      </Demo>

      <Demo title="Avatar" note="The bare box. AvatarGroup overlaps them and folds the rest into +n.">
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
        <AvatarGroup max={3}>
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
        <UserAvatar name="Lena Brandt" size="xs" />
        <UserAvatar name="Lena Brandt" size="xl" />
      </Demo>

      <Demo title="Progress" inline={false}>
        <div className="stack-sm" style={{ maxWidth: '28rem' }}>
          <Progress value={72} size="sm" />
          <Progress value={72} />
          <Progress value={45} tone="warning" />
          <Progress value={100} tone="success" />
          <Progress value={91} tone="destructive" size="lg" />
          <Progress value={null} />
          <p className="muted">
            The last one is indeterminate — no value to show, so it shows activity.
          </p>
        </div>
      </Demo>

      <Demo
        title="Loading and empty"
        note="The inline Empty is the same statement at the volume of a sentence, for a list inside a card whose other content is still worth reading."
        inline={false}
      >
        <div className="grid-2">
          <Card>
            <CardContent className="stack-sm">
              <Skeleton style={{ width: '60%' }} />
              <Skeleton />
              <Skeleton style={{ width: '80%' }} />
              <div className="demo__body--inline">
                <Spinner size="sm" />
                <Spinner />
                <Spinner size="lg" />
                <span className="muted">Loading jobs…</span>
              </div>
              <Separator />
              <Empty
                variant="inline"
                title="No notes on this job yet."
                actions={
                  <Button size="sm" variant="ghost">
                    Add note
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <Empty
              icon={<InboxIcon />}
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

      <Demo
        title="Toast"
        note={
          <>
            A notification, never a focus thief. Hovering or focusing a toast holds every clock, so
            nothing vanishes mid-read; reusing an id replaces a toast in place. Keyboard users reach
            the region with <Kbd>Tab</Kbd> like anything else.
          </>
        }
      >
        <ToastProvider>
          <ToastButtons />
          <Toaster position="bottom-right" />
        </ToastProvider>
      </Demo>
    </div>
  )
}

import {
  Badge,
  Banner,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckIcon,
  CircularProgress,
  ConfirmDialog,
  CopyButton,
  CreditCardIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  PlusIcon,
  Progress,
  SegmentedControl,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineItem,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from '../Demo'

const PLANS = [
  { id: 'starter', name: 'Starter', monthly: 19, blurb: 'For a sole trader.', features: ['3 users', '500 jobs a month', 'Email support'] },
  { id: 'team', name: 'Team', monthly: 49, blurb: 'For a crew that shares the work.', features: ['25 users', 'Unlimited jobs', 'Scheduling and dispatch', 'Priority support'] },
  { id: 'business', name: 'Business', monthly: 129, blurb: 'For several depots.', features: ['Unlimited users', 'SSO and audit log', 'API access', 'A named account manager'] },
]

const USAGE = [
  { label: 'Users', used: 22, limit: 25 },
  { label: 'Storage', used: 38, limit: 100, unit: 'GB' },
  { label: 'API calls this month', used: 91_400, limit: 100_000 },
]

const INVOICES = [
  { id: 'INV-2041', date: 'Sep 1, 2026', amount: '$539.00', status: 'paid' },
  { id: 'INV-1987', date: 'Aug 1, 2026', amount: '$539.00', status: 'paid' },
  { id: 'INV-1930', date: 'Jul 1, 2026', amount: '$490.00', status: 'refunded' },
]

const INVOICE_STATUSES = {
  paid: { label: 'Paid', tone: 'success' as const },
  refunded: { label: 'Refunded', tone: 'neutral' as const },
}

const number = new Intl.NumberFormat('en-AU')

function PricingCards() {
  const [cycle, setCycle] = useState('monthly')
  const [current, setCurrent] = useState('team')
  const price = (monthly: number) => (cycle === 'annual' ? Math.round(monthly * 0.8) : monthly)

  return (
    <div className="stack-sm">
      <SegmentedControl
        aria-label="Billing cycle"
        value={cycle}
        onValueChange={setCycle}
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'annual', label: 'Annual · save 20%' },
        ]}
      />
      <div className="grid-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === current
          return (
            <Card key={plan.id} className="pattern-plan" data-current={isCurrent || undefined}>
              <CardHeader>
                <CardTitle as="h3">{plan.name}</CardTitle>
                <CardDescription>{plan.blurb}</CardDescription>
                {isCurrent ? (
                  <CardAction>
                    <Badge tone="primary">Current plan</Badge>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="stack-sm">
                <p className="pattern-price">
                  <strong>${price(plan.monthly)}</strong>
                  <span className="muted"> per user / month{cycle === 'annual' ? ', billed yearly' : ''}</span>
                </p>
                <ul className="pattern-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckIcon aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="pattern-wide"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                  onClick={() => setCurrent(plan.id)}
                >
                  {isCurrent ? 'Your plan' : `Switch to ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function UsageMeters() {
  return (
    <Card>
      <CardHeader bordered>
        <CardTitle as="h3">Usage</CardTitle>
        <CardDescription>This billing period, Sep 1 – 30.</CardDescription>
        <CardAction>
          <CircularProgress value={22} max={25} size="lg" showValue aria-label="Seats used" />
        </CardAction>
      </CardHeader>
      <CardContent className="stack-sm">
        {USAGE.map((meter) => {
          const share = meter.used / meter.limit
          const tone = share >= 0.9 ? 'destructive' : share >= 0.75 ? 'warning' : 'primary'
          const id = `usage-${meter.label.replace(/\W+/g, '-').toLowerCase()}`
          return (
            <div key={meter.label} className="pattern-meter">
              <div className="pattern-meter__label">
                <span id={id}>{meter.label}</span>
                <span className="muted">
                  {number.format(meter.used)} of {number.format(meter.limit)}
                  {meter.unit ? ` ${meter.unit}` : ''}
                </span>
              </div>
              <Progress value={meter.used} max={meter.limit} tone={tone} aria-labelledby={id} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ApiKeys() {
  const [keys, setKeys] = useState([
    { id: 'k1', name: 'Production', value: 'sk_live_51Hc9fA2e6d0b7c4f1a9f2c', created: 'Sep 23, 2026', lastUsed: '2 minutes ago' },
    { id: 'k2', name: 'Staging', value: 'sk_test_9aa04bd31e7c2f55d8e1', created: 'Jun 2, 2026', lastUsed: 'Sep 20, 2026' },
  ])
  const [revealed, setRevealed] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const target = keys.find((key) => key.id === revoking)

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle as="h3">API keys</CardTitle>
        <CardDescription>Keys act as your organisation. Keep them out of code you share.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            <PlusIcon />
            New key
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="pattern-keys">
          {keys.map((key) => {
            const shown = revealed === key.id
            return (
              <li key={key.id}>
                <KeyIcon aria-hidden="true" className="muted" />
                <div className="pattern-key">
                  <strong>{key.name}</strong>
                  <code>
                    {shown ? key.value : `${key.value.slice(0, 8)}••••••••${key.value.slice(-4)}`}
                  </code>
                  <span className="muted">
                    Created {key.created} · last used {key.lastUsed}
                  </span>
                </div>
                <div className="pattern-key-actions">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Show the ${key.name} key`}
                    aria-pressed={shown}
                    onClick={() => setRevealed(shown ? null : key.id)}
                  >
                    {shown ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                  <CopyButton value={key.value} size="icon-sm" label={`Copy the ${key.name} key`} />
                  <Button size="sm" variant="ghost" onClick={() => setRevoking(key.id)}>
                    Revoke
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        destructive
        title={`Revoke the ${target?.name ?? ''} key?`}
        description="Requests using it start failing straight away."
        confirmLabel="Revoke key"
        onConfirm={() => setKeys((list) => list.filter((key) => key.id !== revoking))}
      />
    </Card>
  )
}

export function BillingPattern() {
  return (
    <div className="stack">
      <Demo
        title="Plan and pricing"
        note="Plans as cards with the current one marked and a cycle switch. An upgrade prompt belongs in a Banner at the top of the app."
        inline={false}
        code={`
<Banner tone="info" title="You are at 88% of your seats."
  action={<Button size="sm">Upgrade</Button>}>Add seats before inviting more people.</Banner>

<SegmentedControl aria-label="Billing cycle" value={cycle} onValueChange={setCycle} options={…} />
<Card data-current={isCurrent || undefined}>
  <CardHeader>
    <CardTitle as="h3">Team</CardTitle>
    <CardAction><Badge tone="primary">Current plan</Badge></CardAction>
  </CardHeader>
  …
</Card>`}
      >
        <div className="stack-sm">
          <Banner tone="info" title="You are at 88% of your seats." action={<Button size="sm">Upgrade</Button>}>
            Add seats before inviting more people.
          </Banner>
          <PricingCards />
        </div>
      </Demo>

      <div className="grid-2">
        <Demo
          title="Usage meters"
          note="A bar per limit, turning amber at 75% and red at 90%; a ring for the headline one."
          inline={false}
          code={`
<Progress value={91400} max={100000} tone="destructive" aria-labelledby="api-calls" />
<CircularProgress value={22} max={25} showValue size="lg" aria-label="Seats used" />`}
        >
          <UsageMeters />
        </Demo>

        <Demo title="Payment method and invoices" note="The card on file, and the invoice history as a plain table." inline={false}>
          <div className="stack-sm">
            <Card>
              <CardHeader>
                <div className="pattern-person">
                  <CreditCardIcon aria-hidden="true" />
                  <div>
                    <CardTitle as="h3">Visa ending 4242</CardTitle>
                    <CardDescription>Expires 08/2028 · billing@acme.example</CardDescription>
                  </div>
                </div>
                <CardAction>
                  <Button size="sm" variant="outline">
                    Update
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pattern-num">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICES.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <a href={`#pattern-billing/payment-method-and-invoices`}>{invoice.id}</a>
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} statuses={INVOICE_STATUSES} />
                      </TableCell>
                      <TableCell className="pattern-num">{invoice.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </Demo>
      </div>

      <div className="grid-2">
        <Demo
          title="API keys"
          note="Keys are masked until asked for; copying does not need them shown; revoking is confirmed."
          inline={false}
          code={`
<code>{shown ? key.value : mask(key.value)}</code>
<Button size="icon-sm" variant="ghost" aria-pressed={shown}
  aria-label="Show the key" onClick={toggle}>
  {shown ? <EyeOffIcon /> : <EyeIcon />}
</Button>
<CopyButton value={key.value} size="icon-sm" label="Copy the Production key" />`}
        >
          <ApiKeys />
        </Demo>

        <Demo
          title="Webhook deliveries"
          note="Recent deliveries as a compact timeline: the time, the event and the response."
          inline={false}
          code={`
<Timeline variant="compact" aria-label="Webhook deliveries">
  <TimelineItem time="09:31:04" tone="success" title="invoice.paid → 200 OK" />
  <TimelineItem time="09:12:47" tone="destructive" title="job.updated → 500, retrying" />
</Timeline>`}
        >
          <Card>
            <CardContent>
              <Timeline variant="compact" aria-label="Webhook deliveries">
                <TimelineItem time="09:31:04" tone="success" title="invoice.paid → 200 OK in 182 ms" />
                <TimelineItem time="09:30:12" tone="success" title="customer.created → 200 OK in 240 ms" />
                <TimelineItem time="09:12:47" tone="destructive" title="job.updated → 500 Internal Server Error">
                  Retry 2 of 5 in 4 minutes
                </TimelineItem>
                <TimelineItem time="08:58:30" tone="success" title="job.updated → 200 OK in 96 ms" />
                <TimelineItem time="Queued" pending title="invoice.overdue" />
              </Timeline>
            </CardContent>
          </Card>
        </Demo>
      </div>
    </div>
  )
}

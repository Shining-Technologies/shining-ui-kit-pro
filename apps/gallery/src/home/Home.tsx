import {
  ArrowRightIcon,
  Badge,
  BellIcon,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CopyButton,
  CreditCardIcon,
  Field,
  Input,
  Label,
  MailIcon,
  PasswordInput,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  TrendUpIcon,
  UserAvatar,
} from '@shining-technologies/ui'
import { Sparkline, TrendChart } from '@shining-technologies/ui/charts'
import { THEME_PRESETS } from '@shining-technologies/ui/theme'
import { useState, type CSSProperties } from 'react'
import { CHART_MONTHS, PEOPLE, SPARK_SERIES } from '../data'
import { REPO_URL } from '../GalleryShell'
import { go } from '../router'
import { SECTIONS } from '../sections'
import { useGalleryTheme } from '../theme'
import './Home.css'

const INSTALL = 'npm install @shining-technologies/ui'
const COMPONENT_COUNT = new Set(
  SECTIONS.filter((s) => s.category === 'Components').flatMap((s) => s.components),
).size

/**
 * The home page: what the package is in one line, how to install it, and a
 * wall of live components that repaint as the theme changes.
 */
export function Home() {
  return (
    <div className="home">
      <Hero />
      <Showcase />
      <Features />
      <Closing />
    </div>
  )
}

function Hero() {
  const { theme, setThemeId } = useGalleryTheme()

  return (
    <section className="hero" aria-labelledby="hero-title">
      <a
        className="hero__pill"
        href="#email-builder"
        onClick={(event) => {
          event.preventDefault()
          go('email-builder')
        }}
      >
        <span className="hero__pill-tag">New</span>
        Email builder for shining-email
        <ArrowRightIcon aria-hidden="true" />
      </a>

      <h1 id="hero-title">Build business apps that look like your brand</h1>
      <p className="hero__lead">
        Accessible React components, a server-ready data table and shadcn-style theming. Change a
        few colours and every screen follows.
      </p>

      <div className="hero__ctas">
        <Button size="lg" onClick={() => go('introduction')}>
          Get started
        </Button>
        <Button size="lg" variant="outline" onClick={() => go('actions')}>
          Browse components
        </Button>
      </div>

      <div className="hero__install">
        <span aria-hidden="true">$</span>
        <code>{INSTALL}</code>
        <CopyButton
          value={INSTALL}
          size="icon-sm"
          variant="ghost"
          label="Copy the install command"
        />
      </div>

      <div className="hero__themes" role="group" aria-label="Try a theme">
        <span>Try a theme</span>
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="hero__swatch"
            aria-pressed={theme.id === preset.id}
            title={preset.name}
            aria-label={preset.name}
            style={
              { '--swatch': preset.seed.primary, '--swatch-2': preset.seed.accent } as CSSProperties
            }
            onClick={() => setThemeId(preset.id)}
          />
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- showcase */

function Showcase() {
  return (
    <section className="showcase" aria-label="Live components">
      <div className="showcase__col">
        <SignUpCard />
        <TeamCard />
        <StorageCard />
      </div>
      <div className="showcase__col">
        <RevenueCard />
        <BookingsCard />
        <CalendarCard />
      </div>
      <div className="showcase__col">
        <NotificationsCard />
        <PaymentCard />
        <ControlsCard />
      </div>
    </section>
  )
}

function SignUpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your email below to create your account.</CardDescription>
      </CardHeader>
      <CardContent className="stack-sm">
        <Field label="Email">
          <Input type="email" placeholder="priya@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput defaultValue="correct-horse" />
        </Field>
        <label className="choice">
          <Checkbox defaultChecked /> <span>Email me product updates</span>
        </label>
      </CardContent>
      <CardFooter className="showcase__footer-stack">
        <Button className="showcase__full">Create account</Button>
        <Button variant="outline" className="showcase__full">
          <MailIcon /> Continue with email link
        </Button>
      </CardFooter>
    </Card>
  )
}

function RevenueCard() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Total revenue</CardDescription>
        <CardTitle className="showcase__figure">$48,120.40</CardTitle>
      </CardHeader>
      <CardContent className="stack-sm">
        <div className="showcase__delta">
          <Badge tone="success">
            <TrendUpIcon /> +12.4%
          </Badge>
          <span className="muted">from last month</span>
        </div>
        <Sparkline data={SPARK_SERIES} height={64} />
      </CardContent>
    </Card>
  )
}

function NotificationsCard() {
  const rows = [
    { id: 'jobs', title: 'New jobs', text: 'When a job is assigned to you.', on: true },
    { id: 'mentions', title: 'Mentions', text: 'When someone @mentions you.', on: true },
    { id: 'digest', title: 'Weekly digest', text: 'A summary every Monday.', on: false },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what you hear about.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="showcase__list">
          {rows.map((row) => (
            <li key={row.id}>
              <BellIcon aria-hidden="true" className="showcase__list-icon" />
              <span className="showcase__list-text">
                <Label htmlFor={`notify-${row.id}`}>{row.title}</Label>
                <span className="muted">{row.text}</span>
              </span>
              <Switch id={`notify-${row.id}`} defaultChecked={row.on} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TeamCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>Invite your team to collaborate.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="showcase__list">
          {PEOPLE.slice(0, 3).map((person, index) => (
            <li key={person.name}>
              <UserAvatar name={person.name} size="sm" />
              <span className="showcase__list-text">
                <strong>{person.name}</strong>
                <span className="muted">{person.role}</span>
              </span>
              <Select defaultValue={index === 0 ? 'owner' : index === 1 ? 'editor' : 'viewer'}>
                <SelectTrigger className="showcase__role" aria-label={`${person.name}'s role`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function BookingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>Booked and completed, last six months.</CardDescription>
      </CardHeader>
      <CardContent>
        <TrendChart
          data={CHART_MONTHS.slice(-6)}
          xKey="month"
          variant="area"
          smooth
          height={180}
          series={[
            { key: 'bookings', label: 'Booked' },
            { key: 'completed', label: 'Completed' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

function PaymentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
        <CardDescription>Add a new payment method to your account.</CardDescription>
      </CardHeader>
      <CardContent className="stack-sm">
        <RadioGroup defaultValue="card" className="showcase__methods">
          {[
            { value: 'card', label: 'Card' },
            { value: 'bank', label: 'Bank' },
            { value: 'invoice', label: 'Invoice' },
          ].map((method) => (
            <label key={method.value} className="showcase__method">
              <RadioGroupItem value={method.value} />
              <CreditCardIcon aria-hidden="true" />
              {method.label}
            </label>
          ))}
        </RadioGroup>
        <Field label="Name on card">
          <Input defaultValue="Priya Raman" />
        </Field>
        <Field label="Card number">
          <Input inputMode="numeric" placeholder="4242 4242 4242 4242" />
        </Field>
      </CardContent>
      <CardFooter>
        <Button className="showcase__full">Continue</Button>
      </CardFooter>
    </Card>
  )
}

function CalendarCard() {
  const [date, setDate] = useState<string | undefined>('2026-11-18')
  return (
    <Card>
      <CardContent className="showcase__calendar">
        <Calendar value={date} onChange={setDate} label="Pick a day" />
      </CardContent>
    </Card>
  )
}

function StorageCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>7.2 GB of 10 GB used.</CardDescription>
      </CardHeader>
      <CardContent className="stack-sm">
        <Progress value={72} />
        <div className="showcase__legend">
          <span>Documents 4.1 GB</span>
          <span>Images 2.3 GB</span>
          <span>Other 0.8 GB</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ControlsCard() {
  const [budget, setBudget] = useState([40])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Controls share one set of tokens.</CardDescription>
      </CardHeader>
      <CardContent className="stack-sm">
        <ToggleGroup type="single" defaultValue="week" aria-label="Range">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <Field label={`Budget up to $${budget[0]}k`}>
          <Slider value={budget} onValueChange={setBudget} max={100} step={5} />
        </Field>
        <div className="showcase__badges">
          <Badge tone="primary">Scheduled</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="warning">Awaiting parts</Badge>
          <Badge tone="destructive" variant="outline">
            Overdue
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- features */

const FEATURES = [
  {
    title: 'Themed with CSS',
    text: 'shadcn token names, light and dark, no provider. Paste a tweakcn theme or generate one from your brand.',
  },
  {
    title: 'Server Components ready',
    text: 'Pure components render on the server with no JavaScript. Interactive ones mark their own boundary.',
  },
  {
    title: 'A data table for real data',
    text: 'Filtering, sorting, paging and URL state run the same in the browser and on your server.',
  },
  {
    title: 'Accessible by default',
    text: 'Keyboard support, focus management and labels are built in to every component.',
  },
]

function Features() {
  return (
    <section className="features" aria-labelledby="features-title">
      <h2 id="features-title">Everything a business app needs</h2>
      <p className="features__lead">
        {COMPONENT_COUNT}+ components, from buttons to kanban boards, plus full-page examples you
        can copy.
      </p>
      <div className="features__grid">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="features__item">
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="closing">
      <h2>Start building</h2>
      <p>Read the docs, or open an example page and copy what you need.</p>
      <div className="hero__ctas">
        <Button onClick={() => go('installation')}>Installation</Button>
        <Button variant="outline" onClick={() => go('overview')}>
          View examples
        </Button>
        <Button variant="ghost" asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </Button>
      </div>
    </section>
  )
}

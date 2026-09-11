import type { Meta, StoryObj } from '@storybook/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  BarChart,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Empty,
  Field,
  Input,
  Label,
  LineChart,
  Pagination,
  PieChart,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Sparkline,
  Spinner,
  Stat,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  initialsFrom,
} from '@shining-technologies/ui-kit-react'
import { useState } from 'react'

/**
 * The component kit, one story per family.
 *
 * Every story is unthemed on purpose: they inherit the stylesheet defaults, so
 * what you see here is what an app gets with no provider mounted. The
 * `Projects` stories cover what changes when one *is* mounted.
 */
const meta = {
  title: 'Components/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const CHART_DATA = [
  { month: 'Jan', bookings: 420, completed: 388 },
  { month: 'Feb', bookings: 468, completed: 431 },
  { month: 'Mar', bookings: 512, completed: 480 },
  { month: 'Apr', bookings: 498, completed: 452 },
  { month: 'May', bookings: 586, completed: 548 },
  { month: 'Jun', bookings: 631, completed: 602 },
]

const SERIES = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'completed', label: 'Completed' },
]

const SLICES = [
  { key: 'organic', label: 'Organic', value: 1840 },
  { key: 'referral', label: 'Referral', value: 1210 },
  { key: 'paid', label: 'Paid', value: 902 },
  { key: 'direct', label: 'Direct', value: 604 },
]

export const Buttons: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="sb-row">
        {(['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const).map((v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        ))}
      </div>
      <div className="sb-row">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
        <Button>
          <Spinner size="sm" label={null} />
          Saving
        </Button>
      </div>
      <div className="sb-row">
        <ButtonGroup aria-label="View">
          <Button variant="outline">Day</Button>
          <Button variant="outline">Week</Button>
          <Button variant="outline">Month</Button>
        </ButtonGroup>
        <Toggle variant="outline">Bold</Toggle>
        <ToggleGroup type="single" defaultValue="b">
          <ToggleGroupItem value="a">Left</ToggleGroupItem>
          <ToggleGroupItem value="b">Centre</ToggleGroupItem>
          <ToggleGroupItem value="c">Right</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="sb-row">
        {(['neutral', 'primary', 'success', 'warning', 'destructive', 'info'] as const).map((t) => (
          <Badge key={t} tone={t}>
            {t}
          </Badge>
        ))}
      </div>
    </div>
  ),
}

export const Cards: Story = {
  render: () => (
    <div className="sb-grid">
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Rolling thirty days</CardDescription>
          <CardAction>
            <Badge tone="success">Live</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Stat label="This month" value="$248,120" delta="+12.4%" trend="up" />
          <Sparkline data={[12, 18, 15, 24, 22, 31, 28, 36, 33, 44]} area />
        </CardContent>
        <CardFooter bordered>
          <Button size="sm" variant="outline">
            Details
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity</CardTitle>
        </CardHeader>
        <CardContent className="sb-stack">
          <Progress value={72} />
          <Progress value={45} tone="warning" />
          <Progress value={91} tone="destructive" />
          <Progress value={null} />
          <AvatarGroup>
            {['Priya Raman', 'Tom Whitfield', 'Ana Ortiz'].map((name) => (
              <Avatar key={name}>
                <AvatarFallback>{initialsFrom(name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </CardContent>
      </Card>

      <Card>
        <Empty
          title="No jobs scheduled"
          description="Nothing booked for this crew today."
          actions={<Button size="sm">Assign job</Button>}
        />
      </Card>
    </div>
  ),
}

export const Alerts: Story = {
  render: () => (
    <div className="sb-stack">
      {(['info', 'success', 'warning', 'destructive'] as const).map((tone) => (
        <Alert key={tone} tone={tone}>
          <AlertTitle>{tone[0]!.toUpperCase() + tone.slice(1)}</AlertTitle>
          <AlertDescription>
            Tinted from the project&rsquo;s own {tone} token, so a custom palette reaches it.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
}

export const Forms: Story = {
  render: function FormsStory() {
    return (
      <Card style={{ maxWidth: '30rem' }}>
        <CardHeader>
          <CardTitle>Book a service</CardTitle>
          <CardDescription>Every control is wired to its label by the field.</CardDescription>
        </CardHeader>
        <CardContent className="sb-stack">
          <Field label="Property address" description="Street and suburb." required>
            <Input placeholder="12 Rundle Street, Adelaide" />
          </Field>
          <Field label="Email" error="That address is already in use.">
            <Input defaultValue="priya@example.com" />
          </Field>
          <Field label="Access notes">
            <Textarea rows={3} />
          </Field>
          <RadioGroup defaultValue="fortnightly">
            {['Weekly', 'Fortnightly', 'Monthly'].map((option) => (
              <div key={option} className="sb-choice">
                <RadioGroupItem value={option.toLowerCase()} id={`sb-${option}`} />
                <Label htmlFor={`sb-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="sb-choice">
            <Switch id="sb-notify" defaultChecked />
            <Label htmlFor="sb-notify">Email me when the job is done</Label>
          </div>
          <div className="sb-choice">
            <Checkbox id="sb-terms" />
            <Label htmlFor="sb-terms">I accept the service agreement</Label>
          </div>
        </CardContent>
        <CardFooter bordered>
          <Button variant="ghost">Cancel</Button>
          <Button style={{ marginInlineStart: 'auto' }}>Request quote</Button>
        </CardFooter>
      </Card>
    )
  },
}

export const Navigation: Story = {
  render: function NavigationStory() {
    const [page, setPage] = useState(4)
    return (
      <div className="sb-stack">
        <Tabs defaultValue="one" appearance="underline">
          <TabsList>
            <TabsTrigger value="one">Upcoming</TabsTrigger>
            <TabsTrigger value="two">In progress</TabsTrigger>
            <TabsTrigger value="three">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="one">18 jobs scheduled this week.</TabsContent>
          <TabsContent value="two">4 crews on site now.</TabsContent>
          <TabsContent value="three">612 jobs completed this quarter.</TabsContent>
        </Tabs>

        <Accordion type="single" collapsible defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>What does a deep clean include?</AccordionTrigger>
            <AccordionContent>
              Ovens, window tracks, skirting boards and cupboards.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I reschedule?</AccordionTrigger>
            <AccordionContent>Up to 24 hours before, at no charge.</AccordionContent>
          </AccordionItem>
        </Accordion>

        <Pagination page={page} pageCount={24} onPageChange={setPage} />
      </div>
    )
  },
}

export const Overlays: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit job JOB-4812</DialogTitle>
          <DialogDescription>Changes apply immediately.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Reference">
            <Input defaultValue="JOB-4812" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Charts: Story = {
  render: () => (
    <div className="sb-grid">
      <Card>
        <CardHeader>
          <CardTitle>Area</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={CHART_DATA} xKey="month" series={SERIES} area smooth />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stacked bars</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={CHART_DATA} xKey="month" series={SERIES} stacked />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Donut</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart data={SLICES} centerLabel="4,556" centerCaption="customers" />
        </CardContent>
      </Card>
    </div>
  ),
}

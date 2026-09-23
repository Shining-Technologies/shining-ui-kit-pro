import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Grid,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SegmentedControl,
  Separator,
  Stack,
  type LayoutGap,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from './Demo'
import './Layout.css'

const GAPS: LayoutGap[] = ['xs', 'sm', 'md', 'lg', 'xl']

const Box = ({ children }: { children: string }) => <div className="layout-box">{children}</div>

export function LayoutSection() {
  const [gap, setGap] = useState<LayoutGap>('md')
  const [sizes, setSizes] = useState([30, 70])

  return (
    <div className="stack">
      <Demo
        title="Stack"
        note="A column or a row of children one step of the spacing scale apart. A horizontal stack that wraps is the inline cluster of buttons, badges or chips."
        inline={false}
        code={`
<Stack gap="md">
  <PageHeader title="Invoices" />
  <DataTable … />
</Stack>

<Stack direction="horizontal" gap="sm" wrap>
  <Badge>Draft</Badge>
  <Badge tone="info">Sent</Badge>
</Stack>`}
      >
        <Stack gap="lg">
          <SegmentedControl
            aria-label="Gap"
            size="sm"
            value={gap}
            onValueChange={(value) => setGap(value as LayoutGap)}
            options={GAPS.map((value) => ({ value, label: value }))}
          />
          <div className="grid-2">
            <Stack gap={gap}>
              <Box>One</Box>
              <Box>Two</Box>
              <Box>Three</Box>
            </Stack>
            <Stack direction="horizontal" gap={gap} wrap>
              <Badge>Draft</Badge>
              <Badge tone="info">Sent</Badge>
              <Badge tone="warning">Overdue</Badge>
              <Badge tone="success">Paid</Badge>
              <Button size="sm" variant="outline">
                Export
              </Button>
            </Stack>
          </div>
        </Stack>
      </Demo>

      <Demo
        title="Grid"
        note={
          'columns={3} folds to one column under 40rem; minItemWidth="12rem" fits as many columns as there is room for, at any width.'
        }
        inline={false}
        code={`
<Grid columns={3}>
  <StatsCard … />
  <StatsCard … />
  <StatsCard … />
</Grid>

<Grid minItemWidth="12rem" gap="sm">
  {records.map((record) => <RecordCard key={record.id} record={record} />)}
</Grid>`}
      >
        <Stack gap="lg">
          <Grid columns={3}>
            <Box>1 / 3</Box>
            <Box>2 / 3</Box>
            <Box>3 / 3</Box>
          </Grid>
          <Separator />
          <Grid minItemWidth="12rem" gap="sm">
            {['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent', 'Stark', 'Wayne'].map((name) => (
              <Box key={name}>{name}</Box>
            ))}
          </Grid>
        </Stack>
      </Demo>

      <Demo
        title="Container"
        note="Centres a page at a readable width with gutters: sm 40rem for a form, lg 64rem by default, xl 80rem for a dashboard."
        inline={false}
        code={`
<Container size="sm" as="main">
  <SettingsForm />
</Container>`}
      >
        <div className="layout-viewport">
          <Container size="sm">
            <Card>
              <CardHeader>
                <CardTitle as="h3">Container size=&quot;sm&quot;</CardTitle>
                <CardDescription>40rem wide at most, centred, with the surface padding either side.</CardDescription>
              </CardHeader>
            </Card>
          </Container>
        </div>
      </Demo>

      <Demo
        title="Resizable panels"
        note="Drag the handle, or focus it and use the arrow keys (Shift for 1%), Home and End. Sizes are percentages; onSizesChange is where a layout would be saved."
        inline={false}
        code={`
<ResizablePanelGroup direction="horizontal" onSizesChange={saveLayout}>
  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
    <InboxList />
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Resize the list" />
  <ResizablePanel>
    <MessageView />
  </ResizablePanel>
</ResizablePanelGroup>`}
      >
        <Stack gap="md">
          <div className="layout-split">
            <ResizablePanelGroup sizes={sizes} onSizesChange={setSizes}>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="layout-pane">
                  <strong>Inbox</strong>
                  <p className="muted">12 conversations</p>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle aria-label="Resize the list" />
              <ResizablePanel>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={65}>
                    <div className="layout-pane">
                      <strong>Message</strong>
                      <p className="muted">The conversation you picked.</p>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle aria-label="Resize the reply box" />
                  <ResizablePanel minSize={20}>
                    <div className="layout-pane">
                      <strong>Reply</strong>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.8125rem' }}>
            List {Math.round(sizes[0]!)}% · detail {Math.round(sizes[1]!)}%
          </p>
        </Stack>
      </Demo>

      <Demo title="Separator" note="A rule between groups; decorative unless it separates landmarks.">
        <Card style={{ width: '100%' }}>
          <CardContent>
            <Stack gap="sm">
              <span>Account</span>
              <Separator />
              <span>Billing</span>
            </Stack>
          </CardContent>
        </Card>
      </Demo>
    </div>
  )
}

import {
  Badge,
  CheckIcon,
  FileIcon,
  FolderIcon,
  MailIcon,
  PencilIcon,
  Timeline,
  TimelineHeading,
  TimelineItem,
  TreeView,
  UserAvatar,
  type TreeNode,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from './Demo'

const ACCOUNTS: TreeNode[] = [
  {
    id: '1000',
    label: '1000 · Assets',
    textValue: 'Assets',
    icon: <FolderIcon />,
    children: [
      {
        id: '1100',
        label: '1100 · Current assets',
        textValue: 'Current assets',
        icon: <FolderIcon />,
        children: [
          { id: '1110', label: '1110 · Cash at bank', textValue: 'Cash at bank', icon: <FileIcon /> },
          { id: '1120', label: '1120 · Accounts receivable', textValue: 'Accounts receivable', icon: <FileIcon /> },
        ],
      },
      { id: '1200', label: '1200 · Equipment', textValue: 'Equipment', icon: <FileIcon /> },
    ],
  },
  {
    id: '2000',
    label: '2000 · Liabilities',
    textValue: 'Liabilities',
    icon: <FolderIcon />,
    children: [
      { id: '2100', label: '2100 · Accounts payable', textValue: 'Accounts payable', icon: <FileIcon /> },
      { id: '2200', label: '2200 · GST payable', textValue: 'GST payable', icon: <FileIcon /> },
    ],
  },
  { id: '3000', label: '3000 · Equity', textValue: 'Equity', icon: <FolderIcon />, children: [] },
  { id: '9000', label: '9000 · Suspense (locked)', textValue: 'Suspense', icon: <FileIcon />, disabled: true },
]

const TEAMS: TreeNode[] = [
  {
    id: 'ops',
    label: 'Operations',
    children: [
      { id: 'north', label: 'North crew' },
      { id: 'south', label: 'South crew' },
    ],
  },
  { id: 'sales', label: 'Sales', children: [{ id: 'enterprise', label: 'Enterprise' }] },
  { id: 'support', label: 'Support' },
]

export function Timelines() {
  const [account, setAccount] = useState<string[]>(['1110'])
  const [teams, setTeams] = useState<string[]>(['north'])

  return (
    <div className="stack">
      <div className="grid-2">
        <Demo
          title="Timeline"
          note="What happened to one record. Markers take a tone; a pending step is hollow."
          inline={false}
          code={`
<Timeline>
  <TimelineItem title="Invoice paid" time="Sep 12, 10:04" dateTime="2026-09-12T10:04"
    tone="success" icon={<CheckIcon />}>
    $4,280.00 by card ending 4242.
  </TimelineItem>
  <TimelineItem title="Invoice sent" time="Sep 10, 16:30" icon={<MailIcon />} />
  <TimelineItem title="Payment reminder" time="Due Sep 24" pending />
</Timeline>`}
        >
          <Timeline aria-label="Invoice INV-2041 history">
            <TimelineItem title="Invoice created" time="Sep 9, 09:12" dateTime="2026-09-09T09:12" icon={<PencilIcon />}>
              Draft from job JOB-4812.
            </TimelineItem>
            <TimelineItem title="Invoice sent" time="Sep 10, 16:30" dateTime="2026-09-10T16:30" tone="info" icon={<MailIcon />}>
              To accounts@rosewood.example.
            </TimelineItem>
            <TimelineItem title="Invoice paid" time="Sep 12, 10:04" dateTime="2026-09-12T10:04" tone="success" icon={<CheckIcon />}>
              $4,280.00 by card ending 4242.
            </TimelineItem>
            <TimelineItem title="Receipt emailed" time="Scheduled" pending />
          </Timeline>
        </Demo>

        <Demo
          title="Activity feed"
          note="The same list with people as the markers and days as headings."
          inline={false}
          code={`
<Timeline aria-label="Team activity">
  <TimelineHeading>Today</TimelineHeading>
  <TimelineItem
    icon={<UserAvatar name="Priya Raman" size="sm" />}
    title={<><strong>Priya Raman</strong> approved PO-311</>}
    time="12 minutes ago"
  />
</Timeline>`}
        >
          <Timeline aria-label="Team activity">
            <TimelineHeading>Today</TimelineHeading>
            <TimelineItem
              icon={<UserAvatar name="Priya Raman" size="sm" />}
              title={
                <>
                  <strong>Priya Raman</strong> approved purchase order <Badge>PO-311</Badge>
                </>
              }
              time="12 minutes ago"
            />
            <TimelineItem
              icon={<UserAvatar name="Tom Whitfield" size="sm" />}
              title={
                <>
                  <strong>Tom Whitfield</strong> commented on JOB-4812
                </>
              }
              time="1 hour ago"
            >
              “Crew arrives 7:30, gate code in the notes.”
            </TimelineItem>
            <TimelineHeading>Yesterday</TimelineHeading>
            <TimelineItem
              icon={<UserAvatar name="Ana Ortiz" size="sm" />}
              title={
                <>
                  <strong>Ana Ortiz</strong> closed 4 tickets
                </>
              }
              time="Sep 23, 17:42"
            />
          </Timeline>
        </Demo>
      </div>

      <Demo
        title="Audit log"
        note={'variant="compact": the time in a column of its own, one line per change. On a phone the time moves under the change.'}
        inline={false}
        code={`
<Timeline variant="compact" aria-label="Audit log">
  <TimelineItem time="2026-09-24 09:31" title="ana@acme.example changed role of tom@… to Admin" tone="warning" />
  <TimelineItem time="2026-09-24 09:12" title="priya@acme.example signed in" />
</Timeline>`}
      >
        <Timeline variant="compact" aria-label="Audit log">
          <TimelineItem time="2026-09-24 09:31" dateTime="2026-09-24T09:31" tone="warning" title="ana@acme.example changed the role of tom@acme.example from Member to Admin" />
          <TimelineItem time="2026-09-24 09:18" dateTime="2026-09-24T09:18" tone="destructive" title="Failed sign-in for kofi@acme.example (wrong password, 3rd attempt)" />
          <TimelineItem time="2026-09-24 09:12" dateTime="2026-09-24T09:12" title="priya@acme.example signed in from 203.0.113.24" />
          <TimelineItem time="2026-09-23 18:02" dateTime="2026-09-23T18:02" tone="info" title="API key sk_live_…9f2c created by lena@acme.example">
            Scopes: invoices:read, customers:read
          </TimelineItem>
          <TimelineItem time="2026-09-23 17:40" dateTime="2026-09-23T17:40" tone="success" title="Export of 1,240 invoices completed" />
        </Timeline>
      </Demo>

      <div className="grid-2">
        <Demo
          title="Tree view"
          note="A chart of accounts. Arrow keys move and open; typing a letter jumps. One node selected; a locked account is disabled."
          inline={false}
          code={`
<TreeView
  aria-label="Chart of accounts"
  items={[
    { id: '1000', label: 'Assets', icon: <FolderIcon />, children: [
      { id: '1110', label: 'Cash at bank', icon: <FileIcon /> },
    ] },
  ]}
  defaultExpanded={['1000']}
  selected={selected}
  onSelectedChange={setSelected}
/>`}
        >
          <TreeView
            aria-label="Chart of accounts"
            items={ACCOUNTS}
            defaultExpanded={['1000', '1100']}
            selected={account}
            onSelectedChange={setAccount}
          />
          <p className="muted" style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem' }}>
            Selected: {account.join(', ') || 'nothing'}
          </p>
        </Demo>

        <Demo
          title="Tree view — multiple"
          note={'selectionMode="multiple": Space or a click toggles each node, as for picking the teams a report covers.'}
          inline={false}
        >
          <TreeView
            aria-label="Teams"
            items={TEAMS}
            selectionMode="multiple"
            defaultExpanded={['ops', 'sales']}
            selected={teams}
            onSelectedChange={setTeams}
          />
          <p className="muted" style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem' }}>
            {teams.length} selected: {teams.join(', ') || 'none'}
          </p>
        </Demo>
      </div>
    </div>
  )
}

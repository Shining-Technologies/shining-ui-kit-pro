import {
  Badge,
  BulkActionBar,
  Button,
  Checkbox,
  Chip,
  EventCalendar,
  FilterBar,
  FilterBarActions,
  FilterChips,
  KanbanBoard,
  PlusIcon,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserAvatar,
  type CalendarEvent,
  type KanbanColumn,
  type KanbanMove,
} from '@shining-technologies/ui'
import { useMemo, useState } from 'react'
import './DataViews.css'
import { Demo } from './Demo'

/* ------------------------------------------------------------------- data */

interface Project {
  id: string
  name: string
  client: string
  status: 'active' | 'on_hold' | 'done'
  owner: string
  overdue: boolean
}

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Harbour Bridge lighting', client: 'City of Sydney', status: 'active', owner: 'Priya Raman', overdue: false },
  { id: 'p2', name: 'Westfield fit-out', client: 'Scentre Group', status: 'active', owner: 'Tom Whitfield', overdue: true },
  { id: 'p3', name: 'Rosewood Estates stage 2', client: 'Rosewood', status: 'on_hold', owner: 'Ana Ortiz', overdue: false },
  { id: 'p4', name: 'North depot solar', client: 'Ausgrid', status: 'active', owner: 'Priya Raman', overdue: false },
  { id: 'p5', name: 'Clinic refurbishment', client: 'Healthscope', status: 'done', owner: 'Kofi Mensah', overdue: false },
  { id: 'p6', name: 'Airport car park CCTV', client: 'Sydney Airport', status: 'active', owner: 'Lena Brandt', overdue: true },
]

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'Active',
  on_hold: 'On hold',
  done: 'Done',
}

interface Deal {
  id: string
  title: string
  company: string
  value: number
  owner: string
  stage: string
}

const STAGES: KanbanColumn[] = [
  { id: 'lead', title: 'Lead', tone: 'neutral' },
  { id: 'qualified', title: 'Qualified', tone: 'info' },
  { id: 'proposal', title: 'Proposal', tone: 'warning', limit: 2 },
  { id: 'won', title: 'Won', tone: 'success' },
]

const DEALS: Deal[] = [
  { id: 'D-104', title: 'Fleet telematics', company: 'Northwind', value: 48000, owner: 'Priya Raman', stage: 'lead' },
  { id: 'D-109', title: 'Warehouse racking', company: 'Contoso', value: 21500, owner: 'Tom Whitfield', stage: 'lead' },
  { id: 'D-097', title: 'HR system rollout', company: 'Fabrikam', value: 96000, owner: 'Ana Ortiz', stage: 'qualified' },
  { id: 'D-088', title: 'Annual maintenance', company: 'Globex', value: 34000, owner: 'Kofi Mensah', stage: 'proposal' },
  { id: 'D-091', title: 'Site security audit', company: 'Initech', value: 12800, owner: 'Lena Brandt', stage: 'proposal' },
  { id: 'D-072', title: 'Office relocation', company: 'Umbrella', value: 64000, owner: 'Priya Raman', stage: 'won' },
]

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

/** Apply a board move to the list: out of its old place, into the new one. */
function moveDeal(deals: Deal[], move: KanbanMove): Deal[] {
  const moving = deals.find((deal) => deal.id === move.itemId)
  if (!moving) return deals
  const rest = deals.filter((deal) => deal.id !== move.itemId)
  const column = rest.filter((deal) => deal.stage === move.toColumnId)
  const anchor = column[move.toIndex]
  const moved = { ...moving, stage: move.toColumnId }
  const at = anchor
    ? rest.indexOf(anchor)
    : column.length
      ? rest.indexOf(column[column.length - 1]!) + 1
      : rest.length
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

const EVENTS: CalendarEvent[] = [
  { id: 'c1', date: '2026-09-01', title: 'Quarter kick-off', time: '09:00', tone: 'primary' },
  { id: 'c2', date: '2026-09-04', title: 'Payroll', tone: 'success' },
  { id: 'c3', date: '2026-09-08', end: '2026-09-10', title: 'Site audit — North depot', tone: 'warning' },
  { id: 'c4', date: '2026-09-09', title: 'Supplier review', time: '14:00', tone: 'info' },
  { id: 'c5', date: '2026-09-09', title: 'Crew rota due', tone: 'neutral' },
  { id: 'c6', date: '2026-09-09', title: 'Board pack', time: '17:00', tone: 'destructive' },
  { id: 'c7', date: '2026-09-15', title: 'Release 4.2', tone: 'chart-2' },
  { id: 'c8', date: '2026-09-18', title: 'Payroll', tone: 'success' },
  { id: 'c9', date: '2026-09-22', end: '2026-09-25', title: 'Leave — Ana Ortiz', tone: 'chart-4' },
  { id: 'c10', date: '2026-09-29', title: 'Invoice run', time: '10:00', tone: 'primary' },
]

/* ------------------------------------------------------------------ demos */

function FilterBarDemo() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [mine, setMine] = useState(false)
  const [overdue, setOverdue] = useState(false)

  const results = PROJECTS.filter(
    (project) =>
      (!query || `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase())) &&
      (status === 'all' || project.status === status) &&
      (!mine || project.owner === 'Priya Raman') &&
      (!overdue || project.overdue),
  )

  const clearAll = () => {
    setQuery('')
    setStatus('all')
    setMine(false)
    setOverdue(false)
  }

  return (
    <div className="stack-sm" style={{ width: '100%' }}>
      <FilterBar aria-label="Filter projects">
        <SearchInput
          aria-label="Search projects"
          placeholder="Search projects or clients"
          value={query}
          onValueChange={setQuery}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status" style={{ width: '9rem' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Chip selected={mine} onSelectedChange={setMine}>
          Mine
        </Chip>
        <Chip selected={overdue} onSelectedChange={setOverdue} tone="destructive">
          Overdue
        </Chip>
        <FilterBarActions>
          <Button size="sm">
            <PlusIcon />
            New project
          </Button>
        </FilterBarActions>
      </FilterBar>

      <FilterChips onClearAll={clearAll}>
        {query ? (
          <Chip onRemove={() => setQuery('')} removeLabel="Remove search filter">
            Search: {query}
          </Chip>
        ) : null}
        {status !== 'all' ? (
          <Chip onRemove={() => setStatus('all')} removeLabel="Remove status filter">
            Status: {STATUS_LABEL[status as Project['status']]}
          </Chip>
        ) : null}
        {mine ? (
          <Chip onRemove={() => setMine(false)} removeLabel="Remove owner filter">
            Owner: me
          </Chip>
        ) : null}
        {overdue ? (
          <Chip onRemove={() => setOverdue(false)} removeLabel="Remove overdue filter">
            Overdue
          </Chip>
        ) : null}
      </FilterChips>

      <p className="muted" style={{ margin: 0, fontSize: '0.8125rem' }}>
        {results.length} of {PROJECTS.length} projects:{' '}
        {results.map((project) => project.name).join(', ') || 'none'}
      </p>
    </div>
  )
}

function BulkDemo() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(['p2', 'p6']))
  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="stack-sm" style={{ width: '100%' }}>
      <BulkActionBar count={selected.size} total={PROJECTS.length} onClear={() => setSelected(new Set())}>
        <Button size="sm" variant="outline">
          Assign
        </Button>
        <Button size="sm" variant="outline">
          Export
        </Button>
        <Button size="sm" variant="destructive">
          Archive
        </Button>
      </BulkActionBar>
      <ul className="bulk-list">
        {PROJECTS.map((project) => (
          <li key={project.id}>
            <label className="choice">
              <Checkbox
                checked={selected.has(project.id)}
                onCheckedChange={(checked) => toggle(project.id, checked === true)}
              />
              <span>
                {project.name}
                <span className="muted"> · {project.client}</span>
              </span>
            </label>
            <Badge tone={project.status === 'done' ? 'success' : project.status === 'on_hold' ? 'warning' : 'info'}>
              {STATUS_LABEL[project.status]}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KanbanDemo() {
  const [deals, setDeals] = useState(DEALS)
  const [lastMove, setLastMove] = useState<string | null>(null)
  const totals = useMemo(() => {
    const sum = new Map<string, number>()
    for (const deal of deals) sum.set(deal.stage, (sum.get(deal.stage) ?? 0) + deal.value)
    return sum
  }, [deals])

  return (
    <div className="stack-sm" style={{ width: '100%' }}>
      <KanbanBoard
        aria-label="Sales pipeline"
        columns={STAGES}
        items={deals}
        getItemId={(deal) => deal.id}
        getColumnId={(deal) => deal.stage}
        getItemLabel={(deal) => `${deal.id} ${deal.title}`}
        onMove={(move) => {
          setDeals((current) => moveDeal(current, move))
          setLastMove(`${move.itemId}: ${move.fromColumnId} → ${move.toColumnId} (position ${move.toIndex + 1})`)
        }}
        renderColumnActions={(column) => (
          <Button size="icon-sm" variant="ghost" aria-label={`Add a deal to ${String(column.title)}`}>
            <PlusIcon />
          </Button>
        )}
        renderItem={(deal) => (
          <div className="deal">
            <div className="deal__top">
              <span className="muted">{deal.id}</span>
              <strong>{money.format(deal.value)}</strong>
            </div>
            <p className="deal__title">{deal.title}</p>
            <div className="deal__top">
              <span className="muted">{deal.company}</span>
              <UserAvatar name={deal.owner} size="xs" />
            </div>
          </div>
        )}
      />
      <p className="muted" style={{ margin: 0, fontSize: '0.8125rem' }}>
        {STAGES.map((stage) => `${String(stage.title)} ${money.format(totals.get(stage.id) ?? 0)}`).join(' · ')}
        {lastMove ? ` — last move ${lastMove}` : ''}
      </p>
    </div>
  )
}

function CalendarDemo() {
  const [picked, setPicked] = useState('Click a day or an event.')
  return (
    <div className="stack-sm" style={{ width: '100%' }}>
      <EventCalendar
        events={EVENTS}
        defaultMonth="2026-09-01"
        onDateClick={(date) => setPicked(`Day ${date}`)}
        onEventClick={(event) => setPicked(`Event: ${String(event.title)} on ${event.date}`)}
        actions={
          <Button size="sm">
            <PlusIcon />
            New event
          </Button>
        }
      />
      <p className="muted" role="status" style={{ margin: 0, fontSize: '0.8125rem' }}>
        {picked}
      </p>
    </div>
  )
}

export function DataViews() {
  return (
    <div className="stack">
      <Demo
        title="Filter bar"
        note="Search, a select and toggle chips on one wrapping line, with the filters in force as removable chips underneath. The DataTable toolbar looks the same; this one is for card grids, lists and boards."
        inline={false}
        code={`
<FilterBar aria-label="Filter projects">
  <SearchInput aria-label="Search projects" value={query} onValueChange={setQuery} />
  <Select value={status} onValueChange={setStatus}>…</Select>
  <Chip selected={mine} onSelectedChange={setMine}>Mine</Chip>
  <FilterBarActions>
    <Button size="sm">New project</Button>
  </FilterBarActions>
</FilterBar>

<FilterChips onClearAll={clearAll}>
  {status !== 'all' && (
    <Chip onRemove={() => setStatus('all')} removeLabel="Remove status filter">
      Status: {status}
    </Chip>
  )}
</FilterChips>`}
      >
        <FilterBarDemo />
      </Demo>

      <Demo
        title="Bulk action bar"
        note="The count and the actions that apply to every selected item. The DataTable renders the same bar for its selection — pass the actions as slots.selectionActions."
        inline={false}
        code={`
<BulkActionBar count={selected.size} total={projects.length} onClear={clear}>
  <Button size="sm" variant="outline">Export</Button>
  <Button size="sm" variant="destructive">Archive</Button>
</BulkActionBar>

// In a DataTable:
<DataTable
  enableRowSelection
  slots={{
    selectionActions: ({ table }) => (
      <Button size="sm" onClick={() => exportRows(table.getSelectedRowModel().rows)}>
        Export
      </Button>
    ),
  }}
/>`}
      >
        <BulkDemo />
      </Demo>

      <Demo
        title="Kanban board"
        note="Drag a card, or focus it and press Space, move it with the arrow keys and press Space again. The board reports each move and renders what the items say next; Proposal has a work-in-progress limit of two."
        inline={false}
        code={`
<KanbanBoard
  aria-label="Sales pipeline"
  columns={[
    { id: 'lead', title: 'Lead' },
    { id: 'proposal', title: 'Proposal', tone: 'warning', limit: 2 },
    { id: 'won', title: 'Won', tone: 'success' },
  ]}
  items={deals}
  getItemId={(deal) => deal.id}
  getColumnId={(deal) => deal.stage}
  getItemLabel={(deal) => deal.title}
  onMove={(move) => setDeals((deals) => applyMove(deals, move))}
  renderItem={(deal) => <DealCard deal={deal} />}
/>`}
      >
        <KanbanDemo />
      </Demo>

      <Demo
        title="Event calendar"
        note="A month of events. Arrow keys move between days, Page Up and Page Down between months; spanning events show on each day. On a phone the events become coloured bars."
        inline={false}
        code={`
<EventCalendar
  events={[
    { id: '1', date: '2026-09-04', title: 'Payroll', tone: 'success' },
    { id: '2', date: '2026-09-08', end: '2026-09-10', title: 'Site audit' },
  ]}
  onDateClick={(date) => openDay(date)}
  onEventClick={(event) => openEvent(event.id)}
/>`}
      >
        <CalendarDemo />
      </Demo>
    </div>
  )
}

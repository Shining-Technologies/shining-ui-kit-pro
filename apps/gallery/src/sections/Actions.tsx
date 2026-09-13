import {
  Badge,
  Button,
  ButtonGroup,
  CopyButton,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoldButton,
  Kbd,
  MoreIcon,
  PencilIcon,
  PlusIcon,
  Spinner,
  StatusBadge,
  StatusRegistryProvider,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipProvider,
  TrashIcon,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { STATUS_REGISTRY } from '../data'
import { Demo } from './Demo'

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const SIZES = ['sm', 'default', 'lg'] as const
const ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const
const TONES = ['neutral', 'primary', 'success', 'warning', 'destructive', 'info'] as const
const BADGE_VARIANTS = ['soft', 'solid', 'outline'] as const

export function Actions() {
  const [showArchived, setShowArchived] = useState(false)
  const [density, setDensity] = useState('comfortable')
  const [deleted, setDeleted] = useState(0)

  return (
    <div className="stack">
      <Demo title="Button variants" note="Every fill and its label come from project tokens.">
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </Demo>

      <Demo
        title="Sizes"
        note="Icon sizes are square and have no text, so each needs an aria-label."
      >
        {SIZES.map((size) => (
          <Button key={size} size={size} variant="outline">
            Size {size}
          </Button>
        ))}
        {ICON_SIZES.map((size) => (
          <Button key={size} size={size} variant="outline" aria-label={`Add (${size})`}>
            <PlusIcon />
          </Button>
        ))}
      </Demo>

      <Demo
        title="States and icons"
        note="A spinner inherits currentColor, so it stays legible on any fill."
      >
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled outline
        </Button>
        <Button>
          <Spinner size="sm" label={null} />
          Saving…
        </Button>
        <Button variant="secondary">
          <PencilIcon />
          Edit
        </Button>
        <Button variant="destructive">
          <TrashIcon />
          Delete
        </Button>
        <Button asChild variant="link">
          <a href="#actions">asChild renders a link</a>
        </Button>
      </Demo>

      <Demo
        title="Button group"
        note="A plain role=group, not a toolbar — these are ordinary buttons that sit together, so arrow keys behave as usual."
      >
        <ButtonGroup aria-label="Alignment">
          <Button variant="outline">Left</Button>
          <Button variant="outline">Centre</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </Demo>

      <Demo
        title="Copy button"
        note="The tick is the whole point — without feedback people press it twice. It reverts on a timer, so a parent re-render cannot cut it short."
      >
        <CopyButton value="JOB-4812">Copy job number</CopyButton>
        <CopyButton value="https://example.com/jobs/4812" label="Copy link" />
        <CopyButton value="INV-2291" variant="outline" copiedLabel="Copied!">
          Copy invoice
        </CopyButton>
      </Demo>

      <Demo
        title="Hold button"
        note="Friction in the gesture rather than a second screen. A bare click (screen reader, voice control) asks in a dialog instead."
      >
        <HoldButton onHoldComplete={() => setDeleted((n) => n + 1)} holdingLabel="Keep holding…">
          Hold to delete
        </HoldButton>
        <HoldButton
          variant="outline"
          duration={2000}
          confirmOnClick={false}
          onHoldComplete={() => setDeleted((n) => n + 1)}
        >
          Hold to archive (2s)
        </HoldButton>
        <span className="muted">Completed holds: {deleted}</span>
      </Demo>

      <Demo title="Toggle and toggle group">
        <Toggle aria-label="Bold">Bold</Toggle>
        <Toggle variant="outline" aria-label="Italic">
          Italic
        </Toggle>
        <Toggle variant="outline" size="sm" defaultPressed aria-label="Underline">
          Underline
        </Toggle>
        <ToggleGroup type="single" defaultValue="week" aria-label="Range">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" defaultValue={['email']} aria-label="Channels">
          <ToggleGroupItem value="email" variant="outline">
            Email
          </ToggleGroupItem>
          <ToggleGroupItem value="sms" variant="outline">
            SMS
          </ToggleGroupItem>
          <ToggleGroupItem value="push" variant="outline">
            Push
          </ToggleGroupItem>
        </ToggleGroup>
      </Demo>

      <Demo
        title="Badges"
        note="Tone says what it means; variant says how loudly. Six tones × three variants, all from tokens."
        inline={false}
      >
        <div className="stack-sm">
          {BADGE_VARIANTS.map((variant) => (
            <div key={variant} className="demo__body demo__body--inline">
              {TONES.map((tone) => (
                <Badge key={tone} tone={tone} variant={variant}>
                  {tone}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </Demo>

      <StatusRegistryProvider registry={STATUS_REGISTRY}>
        <Demo
          title="Status badge"
          note="The words come from the app, not the library — a vocabulary is supplied through StatusRegistryProvider, and an unknown value still renders."
        >
          <StatusBadge type="job" status="draft" />
          <StatusBadge type="job" status="scheduled" />
          <StatusBadge type="job" status="in_progress" />
          <StatusBadge type="job" status="awaiting_parts" />
          <StatusBadge type="job" status="complete" />
          <StatusBadge type="job" status="cancelled" />
          <StatusBadge type="job" status="escalated_to_legal" />
        </Demo>

        <Demo
          title="Status badge sizes and shapes"
          note="A dot says “state”; without one the badge reads as a label."
        >
          <StatusBadge type="invoice" status="paid" size="sm" />
          <StatusBadge type="invoice" status="sent" />
          <StatusBadge type="invoice" status="overdue" size="lg" />
          <StatusBadge type="invoice" status="draft" dot={false} />
          <StatusBadge
            status="charged_back"
            statuses={{ charged_back: { label: 'Charged back', tone: 'warning' } }}
          />
        </Demo>
      </StatusRegistryProvider>

      <Demo
        title="Dropdown menu"
        note="Content aligns to the trigger's end by default — row actions usually sit at the right edge."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Row actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Manage</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Sydney</DropdownMenuItem>
                  <DropdownMenuItem>Melbourne</DropdownMenuItem>
                  <DropdownMenuItem>Brisbane</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="View options">
              <MoreIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            >
              Show archived
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
              <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="muted">
          Archived {showArchived ? 'shown' : 'hidden'} · {density}
        </span>
      </Demo>

      <Demo
        title="Tooltip and keyboard hints"
        note="Tooltips are a convenience only — every trigger keeps its own accessible name. A disabled button gets no pointer events, so wrap it in a focusable span."
      >
        <TooltipProvider delayDuration={200}>
          <Tooltip content="Saves and closes the record">
            <Button variant="outline">Hover me</Button>
          </Tooltip>
          <Tooltip content="Opens to the right" side="right">
            <Button variant="outline" size="icon" aria-label="Add">
              <PlusIcon />
            </Button>
          </Tooltip>
          <Tooltip content="You need approver access to publish">
            <span tabIndex={0}>
              <Button disabled>Publish</Button>
            </span>
          </Tooltip>
        </TooltipProvider>
        <span className="muted">
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
        </span>
      </Demo>
    </div>
  )
}

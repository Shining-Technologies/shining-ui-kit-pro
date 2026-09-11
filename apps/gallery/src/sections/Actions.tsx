import {
  Badge,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
  Spinner,
  StatusBadge,
  StatusRegistryProvider,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipProvider,
} from '@shining-ui-kit/react'
import { STATUS_REGISTRY } from '../data'
import { Demo } from './Demo'

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const SIZES = ['sm', 'default', 'lg'] as const
const TONES = ['neutral', 'primary', 'success', 'warning', 'destructive', 'info'] as const

export function Actions() {
  return (
    <div className="stack">
      <Demo title="Button variants" note="Every fill and its label come from project tokens.">
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </Demo>

      <Demo title="Sizes">
        {SIZES.map((size) => (
          <Button key={size} size={size} variant="outline">
            Size {size}
          </Button>
        ))}
        <Button size="icon" variant="outline" aria-label="Add">
          +
        </Button>
      </Demo>

      <Demo title="States">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled outline
        </Button>
        <Button>
          <Spinner size="sm" label={null} />
          Saving…
        </Button>
      </Demo>

      <Demo
        title="Button group"
        note="One control from several buttons; the shared edge is collapsed."
      >
        <ButtonGroup aria-label="Alignment">
          <Button variant="outline">Left</Button>
          <Button variant="outline">Centre</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </Demo>

      <Demo title="Toggle and toggle group">
        <Toggle variant="outline">Bold</Toggle>
        <ToggleGroup type="single" defaultValue="week">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </Demo>

      <Demo title="Badges" note="Tone says what it means; variant says how loudly.">
        <div className="stack-sm" style={{ width: '100%' }}>
          <div className="demo__body demo__body--inline">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="soft">
                {tone}
              </Badge>
            ))}
          </div>
          <div className="demo__body demo__body--inline">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="solid">
                {tone}
              </Badge>
            ))}
          </div>
          <div className="demo__body demo__body--inline">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant="outline">
                {tone}
              </Badge>
            ))}
          </div>
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
        </Demo>
      </StatusRegistryProvider>

      <Demo title="Dropdown menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Row actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Manage</DropdownMenuLabel>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Demo>

      <Demo title="Tooltip and keyboard hints">
        <TooltipProvider>
          <Tooltip content="Saves and closes the record">
            <Button variant="outline">Hover me</Button>
          </Tooltip>
        </TooltipProvider>
        <span className="muted">
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
        </span>
      </Demo>
    </div>
  )
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Field,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  InfoIcon,
  Input,
  MoreIcon,
  PencilIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
  Tooltip,
  TooltipProvider,
  TrashIcon,
  UserAvatar,
} from '@shining-technologies/ui'
import { useState } from 'react'
import { Demo } from './Demo'

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function DialogSizes() {
  return (
    <>
      {(['sm', 'default', 'lg', 'xl', 'full'] as const).map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button variant="outline">Size {size}</Button>
          </DialogTrigger>
          <DialogContent size={size}>
            <DialogHeader>
              <DialogTitle>A {size} dialog</DialogTitle>
              <DialogDescription>
                {size === 'full'
                  ? 'The whole viewport, for an editor or a long form. Edge to edge on a phone.'
                  : 'Only the width changes; header, body and footer keep the same rhythm.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </>
  )
}

function ConfirmDemos() {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [result, setResult] = useState('Nothing answered yet.')

  return (
    <>
      <Button variant="outline" onClick={() => setArchiveOpen(true)}>
        Archive job
      </Button>
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive JOB-4812?"
        description="It leaves the board but stays searchable."
        confirmLabel="Archive"
        onConfirm={async () => {
          await wait(1200)
          setResult('Archived, after a 1.2s round trip.')
        }}
      />

      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
        <TrashIcon />
        Delete crew
      </Button>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Delete North crew?"
        description="Their three open jobs will be unassigned."
        confirmLabel="Delete crew"
        cancelLabel="Keep crew"
        onConfirm={() => setResult('Crew deleted.')}
      >
        <ul className="muted" style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
          <li>JOB-4812 · Norwood</li>
          <li>JOB-4815 · Unley</li>
          <li>JOB-4821 · Glenelg</li>
        </ul>
      </ConfirmDialog>

      <Button variant="ghost" onClick={() => setLeaveOpen(true)}>
        Leave with unsaved changes
      </Button>
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="You have unsaved changes"
        description="Three choices, in reading order. Each action can be async."
        actions={[
          { label: 'Stay', variant: 'ghost' },
          { label: 'Discard', variant: 'outline', onClick: () => setResult('Changes discarded.') },
          {
            label: 'Save and leave',
            onClick: async () => {
              await wait(900)
              setResult('Saved, then left.')
            },
          },
        ]}
      />

      <span className="muted" role="status">
        {result}
      </span>
    </>
  )
}

function MenuDemo() {
  const [columns, setColumns] = useState({ crew: true, suburb: true, due: false })
  const [density, setDensity] = useState('comfortable')
  const [lastAction, setLastAction] = useState('Pick something from the menu.')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Job actions">
            <MoreIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>JOB-4812</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setLastAction('Edit')}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLastAction('Duplicate')}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Assign to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {['North crew', 'South crew', 'Night shift'].map((crew) => (
                  <DropdownMenuItem key={crew} onSelect={() => setLastAction(`Assigned to ${crew}`)}>
                    {crew}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem disabled>Invoice (job not complete)</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setLastAction('Delete')}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">View options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          {(Object.keys(columns) as (keyof typeof columns)[]).map((key) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={columns[key]}
              onCheckedChange={(checked) => setColumns((current) => ({ ...current, [key]: checked }))}
              // Keep the menu open so several columns can be toggled in one go.
              onSelect={(event) => event.preventDefault()}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="muted" role="status">
        {lastAction} · Columns:{' '}
        {Object.entries(columns)
          .filter(([, on]) => on)
          .map(([key]) => key)
          .join(', ') || 'none'}{' '}
        · {density}
      </span>
    </>
  )
}

export function Overlays() {
  return (
    <div className="stack">
      <Demo
        title="Dialog"
        note="Portalled, so it escapes any overflow on the page. On close, focus returns to whatever opened it rather than falling back to the body."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button>Edit job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit job JOB-4812</DialogTitle>
              <DialogDescription>
                Changes are applied immediately and the crew is notified.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="stack-sm">
              <Field label="Reference" required>
                <Input defaultValue="JOB-4812" />
              </Field>
              <Field label="Access notes" description="Shown to the crew on arrival.">
                <Textarea rows={3} defaultValue="Side gate, code 4417. Dog in the yard." />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save changes</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DialogSizes />
      </Demo>

      <Demo
        title="Alert dialog"
        note="No close button and no dismiss-by-outside-click — a confirmation has to be answered. Escape still counts as Cancel."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Clicking outside will not dismiss it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="ghost">Keep it</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive">Delete permanently</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Demo>

      <Demo
        title="Confirm dialog"
        note="The alert dialog, done once. Async actions hold it open, disable every choice and mark the pending one busy — which is what stops the double-submit a hand-rolled confirm eventually allows."
      >
        <ConfirmDemos />
      </Demo>

      <Demo title="Sheet" note="A dialog anchored to an edge — same semantics, different geometry.">
        {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="outline">From {side}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the job list.</SheetDescription>
              </SheetHeader>
              <Field label="Suburb">
                <Input placeholder="Norwood" />
              </Field>
              <Field label="Crew">
                <Input placeholder="Any" />
              </Field>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="ghost">Reset</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </Demo>

      <Demo
        title="Popover and hover card"
        note="A popover takes focus and can hold controls. A hover card is a preview only — it never opens on touch, so nothing may live solely inside it."
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Set reminder</Button>
          </PopoverTrigger>
          <PopoverContent className="stack-sm" style={{ width: '18rem' }}>
            <Field label="Remind me in" description="Minutes before the job starts.">
              <Input type="number" defaultValue={30} min={5} step={5} />
            </Field>
            <Button size="sm">Save reminder</Button>
          </PopoverContent>
        </Popover>

        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@priya</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="demo__body--inline">
              <UserAvatar name="Priya Raman" size="lg" status="online" />
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Priya Raman</p>
                <p className="muted" style={{ margin: 0 }}>
                  Operations lead · Adelaide
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Demo>

      <Demo
        title="Dropdown menu"
        note="Items, a submenu, checkbox and radio items. A dialog opened from an item hands focus back to the menu's trigger, even though the item itself has unmounted."
      >
        <MenuDemo />
      </Demo>

      <Demo
        title="Tooltip"
        note="A convenience only: every trigger here has an accessible name of its own. A disabled button gets no pointer events, so it is wrapped in a focusable span to explain why."
      >
        <TooltipProvider delayDuration={200}>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <Tooltip key={side} side={side} content={`Opens on the ${side}`}>
              <Button variant="outline">{side}</Button>
            </Tooltip>
          ))}
          <Tooltip content="Job details">
            <Button variant="ghost" size="icon" aria-label="Job details">
              <InfoIcon />
            </Button>
          </Tooltip>
          <Tooltip content="Invoicing unlocks once the job is complete">
            <span tabIndex={0}>
              <Button disabled>Raise invoice</Button>
            </span>
          </Tooltip>
        </TooltipProvider>
      </Demo>
    </div>
  )
}

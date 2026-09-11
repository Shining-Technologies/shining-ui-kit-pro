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
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
} from '@shining-ui-kit/react'
import { Demo } from './Demo'

export function Overlays() {
  return (
    <div className="stack">
      <Demo
        title="Dialog"
        note="Portalled to the document body — the provider runs in global scope so the tokens still reach it."
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
              <Field label="Reference">
                <Input defaultValue="JOB-4812" />
              </Field>
              <Field label="Access notes">
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Clicking outside will not dismiss it — a confirmation has to
                be answered.
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
            </SheetContent>
          </Sheet>
        ))}
      </Demo>

      <Demo title="Popover and hover card">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p style={{ margin: 0 }}>
              A popover takes focus and can hold controls. Use it when the content is interactive.
            </p>
          </PopoverContent>
        </Popover>

        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@priya</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="demo__body demo__body--inline">
              <Avatar>
                <AvatarFallback>PR</AvatarFallback>
              </Avatar>
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
    </div>
  )
}

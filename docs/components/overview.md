# Components

Every component in the kit is painted entirely from `--sui-*` tokens, so it follows the
active [project](../guide/projects.md) with no per-component theming work. None of them hardcodes a
colour — a test enforces that.

They are composed rather than configured: parts are exported separately so a component can
be assembled the way a screen actually needs, instead of growing a prop for every variation.

---

## Actions

### Button

```tsx
<Button>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon" aria-label="Add"><PlusIcon /></Button>
<Button asChild><a href="/jobs">All jobs</a></Button>
```

| Prop      | Values                                                                 |
| --------- | ---------------------------------------------------------------------- |
| `variant` | `default` · `secondary` · `outline` · `ghost` · `destructive` · `link` |
| `size`    | `default` · `sm` · `lg` · `icon` · `icon-sm` · `icon-lg`               |
| `asChild` | Render the child element instead of a `<button>`, keeping the styling  |

Variant names follow shadcn/ui. The earlier table-only names — `solid`, `danger`, `md` — are
kept as aliases, so existing call sites keep working.

### ButtonGroup

Adjacent buttons rendered as one segmented control. The shared edge is collapsed rather than
doubled, and only the outer corners keep their radius.

```tsx
<ButtonGroup aria-label="View">
  <Button variant="outline">Day</Button>
  <Button variant="outline">Week</Button>
</ButtonGroup>
```

It carries `role="group"` rather than toolbar semantics: these are ordinary buttons that
happen to sit together, and claiming a toolbar would change the arrow-key behaviour
screen-reader users expect.

### Toggle, ToggleGroup

```tsx
<Toggle variant="outline" pressed={bold} onPressedChange={setBold}>Bold</Toggle>

<ToggleGroup type="single" value={range} onValueChange={setRange}>
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
</ToggleGroup>
```

Inside a group the selected item is a raised chip on a recessed track, rather than the flat
tint a standalone toggle uses — otherwise "on" and "hovered" look identical when several sit
side by side.

### Badge

`tone` says what it means; `variant` says how loudly.

```tsx
<Badge tone="success">Paid</Badge>
<Badge tone="destructive" variant="solid">Overdue</Badge>
<Badge tone="neutral" variant="outline">Draft</Badge>
```

| Prop      | Values                                                                 |
| --------- | ---------------------------------------------------------------------- |
| `tone`    | `neutral` · `primary` · `success` · `warning` · `destructive` · `info` |
| `variant` | `soft` · `solid` · `outline`                                           |

Splitting the two keeps the set small — six tones times three variants covers what would
otherwise be eighteen hand-written variants — and every tone resolves to a project token, so
a custom palette's own success green reaches badges.

---

## Surfaces

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
    <CardDescription>Rolling thirty days</CardDescription>
    <CardAction>
      <Badge tone="success">Live</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter bordered>
    <Button size="sm">Details</Button>
  </CardFooter>
</Card>
```

`Card` owns the box and the vertical rhythm; the parts own their own horizontal padding.
That is what lets a card hold a full-bleed chart or table — the part that needs to escape
the padding simply is not wrapped in `CardContent`.

`CardAction` sits at the top right of the header and spans both title rows, so it does not
get dragged down by a long description.

| Prop          |                                                                           |
| ------------- | ------------------------------------------------------------------------- |
| `variant`     | `default` · `flat` (no shadow) · `ghost` (no chrome at all)               |
| `interactive` | Adds hover affordance. Only set it when the card actually does something. |

### Stat

```tsx
<Stat label="Revenue" value="$248,120" delta="+12.4%" trend="up" />
```

`trend` is explicit rather than inferred from the sign — a fall in churn is an `up`, and only
the caller knows that.

### Alert

```tsx
<Alert tone="warning">
  <AlertTitle>Licence expires in 9 days</AlertTitle>
  <AlertDescription>Jobs after 14 March cannot be assigned.</AlertDescription>
</Alert>
```

Tones: `neutral` · `info` · `success` · `warning` · `destructive`. Each supplies its own
default icon; pass `icon={null}` to suppress it, or your own node to replace it.

Only the destructive tone gets `role="alert"`. The role interrupts a screen reader
mid-sentence, which is right for an error and rude for a tip.

### Avatar

```tsx
<Avatar size="lg">
  <AvatarImage src={user.photo} alt="" />
  <AvatarFallback>{initialsFrom(user.name)}</AvatarFallback>
</Avatar>

<AvatarGroup>{people.map(…)}</AvatarGroup>
```

Sizes: `sm` · `default` · `lg` · `xl`. `AvatarGroup` overlaps them with a ring in the surface
colour. It carries no role — a row of faces is decoration around a list that should already
be readable another way.

### Progress, Spinner, Skeleton, Empty, Kbd

```tsx
<Progress value={72} />
<Progress value={45} tone="warning" size="lg" />
<Progress value={null} />                    {/* indeterminate */}

<Spinner />                                  {/* role="status", announced */}
<Button><Spinner label={null} /> Saving…</Button>  {/* decorative inside a labelled control */}

<Empty
  icon={<InboxIcon />}
  title="No jobs scheduled"
  description="Nothing booked for this crew today."
  actions={<Button size="sm">Assign job</Button>}
/>

Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
```

The indeterminate progress bar animates because there is no value to show. The spinner
inherits `currentColor`, so one inside a primary button is legible without being told a
colour, and with motion suppressed it becomes a pulsing dot rather than a spinning ring.

---

## Form inputs

### Field

The one that matters. Label, control, help text and error in a consistent layout — and the
control is never told the ids.

```tsx
<Field label="Email" description="We never share it." error={errors.email} required>
  <Input {...register('email')} />
</Field>
```

The `Input` reads `id`, `aria-describedby`, `aria-invalid`, `disabled` and `required` from
the surrounding field through context. That is the part hand-written forms usually get
wrong, and the part screen-reader users depend on.

| Prop                          |                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `label` `description` `error` | Any node. A truthy `error` also marks the control invalid.                                               |
| `required` `disabled`         | Propagate to the control.                                                                                |
| `orientation`                 | `vertical` (default) or `horizontal`, which puts the label after the control — for a checkbox or switch. |
| `htmlFor`                     | Override the generated id, e.g. to match a form library's field name.                                    |

Building your own control that participates:

```tsx
import { useFieldControl } from '@shining-ui-kit/react'

function MyInput(props) {
  const field = useFieldControl() // {} outside a Field, so it still works standalone
  return <input {...field} {...props} />
}
```

`Fieldset` groups related fields with a real `<fieldset>`/`<legend>`.

### Controls

```tsx
<Input placeholder="12 Rundle Street" />
<InputGroup prefix="$" suffix="AUD" defaultValue="1250.00" />
<Textarea rows={3} />
<Checkbox />
<Switch />
<RadioGroup><RadioGroupItem value="a" /></RadioGroup>
<Slider value={[40]} onValueChange={setValue} max={100} step={5} />
<Slider value={[20, 80]} onValueChange={setRange} />   {/* range: one thumb per value */}
<Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>…</SelectContent></Select>
```

`InputGroup` puts an icon, a unit or a button inside the input's box. The wrapper owns the
border and the focus ring, so focusing the field rings the whole control rather than the bare
text area inside it.

`Slider` renders one thumb per value in `value`/`defaultValue`, which is what lets the same
component serve a single value and a range without a `range` flag.

`Textarea` takes `autoResize` (with an optional `maxRows`) and `showCount`. Neither is the
default: a box that changes height on every keystroke moves everything under it, which is
right for a composer and wrong for a dense form, and a counter is only useful where the limit
is real.

### PasswordInput

```tsx
<PasswordInput strength />
<PasswordInput revealable={false} placeholder="Confirm password" />
```

The reveal button is the default. Masking is a shoulder-surfing defence, not a security
boundary, and enforcing it costs far more in mistyped passwords than it saves — so turning it
off is the deliberate act. `strength` mounts [`PasswordStrengthIndicator`](#passwordstrengthindicator)
under the field and feeds it the value even when the field is uncontrolled. Caps Lock is
warned about while typing, because it is the commonest password typo there is.

### PhoneInput

```tsx
<PhoneInput value={phone} onValueChange={setPhone} />
<PhoneInput defaultCountry="NZ" preferredCountries={['AU', 'NZ', 'GB', 'US']} />
<PhoneInput countries={['AU', 'NZ']} />
```

The country is a control rather than four characters to type, because `+61` and `+1` decide
how the rest of the number is parsed — and a flag makes a wrong one obvious at a glance. The
list is searchable by name, alpha-2 code or dialling code.

What `onValueChange` receives is always E.164 (`+61412345678`) plus the parts, so neither has
to be re-derived; the spacing in the field is presentation and never reaches the value. A
value passed in selects its own country, so a saved `+1…` number shows the right flag with no
extra prop. Deliberately not libphonenumber: that is 150 kB to place brackets, and nothing
here ever _rejects_ a number it formats oddly.

The country list is exported on its own as `COUNTRIES`, `countryByCode`, `countryByDial` and
`flagFor` for forms that need the same names elsewhere.

### NumberInput

```tsx
<NumberInput value={beds} onValueChange={setBeds} min={1} max={10} />
<NumberInput value={price} onValueChange={setPrice} precision={2} thousands prefix="$" suffix="AUD" />
```

Not `<input type="number">`, on purpose: that one silently discards what it cannot parse (so
a stray character empties the field), its spinners cannot be styled, and a scroll over a
focused one changes the value. This is a text field that accepts only numeric input, steps
from the buttons and the arrow keys, and rounds and clamps on blur. A half-typed `-`, `1.` or
empty string survives while it is being typed.

### OtpInput

```tsx
<OtpInput value={code} onValueChange={setCode} onComplete={submit} groupEvery={3} />
<OtpInput length={4} type="alphanumeric" masked />
```

One box per character, because that is what makes an SMS autofill and a password-manager
paste land correctly on every platform — but it behaves as one control: typing advances,
Backspace retreats, arrows move, and pasting the whole code fills every box rather than
putting six characters in the first one.

### TagsInput

```tsx
<TagsInput value={tags} onValueChange={setTags} max={6} />
<TagsInput validate={(tag) => (tag.includes('@') ? null : 'That is not an email address')} />
```

For short values typed one after another — skills, recipients, labels. Everything a
comma-separated text field gets wrong is handled here: a finished tag is a chip, removing one
is a click rather than text surgery, and pasting `a, b, c` produces three tags. `delimiters`
defaults to Enter and comma; an unfinished tag is committed on blur.

### ColorInput

```tsx
<ColorInput value={colour} onValueChange={setColour} />
<ColorInput value={colour} onValueChange={setColour} swatches={[]} />
```

The swatch is a real `<input type="color">` — the OS picker is better than anything worth
reimplementing — with a hex field beside it, because a brand colour arrives as text from a
design file far more often than it is chosen by eye. `normalizeHex()` is exported: it expands
`#abc` and returns `null` for anything that is not a hex colour.

### RatingInput

```tsx
<RatingInput value={rating} onValueChange={setRating} />
<RatingInput value={4.5} allowHalf readOnly caption="4.5 · 212 reviews" />
```

A `slider` under the surface, which is where the keyboard comes from: arrows move by one (or
a half), Home and End jump to the ends, and the value is announced as "3 of 5 stars" rather
than as an unlabelled button press. The filled star is the same glyph clipped to a fraction,
so a half needs no second icon.

### DateField, TimeField, DateTimeField

```tsx
<DateField value={date} onChange={setDate} label="Service date" />
<TimeField value={time} onChange={setTime} label="Arrival" minuteStep={15} />
<DateTimeField value={slot} onChange={setSlot} label="Appointment" />
```

`Calendar` and `Clock` are also exported for use inline, without a popover.

The native date and time pickers are the two controls in a themed form that cannot be
themed — their layout, their placeholder and their popover belong to the browser — so the kit
draws both from tokens instead. The calendar follows the ARIA grid pattern (arrows by day,
PageUp/PageDown by month); the clock reads like an analogue face — pick the hour, the dial
turns to minutes, pick the minute — while the two digits in its header are real spinbuttons,
so it is fully usable from the keyboard without touching the face.

`DateTimeField` puts both in one panel behind one Done, so the field is either empty or
complete rather than half-set. Values are local strings with no timezone attached:
`yyyy-mm-dd`, `HH:mm` and `yyyy-mm-ddTHH:mm`, with `toIso`/`fromIso`, `toTime`/`fromTime`,
`formatTime` and `splitDateTime`/`joinDateTime` exported to move between them.

### ImageUpload

```tsx
<ImageUpload value={photos} onValueChange={setPhotos} maxFiles={4} maxSize={5_000_000} />
<ImageUpload multiple={false} shape="circle" />
```

[`FileUpload`](#fileupload) is right for documents; images want the picture rather than the
filename, since `screenshot-2024-11-03-final-v2.png` tells nobody which screenshot it is. A
grid of removable thumbnails with the add tile last, and the whole grid is the drop target.

Previews are object URLs, revoked when the tile goes — a `FileReader` preview holds every
image in memory as base64 for the life of the page, which is how an upload form quietly costs
200 MB. An item may carry a remote `url` instead of a `file`, for images already on the
server; those are never revoked.

---

## Navigation

### Tabs

```tsx
<Tabs defaultValue="upcoming">                        {/* pills — a control */}
<Tabs defaultValue="details" appearance="underline">  {/* underline — navigation */}
<Tabs orientation="vertical">                         {/* a sidebar of sections */}
```

The distinction is real: a pill track next to a page title reads as a filter, not as
sections. In the underline variant the inactive triggers carry a transparent rule of the
same width as the active one, so switching tabs does not shift the labels by a pixel.

### Accordion, Collapsible

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>What does a deep clean include?</AccordionTrigger>
    <AccordionContent>Ovens, window tracks, skirting boards.</AccordionContent>
  </AccordionItem>
</Accordion>

<Accordion type="multiple" appearance="separated">   {/* each item its own card */}
```

Each trigger is wrapped in a heading, so the panels are reachable from a screen reader's
heading list. The open and close animate to the measured panel height, which is what makes
them symmetrical.

### Breadcrumb, Pagination

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/jobs">Jobs</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>JOB-4812</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

<Pagination page={page} pageCount={24} onPageChange={setPage} siblings={1} />
```

`Pagination` always renders the same number of slots, so the control does not change width as
the user pages through and move the button out from under their cursor. It is the standalone
control; the data table has its own row pagination.

---

## Overlays

### Dialog

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Edit</Button>
  </DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Edit job</DialogTitle>
      <DialogDescription>Changes apply immediately.</DialogDescription>
    </DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Sizes: `sm` · `default` · `lg` · `xl`. On a narrow screen the footer stacks and reverses, so
the primary action is the one nearest the thumb.

Dialogs are portalled to the document body, so they only inherit the theme when the provider
runs in `scope="global"`. An app that uses dialogs should prefer that scope.

### AlertDialog

A dialog that must be answered: the close button and outside-click dismissal are both
removed, because "clicked somewhere else" is not an answer to "delete this permanently?".

```tsx
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>Delete this job?</AlertDialogTitle>
    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel asChild>
      <Button variant="ghost">Keep it</Button>
    </AlertDialogCancel>
    <AlertDialogAction asChild>
      <Button variant="destructive">Delete</Button>
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
```

### Sheet, Popover, HoverCard, DropdownMenu, Tooltip

```tsx
<SheetContent side="right">…</SheetContent>   {/* top · right · bottom · left */}
```

`Sheet` is built on the dialog primitive rather than being its own thing: a sheet has exactly
a dialog's semantics — modal, focus-trapped, escape-dismissable — and differs only in where
it comes from.

Reach for a **popover** when the content is interactive and should take focus, and a **hover
card** when it is a preview. Tooltips are a convenience only: every control that carries one
also has an accessible name of its own, so nothing is lost on touch.

---

## Composites

A tier above the primitives: the shapes an application is assembled from, each of which every
dashboard would otherwise rebuild slightly differently.

### Table

```tsx
<Table striped>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead align="end">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV-2041</TableCell>
      <TableCell numeric>4,820</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

The plain table, for a fixed handful of rows where the data table would be ceremony. Same
tokens, so the two sit on one page as one thing. `density` · `striped` · `bordered`; `align`
is logical (`start` · `center` · `end`), and `numeric` on a cell adds tabular figures and
right-aligns it. The wrapper scrolls, never the document.

> The engine's table-instance type is exported as `TableInstance`; the bare `Table` name
> belongs to this component.

### StatusBadge

```tsx
<StatusRegistryProvider
  registry={{ job: { in_progress: { label: 'In progress', tone: 'primary' } } }}
>
  <StatusBadge type="job" status="in_progress" />
</StatusRegistryProvider>
```

Status words are _application_ data, not library data — "awaiting parts" means nothing to a
component library — so the kit ships the badge and the app ships the vocabulary. Resolution
runs local `statuses` → registry → fallback, and an undefined value renders as a neutral badge
with a prettified label rather than crashing.

Sizes `sm` · `md` · `lg`; tones `neutral` · `primary` · `success` · `warning` · `destructive` ·
`info`. `dot={false}` for a badge that reads as a label rather than a state.

### StatsCard

```tsx
<StatsCard label="Jobs completed" value="8,241" change="+12.4%" trend="up" description="vs Q3" />
<StatsCard label="Revenue" value="$1.42M" loading />
<StatsCard label="Crews" value="24" onClick={() => navigate('/roster')} />
```

`Stat` is the bare figure for a card you are already composing; this is the whole tile.
`trend` is explicit for the same reason as `Stat`'s. `onClick` upgrades the element to a real
`<button>` rather than putting a handler on a `<div>`. `chart` renders full-bleed under the
figure.

### PageHeader

```tsx
<PageHeader
  title="Jobs"
  description="Everything scheduled this week."
  eyebrow={<Breadcrumb>…</Breadcrumb>}
  actions={<Button size="sm">New job</Button>}
  onBack={() => navigate(-1)}
  documentTitle
>
  <SectionTabs tabs={tabs} />
</PageHeader>
```

`as` picks the heading level, so a header inside a section does not open a second `h1`.
`documentTitle` sets `document.title` while mounted and restores it on unmount, so a modal
route does not leave the tab renamed. The kit has no router: `onBack` is yours to implement.

### SectionTabs

```tsx
<SectionTabs
  tabs={[
    { id: 'all', label: 'All', count: 128 },
    { id: 'today', label: 'Today' },
  ]}
  onValueChange={setSection}
/>
```

Not `Tabs`. These usually change the route, and a tablist owns its panels — claiming that
relationship when the content is a separate page makes a screen reader promise something the
app does not deliver. So it is a group of buttons with `aria-current`, and the arrow-key
behaviour of real tabs is deliberately absent. `appearance`: `underline` (sections) · `pills`
(a filter).

### Combobox, MultiCombobox

```tsx
<Combobox options={regions} value={region} onValueChange={setRegion} clearable />
<MultiCombobox options={regions} value={selected} onValueChange={setSelected} />
<Combobox options={results} onSearch={(query) => fetchRegions(query)} loading={pending} />
```

`Select` is right up to about a dozen options; past that, scanning beats scrolling. Filtering
is local until `onSearch` is passed, at which point the same component asks the server — a
list that outgrows the client does not have to be rewritten. Options may carry a
`description`, an `icon`, a `group` and `disabled`.

The multi variant keeps the list open while you pick, and renders selections as removable
chips: removing one is the thing people actually want, and a comma-joined string makes them
clear the field and start again.

### FileUpload

```tsx
<FileUpload
  multiple
  accept="image/*"
  maxSize={5_000_000}
  value={items}
  onValueChange={setItems}
  onFileRejected={(file, reason) =>
    toast({ tone: 'destructive', title: `${file.name}: ${reason}` })
  }
/>
```

The styled drop zone is a label for a real `<input type="file">`, so the keyboard, form resets
and the OS picker all work. Validation happens here; _reporting_ it does not — the component
rejects a file and tells you why, and you decide whether that is a toast, an inline error or
nothing. `UploadItem.progress` drives a bar per file for a real upload.

### PasswordStrengthIndicator

```tsx
<PasswordStrengthIndicator password={password} />
<PasswordStrengthIndicator password={password} showRules={false} />
```

The checklist is the useful half: a bare meter tells someone they failed without telling them
what to change. `scorePassword()` counts the rules met and then lets length have the last word
— under eight characters cannot rate above "Weak" however many character classes it crams in,
and a passphrase of sixteen or more is credited on its own. Pass `rules` to replace the
defaults, or `score` to drive it from zxcvbn on the server.

The meter is `aria-hidden` and the verdict is announced as text: a screen reader gets the
sentence, not four coloured bars.

### ConfirmDialog

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  destructive
  title="Delete Rosewood Estates?"
  description="This removes 14 properties and 11 invoices. It cannot be undone."
  confirmLabel="Delete permanently"
  onConfirm={() => api.delete(id)}
/>
```

Built on `AlertDialog` — no close button, no dismiss-by-overlay — because a question worth
interrupting someone for is worth an explicit answer. Actions may be async: the dialog holds
itself open, disables every choice and shows the pending one as busy, which is what stops the
double-submit a hand-rolled confirm eventually allows. Pass `actions` for more than two
choices.

### CopyButton, HoldButton

```tsx
<CopyButton value={invoice.id} />
<CopyButton value={user.email} variant="outline">Copy email</CopyButton>

<HoldButton onHoldComplete={destroy} holdingLabel="Keep holding…">Hold to delete</HoldButton>
```

The tick is the whole point of the copy button: without feedback, people press it twice.
`HoldButton` is the alternative to a dialog for something destructive but not rare — the
friction is in the gesture rather than in a second screen, so an operator doing this fifty
times a day is not asked fifty questions. Space and Enter stand in for a hold on a keyboard.

### UserAvatar

```tsx
<UserAvatar name="Priya Raman" src={user.photo} status="online" size="lg" />
```

`Avatar` is the box; this is the person in it. The tint is derived from the name (or `seed`)
so the same person is the same colour on every page and after every reload — and it is drawn
from the chart tokens, so it repaints with the project. The name reaches assistive tech, which
is the part every hand-rolled version forgets.

### FloatingFormActions

```tsx
<FloatingFormActions
  visible={form.isDirty}
  message="3 unsaved changes"
  onCancel={form.reset}
  onSubmit={form.submit}
  submitting={form.isSubmitting}
/>
```

The save bar for a form taller than the viewport. It unmounts when hidden rather than merely
fading, so a screen reader is never offered a Save button that is not there yet.

### Toasts

```tsx
<ToastProvider>
  <App />
  <Toaster position="bottom-right" />
</ToastProvider>
```

```tsx
const { toast, dismiss } = useToast()
toast({ tone: 'success', title: 'Invoice sent', action: { label: 'Undo', onClick: undo } })
```

The store is per-provider, not a module singleton: two providers on one page — a gallery, a
preview pane, a test — get two independent stacks. Reuse an `id` to replace a toast in place,
a "Saving…" that becomes "Saved". `duration: 0` keeps one up until it is dismissed.

`Toaster` renders inline rather than through a portal, so it stays inside whatever scope the
provider painted; a portalled stack would escape a scoped `UIKitProvider` and come out in the
default palette. The region is polite — a toast never steals focus.

---

## Application shell

```tsx
<SkipToContent targetId="main" />
<AppShell collapsed={collapsed} hasBottomNav>
  <AppShellSidebar header={<Brand />} footer={<UserAvatar name={me.name} />}>
    <SidebarGroup label="Operations">
      <SidebarItem href="/jobs" icon={<JobsIcon />} badge={12} active>Jobs</SidebarItem>
    </SidebarGroup>
  </AppShellSidebar>

  <AppShellHeader start={<Search />} end={<UserMenu />} />

  <AppShellContent id="main">
    <PageHeader title="Jobs" />
  </AppShellContent>

  <AppShellBottomNav>
    <BottomNavItem icon={<JobsIcon />} label="Jobs" active />
  </AppShellBottomNav>
</AppShell>
<ScrollToTop />
```

Slots rather than props: `sidebar={…}` would mean the shell decides what a sidebar contains,
and a field app and an admin console disagree about that. The layout is CSS grid on `100dvh`,
so the sidebar and header stay put while the content scrolls and a mobile browser's collapsing
toolbar does not leave a dead strip.

Below 48rem the rail is hidden and `AppShellBottomNav` takes over, clear of the home
indicator. Nothing switches components — it is the same shell.

`SidebarItem` renders an `<a>` when given an `href` and a `<button>` otherwise, so a
router-driven app and a state-driven one both get the correct element instead of a `<div>`
with a click handler. `collapsed` narrows the rail to icons.

`SkipToContent` is WCAG 2.4.1 — invisible until focused, first in the tab order, and
`AppShellContent` is `tabIndex={-1}` so it has somewhere to land. `ScrollToTop` appears only
past its `threshold`, because a control that is always there on a short page is chrome for
nothing.

The sidebar paints from `--sui-sidebar*` rather than the card tokens: navigation is a
different surface from content, and a project that wants a dark rail against a light page has
to be able to say so.

---

## Charts

See [charts](./charts.md).

## Data table

See [quick start](../guide/quick-start.md) and the table pages listed in the [README](../../README.md).

## Theming controls

`<ProjectSwitcher />`, `<ColorModeToggle />`, `<ProjectEditor />` and `<TokenSwatchGrid />`
ship with the kit so an application can expose project switching and editing without
rebuilding that UI. See [Projects](../guide/projects.md).

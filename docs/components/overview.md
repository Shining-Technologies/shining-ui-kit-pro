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

`CardTitle` renders a `div` unless told otherwise, and a `div` is invisible to a screen
reader's heading list. Pick the level that fits the page outline — `<CardTitle as="h2">` under
the page's `h1` — so people can jump from card to card. `SummaryCard` and `StepCard` take the
same choice as `titleAs`.

| Prop          |                                                                           |
| ------------- | ------------------------------------------------------------------------- |
| `variant`     | `default` · `flat` (no shadow) · `ghost` (no chrome at all)               |
| `interactive` | Adds hover affordance. Only set it when the card actually does something. |

`CardIcon` is a tinted glyph tile. Put it first inside `CardHeader` and it takes its own
column, spanning the title and description; a `CardAction` still lands at the far right.

```tsx
<CardHeader>
  <CardIcon tone="info">
    <TicketIcon />
  </CardIcon>
  <CardTitle>Support queue</CardTitle>
  <CardDescription>Tickets raised by customers and crews</CardDescription>
</CardHeader>
```

`tone` takes any `AccentTone`: the six status tones (`neutral` · `primary` · `success` ·
`warning` · `destructive` · `info`) plus `chart-1` … `chart-5`, for categories that outnumber
the statuses. Sizes `sm` · `default` · `lg`.

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

`max` shows that many avatars and a `+n` chip for the rest, announced as "n more";
`moreClassName` styles the chip, usually with the avatars' size (`sui-avatar--sm`).

```tsx
<AvatarGroup max={3} moreClassName="sui-avatar--sm">{crew.map(…)}</AvatarGroup>
```

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

`<Empty variant="inline" title="No records yet." />` is the same statement at the volume of a
sentence — for a list that is empty _inside_ a card whose other figures are still worth
reading, where a centred panel would shout over them.

`Skeleton` renders a `div`; `as="span"` gives the same block inside a button, a link or a label,
where a `div` is invalid HTML.

### StatusDot, SegmentedBar

```tsx
<StatusDot tone="success" label="Operational" />
<StatusDot tone="info" label="Syncing" pulse />      {/* "live", not just "on" */}

<SegmentedBar
  label="Tickets by status"
  segments={[
    { label: 'Open', value: 14, tone: 'info' },
    { label: 'Resolved', value: 61, tone: 'success' },
  ]}
/>
```

A `StatusDot` with no `label` and no `aria-label` is hidden from assistive tech, on the
assumption that the text beside it already says what it means — the colour is never the only
signal. The pulse becomes a steady halo when motion is reduced.

`SegmentedBar` answers "how is the lot distributed" where `Progress` answers "how far along is
one thing". Segments size by `flex-grow` on their raw values, so rounding can never leave the
bar short, and the whole bar is one `role="img"` named with the counts spelled out. A segment's
`key` is optional; without one it is keyed by position, not by label.

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

`<label for>` only reaches native form elements and buttons, so a control that is a `div` with
a role — `RadioGroup`, `RatingInput`, the `OtpInput` group — is named from the field's label
through `aria-labelledby` instead. `SelectTrigger`, `RadioGroup`, `Checkbox` and `Switch` join a
field like the rest: described, marked invalid, disabled and required by it — so an unticked "I
accept the terms" is announced as required and, with an error, as invalid. Do not pass
`aria-label` to a control inside a `Field`: it overrides the visible label, and a screen reader
then hears a different name from the one on screen.

A `Slider`'s thumbs are what take focus, so they are what joins: each is named from the field's
label — a range's two read "Price Minimum" and "Price Maximum" — and takes the description, the
invalid state and `disabled`. `required` is not announced: a slider always holds a value, and
`aria-required` is not valid on `role="slider"`.

Every control that holds a value follows one rule: it is controlled when `value` is not
`undefined`, and uncontrolled (`defaultValue`) otherwise. The empty value is spelled out rather
than left `undefined`:

| Empty value | Controls                                                         |
| ----------- | ---------------------------------------------------------------- |
| `''`        | `Input`, `PasswordInput`, `PhoneInput`, `OtpInput`, `ColorInput` |
| `null`      | `NumberInput`, `Combobox`                                        |
| `[]`        | `TagsInput`, `MultiCombobox`, `FileUpload`, `ImageUpload`        |
| `0`         | `RatingInput`                                                    |

Which controls take a form library's `register()` and which need a controlled wrapper — the
Radix-built `Checkbox`, `Switch`, `Select` and `RadioGroup` among them — is covered in
[Forms](../guide/forms.md), along with native submission and value formats.

Building your own control that participates:

```tsx
import { useFieldControl } from '@shining-technologies/ui-kit-react'

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

A `hint` and the strength verdict are added to the input's `aria-describedby`, after the field's
own description. With `strength` set the input asks for `autoComplete="new-password"` (otherwise
`current-password`), which is what makes a password manager offer to generate one; your own
`autoComplete` wins. The meter reads the input itself, not only its own `onChange`, so it follows
a react-hook-form `reset()` and a native `form.reset()` rather than scoring the password that was
just cleared.

### PhoneInput

```tsx
<PhoneInput value={phone} onValueChange={setPhone} />
<PhoneInput defaultCountry="NZ" preferredCountries={['AU', 'NZ', 'GB', 'US']} />
<PhoneInput countries={['AU', 'NZ']} />
```

The country is a control rather than four characters to type, because `+61` and `+1` decide
how the rest of the number is parsed — and a flag makes a wrong one obvious at a glance. The
list is searchable by name, alpha-2 code or dialling code, and driven from the keyboard: the
arrows move through it and Enter picks.

The value is always E.164 (`+61412345678`), and `''` when the field is empty. `onValueChange`
receives `(e164, { country, national })`, so neither half has to be re-derived; the spacing in
the field is presentation and never reaches the value. `defaultValue` takes the same E.164
form, and `name` submits it through a hidden input.

A value passed in selects its own country, so a saved `+44…` number shows the right flag with
no extra prop — but the country already selected wins a code it shares, so `+1` for someone who
picked Canada stays Canada. Pasting or autofilling `+44 …` into the field picks the country
too. A trunk `0` typed before the national number, the way it is written at home (`0412…` in
Australia, `07…` in the UK), stays visible but is dropped from the value: `+61412…`. Italy, San
Marino, the Vatican, Côte d'Ivoire and the Republic of the Congo keep their leading `0`,
because there it is part of the number.

Deliberately not libphonenumber: that is 150 kB to place brackets, and nothing here ever
_rejects_ a number it formats oddly.

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

The value is `number | null` and never `NaN`: a draft that is not yet a number is `null`.
`onValueChange` fires on every keystroke with what the draft stands for, and again on blur
with the rounded, clamped result; once the field is left, `precision` decimals are shown, so
`12.5` reads as `12.50`. `name` submits the plain number through a hidden input, never the
grouped text (`1,250.00`) the field displays.

The decimal separator is `locale`'s (a BCP 47 tag), else the runtime's: `locale="de-DE"` types
and shows `1.250,5`. A `.` is always accepted as the decimal point too — it is the only one on
many keypads — unless the locale's own separator is also present, when it is read as grouping.
Pass `locale` when server rendering, so the server and the browser format alike.

The phone keypad follows the range. `inputMode` is `text` when negatives are allowed (no `min`,
or one below zero), because the numeric pads have no minus key; otherwise `decimal`, or `numeric`
with `precision={0}`. Your own `inputMode` wins.

### OtpInput

```tsx
<OtpInput value={code} onValueChange={setCode} onComplete={submit} groupEvery={3} />
<OtpInput length={4} type="alphanumeric" masked />
```

One box per character, because that is what makes an SMS autofill and a password-manager
paste land correctly on every platform — but it behaves as one control: typing advances,
arrows move, and pasting the whole code fills every box rather than putting six characters in
the first one. A full-length paste replaces the code whichever box has the caret; anything
shorter is written from the focused box onwards.

Deleting keeps positions. Backspace and Delete empty the box where it stands (Backspace in an
empty box empties the one before and moves there), and nothing slides left into the hole. The
value is the characters in order with empty boxes skipped — clearing the third box of `1234`
gives `'124'` — so the code is complete exactly when `value.length === length`, and
`onComplete` fires only then.

`defaultValue` makes it uncontrolled, and `name` submits the whole code through one hidden
input. Inside a `Field` the first box takes the field's id, so the label's `for` lands on it,
and the group is named by the label.

### TagsInput

```tsx
<TagsInput value={tags} onValueChange={setTags} max={6} />
<TagsInput validate={(tag) => (tag.includes('@') ? null : 'That is not an email address')} />
```

For short values typed one after another — skills, recipients, labels. Everything a
comma-separated text field gets wrong is handled here: a finished tag is a chip, removing one
is a click rather than text surgery, and pasting `a, b, c` produces three tags. `delimiters`
defaults to Enter and comma, and the same characters split pasted text (Enter and Tab standing
for a line break and a tab); a line break always splits, so a column copied from a spreadsheet
is one tag per line. A paste lands at the caret, so text already typed in the box joins the list
rather than being thrown away. An unfinished tag is committed on blur. An Enter that confirms an
IME composition does not end the tag, so a Japanese or Chinese word is not cut in half.

`defaultValue` makes it uncontrolled. `name` renders one hidden input per tag, so the server
reads them with `formData.getAll(name)`. Inside a `Field` the label names the text box — which
is why an `aria-label` does not belong there.

### ColorInput

```tsx
<ColorInput value={colour} onValueChange={setColour} />
<ColorInput value={colour} onValueChange={setColour} swatches={[]} />
```

The swatch is a real `<input type="color">` — the OS picker is better than anything worth
reimplementing — with a hex field beside it, because a brand colour arrives as text from a
design file far more often than it is chosen by eye. `normalizeHex()` is exported: it expands
`#abc` and returns `null` for anything that is not a hex colour.

Controlled with `value`, or uncontrolled with `defaultValue` (black when neither is given).
`value=""` is no colour: the swatch shows its empty state and `name` submits `''`; otherwise
`name` submits the normalised `#rrggbb`.

### RatingInput

```tsx
<RatingInput value={rating} onValueChange={setRating} />
<RatingInput value={4.5} allowHalf readOnly caption="4.5 · 212 reviews" />
```

A `slider` under the surface, which is where the keyboard comes from: arrows move by one (or
a half), Home and End jump to the ends, and the value is announced as "3 of 5 stars" rather
than as an unlabelled button press. The filled star is the same glyph clipped to a fraction,
so a half needs no second icon.

Controlled or uncontrolled (`defaultValue`), with `name` submitting the number through a hidden
input. Inside a `Field` the slider is named by the label through `aria-labelledby`.

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
`yyyy-mm-dd`, `HH:mm` and `yyyy-mm-ddTHH:mm` (the `IsoDate`, `IsoTime` and `IsoDateTime`
types), with `toIso`/`fromIso`, `toTime`/`fromTime`, `formatTime` and
`splitDateTime`/`joinDateTime` exported to move between them. Do not pass the output of
`toISOString()`: that is UTC, and moves the day by one for half the planet every evening —
`toIso(date)` reads the local parts instead. Seconds are accepted on the way in and dropped.
`fromIso('2026-02-31')` is `null`, not 3 March.

`DateTimeField`'s `defaultTime` (`'09:00'` unless set) is the time a day gets when it is picked
before any time is, and the time the clock opens on — so what the dial shows is what is stored.
A time picked before a day lands on today.

`label` is optional. It names the field when it stands alone (without it the trigger is just
"Date", "Time" or "Date and time"). Inside a `Field`, leave it out: the trigger is then named by
the field's label together with the value it shows ("Service date 12 Mar 2026"), where a `label`
would override the visible one with a second name.

```tsx
<Field label="Service date" error={errors.date}>
  <DateField value={date} onChange={setDate} />
</Field>
```

All three read a surrounding `Field` (id, description, invalid, disabled, required) and forward
their ref to the trigger button. `id` overrides the field's; `onBlur` fires when the trigger
loses focus, which is where a form library records "touched"; `name` submits the string through
a hidden input. `required` only sets `aria-required` — a hidden input cannot be validated by
the browser, so it does not block submission; validate it yourself.

In the calendar, days outside `min`/`max` are `aria-disabled` rather than `disabled`, so the
arrow keys move through them instead of stalling, and the grid keeps its one tab stop on a day
that is on screen after the month buttons move the view. The "Last 7 days" preset in
`DATE_RANGE_PRESETS` counts calendar days, so a daylight-saving change does not land it a day
out.

### ImageUpload

```tsx
<ImageUpload value={photos} onValueChange={setPhotos} maxFiles={4} maxSize={5_000_000} />
<ImageUpload multiple={false} shape="circle" />
```

[`FileUpload`](#fileupload) is right for documents; images want the picture rather than the
filename, since `screenshot-2024-11-03-final-v2.png` tells nobody which screenshot it is. A
grid of removable thumbnails with the add tile last, and the whole grid is the drop target.

Previews are object URLs, revoked when their item leaves the value — by the remove button, or
by a parent that replaces the list. A `FileReader` preview holds every image in memory as base64
for the life of the page, which is how an upload form quietly costs 200 MB. Only URLs the
component created are revoked: an item may carry a remote `url` instead of a `file`, for images
already on the server, and that is never touched.

On unmount the URLs go only if the field is uncontrolled. A controlled parent that keeps its
items across an unmount and remount (a tab switch, a wizard step) still has working thumbnails;
one that discards such items itself releases them with `URL.revokeObjectURL(item.url)`.

Drops are checked against `accept` as well as the picker, so `accept="image/png"` refuses a
dropped JPEG with `onFileRejected(file, 'type')`. `name` mirrors the new files (not remote
items) into a hidden file input, as `FileUpload` does.

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

Dialogs are portalled — into the provider's own wrapper in the default `local` scope, and into
`<body>` in `scope="global"`, where the tokens are on `<html>` — so they are themed in either.
The same goes for `Sheet`, `AlertDialog`, `Popover`, `DropdownMenu`, `HoverCard`, `Tooltip` and
`Select`. For a Radix portal of your own, pass `usePortalContainer()` as its `container`.

On close, focus goes back to the element that opened the dialog — or to the menu's trigger when
it was opened from a `DropdownMenuItem`, which has unmounted by then. That holds for a controlled
dialog with no `DialogTrigger` and for `ConfirmDialog`, which would otherwise leave focus on
`<body>`, and for `Sheet` and `AlertDialog` alike. To send it elsewhere, pass `onCloseAutoFocus`
and call `event.preventDefault()`.

In development, a `Dialog`, `Sheet` or `AlertDialog` panel with no title and no `aria-label` logs
a console warning, since a screen reader would announce only "dialog". To keep a title off
screen, wrap it in `VisuallyHidden`. `DialogHeader`, `DialogBody`, `DialogFooter` and the sheet
and alert-dialog headers and footers forward their refs.

### AlertDialog

A dialog that must be answered: the close button and outside-click dismissal are both
removed, because "clicked somewhere else" is not an answer to "delete this permanently?".

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
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
</AlertDialog>
```

Your own `onPointerDownOutside` or `onInteractOutside` runs first, and the guard still applies
after it, so a handler added for logging does not bring back dismiss-by-outside-click.

### Sheet, Popover, HoverCard, DropdownMenu, Tooltip

```tsx
<SheetContent side="right">…</SheetContent>   {/* top · right · bottom · left */}
```

`Sheet` is built on the dialog primitive rather than being its own thing: a sheet has exactly
a dialog's semantics — modal, focus-trapped, escape-dismissable — and differs only in where
it comes from.

Reach for a **popover** when the content is interactive and should take focus, and a **hover
card** when it is a preview. `PopoverAnchor` positions the panel against something other than
the trigger.

**Menus** are composed from parts: `DropdownMenuItem` (with `destructive`),
`DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup` and `DropdownMenuRadioItem` for a
one-of-n choice, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`, and
`DropdownMenuSub` with `DropdownMenuSubTrigger` (which draws its own chevron) and
`DropdownMenuSubContent` for a submenu.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">View</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
      <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="amount">Amount</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onSelect={exportCsv}>CSV</DropdownMenuItem>
        <DropdownMenuItem onSelect={exportPdf}>PDF</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

`Select` groups its options the same way, with `SelectGroup` and `SelectLabel`.

**Tooltips** are a convenience only: every control that carries one also has an accessible
name of its own, so nothing is lost on touch.

```tsx
<Tooltip content="Archive">
  <Button size="icon" aria-label="Archive"><ArchiveIcon /></Button>
</Tooltip>

<Tooltip content="Only owners can delete jobs">
  <span tabIndex={0}>
    <Button disabled>Delete</Button>
  </span>
</Tooltip>
```

A `Tooltip` works without a `TooltipProvider`; under one it inherits the shared
`delayDuration` and skip-delay, so moving between tooltips does not wait again. It also takes
`side`, `align`, `sideOffset`, `delayDuration` and, for a controlled one, `open`, `defaultOpen`
and `onOpenChange`. An empty `content` renders only the trigger. The child must accept a ref
and spread props onto its element — every kit control does. A disabled button gets no pointer
events, so a tooltip explaining _why_ it is disabled goes on a focusable `<span tabIndex={0}>`
wrapped around it.

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

`containerClassName` and `containerProps` (a `ref` included) reach that scrolling wrapper. A
table wider than its column needs its scroll region reachable from the keyboard:

```tsx
<Table containerProps={{ tabIndex: 0, role: 'region', 'aria-label': 'Invoices' }}>…</Table>
```

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
`<button>` rather than putting a handler on a `<div>`, and everything inside it — `chart`
included — is then phrasing content, the only kind a button may hold. `chart` renders
full-bleed under the figure.

### MetricTile, MetricGrid

```tsx
<MetricGrid columns={2}>
  <MetricTile label="Total requests" value={49} />
  <MetricTile label="New (30d)" value={48} delta="+6" trend="up" tone="success" />
  <MetricTile label="Average time to accept" value="2.4 days" span="full" />
</MetricGrid>
```

The headline figures _inside_ a card. `StatsCard` is a card of its own and would put a box in a
box here, so a tile is filled rather than bordered. `tone` paints an accent rule on the leading
edge; `span="full"` takes the whole row; `loading` swaps the figure for a placeholder.
`columns` is `1`–`4` (one column on a phone-width screen) or `auto`.

### BreakdownList

```tsx
<BreakdownList
  title="By status"
  items={[
    { key: 'pending', label: 'Pending', value: 2, tone: 'info' },
    { key: 'rejected', label: 'Rejected', value: 0, tone: 'destructive' },
    { key: 'converted', label: 'Converted', value: 47, tone: 'success' },
  ]}
  showShare
  showPercent
/>
```

A count per bucket: dot, label, figure. A zero still renders, stepped back — "none rejected"
is information, and a row that vanishes at zero shifts the layout every time it returns.
`showShare` draws a bar under each row (clamped to 100%, so a `total` smaller than the sum
cannot overflow it), `showPercent` prints the share, `showSummary` puts a
`SegmentedBar` of the whole distribution on top. `total` overrides the sum; `formatValue`
renders the figures; `empty` is the inline line shown when `items` is empty; `loading` shows
placeholder rows. An item's `key` is optional; without one the row is keyed by position, not by
label.

### SummaryCard

```tsx
<SummaryCard
  icon={<TicketIcon />}
  iconTone="info"
  title="Support queue"
  description="Tickets raised by customers and crews"
  metrics={[
    { label: 'Total tickets', value: 87 },
    { label: 'New (7d)', value: 12 },
  ]}
  breakdown={ticketsByStatus}
  breakdownProps={{ showSummary: true }}
/>
```

The dashboard block every module ends up with, assembled from `CardIcon`, `MetricTile` and
`BreakdownList`. A card that outgrows the props is recomposed from those same exported parts
rather than rebuilt. `loading` puts every figure and row into its placeholder state; `action`,
`footer` and `children` fill the usual slots. `titleAs` picks the title's heading level, as
`as` does on `CardTitle`.

### StatusFlow

```tsx
<StatusFlow
  type="quote"
  label="Quote lifecycle"
  steps={['draft', 'sent', 'seen', 'accepted']}
  alternates={['changes_requested', 'rejected']}
/>

<StatusFlow type="quote" steps={['draft', 'sent', 'seen', 'accepted']} current={2} />

<StatusFlow
  type="quote"
  steps={['draft', 'sent', 'seen', 'accepted']}
  alternates={['changes_requested', 'rejected']}
  current="rejected"
  reached="seen"
/>
```

A lifecycle drawn with `StatusBadge`'s vocabulary — `type` and `statuses` resolve exactly as
they do on the badge — so the documentation of a workflow cannot drift from its chips. Steps
may also be `{ status, label?, tone? }`. With `current` it becomes a tracker: earlier steps get
a check, the current one a ring and `aria-current="step"`, later ones are outlined. Arrows
belong to the chip before them, so a wrapped flow never opens a line on an arrow. A status may
appear more than once — `sent → changes_requested → sent` is a real lifecycle.

`current` takes an index or a status. A status may name one of the `alternates` — a quote that
is sitting in "rejected" — and that chip becomes the current one. `reached`, an index or a
status, then says how far the main path got before the record left it; it defaults to every
step but the last, since an alternate usually stands in for the final outcome.

### StepCard

```tsx
<StepCard
  step={1}
  title="Quote request"
  description="The customer asks for a price."
  condition="A quote is created from it."
>
  <StatusFlow type="quoteRequest" steps={['pending', 'quote_created', 'quote_sent']} />
</StepCard>

<StepCard step={2} state="current" title="Compliance review" />
```

One stage of a process and the rule that ends it. The condition footer is pinned to the
bottom, so a row of steps lines their rules up whatever the copy length; `conditionLabel`
changes its lead-in (default `Moves on when:`). `state` — `upcoming` · `current` · `done` —
turns the number into a marker for tracking a live record. `titleAs` picks the title's heading
level (default `div`).

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
app does not deliver. So it is a set of buttons, the current one marked `aria-current="page"`,
and the arrow-key behaviour of real tabs is deliberately absent. Without `value` or
`defaultValue` the first tab is current. `appearance`: `underline` (sections) · `pills` (a
filter).

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

`onSearch` is called once per settled query (after `searchDebounce`, 250 ms) while the list is
open, through a stable callback — an inline `(query) => fetchRegions(query)` is fine and does
not re-fire on every parent render. An option you picked stays in the trigger after a later
search drops it from `options`. For a value that arrives from outside — a saved record shown
before async options load — pass `selectedOption` (`selectedOptions` on the multi variant) to
label it; it labels the trigger only and is not added to the list. A value no option describes
shows as its raw value, never as the placeholder, since the field is not empty.

```tsx
<Combobox
  options={results}
  value={record.regionId}
  selectedOption={record.region}
  onSearch={search}
/>
```

Both are controlled when `value` is defined — `null` and `[]` are their empty selections — and
uncontrolled with `defaultValue`. The trigger is a button, so `name` puts the value in a
hidden input for a native form — `MultiCombobox` submits one entry per selected value, read with
`formData.getAll(name)`. With `clearable`, Backspace or Delete on the focused trigger clears it,
the keyboard's way to the ✕.

The multi variant keeps the list open while you pick, and renders selections as removable
chips (`maxChips`, default 3, then a `+n`): removing one is the thing people actually want, and
a comma-joined string makes them clear the field and start again.

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

The styled drop zone is a label for a real `<input type="file">`, so the keyboard and the OS
picker work. Validation happens here; _reporting_ it does not — the component rejects a file
and tells you why, and you decide whether that is a toast, an inline error or nothing.
`UploadItem.progress` drives a bar per file for a real upload.

The visible input is emptied after every pick, so it never carries the selection into a form.
Pass `name` and the selection is mirrored into a hidden file input of that name, so a native
submission — a server action, a plain POST — receives the files; that needs a constructible
`DataTransfer`, which every current browser has. A form reset does not clear the component's
React state: clear `value` yourself, or remount an uncontrolled one with a new `key`. Without `multiple`, a second pick replaces the file rather
than being refused. A disabled `Field` disables it.

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
interrupting someone for is worth an explicit answer. It is always parent-controlled: `open`
and `onOpenChange` are required. Actions may be async — any thenable, not only a native
`Promise`: the dialog holds itself open, disables every other choice and shows the pending one
with a spinner and `aria-busy`, which is what stops the double-submit a hand-rolled confirm
eventually allows. While it is pending, Escape, cancel and outside clicks are ignored, and a
double-click runs the action once. Pass `actions` for more than two choices; `keepOpen` on one
leaves the dialog up after it runs.

If an action throws or rejects, `onError(error, action)` hears about it and the dialog stays
open with every choice enabled again, so the person can retry or cancel. Without `onError` the
error is rethrown, as an unhandled rejection.

### CopyButton, HoldButton

```tsx
<CopyButton value={invoice.id} />
<CopyButton value={user.email} variant="outline">Copy email</CopyButton>

<HoldButton onHoldComplete={destroy} holdingLabel="Keep holding…">Hold to delete</HoldButton>
```

The tick is the whole point of the copy button: without feedback, people press it twice. Your
own `onClick` runs first and composes with the copy rather than replacing it (call
`event.preventDefault()` to skip the copy). Where the async clipboard is missing or refused — a
plain-HTTP origin, an iframe without `clipboard-write` — it falls back to
`document.execCommand('copy')`. If both fail the label stays put and `onCopyError(error)` is
the only place the failure surfaces.

`HoldButton` is the alternative to a dialog for something destructive but not rare — the
friction is in the gesture rather than in a second screen, so an operator doing this fifty
times a day is not asked fifty questions. Space and Enter stand in for a hold on a keyboard,
and a held key fires once, not again on auto-repeat. Only the primary pointer button arms it,
so a right-click cannot. Your pointer, key and blur handlers and your `style` are composed
with its own.

A screen reader in browse mode and voice control activate a button with a bare click — nothing
goes down, so there is nothing to hold. A click with no press behind it opens a `ConfirmDialog`
instead, and confirming runs `onHoldComplete`: the friction survives, in the one form those
users can get through. `confirmTitle` defaults to the label as a question ("Delete?" for "Hold to
delete") and `confirmLabel` to its verb ("Delete"); a label that is not plain text falls back to
"Are you sure?" and "Confirm". `confirmDescription` adds a line. `instructions` is the
description exposed through `aria-describedby` — by default, that it can be held, or activated
and confirmed. `confirmOnClick={false}` ignores such clicks, as the button used to.

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
preview pane, a test — get two independent stacks. `useToast` and `Toaster` throw outside a
`ToastProvider` rather than failing silently. Reuse an `id` to replace a toast in place, keeping
its position — a "Saving…" that becomes "Saved". `duration: 0` keeps one up until it is
dismissed.

Hovering or focusing any toast pauses every timer, and each resumes with the time it had left,
so a message cannot vanish while someone is reading it or reaching for its action. The context
exposes the same `pause()` and `resume()` for a custom stack, which should call them too.

`Toaster` renders inline rather than through a portal, so it stays inside whatever scope the
provider painted; a portalled stack would escape a scoped `UIKitProvider` and come out in the
default palette. The region is an `aria-live="polite"` region, mounted before any toast
arrives so the first one is announced — and a toast never steals focus.

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

## Dashboard sidebar

```tsx
const NAV: SidebarNavEntry[] = [
  {
    type: 'section',
    id: 'ops',
    label: 'Operations',
    icon: <BriefcaseIcon />,
    tone: 'success',
    items: [
      { id: 'status', label: 'Status guide', href: '/status', icon: <HelpIcon /> },
      {
        id: 'residential',
        label: 'Residential',
        icon: <HomeIcon />,
        children: [
          { id: 'quotes', label: 'Quotes', href: '/residential/quotes', badge: 3 },
          {
            id: 'orders',
            label: 'Orders',
            href: '/residential/orders',
            children: [{ id: 'archive', label: 'Archive', href: '/residential/orders/archive' }],
          },
        ],
      },
    ],
  },
  { type: 'separator' },
  { id: 'help', label: 'Help centre', href: 'https://help.example.com', external: true },
]

<SidebarProvider storageKey="admin-nav" shortcut="b">
  <AppShell>
    <Sidebar
      header={<SidebarBrand logo={<Logo />} name="Acme" description="Operations" menu={workspaces} />}
      footer={<SidebarUser name={me.name} description={me.email} menu={accountMenu} />}
    >
      <SidebarNav
        items={NAV}
        currentPath={pathname}
        searchable
        renderLink={({ href, ...props }) => <Link to={href} {...props} />}
      />
    </Sidebar>

    <AppShellHeader start={<SidebarTrigger />} />
    <AppShellContent id="main">…</AppShellContent>
  </AppShell>
</SidebarProvider>
```

`AppShellSidebar` is a frame around a flat list; `Sidebar` is the navigation an admin console
actually has. There is no depth limit: an item with `children` is a branch, and its children can
have children. Each level indents to the centre of its parent's icon along a guide line, so a
deep tree stays readable.

**The current page.** Pass `activeId`, or `currentPath` and the item with the matching — or
longest enclosing — `href` lights up, so `/residential/orders/1042` marks "Orders". The branches
above it open by themselves, once; the user can still close them. `getSidebarTrail(items, id)`
returns the same chain for a breadcrumb or a page title. `matchSidebarPath(items, path)` is the
matcher on its own: it accepts a full URL (`https://app.test/orders/?page=2` is `/orders`),
treats a hash route (`#/orders`) as a path, and ignores `href`s such as `#` or `?tab=2` that
name no path and would otherwise match every page.

**Branches.** A branch without an `href` is a button that opens it. A branch with one is a link
with its own open/close button beside it. `accordion` closes siblings when one opens;
`expanded` / `defaultExpanded` / `onExpandedChange` take the open branches by id.

**Sections** take a `label`, an `icon` and a `tone` (the six status tones or `chart-1` …
`chart-5`), which colours the icon — one hue per product area. `collapsible` makes the heading a
button; `action` puts a control at its end.

**Items** take `icon`, `badge` (with `badgeTone`), `disabled`, `external`, `keywords` for search,
and `actions` — controls revealed on hover and focus, such as a "+" to create one.

**The rail.** `SidebarTrigger`, `collapsed` or the opt-in ⌘/Ctrl shortcut narrows the sidebar to
icons. Labels are hidden visually, not removed, so the links keep their accessible names. Leaves
show their label as a tooltip, branches open their subtree in a flyout, badges become a dot, and
the branch holding the current page is highlighted in its place. In the rail a branch's row is
the flyout's trigger, so a branch that is also a page (it has an `href`) lists that page first
in its flyout.

**Search.** `searchable` puts a filter above the tree. It keeps matching items and their
ancestors, opens those ancestors, highlights the match and says so when nothing matches. A
matching branch keeps everything under it. Escape clears it.

**Keyboard.** Tab works as usual. ↑/↓ step through the visible items, → opens a branch or enters
it, ← closes it or goes up to the parent, and Home/End jump to either end. Right and left swap in
RTL.

**Phones.** Below `mobileBreakpoint` (default `48rem`; `false` to disable) the sidebar leaves the
grid and becomes an off-canvas drawer with a backdrop. The same `SidebarTrigger` opens it.
While open it is a modal dialog (`role="dialog"`, `aria-modal`) named by the sidebar's
`aria-label`, else its `SidebarBrand`'s name, else "Navigation". The rest of the page is inert
and the body does not scroll, and both are restored when it closes. Focus moves into it and Tab
wraps inside it. Escape, the backdrop or choosing a destination closes it, and focus goes back
to the trigger. As a column the panel is a `<div role="complementary">`, named "Sidebar" by
default, rather than an `<aside>`: the element never changes, because an `<aside>` cannot take
the dialog role, and swapping it would remount the contents.

**State.** `SidebarProvider` shares the rail and drawer state with controls outside the sidebar.
A `Sidebar` without one makes its own. `storageKey` remembers the rail and the open branches in
`localStorage`; `useSidebar()` reads it all, including the `mobileBreakpoint` in force.

**Server rendering.** The server has neither `localStorage` nor a viewport. Remembered state is
read once the page has hydrated, so the server HTML and the first client render agree and the
stored rail state and open branches apply one commit later. Server HTML is the desktop column,
yet a phone sees the closed drawer from the first paint at any breakpoint: the default `48rem`
is in the stylesheet, and a custom `mobileBreakpoint` is server-rendered as a small `<style>`
scoped to the sidebar, carrying the provider's `nonce`.

**Routers.** `renderLink` receives every prop the default `<a>` would have had, so a router's
link drops in without losing the active state or the keyboard handling. It must forward its ref
to the `<a>` — the rail's tooltips and flyouts position against it. Next.js's `Link` and React
Router's `Link` both do.

```tsx
// Next.js (App Router)
const pathname = usePathname()
<SidebarNav items={NAV} currentPath={pathname} renderLink={(props) => <Link {...props} />} />

// React Router
const { pathname } = useLocation()
<SidebarNav
  items={NAV}
  currentPath={pathname}
  renderLink={({ href, ...props }) => <Link to={href} {...props} />}
/>
```

**By hand.** `SidebarSection` and `SidebarMenuItem` are the parts `SidebarNav` renders with.
Nest `SidebarMenuItem`s as `children` to any depth and put anything you like between them. An
item keeps its own open state, or the nav's when you give it a `value`.

```tsx
<SidebarNav>
  <SidebarSection label="Marketing" icon={<TargetIcon />} tone="chart-4" collapsible>
    <SidebarMenuItem label="Campaigns" icon={<MailIcon />} defaultExpanded>
      <SidebarMenuItem label="Email" href="/campaigns/email" active />
      <SidebarMenuItem label="SMS" href="/campaigns/sms" badge="New" badgeTone="success" />
    </SidebarMenuItem>
  </SidebarSection>
</SidebarNav>
```

`appearance="primary"` tints the current page with the project's primary colour instead of the
neutral fill; `width`, `railWidth` and `--sui-sidebar-indent` adjust the geometry. Everything
paints from `--sui-sidebar*`, and flyouts switch to the popover tokens because they sit on a
different surface.

---

## Charts

See [charts](./charts.md). The dependency-free `LineChart`, `BarChart` and `PieChart` take
`ariaLabel` for their accessible name (a summary is generated when it is omitted), and a `null`
in a line or bar series is a gap, not a zero.

## Data table

See [quick start](../guide/quick-start.md) and the table pages listed in the [README](../../README.md).

## Theming controls

`<ProjectSwitcher />`, `<ColorModeToggle />`, `<ProjectEditor />` and `<TokenSwatchGrid />`
ship with the kit so an application can expose project switching and editing without
rebuilding that UI. See [Projects](../guide/projects.md).

`ColorModeToggle` and the preset picker in `ProjectEditor` are radio groups with a single tab
stop: the arrows move and select, wrapping at the ends (left and right swap in right-to-left),
and Home and End jump to either end.

On `UIKitProvider` itself, `className` and `style` go on the wrapper in the default `local`
scope. `scope="global"` has no wrapper, so `className` is added to `<html>` and `style` is set
on it property by property; both are removed on unmount, and a class the app had already set is
left alone. With nested global providers, the innermost one's apply. A server render in global
scope carries the tokens, and `style`, in an inline `<style>` so the first paint is already
themed; `className` arrives at hydration. Local scope with `mode="system"` does the same with a
`<style>` scoped to its wrapper, holding both palettes, so a dark-OS reader sees no light flash.
Pass your Content-Security-Policy nonce as `nonce` if the policy forbids inline styles without
one; it covers both sheets and the sidebar's custom-breakpoint style.

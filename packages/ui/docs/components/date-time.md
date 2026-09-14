# Date and time

Pickers and fields for calendar days and times of day: a month grid (`Calendar`), a clock face
(`Clock`), a typed time (`TimeInput`), and three form fields built from them (`DateField`,
`TimeField`, `DateTimeField`). The appearance comes from the theme tokens, not from the browser.
Values are plain strings with no time zone.

```tsx
import {
  Calendar,
  Clock,
  DateField,
  DateTimeField,
  TimeField,
  TimeInput,
} from '@shining-technologies/ui' // or '@shining-technologies/ui/date-time'
```

**Server and client.** All six components (`Calendar`, `Clock`, `TimeInput`, `DateField`,
`TimeField`, `DateTimeField`) are client components (`'use client'`). They take an `onChange`
function, so you render them from a client component. The helper functions (`toIso`, `fromIso`,
`fromTime`, `toTime`, `formatTime`, `splitDateTime`, `joinDateTime`), `DATE_RANGE_PRESETS` and the
value types come from a module without the directive, so they can also be called in Server
Components and route handlers. See [SSR and hydration](#ssr-and-hydration).

## Value formats and time zones

| Type          | Format             | Example              | Used by                                         |
| ------------- | ------------------ | -------------------- | ----------------------------------------------- |
| `IsoDate`     | `yyyy-mm-dd`       | `'2026-03-12'`       | `Calendar`, `DateField`, `min`/`max` everywhere |
| `IsoTime`     | `HH:mm`, 24-hour   | `'09:30'`, `'17:05'` | `Clock`, `TimeInput`, `TimeField`               |
| `IsoDateTime` | `yyyy-mm-ddTHH:mm` | `'2026-03-12T09:30'` | `DateTimeField`                                 |

All three are `string` aliases. No component accepts or returns a `Date`.

- **No time zone.** A value is a wall-clock reading: the day and time the user picked on their own
  calendar. There is no offset and no `Z`. `'2026-03-12T09:30'` means 9:30 on 12 March wherever
  the value is later read.
- **Local time only.** Parsing and formatting use the local parts of a `Date` (`getFullYear`,
  `getMonth`, `getDate`), never UTC. "Today", "Now" and the presets use the clock and time zone of
  the runtime they run in, which is the browser.
- **Invalid input is treated as empty.** A value that does not parse, such as `'2026-02-31'`,
  `'25:00'` or `'12/03/2026'`, is ignored: the field shows its placeholder and the calendar shows no
  selection. Nothing is thrown and `onChange` is not called.
- **Seconds.** `DateTimeField` accepts `'2026-03-12T09:30:59'` and drops the seconds. `Clock`,
  `TimeInput` and `TimeField` do not accept seconds; `'09:30:00'` is invalid for them.
- **Single-digit hours.** `fromTime` also accepts `'9:30'`. Every value the components emit is
  zero-padded (`'09:30'`).

To turn a value into an instant, build the `Date` from its local parts:

```ts
new Date('2026-03-12T09:30') // date and time without an offset: parsed as local time
fromIso('2026-03-12') // local midnight, or null if the day does not exist

// Avoid these:
new Date('2026-03-12') // a date-only string is parsed as UTC midnight
someDate.toISOString().slice(0, 10) // converts to UTC first, so the day can shift by one
```

If your server stores UTC instants, convert in the browser, where the user's time zone is known.
Alternatively, send the wall-clock string together with the user's IANA time zone.

## Calendar

A month grid that follows the ARIA grid pattern. It has one tab stop, and the arrow keys move
between days. `DateField` and `DateTimeField` use it inside their popovers, and you can render it
inline.

```tsx
'use client'

import { useState } from 'react'
import { Calendar } from '@shining-technologies/ui'

export function DeliveryDay() {
  const [day, setDay] = useState<string>()
  return (
    <Calendar
      value={day}
      onChange={setDay}
      min="2026-03-01"
      max="2026-06-30"
      label="Delivery date"
      locale="en-AU"
    />
  )
}
```

| Prop           | Type                      | Default           | Description                                                                                   |
| -------------- | ------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `value`        | `IsoDate`                 | —                 | The selected day. An invalid string counts as no selection.                                   |
| `onChange`     | `(value: IsoDate) => void` | —                | Required. Called with the day that was clicked or activated with Enter or Space.              |
| `min`          | `IsoDate`                 | —                 | Days before this one cannot be chosen. `min` itself can be chosen.                            |
| `max`          | `IsoDate`                 | —                 | Days after this one cannot be chosen. `max` itself can be chosen.                             |
| `label`        | `string`                  | `'Choose a date'` | Accessible name of the grid. Ignored when `aria-labelledby` is set.                           |
| `aria-labelledby` | `string`               | —                 | Id(s) of the element(s) that name the grid, such as a visible label elsewhere on the page.   |
| `locale`       | `string`                  | `'en-US'`         | BCP 47 locale for the month caption, weekday names and day labels.                            |
| `weekStartsOn` | `0 \| 1`                  | `1`               | `1` starts weeks on Monday, `0` on Sunday.                                                    |
| `className`    | `string`                  | —                 | Added to the root `div`.                                                                      |

No other props are accepted. The root does not take `<div>` attributes and has no ref.

**Controlled only.** `Calendar` does not store the selection. It highlights `value` and reports
clicks through `onChange`. Without a `value`, nothing is shown as selected.

**Visible month.** The grid opens on the month of `value`, or on the current month when there is
none. If `value` changes while the grid is mounted, the grid moves to the new month. The grid is
always six weeks (42 days). Days from the neighbouring months are shown and can be chosen. The
Previous month and Next month buttons are not limited by `min` or `max`.

**Out-of-range days** get `aria-disabled="true"` rather than `disabled`. They can still receive
focus, so the arrow keys can move past them, but clicking one does nothing.

**Keyboard** (focus on a day):

| Key                    | Action                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Arrow Left / Right     | Previous / next day                                                                    |
| Arrow Up / Down        | Same weekday in the previous / next week                                               |
| Home / End             | First / last day of the week, according to `weekStartsOn`                              |
| Page Up / Page Down    | Same day in the previous / next month, clamped to the month length (31 Jan → 28 Feb)  |
| Enter / Space          | Choose the focused day                                                                 |
| Tab                    | Leave the grid. The grid has one tab stop.                                             |

Moving focus into another month changes the visible month. The tab stop is chosen in this order:
the day that last had focus, the selected day, today, then the first day of the visible month that
can be chosen. If `min`/`max` rule out the whole month, the tab stop is a disabled day in that
month.

**Styling hooks.** The elements are `.sui-calendar`, `.sui-calendar__head`, `.sui-calendar__nav`,
`.sui-calendar__caption` (an `aria-live="polite"` region, so month changes are announced),
`.sui-calendar__grid`, `.sui-calendar__weekdays`, `.sui-calendar__week` and `.sui-calendar__day`.
Each day button has `data-day="yyyy-mm-dd"` and, when they apply, `data-outside`, `data-today`,
`data-selected`, `data-disabled` and `aria-disabled="true"`.

## Clock

A clock face for picking a time. You pick the hour, the dial switches to minutes, and you pick the
minute. The hour and minute digits in the header are spinbuttons, so the whole control also works
from the keyboard. `TimeField` uses it inside its popover.

```tsx
'use client'

import { useState } from 'react'
import { Clock } from '@shining-technologies/ui'

export function PickupTime() {
  const [time, setTime] = useState('09:00')
  return <Clock value={time} onChange={setTime} label="Pickup time" minuteStep={15} />
}
```

| Prop         | Type                       | Default           | Description                                                                                         |
| ------------ | -------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `value`      | `IsoTime`                  | —                 | The current time. If it is missing or invalid, the face shows 12:00 (PM) but does not emit it.    |
| `onChange`   | `(value: IsoTime) => void` | —                 | Required. Called on every change: an hour pick, a minute pick, AM/PM, or an arrow key.            |
| `minuteStep` | `number`                   | `1`               | The minute step. The arrow keys snap to it, and the minute dial offers only minutes that are multiples of both 5 and the step. A value below 1 or not a number is treated as `1`. |
| `hour12`     | `boolean`                  | `true`            | `true`: a 12-hour dial and an AM/PM switch. `false`: a 24-hour dial with two rings (00–11 outer, 12–23 inner). |
| `label`      | `string`                   | `'Choose a time'` | Accessible name of the dial group. Ignored when `aria-labelledby` is set.                          |
| `aria-labelledby` | `string`              | —                 | Id(s) of the element(s) that name the dial group.                                                   |
| `onDone`     | `(value: IsoTime) => void` | —                 | Called after a minute is picked on the dial, after `onChange`. `TimeField` closes its popover here. |
| `className`  | `string`                   | —                 | Added to the root `div`.                                                                            |

No other props are accepted. `Clock` has no ref.

**Behaviour.**

- `Clock` is controlled. The only internal state is which dial is showing (hours or minutes). It
  starts on hours, switches to minutes after an hour is picked, and changes when you click the Hour
  or Minute digit.
- On a 12-hour dial, the hour is interpreted using the current AM/PM setting: 12 in AM is `00`,
  12 in PM is `12`. The AM and PM toggles add or subtract 12 hours.
- Arrow Up or Right increases the focused spinbutton, and Arrow Down or Left decreases it. Hours
  move by 1 and wrap from 23 to 00. Minutes first snap to the `minuteStep` grid, then move by one
  step: with a step of 15, 09:07 goes up to 09:15 and down to 09:00. Minutes carry into the hour and
  wrap past midnight.
- The minute dial shows the minutes that are multiples of both 5 and `minuteStep`, each at its true
  position on the face. A step of 1 or 5 gives 12 marks, 2 gives 6 (every ten minutes), and 15 gives
  4. Other minutes are reachable only from the Minute spinbutton.

**Styling hooks.** The root is `.sui-clock` with `data-mode="hour" | "minute"`. Parts:
`.sui-clock__head`, `.sui-clock__time`, `.sui-clock__digit` (`data-active`), `.sui-clock__colon`,
`.sui-clock__meridiem`, `.sui-clock__period` (`data-active`, `aria-pressed`), `.sui-clock__dial`,
`.sui-clock__hand` (`data-short` on the inner 24-hour ring), `.sui-clock__centre` and
`.sui-clock__mark` (`data-selected`, `data-inner`). With `prefers-reduced-motion: reduce`, the
hand moves without a transition.

## TimeInput

A typed time field: an hour segment, a minute segment and an optional AM/PM switch in one field
box. It has the shape of `<input type="time">` but is drawn from tokens. `DateTimeField` uses it
under its calendar. Use it on its own when typing a time is quicker than dialling one.

```tsx
'use client'

import { useState } from 'react'
import { Field, TimeInput } from '@shining-technologies/ui'

export function ShiftStart() {
  const [start, setStart] = useState<string>()
  return (
    <Field label="Shift starts" description="Local time at the site">
      <TimeInput value={start} onChange={setStart} minuteStep={15} />
    </Field>
  )
}
```

| Prop         | Type                       | Default | Description                                                                                      |
| ------------ | -------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `value`      | `IsoTime \| undefined`     | —       | Required prop; pass `undefined` for empty. Empty segments show `--`.                            |
| `onChange`   | `(value: IsoTime) => void` | —       | Required. Called with a full `HH:mm` on every edit. The control never emits `undefined`.         |
| `hour12`     | `boolean`                  | `true`  | `true`: hours 01–12 and an AM/PM switch. `false`: hours 00–23.                                  |
| `minuteStep` | `number`                   | `1`     | How far the arrow keys move the minute. Typed minutes are kept exactly as typed.                 |
| `label`      | `string`                   | —       | Accessible name of the group. Leave it out inside a `<Field>`; the field's label is used.       |
| `aria-labelledby` | `string`              | —       | Id(s) of the element(s) that name the group, when the name is not the surrounding `<Field>`'s label. `label` takes precedence. |
| `icon`       | `boolean`                  | `true`  | Show the clock icon at the start of the box.                                                    |
| `disabled`   | `boolean`                  | —       | Disables the segments and AM/PM buttons. If not set, the value comes from a surrounding `<Field>`. |
| `id`         | `string`                   | —       | Put on the hour segment. Overrides the id a surrounding `<Field>` supplies.                    |
| `className`  | `string`                   | —       | Added to the root `div`.                                                                         |

The ref goes to the root `div` (`role="group"`). `TimeInput` has no `name` and renders no hidden
input, so it does not submit with a native form on its own.

**Keyboard** (focus in a segment):

| Key                | Action                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Digits             | Fill the segment. Focus moves to the minute once the hour cannot take another digit. On a 12-hour clock, `3` sets 03 and moves on; `1` sets 01 and waits in case a second digit follows. A digit that would overflow starts the segment again. |
| Arrow Up / Down    | Step the segment. The hour moves by 1 and wraps. The minute first snaps to the `minuteStep` grid (with a step of 5, 09:07 → 09:10), then carries into the hour. |
| Arrow Left / Right | Move between the hour and minute segments                                                                                                        |
| `a` / `p`          | Set AM / PM (12-hour only)                                                                                                                       |
| Backspace / Delete | Discard the digits typed so far. They do not clear the value.                                                                                   |

When the value is empty, typing into one segment fills the other with `00` (shown as 12 AM on a
12-hour clock). Choosing AM sets
`00:00` and choosing PM sets `12:00`. Each segment is a text input with `inputMode="numeric"`, so
phones show a digit keypad.

**Inside a `<Field>`**, the group is labelled by the field's label (`aria-labelledby`) and described
by its description and error. The hour segment takes the field's id. The field's error sets
`aria-invalid` on both segments. **Styling hooks:** `.sui-time-input`, `data-slot="time-input"`,
`data-disabled`, `data-invalid`, `.sui-time-input__icon`, `__segments`, `__segment`,
`__separator`, `__period` and `__period-option` (`data-active`, `aria-pressed`).

## DateField

A form field for a single day. The trigger is a button that shows the formatted date and opens a
popover containing a `Calendar`. It also has a clear button, and it can submit a hidden input with
a native form.

```tsx
'use client'

import { useState } from 'react'
import { DateField, Field } from '@shining-technologies/ui'

export function ServiceDate() {
  const [date, setDate] = useState<string>()
  return (
    <Field label="Service date" description="The day the crew arrives" required>
      <DateField value={date} onChange={setDate} name="serviceDate" min="2026-01-01" locale="en-AU" />
    </Field>
  )
}
```

| Prop          | Type                                     | Default         | Description                                                                                          |
| ------------- | ---------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `value`       | `IsoDate \| undefined`                   | —               | Required prop; pass `undefined` for empty.                                                           |
| `onChange`    | `(value: IsoDate \| undefined) => void`  | —               | Required. Called with the picked day, or `undefined` when the clear button is pressed.              |
| `placeholder` | `string`                                 | `'Pick a date'` | Shown when there is no valid value.                                                                  |
| `label`       | `string`                                 | —               | Accessible name. Leave it out inside a `<Field>`. Outside one, pass it: the control is a button, so `<label for>` alone does not describe its value. |
| `min`         | `IsoDate`                                | —               | Passed to the calendar.                                                                              |
| `max`         | `IsoDate`                                | —               | Passed to the calendar.                                                                              |
| `locale`      | `string`                                 | `'en-US'`       | Formats the trigger (`dateStyle: 'medium'`) and the calendar.                                       |
| `id`          | `string`                                 | —               | The trigger's id. Overrides the id a surrounding `<Field>` supplies.                               |
| `name`        | `string`                                 | —               | Renders `<input type="hidden" name={name}>` containing `yyyy-mm-dd`, or `''` when empty.            |
| `required`    | `boolean`                                | —               | Sets `aria-required` only. The hidden input is not validated by the browser. If not set, the value comes from a surrounding `<Field>`. |
| `onBlur`      | `FocusEventHandler<HTMLButtonElement>`   | —               | Called when the trigger loses focus. Use it to mark a form library field as touched.               |
| `disabled`    | `boolean`                                | —               | Disables the trigger, hides the clear button and disables the hidden input. If not set, the value comes from a surrounding `<Field>`. |
| `className`   | `string`                                 | —               | Added to the root `div`.                                                                             |

The ref goes to the trigger `<button>`.

**Behaviour.**

- Picking a day calls `onChange` and closes the popover.
- The clear button appears only when the value is a valid date (one the trigger can display) and
  the field is not disabled. `TimeField` and `DateTimeField` follow the same rule. Its name is
  `Clear <label>`, or `Clear Date` when no `label` is passed.
- `min` and `max` limit only what the calendar lets you pick. A `value` outside the range is still
  shown and submitted.
- The popover is a Radix Popover rendered in a portal (see [Overlay](overlay.md)). The trigger has
  the usual `aria-haspopup`/`aria-expanded` wiring, and Escape closes the popover.

**Accessible name.** An explicit `label` wins: the trigger's `aria-label` is `"<label>: <date>"`, or
just `"<label>"` when empty. Without `label` inside a `<Field>` that has a label, the trigger uses
`aria-labelledby` pointing at the field label and the displayed value. Without either, the name is
`"Date: <date>"` or `"Date"`. The calendar grid follows the same rule: it is named by `label`, by
the field's label (`aria-labelledby`) when there is no `label` inside a labelled `<Field>`, and
otherwise `Date`.

**Styling hooks:** `.sui-date-field` (`data-empty` when there is no value), `.sui-date-field__trigger`,
`.sui-date-field__icon`, `.sui-date-field__value`, `.sui-date-field__clear` and
`.sui-date-field__popover`.

## TimeField

A form field for a time of day. It works like `DateField`, with a `Clock` in the popover instead of
a calendar.

```tsx
'use client'

import { useState } from 'react'
import { Field, TimeField } from '@shining-technologies/ui'

export function Arrival() {
  const [time, setTime] = useState<string>()
  return (
    <Field label="Arrival">
      <TimeField value={time} onChange={setTime} minuteStep={15} name="arrival" />
    </Field>
  )
}
```

| Prop          | Type                                     | Default         | Description                                                                                 |
| ------------- | ---------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `value`       | `IsoTime \| undefined`                   | —               | Required prop; pass `undefined` for empty.                                                  |
| `onChange`    | `(value: IsoTime \| undefined) => void`  | —               | Required. Called on every change on the dial, and with `undefined` when cleared.            |
| `placeholder` | `string`                                 | `'Pick a time'` | Shown when there is no valid value.                                                         |
| `label`       | `string`                                 | —               | Accessible name. Same rules as `DateField`. The fallback word is `Time`.                   |
| `minuteStep`  | `number`                                 | `5`             | Passed to the clock (arrow-key step and dial marks). Also sets the rounding of **Now**.   |
| `hour12`      | `boolean`                                | `true`          | 12- or 24-hour dial. Also controls how the trigger text is formatted.                      |
| `locale`      | `string`                                 | `'en-US'`       | Formats the trigger text (`hour: 'numeric', minute: '2-digit'`).                            |
| `showNow`     | `boolean`                                | `true`          | Show a **Now** button above the dial.                                                       |
| `id`          | `string`                                 | —               | The trigger's id. Overrides the id a surrounding `<Field>` supplies.                       |
| `name`        | `string`                                 | —               | Renders a hidden input containing the value as passed (`HH:mm`), or `''`.                  |
| `required`    | `boolean`                                | —               | Sets `aria-required` only. If not set, the value comes from a surrounding `<Field>`.       |
| `onBlur`      | `FocusEventHandler<HTMLButtonElement>`   | —               | Called when the trigger loses focus.                                                        |
| `disabled`    | `boolean`                                | —               | Disables the trigger and hidden input and hides the clear button. If not set, the value comes from a surrounding `<Field>`. |
| `className`   | `string`                                 | —               | Added to the root `div`.                                                                    |

The ref goes to the trigger `<button>`.

**Behaviour.**

- When the field is empty, the dial opens on 09:00. Nothing is stored until you interact.
- Each interaction commits at once. Picking an hour on an empty field already emits a value
  (`'03:00'`). Picking a minute emits the value and closes the popover.
- **Now** emits the current browser time, rounded down to `minuteStep` (09:37 with a step of 15
  becomes `'09:30'`), and closes the popover.
- The clear button is shown only when `value` is a valid time and the field is not disabled.
- The dial is named like the trigger: by `label`, by the field's label inside a labelled
  `<Field>`, and otherwise `Time`.

## DateTimeField

A single field for a date and a time together. The popover contains a `Calendar`, a `TimeInput`
under it, and a footer with **Now** and **Done**.

```tsx
'use client'

import { useState } from 'react'
import { DateTimeField, Field } from '@shining-technologies/ui'

export function Appointment() {
  const [slot, setSlot] = useState<string>()
  return (
    <Field label="Appointment" description="Clinic local time">
      <DateTimeField
        value={slot}
        onChange={setSlot}
        min="2026-03-01"
        defaultTime="08:30"
        minuteStep={15}
        name="appointment"
        locale="en-AU"
      />
    </Field>
  )
}
```

| Prop          | Type                                         | Default                  | Description                                                                                          |
| ------------- | -------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `value`       | `IsoDateTime \| undefined`                   | —                        | Required prop; pass `undefined` for empty.                                                           |
| `onChange`    | `(value: IsoDateTime \| undefined) => void`  | —                        | Required. Called on every change inside the panel, and with `undefined` when cleared.                |
| `placeholder` | `string`                                     | `'Pick a date and time'` | Shown when there is no valid date.                                                                   |
| `label`       | `string`                                     | —                        | Accessible name. Same rules as `DateField`. The fallback words are `Date and time`.                 |
| `min`         | `IsoDate`                                    | —                        | Earliest day that can be picked, typed onto or reached with **Now**. The limit is a **date**; the time of day is not limited. |
| `max`         | `IsoDate`                                    | —                        | Latest day, with the same meaning.                                                                   |
| `minuteStep`  | `number`                                     | `5`                      | Arrow-key step of the time input. Also sets the rounding of **Now**.                                |
| `hour12`      | `boolean`                                    | `true`                   | 12- or 24-hour time input and trigger text.                                                          |
| `locale`      | `string`                                     | `'en-US'`                | Formats the trigger text and the calendar.                                                           |
| `showNow`     | `boolean`                                    | `true`                   | Show **Now** in the footer. It is disabled while today is outside `min`–`max`.                      |
| `defaultTime` | `IsoTime`                                    | `'09:00'`                | The time a day has while no time is set: shown in the time input and the trigger, stored when a day is picked first, and submitted for a value with a date but no time. An invalid value falls back to `'09:00'`. |
| `id`          | `string`                                     | —                        | The trigger's id. Overrides the id a surrounding `<Field>` supplies.                               |
| `name`        | `string`                                     | —                        | Renders a hidden input containing `yyyy-mm-ddTHH:mm`, or `''`.                                      |
| `required`    | `boolean`                                    | —                        | Sets `aria-required` only. If not set, the value comes from a surrounding `<Field>`.               |
| `onBlur`      | `FocusEventHandler<HTMLButtonElement>`       | —                        | Called when the trigger loses focus.                                                                |
| `disabled`    | `boolean`                                    | —                        | Disables the trigger and hidden input and hides the clear button. If not set, the value comes from a surrounding `<Field>`. |
| `className`   | `string`                                     | —                        | Added to the root `div`.                                                                             |

The ref goes to the trigger `<button>`.

**Behaviour.** Changes are emitted immediately; there is no draft state waiting for **Done**.

- **Picking a day** emits `<day>T<current time or defaultTime>`. The popover stays open.
- **Editing the time before a day is chosen** emits today's date (from the browser clock) with that
  time. If today is outside `min`–`max`, the nearest allowed day (`min` or `max`) is used instead.
- **Now** emits today with the current time, rounded down to `minuteStep`. It is disabled while
  today is outside `min`–`max`.
- **Done** only closes the popover. Escape and clicking outside close it too.
- **Trigger text** is the date (`dateStyle: 'medium'`), then a comma and the time.
- **A value with a date but no valid time** (such as `'2026-03-12'`) is shown in the trigger, shown
  in the time input, and submitted through `name`, all at `defaultTime`. `onChange` is not called
  until the user edits it.
- **A value already outside `min`/`max`** is not changed; the limits apply to what the user picks.

The time input inside the panel is not connected to the surrounding `<Field>`'s id or help text.
With a `label`, the calendar is named `"<label> — date"` and the time input `"<label> — time"`.
Without one, inside a labelled `<Field>`, they are named by the field's label followed by "date" and
"time" (for example "Appointment date"). Otherwise the fallback words are `Date and time`. The panel
uses `.sui-datetime__popover`, `.sui-datetime__time`, `.sui-datetime__time-label` and
`.sui-datetime__foot`. The trigger shares the `.sui-date-field` classes.

## DATE_RANGE_PRESETS

Common date ranges, as used by the data table's date-range filter. Each preset computes its range
when it is called, from the local clock of the runtime (normally the browser).

```tsx
'use client'

import { DATE_RANGE_PRESETS, type DateRangePreset } from '@shining-technologies/ui'

const lastWeek: DateRangePreset = DATE_RANGE_PRESETS[1]!
const [from, to] = lastWeek.range() // e.g. ['2026-03-03', '2026-03-09']
```

| Label          | `range()` returns                                       |
| -------------- | ------------------------------------------------------- |
| `Today`        | `[today, today]`                                        |
| `Last 7 days`  | `[today − 6 days, today]`                               |
| `Last 30 days` | `[today − 29 days, today]`                              |
| `This month`   | `[first day of this month, today]`                      |

The day arithmetic counts calendar days, not multiples of 24 hours, so a daylight-saving change
does not shift a range by a day.

`DateRangePreset` is `{ label: string; range: () => [IsoDate, IsoDate] }`.

## Helper functions

These are exported for converting between values. They have no `'use client'` directive and run
on the server as well as in the browser. Functions that read the clock ("today") use the time zone
of whichever runtime calls them.

| Function        | Signature                                                                     | Behaviour |
| --------------- | ----------------------------------------------------------------------------- | --------- |
| `toIso`         | `(date: Date) => IsoDate`                                                     | Formats from the date's **local** parts. |
| `fromIso`       | `(value: string \| undefined \| null) => Date \| null`                        | Local midnight. Returns `null` for anything that is not an existing `yyyy-mm-dd` day (`'2026-02-31'` and `'2026-13-01'` give `null`). |
| `fromTime`      | `(value: string \| undefined \| null) => { hours: number; minutes: number } \| null` | Accepts `H:mm` or `HH:mm` with surrounding whitespace. Hours above 23 or minutes above 59 give `null`. |
| `toTime`        | `(hours: number, minutes: number) => IsoTime`                                 | Zero-pads. Each part wraps on its own (`toTime(24, 5)` is `'00:05'`); minutes do not carry into hours. |
| `formatTime`    | `(value: string \| undefined, locale = 'en-US', hour12 = true) => string \| null` | `Intl.DateTimeFormat` with `hour: 'numeric', minute: '2-digit'`. Returns `null` for an invalid time. |
| `splitDateTime` | `(value: string \| undefined) => { date: IsoDate \| undefined; time: IsoTime \| undefined }` | Splits on `T`. Drops seconds. An invalid half is `undefined`. |
| `joinDateTime`  | `(date: IsoDate \| undefined, time: IsoTime \| undefined) => IsoDateTime \| undefined` | `undefined` without a date. A missing time becomes `'00:00'`. |

Exported types: `IsoDate`, `IsoTime`, `IsoDateTime`, `CalendarProps`, `ClockProps`,
`TimeInputProps`, `DateFieldProps`, `TimeFieldProps`, `DateTimeFieldProps` and `DateRangePreset`.

## SSR and hydration

- **Client components.** The six components are client code (`'use client'`). Render them from a
  client component that owns the state.
- **Helpers on the server.** `toIso`, `fromIso`, `splitDateTime`, `formatTime`,
  `DATE_RANGE_PRESETS` and the other helpers are server-safe and can be called from Server
  Components. Remember that a server usually runs in UTC, so `toIso(new Date())` or a preset
  computed there may not match the user's today.
- **Today.** `Calendar` sets `data-today` only after hydration. Server HTML has no today marker, so
  the server's time zone cannot cause a hydration mismatch.
- **Initial month without a value.** A `Calendar` with no `value` opens on the current month of
  whichever clock renders it. Around midnight at the end of a month, the server and the browser can
  disagree. Pass `value` to fix the month.
- **Locale.** When `locale` is omitted, every date and time is formatted in `'en-US'`, never in the
  runtime's default locale. Server HTML is therefore the same whatever locale the server runs in,
  and it matches the browser. This is the same default `DataTable` uses. To format for your users,
  pass the same `locale` everywhere (see
  [Next.js: time zone and locale](../nextjs.md#time-zone-and-locale)).
- **Popovers** are closed in server HTML. The calendar and clock inside them render only on the
  client, after the user opens them.
- **Click-time values.** "Now", the presets, and the date a `DateTimeField` fills in for today are
  computed when the user acts, in the browser, so they never reach server HTML.

## Accessibility

- The field triggers are real `<button>`s with an accessible name that includes the current value.
  Inside a `<Field>`, they use the field's label (`aria-labelledby`), description and error
  (`aria-describedby`, `aria-invalid`), and required state (`aria-required`).
- `Calendar` implements the ARIA grid pattern: `role="grid"`, `row`, `columnheader` (full weekday
  name as `aria-label`), and `gridcell` with `aria-selected`. It has a single tab stop. Each day's
  `aria-label` is the full date (`dateStyle: 'full'`). Out-of-range days are `aria-disabled`, not
  removed from focus.
- `Clock` exposes Hour and Minute as `role="spinbutton"` with `aria-valuenow` (0–23 and 0–59) and
  an hour `aria-valuetext`. The dial is a labelled group of buttons named like "3 hours" and
  "15 minutes". AM/PM are toggle buttons with `aria-pressed`.
- `TimeInput` is a labelled `role="group"` with two `role="spinbutton"` inputs. Each input's
  `aria-valuetext` is `Empty` when there is no value.
- Clear buttons are named `Clear <label>`. Disabled fields do not show one.
- Motion is limited under `prefers-reduced-motion: reduce`.
- Built-in UI strings are English and are not configurable: Previous month, Next month, Hour,
  Minute, AM or PM, Now, Done, Time, Clear, and the Date / Time / Date and time fallbacks.
  `locale` changes only the formatting of dates and times.

See [Accessibility](../accessibility.md) for the package-wide approach.

## Related

- [Form](form.md): `Field`, labels, descriptions, errors, and other inputs
- [Overlay](overlay.md): `Popover`, which the field panels are built on
- [Data table](../data-table.md): date filters, which use `Calendar` and `DATE_RANGE_PRESETS`
- [Next.js](../nextjs.md): server and client components, locale and time zone
- [Theming](../theming.md): the tokens these components are drawn from
- [Troubleshooting](../troubleshooting.md)

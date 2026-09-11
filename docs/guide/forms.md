# Forms

The kit's form controls are built to sit inside three kinds of form without adapters: a
plain HTML `<form>`, a form library such as [React Hook Form](https://react-hook-form.com),
and hand-rolled `useState`. This page is the reference for how each control plugs into each.

For every control's props and look, see the [component overview](../components/overview.md#form-inputs).

---

## `Field` does the wiring

Wrap a control in `Field` and it is labelled, described and marked invalid without being told
a single id:

```tsx
import { Field, Input } from '@shining-technologies/ui-kit-react'
;<Field label="Email" description="We never share it." error={errors.email?.message} required>
  <Input type="email" {...register('email', { required: 'Enter your email' })} />
</Field>
```

The control reads `id`, `aria-describedby`, `aria-invalid`, `disabled` and `required` from the
field. Controls that `<label for>` cannot reach — `RadioGroup`, `RatingInput`, the `OtpInput`
group — are named by the label through `aria-labelledby` instead. A `Slider` is named through
its thumbs. `required` does not apply to a slider, which always holds a value. `Switch` and
`Checkbox` take `required` and the invalid state from the field too. The date and time fields
are named by the label together with the value they show, so a screen reader hears "Start
date, 14 Mar 2026".

Three rules:

- **`error` is the switch.** Any truthy value marks the field invalid and is rendered as the
  message. Pass the message, not a boolean, so it is announced.
- **Do not pass `aria-label` inside a `Field`.** It wins over the visible label and screen
  readers hear a different name from the one on screen. The same goes for the `label` prop of
  `DateField`, `TimeField` and `DateTimeField`: it is for use outside a `Field`.
- **`htmlFor`** overrides the generated id when something else — a test, an analytics tag —
  needs a known one.

Building your own control? Spread `useFieldControl()` on its focusable element and it joins a
field the same way the kit's controls do:

```tsx
import { useFieldControl } from '@shining-technologies/ui-kit-react'

function PostcodeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldControl() // {} outside a Field, so it still works standalone
  return <input inputMode="numeric" {...field} {...props} />
}
```

---

## Which controls take `register`, which need a `Controller`

React Hook Form's `register()` returns `ref`, `name`, `onChange` and `onBlur` for a **native**
input. Controls that are native inputs underneath accept it directly. Controls that are not —
anything that holds a value that is not a string in a text box — take a `Controller`.

| Control                                            | React Hook Form | Value                                                    |
| -------------------------------------------------- | --------------- | -------------------------------------------------------- |
| `Input`, `Textarea`, `InputGroup`, `PasswordInput` | `register`      | `string`                                                 |
| `Checkbox`, `Switch`                               | `Controller`    | `boolean` (`checked` / `onCheckedChange`)                |
| `RadioGroup`, `Select`                             | `Controller`    | `string` (`value` / `onValueChange`)                     |
| `Slider`                                           | `Controller`    | `number[]` (`value` / `onValueChange`)                   |
| `NumberInput`                                      | `Controller`    | `number \| null` — never `NaN`                           |
| `PhoneInput`                                       | `Controller`    | E.164 `string`, `''` when empty                          |
| `OtpInput`, `ColorInput`                           | `Controller`    | `string` (`#rrggbb` for colour)                          |
| `TagsInput`, `MultiCombobox`                       | `Controller`    | `string[]`                                               |
| `Combobox`                                         | `Controller`    | `string \| null`                                         |
| `RatingInput`                                      | `Controller`    | `number`                                                 |
| `DateField` / `TimeField` / `DateTimeField`        | `Controller`    | local `string` (`value` / **`onChange`**) — see [Dates and times](#dates-and-times) |
| `FileUpload` / `ImageUpload`                       | `Controller`    | item arrays — see [Uploads](#uploads)                    |

`Checkbox` and `Switch` look like inputs but render a `<button role="checkbox">` (they are
Radix primitives), so `register` would read the wrong property. Use a `Controller`.

The pattern is the same for every `Controller` row — map `field.value` and `field.onChange` onto
the control's `value` and `onValueChange` (or `checked` / `onCheckedChange`), and forward
`ref`, `name` and `onBlur` where the control takes them:

```tsx
import { Controller, useForm } from 'react-hook-form'
import { Button, Field, Input, NumberInput, PhoneInput, Switch } from '@shining-technologies/ui-kit-react'

interface Booking {
  name: string
  phone: string
  guests: number | null
  newsletter: boolean
}

export function BookingForm({ onSubmit }: { onSubmit: (values: Booking) => void }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Booking>({ defaultValues: { name: '', phone: '', guests: 2, newsletter: false } })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Name" error={errors.name?.message} required>
        <Input {...register('name', { required: 'Tell us who is booking' })} />
      </Field>

      <Controller
        name="phone"
        control={control}
        rules={{ required: 'We text the confirmation' }}
        render={({ field, fieldState }) => (
          <Field label="Mobile" error={fieldState.error?.message} required>
            <PhoneInput
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              defaultCountry="AU"
            />
          </Field>
        )}
      />

      <Controller
        name="guests"
        control={control}
        render={({ field }) => (
          <Field label="Guests">
            <NumberInput
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              min={1}
              max={12}
            />
          </Field>
        )}
      />

      <Controller
        name="newsletter"
        control={control}
        render={({ field }) => (
          <Field label="Send me offers" orientation="horizontal">
            <Switch ref={field.ref} checked={field.value} onCheckedChange={field.onChange} />
          </Field>
        )}
      />

      <Button type="submit" disabled={isSubmitting}>
        Book
      </Button>
    </form>
  )
}
```

The same shape works with Formik (`setFieldValue`), TanStack Form (`field.handleChange`) or
plain `useState`: each control is a controlled component with a `value` and a change callback.

---

## Controlled and uncontrolled

Every value-holding control follows one rule: it is **controlled when `value !== undefined`**.

- **Controlled** — pass `value` and `onValueChange`. The control shows exactly what you pass.
- **Uncontrolled** — pass `defaultValue` (or nothing) and read the result from
  `onValueChange` or the submitted form.

So `undefined` never means "empty". Each control has an empty value of its own:

| Empty value | Controls                                                          |
| ----------- | ----------------------------------------------------------------- |
| `''`        | `Input`, `PasswordInput`, `PhoneInput`, `OtpInput`, `ColorInput`  |
| `null`      | `NumberInput`, `Combobox`                                         |
| `[]`        | `TagsInput`, `MultiCombobox`, `FileUpload`, `ImageUpload`         |
| `0`         | `RatingInput`                                                     |

An empty `ColorInput` submits `''`, not black.

The date and time fields are the exception: they are always controlled, and their callback is
`onChange(value | undefined)`, where `undefined` means empty.

A form library that initialises a field as `undefined` leaves the control uncontrolled, and
it stops following the form. Give every field a default value (React Hook Form's
`defaultValues`).

---

## Native form submission

Give a control a `name` and it submits with the surrounding `<form>`, including the custom
widgets that have no native input of their own. They render a hidden input carrying the
**value**, not the display text:

| Control                                      | Submits                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `PhoneInput`                                 | E.164 — `+61412345678`, not `0412 345 678`              |
| `NumberInput`                                | the plain number — `1250.5`, not `1,250.50`             |
| `ColorInput`                                 | `#rrggbb`                                               |
| `OtpInput`, `RatingInput`, `Combobox`        | the value                                               |
| `TagsInput`, `MultiCombobox`                 | one entry per value — read with `formData.getAll(name)` |
| `DateField`, `TimeField`, `DateTimeField`    | the local string                                        |
| `Checkbox`, `Switch`, `RadioGroup`, `Select` | as their native equivalents (Radix renders the input)   |
| `FileUpload`, `ImageUpload`                  | the files, through a hidden `<input type="file">`       |

```tsx
;<form action={createBooking}>
  <Field label="Mobile">
    <PhoneInput name="phone" defaultCountry="AU" />
  </Field>
  <Field label="Tags">
    <TagsInput name="tags" defaultValue={['vip']} />
  </Field>
  <Button type="submit">Save</Button>
</form>

// on the server
const phone = formData.get('phone') // '+61412345678'
const tags = formData.getAll('tags') // ['vip', 'returning']
```

This works with Next.js Server Actions and React Router / Remix `<Form>` unchanged.

Two things a native form does not do for you:

- **`required` on a custom widget is announced, not enforced.** The date and time fields and
  the comboboxes set `aria-required`, but a hidden input cannot block submission. The uploads
  do not announce it at all. Validate on submit.
- **`form.reset()` does not reset React state.** Custom widgets keep their value after a native
  reset. Reset them through state, or remount the form with a new `key`.

---

## Value formats

### Phone numbers

`PhoneInput` always emits **E.164**: `+` then the country code then the national significant
number. A trunk `0` typed in front of the national number — `0412 345 678` in Australia,
`07700 900123` in the UK — is dropped from the value and stays on screen, because that is how
the user writes the number at home. Italy, San Marino, the Vatican, Côte d'Ivoire and the
Republic of the Congo keep the leading `0`, which is part of the number there.

The country is chosen by the flag, or by the number: pasting or autofilling `+44 20 …` picks
the United Kingdom. A country already selected wins a shared code, so a Canadian `+1` number
stays Canadian.

The second argument to `onValueChange` hands you the parts, so you never re-parse:

```tsx
<PhoneInput
  onValueChange={(e164, { country, national }) => {
    // e164: '+61412345678', country.code: 'AU', national: '412345678'
  }}
/>
```

`PhoneInput` groups digits for readability but does not validate numbering plans — that would
be 150 kB of metadata. Validate server-side (for example with `libphonenumber-js`) when the
number must be dialable.

### Numbers

`NumberInput` emits `number | null` — `null` for an empty field, and never `NaN`, even for a
half-typed `-`. `onValueChange` fires on each keystroke that forms a number; rounding to
`precision` and clamping to `min`/`max` happen on blur.

The decimal separator comes from the `locale` prop, or the runtime's default locale without
one: `locale="de-DE"` types and shows `1.250,5`. A `.` is always accepted as the decimal point,
because it is the only one on many numeric keypads. When server rendering, pass `locale`, so
the server and the browser agree on the separator.

### Dates and times

The date and time fields hold **local, timezone-free strings**:

| Control         | Value              | Example            |
| --------------- | ------------------ | ------------------ |
| `DateField`     | `yyyy-mm-dd`       | `2026-03-14`       |
| `TimeField`     | `HH:mm`            | `09:30`            |
| `DateTimeField` | `yyyy-mm-ddTHH:mm` | `2026-03-14T09:30` |

They mean "the date on the calendar", not an instant, so a birthday or an appointment does not
move a day when a user in another timezone opens it.

`DateTimeField` stores a day picked before any time with its `defaultTime` (`'09:00'` by
default), which is also where its clock opens, so what is on the dial is what is stored.

Do **not** pass `new Date().toISOString()`: the trailing `Z` is ignored and the UTC time is shown
as if it were local. Convert explicitly:

```ts
import { fromIso, toIso } from '@shining-technologies/ui-kit-react'

toIso(new Date()) // '2026-03-14' — local calendar date
fromIso('2026-03-14') // Date at local midnight
fromIso('2026-02-31') // null — not a real day
```

To store an instant, combine the local string with the user's timezone on the server.

### Uploads

`FileUpload` and `ImageUpload` hand you arrays of items — the component does not upload
anything. You own the upload and report progress back:

```tsx
const [items, setItems] = useState<UploadItem[]>([])

<FileUpload
  value={items}
  onValueChange={setItems}
  accept=".pdf,image/*"
  maxSize={10 * 1024 * 1024}
/>
```

`ImageUpload` creates object URLs for previews. It revokes one when its item leaves the value,
and on unmount only when the field is uncontrolled. A controlled parent keeps its items, so
their previews still work when the component mounts again, as with a multi-step form that
unmounts a step. When the parent discards such items itself, it releases their URLs with
`URL.revokeObjectURL(item.url)`. Remote URLs, and object URLs you made yourself, are never revoked.

---

## Validation and errors

- Show the message through `Field`'s `error`; the control is marked `aria-invalid` and the
  message is linked with `aria-describedby`, so it is read when the control is focused.
- Validate on submit and on blur rather than on every keystroke — an error that appears while
  someone is still typing is noise.
- Move focus to the first invalid control on a failed submit. React Hook Form does this with
  `shouldFocusError` (the default), which is why forwarding `field.ref` in a `Controller`
  matters.
- `PasswordInput` shows Caps Lock and optional strength; pair it with
  `PasswordStrengthIndicator` to list the rules. The meter reads the input itself, so it
  follows React Hook Form's `reset()` and a native `form.reset()`. The hint and the strength
  verdict are in the input's `aria-describedby`, after the field's own description.
- `TagsInput` splits on its `delimiters` (`,` and Enter by default) as you type, and a pasted
  list is split on the same characters. A line break in pasted text always splits.
- `Combobox` shows the label of a value that is not in `options` if you pass it as
  `selectedOption`. `MultiCombobox` does the same with `selectedOptions`. That covers a
  saved value whose option has not loaded yet. Without one, the value is shown as itself,
  never as the placeholder.

## Layout helpers

- `Fieldset` groups related fields under a legend — use it for a radio group's question or an
  address block.
- `FloatingFormActions` pins Save / Cancel to the bottom of a long form.
- `ConfirmDialog` is the "discard changes?" prompt; its action can return a promise and the
  dialog waits for it.

## Related

- [Component overview — form inputs](../components/overview.md#form-inputs)
- [Accessibility](./accessibility.md)
- [Next.js and server rendering](./nextjs.md) — Server Actions with native submission

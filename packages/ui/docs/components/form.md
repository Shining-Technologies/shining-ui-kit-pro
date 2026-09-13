# Form

Form layout and every form control in the kit: `Field` wires a label, help text and an error message
to whatever control it wraps, and the controls range from a plain text input to phone numbers, one-time
codes, tags, colours, ratings and file uploads. Every control works standalone, inside a `Field`, with
React Hook Form, and in a native `<form>` posted to a Server Action.

```tsx
import { Field, Input } from '@shining-technologies/ui'
// or, scoped to this family:
import { Field, Input } from '@shining-technologies/ui/form'
```

**Server and client.** Every component and hook on this page lives in a module marked `'use client'`, so
all of them are client components. You can still render them from a Server Component as long as the
props are serialisable: strings, numbers, arrays, plain objects and JSX. Props that are functions
(`onValueChange`, `validate`, `onSearch`, …) have to be passed from a client component. The helpers
(`scorePassword`, `DEFAULT_PASSWORD_RULES`, `normalizeHex`, `DEFAULT_SWATCHES`, `formatBytes`,
`COUNTRIES`, `countryByCode`, `countryByDial`, `flagFor`) come from modules without the directive, so
Server Components and Server Actions can call them, for example to score a submitted password with the
rules the form showed.

Date and time fields (`DateField`, `TimeField`, `DateTimeField`) join a `Field` in the same way. They are
documented in [date-time.md](date-time.md).

## Contents

- Layout: [Field](#field), [Label](#label), [Fieldset](#fieldset), [useFieldControl](#usefieldcontrol)
- Text: [Input](#input), [InputGroup](#inputgroup), [Textarea](#textarea), [PasswordInput](#passwordinput),
  [PasswordStrengthIndicator](#passwordstrengthindicator)
- Choice: [Checkbox](#checkbox), [RadioGroup](#radiogroup), [Switch](#switch), [Select](#select),
  [Combobox and MultiCombobox](#combobox-and-multicombobox), [Toggle and ToggleGroup](#toggle-and-togglegroup)
- Structured values: [NumberInput](#numberinput), [PhoneInput](#phoneinput), [OtpInput](#otpinput),
  [TagsInput](#tagsinput), [ColorInput](#colorinput), [RatingInput](#ratinginput), [Slider](#slider)
- Files: [FileUpload](#fileupload), [ImageUpload](#imageupload)
- Actions: [FloatingFormActions](#floatingformactions)
- [Helpers](#helpers)
- [Controlled and uncontrolled](#controlled-and-uncontrolled)
- [React Hook Form](#react-hook-form)
- [Native forms and Server Actions](#native-forms-and-server-actions)
- [Accessibility](#accessibility)
- [Related](#related)

## Field

`Field` lays out a label, a control, help text and an error message. It also gives the control an `id`,
an `aria-describedby` that points at the help text and the error, `aria-invalid` when there is an error,
and the field's `disabled` and `required` state. You never pass those ids by hand.

```tsx
<Field
  label="Email"
  description="We send the receipt here."
  error="Enter an email address."
  required
>
  <Input type="email" name="email" autoComplete="email" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `label` | `ReactNode` | — | Rendered as a `<label>` with `for` set to the control's id. No label is rendered when it is omitted. |
| `description` | `ReactNode` | — | Help text below the control, added to the control's `aria-describedby`. |
| `error` | `ReactNode` | — | Any truthy value marks the field invalid (`aria-invalid` on the control) and is rendered as the message. Pass a string: `error={true}` makes the field invalid but shows an empty message. |
| `required` | `boolean` | `false` | Adds a decorative `*` to the label and passes `required` to the control. How each control uses it is listed in [Accessibility](#accessibility). |
| `disabled` | `boolean` | `false` | Disables the control and dims the label. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `'horizontal'` puts the control and label on one row, with the label visually after the control. Use it for a checkbox or a switch. |
| `htmlFor` | `string` | a `useId()` value | Overrides the generated id, for example to match a form library's field name. |
| `children` | `ReactNode` | — | Required. The control. |

Also accepts all `<div>` props. The ref goes to the wrapper `<div>`.

The ids are derived from the control id: `<id>-label`, `<id>-description` and `<id>-error`. Controls that
`<label for>` cannot name (a radio group, a slider thumb, the rating, the one-time code group) are named
with `aria-labelledby` pointing at the label instead. The radio group, the first slider thumb and the
rating still carry the field id, and clicking the label moves focus to their tab stop, as it would for
an input. The one-time code group gives the id to its first box.

If the control is given its own `id`, `aria-describedby`, `disabled` or `required` prop, that prop wins
over the value from the field.

Styling hooks: `data-slot="field"`, `data-disabled`, `.sui-field`, `.sui-field--horizontal`,
`.sui-field__label`, `.sui-field__required`, `.sui-field__description`, `.sui-field__error`.

## Label

The label element used by `Field`, built on Radix `Label`. Use it on its own to label a control outside a
`Field`, such as each option of a radio group.

```tsx
<Label htmlFor="terms">I accept the terms</Label>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Radix `Label.Root` props (all `<label>` props). |

Styling hooks: `data-slot="label"`, `.sui-field__label`.

## Fieldset

A `<fieldset>` with an optional `<legend>`, for a group of related fields. It does not create field
context, and `disabled` is the native attribute.

```tsx
<Fieldset legend="Billing address">
  <Field label="Street">
    <Input name="street" autoComplete="address-line1" />
  </Field>
  <Field label="Postcode">
    <Input name="postcode" autoComplete="postal-code" inputMode="numeric" />
  </Field>
</Fieldset>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `legend` | `ReactNode` | — | Rendered as the `<legend>`. |

Also accepts all `<fieldset>` props. Styling hooks: `data-slot="fieldset"`, `.sui-fieldset`,
`.sui-fieldset__legend`.

## useFieldControl

`useFieldControl()` returns the props a control spreads to join the surrounding `Field`. Use it to build
your own control. Outside a `Field` it returns `{}`, so the control still works standalone.

```tsx
'use client'

import { useFieldControl } from '@shining-technologies/ui'
import type { InputHTMLAttributes } from 'react'

export function SubdomainInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldControl()
  // Spread the field first so explicit props win.
  return <input className="sui-input" {...field} {...props} />
}
```

It returns a `FieldControlProps` object:

| Key | Type | Description |
| --- | ---- | ----------- |
| `id` | `string \| undefined` | The field's control id. |
| `aria-describedby` | `string \| undefined` | The description id and the error id, when those elements are rendered. |
| `aria-invalid` | `true \| undefined` | Set when the field has an `error`. |
| `disabled` | `boolean \| undefined` | `true` when the field is disabled. |
| `required` | `boolean \| undefined` | `true` when the field is required. |

The types `FieldControlProps` and `FieldContextValue` are exported too.

## Input

A single-line text input: a native `<input>` with the kit's styling that joins the surrounding `Field`.

```tsx
<Field label="Company name">
  <Input name="company" placeholder="Acme Pty Ltd" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Also accepts all `<input>` props. |

The ref goes to the `<input>`. Styling hooks: `.sui-input`, `[aria-invalid='true']`.

## InputGroup

An input with content inside its border, before or after the text: an icon, a unit or a button. The
wrapper draws the border and the focus state, so the whole box lights up when the input has focus.

```tsx
<Field label="Website">
  <InputGroup name="website" prefix="https://" suffix=".com.au" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `prefix` | `ReactNode` | — | Content before the text. It is hidden from assistive technology (`aria-hidden`), so do not put interactive content here. |
| `suffix` | `ReactNode` | — | Content after the text. Not hidden, so it can hold a button (for example, a clear button). |
| `wrapperClassName` | `string` | — | Class for the wrapper that draws the border. |
| `className` | `string` | — | Class for the inner `<input>`. |

Also accepts all `<input>` props except the HTML `prefix` attribute. The ref goes to the `<input>`.
Styling hooks: `data-slot="input-group"`, `.sui-input-group`, `.sui-input-group__addon`,
`.sui-input-group__input`.

## Textarea

A multi-line text field that can grow with its content and show a character count.

```tsx
<Field label="Notes">
  <Textarea name="notes" rows={3} autoResize maxRows={8} showCount maxLength={500} />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `autoResize` | `boolean` | `false` | Grows the box to fit the text instead of scrolling. It also resizes when a controlled `value` changes. |
| `maxRows` | `number` | — | Maximum height in rows, based on the computed line height. Past it, the box scrolls. Ignored without `autoResize`. |
| `showCount` | `boolean` | `false` | Shows `length` under the box, or `length / maxLength` when `maxLength` is set. |

Also accepts all `<textarea>` props. The ref and `className` go to the `<textarea>`.

The counter follows typing when the field is uncontrolled and follows `value` when it is controlled. It
is `aria-hidden`: the limit is enforced by the native `maxLength`. `data-over` is set on the counter
when a controlled value is longer than `maxLength`.

Styling hooks: `data-slot="textarea"`, `.sui-textarea`, `.sui-textarea--auto`, `.sui-textarea-wrap`
(only rendered with `showCount`), `.sui-textarea__count`, `[data-over]`.

## PasswordInput

A password field with a show/hide button, a Caps Lock warning, an optional hint, and an optional strength
meter with a checklist.

```tsx
<Field label="New password">
  <PasswordInput name="password" strength hint="A short sentence is easiest to remember." />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `strength` | `boolean` | `false` | Shows a [PasswordStrengthIndicator](#passwordstrengthindicator) under the field. |
| `rules` | `PasswordRule[]` | `DEFAULT_PASSWORD_RULES` | Rules for the meter. Ignored unless `strength` is set. |
| `showRules` | `boolean` | `true` | Shows the per-rule checklist under the meter. `false` shows the meter and verdict only. |
| `revealable` | `boolean` | `true` | Shows the show/hide button. Set `false` for a confirmation field. |
| `capsLockWarning` | `boolean` | `true` | Shows "Caps Lock is on" (`role="status"`) while Caps Lock is on. It is checked on key-up and cleared on blur. |
| `hint` | `ReactNode` | — | Text under the field, added to the input's `aria-describedby`. |
| `wrapperClassName` | `string` | — | Class for the bordered control that holds the input and the button. |
| `className` | `string` | — | Class for the `<input>`. |

Also accepts all `<input>` props except `type`. The ref goes to the `<input>`.

- `autoComplete` defaults to `'new-password'` when `strength` is set and to `'current-password'`
  otherwise. Pass `autoComplete` to override it.
- The show/hide button is a `<button type="button">` in the tab order. Its label is "Show password" or
  "Hide password", and `aria-pressed` reports its state.
- The input's `aria-describedby` lists, in order: the field's description and error, your own
  `aria-describedby`, the hint, and the strength indicator.
- The meter reads the input's value even when you do not control it. It re-reads the DOM after every
  render and after a native `form.reset()`, so it stays correct when React Hook Form's `reset()` or
  `setValue()` writes the value directly.

Styling hooks: `data-slot="password-input"` (on the control), `.sui-password`, `.sui-password__control`,
`.sui-password__reveal`, `.sui-password__caps`, `.sui-password__hint`.

## PasswordStrengthIndicator

A four-bar meter, a text verdict and a checklist of rules for a password. `PasswordInput` renders it for
you when `strength` is set. Use it directly when the password lives somewhere else.

```tsx
'use client'

import { Field, Input, PasswordStrengthIndicator } from '@shining-technologies/ui'
import { useState } from 'react'

export function NewPassword() {
  const [password, setPassword] = useState('')
  return (
    <Field label="Password">
      <Input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordStrengthIndicator password={password} />
    </Field>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `password` | `string` | — | Required. The password to score. |
| `rules` | `PasswordRule[]` | `DEFAULT_PASSWORD_RULES` | Rules to check. Define the array outside the component, because the score is memoised on its identity. |
| `showRules` | `boolean` | `true` | Shows the checklist. |
| `score` | `PasswordScore` (`0`–`4`) | computed | Overrides the computed score, for example with a score from zxcvbn on the server. The checklist still uses `rules`. |
| `announce` | `boolean` | `true` | Makes the verdict a polite live region. Set `false` when something else announces the strength. |

Also accepts all `<div>` props except `children`.

Verdicts by score: `0` Too short, `1` Weak, `2` Fair, `3` Good, `4` Strong. The bars are `aria-hidden`.
The verdict is text that starts with a visually hidden "Password strength: ", and each rule ends with a
visually hidden "— met" or "— not met". The verdict is a polite live region (`aria-live="polite"`,
`aria-atomic`): a change of verdict is announced while typing, and typing that keeps the same verdict
says nothing. Inside `PasswordInput` the indicator is also in the input's `aria-describedby`, which is
read when the input gains focus. That is not a change, so the verdict is not spoken twice.

Styling hooks: `data-slot="password-strength"`, `data-score`, `.sui-strength`, `.sui-strength__meter`,
`.sui-strength__bar`, `.sui-strength__bar--{destructive|warning|info|success}`,
`.sui-strength__verdict`, `.sui-strength__verdict--{tone}`, `.sui-strength__rules`, `.sui-strength__rule`,
`.sui-strength__rule--met`.

See [scorePassword](#scorepassword) for how the score is calculated.

## Checkbox

A checkbox built on Radix `Checkbox`. It supports the indeterminate state and joins the surrounding
`Field`, including `required` and `aria-invalid`.

```tsx
<Field label="Email me about new bookings" orientation="horizontal">
  <Checkbox name="notify" defaultChecked />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Radix `Checkbox.Root` props: `checked` (`boolean \| 'indeterminate'`), `defaultChecked`, `onCheckedChange`, `name`, `value` (Radix default `'on'`), `required`, `disabled`, and all `<button>` props. |

`checked="indeterminate"` or `defaultChecked="indeterminate"` sets `aria-checked="mixed"` and shows a dash
instead of a tick. Both glyphs are rendered, and the stylesheet shows the one that matches the
indicator's `data-state`, so the glyph also follows uncontrolled changes and form resets.

The control is a `<button role="checkbox">`, and Space toggles it. For form submission, see
[Native forms and Server Actions](#native-forms-and-server-actions).

Styling hooks: `.sui-checkbox`, `.sui-checkbox__indicator`, `.sui-checkbox__check`, `.sui-checkbox__minus`,
`[data-state='checked' | 'unchecked' | 'indeterminate']`, `[aria-invalid='true']`.

## RadioGroup

A set of mutually exclusive options, built on Radix `RadioGroup`. Inside a `Field`, the field label names
the group through `aria-labelledby`.

```tsx
<Field label="Plan" description="You can change plans at any time.">
  <RadioGroup name="plan" defaultValue="team">
    <div className="plan-option">
      <RadioGroupItem value="solo" id="plan-solo" />
      <Label htmlFor="plan-solo">Solo</Label>
    </div>
    <div className="plan-option">
      <RadioGroupItem value="team" id="plan-team" />
      <Label htmlFor="plan-team">Team</Label>
    </div>
  </RadioGroup>
</Field>
```

**RadioGroup**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Lays the items out in a row (`.sui-radio-group--horizontal`) or a column, and sets `aria-orientation`. It is not passed to Radix's roving focus, so the arrow keys work in all four directions either way. |

Also accepts Radix `RadioGroup.Root` props: `value`, `defaultValue`, `onValueChange`, `name`, `required`,
`disabled`, `loop`, `dir`.

**RadioGroupItem**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Radix `RadioGroup.Item` props: `value` (required), `disabled`, `id`, and all `<button>` props. |

Each item needs its own accessible name: a `<Label htmlFor>` or an `aria-label`. The arrow keys move
between items and select them, and Tab leaves the group. An explicit `aria-label` on the group takes
precedence over the field label. Inside a `Field`, the group carries the field id, so clicking the field
label focuses the checked item (or the first).

Styling hooks: `data-slot="radio-group"`, `data-slot="radio-group-item"`, `.sui-radio-group`,
`.sui-radio-group--horizontal`, `.sui-radio`, `.sui-radio__indicator`, `[data-state='checked']`.

## Switch

An on/off switch built on Radix `Switch`. It joins the surrounding `Field`, including `required` and
`aria-invalid`.

```tsx
<Field label="Public listing" orientation="horizontal">
  <Switch name="public" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Radix `Switch.Root` props: `checked`, `defaultChecked`, `onCheckedChange`, `name`, `value` (Radix default `'on'`), `required`, `disabled`, and all `<button>` props. |

Renders a `<button role="switch">`. Space and Enter toggle it.

Styling hooks: `data-slot="switch"`, `.sui-switch`, `.sui-switch__thumb`, `[data-state='checked']`,
`[aria-invalid='true']`.

## Select

A styled wrapper around Radix `Select`, for a short list of options (up to about a dozen). For longer
lists or search, use [Combobox](#combobox-and-multicombobox).

```tsx
<Field label="Status" description="Who can see the listing.">
  <Select name="status" defaultValue="draft" required>
    <SelectTrigger>
      <SelectValue placeholder="Choose a status" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Visibility</SelectLabel>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="published">Published</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</Field>
```

| Export | Built on | Notes |
| ------ | -------- | ----- |
| `Select` | Radix `Select.Root` | The Radix component itself: `value`, `defaultValue`, `onValueChange`, `open`, `onOpenChange`, `name`, `required`, `disabled`, `form`, `autoComplete`, `dir`. |
| `SelectTrigger` | Radix `Select.Trigger` | Adds the chevron. It is the focusable part, so it joins the `Field`: `id`, `aria-describedby`, `aria-invalid`, `disabled`, and `aria-required` when the field is required. Class `.sui-select__trigger`. |
| `SelectValue` | Radix `Select.Value` | The selected item's text, or `placeholder`. |
| `SelectContent` | Radix `Select.Content` | Rendered in a portal, inside the element from `PortalContainerProvider` or `<body>` (see [overlay.md](overlay.md)). `position` defaults to `'popper'`, where Radix's own default is `'item-aligned'`. Classes `.sui-surface .sui-select__content`, with a `.sui-select__viewport` inside. |
| `SelectItem` | Radix `Select.Item` | `value` is required. Shows a check mark when selected. Classes `.sui-menu__item .sui-select__item`. |
| `SelectGroup` | Radix `Select.Group` | Groups items. |
| `SelectLabel` | Radix `Select.Label` | A heading inside a group. Class `.sui-menu__label`. |

A required `Field` only adds `aria-required` to the trigger. For the browser to block an empty
submission, also pass `required` to `<Select>`. Keyboard behaviour is Radix's: Enter, Space and the arrow
keys open the list, typing jumps to a matching item, and Escape closes it.

## Combobox and MultiCombobox

A select with a search box. `Combobox` picks one value and `MultiCombobox` picks several, shown as chips.
Both use the same list and keyboard handling. Filtering happens on the client unless you pass
`onSearch`, in which case you supply the options.

```tsx
<Field label="Region">
  <Combobox
    name="region"
    placeholder="Choose a region"
    clearable
    options={[
      { value: 'syd', label: 'Sydney', group: 'New South Wales' },
      { value: 'new', label: 'Newcastle', group: 'New South Wales' },
      { value: 'mel', label: 'Melbourne', group: 'Victoria' },
    ]}
  />
</Field>
```

```tsx
<Field label="Trades">
  <MultiCombobox
    name="trades"
    defaultValue={['roofing']}
    maxChips={2}
    options={[
      { value: 'roofing', label: 'Roofing' },
      { value: 'solar', label: 'Solar' },
      { value: 'plumbing', label: 'Plumbing' },
    ]}
  />
</Field>
```

Searching on a server:

```tsx
'use client'

import { Combobox, type ComboboxOption } from '@shining-technologies/ui'
import { useState } from 'react'

export function CustomerPicker({ saved }: { saved: ComboboxOption | null }) {
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState<string | null>(saved?.value ?? null)

  return (
    <Combobox
      aria-label="Customer"
      options={options}
      value={value}
      onValueChange={setValue}
      selectedOption={saved}
      loading={loading}
      onSearch={async (query) => {
        setLoading(true)
        const response = await fetch(`/api/customers?q=${encodeURIComponent(query)}`)
        setOptions(await response.json())
        setLoading(false)
      }}
    />
  )
}
```

**Shared props**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `options` | `ComboboxOption[]` | — | Required. The options, in display order. |
| `placeholder` | `string` | `'Select…'` | Trigger text when nothing is selected. |
| `searchPlaceholder` | `string` | `'Search…'` | Placeholder and accessible name of the search box. |
| `emptyMessage` | `ReactNode` | `'No matches'` | Shown when the list is empty. |
| `disabled` | `boolean` | from `Field` | Disables the trigger. An explicit value takes precedence over the field. |
| `loading` | `boolean` | — | Shows "Searching…" with a spinner in place of the options. Enter in the search box does nothing while it is set. |
| `onSearch` | `(query: string) => void` | — | Turns off client-side filtering. It is called with the debounced query while the list is open, including `''` when it opens. Changing the function between renders does not trigger extra calls. |
| `searchDebounce` | `number` | `250` | Delay in ms before `onSearch` is called. |
| `footer` | `ReactNode` | — | Rendered below the list, for example a "Load more" button. |
| `name` | `string` | — | Adds hidden inputs for native form submission. See [Native forms and Server Actions](#native-forms-and-server-actions). |
| `id`, `className`, `aria-label`, `aria-labelledby`, `aria-describedby` | `string` | — | Applied to the trigger button. No other HTML attributes are accepted, including `onBlur`. |

**Combobox**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `string \| null` | — | Controlled selection. `null` means nothing is selected. Leave it `undefined` for an uncontrolled field. |
| `defaultValue` | `string \| null` | `null` | Initial selection while uncontrolled. |
| `onValueChange` | `(value: string \| null) => void` | — | Called on every change, controlled or not. |
| `selectedOption` | `ComboboxOption \| null` | — | The option for the current value when `options` may not contain it, for example a saved value before async options load. Used only for the trigger text. |
| `clearable` | `boolean` | `false` | Shows a clear (✕) button over the trigger while a value is selected, and lets Backspace or Delete on the trigger clear the value. Wraps the trigger in a `.sui-combobox` element. |

**MultiCombobox**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `string[]` | — | Controlled selection. `[]` means nothing is selected. Leave it `undefined` for an uncontrolled field. |
| `defaultValue` | `string[]` | `[]` | Initial selection while uncontrolled. |
| `onValueChange` | `(value: string[]) => void` | — | Called on every change. Values are kept in the order they were picked. |
| `selectedOptions` | `ComboboxOption[]` | `[]` | Labels for current values that `options` may not contain. |
| `maxChips` | `number` | `3` | Chips shown before a `+n` summary chip. |

**ComboboxOption**

| Key | Type | Description |
| --- | ---- | ----------- |
| `value` | `string` | Required. The submitted value. |
| `label` | `string` | Required. The displayed and searched text. |
| `description` | `ReactNode` | A second line under the label. |
| `icon` | `ReactNode` | An icon before the label (`aria-hidden`). |
| `disabled` | `boolean` | Shown but cannot be picked, and skipped by the arrow keys. |
| `group` | `string` | Options with the same `group` appear under one heading. Groups follow the order they first appear in. |

Behaviour:

- The ref goes to the trigger `<button role="combobox">`. Opening the list moves focus to the search box.
- In the search box, ArrowDown and ArrowUp move the active option (wrapping, skipping disabled options),
  Enter picks it, and Escape closes the list. `aria-activedescendant` on the search box points at the
  active option.
- Client-side filtering is a case-insensitive substring match on `label` or `value`. The query clears when
  the list closes.
- `Combobox` closes after a pick. `MultiCombobox` stays open, and picking an option toggles it.
- The trigger label comes from `options`, then `selectedOption(s)`, then options picked earlier in this
  session. A value none of them knows is shown as the raw value rather than the placeholder.
- The listbox is named by the combobox's `aria-labelledby` or `aria-label`, then by the surrounding
  field label, then by the placeholder.
- The clear button and the chip remove buttons are not inside the trigger, because a button inside a
  button is invalid and unreachable for screen readers. They are real `<button>`s in a layer stacked
  over the trigger (`.sui-combobox__overlay`), which repeats the trigger's layout with its content
  hidden. They are named "Clear selection" and "Remove {label}", are left out of the tab order, and
  return focus to the trigger. Keyboard users clear a `Combobox` with Backspace or Delete, and deselect
  a `MultiCombobox` value by picking it again in the list.
- `MultiCombobox`, and `Combobox` with `clearable`, wrap the trigger in a `.sui-combobox` grid element
  (`data-slot="combobox"` or `"multi-combobox"`). `className` still goes to the trigger.

Styling hooks: `.sui-combobox`, `.sui-combobox--multi`, `.sui-combobox__overlay`, `.sui-combobox__ghost`,
`.sui-combobox__trigger`, `.sui-combobox__trigger--multi`, `.sui-combobox__value`,
`.sui-combobox__value--empty`, `.sui-combobox__clear`, `.sui-combobox__chips`, `.sui-combobox__chip`,
`.sui-combobox__chip--more`, `.sui-combobox__chip-remove`, `.sui-combobox__panel`,
`.sui-combobox__search`, `.sui-combobox__search-input`, `.sui-combobox__list`, `.sui-combobox__group`,
`.sui-combobox__group-label`, `.sui-combobox__option` (`[data-active]`, `[aria-selected]`),
`.sui-combobox__option--disabled`, `.sui-combobox__option-label`, `.sui-combobox__option-description`,
`.sui-combobox__status`, `.sui-combobox__footer`.

## Toggle and ToggleGroup

A pressable on/off button (`Toggle`) and a set of them (`ToggleGroup`), built on Radix `Toggle` and
`ToggleGroup`. They are not form fields: they do not join a `Field` and submit nothing with a form.

```tsx
<ToggleGroup type="single" defaultValue="grid" aria-label="Layout">
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
</ToggleGroup>

<Toggle variant="outline" size="sm" aria-label="Show archived">
  Archived
</Toggle>
```

**Toggle** and **ToggleGroupItem**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `variant` | `'default' \| 'outline'` | `'default'` | `outline` adds `.sui-toggle--outline`. |
| `size` | `'default' \| 'sm'` | `'default'` | `sm` adds `.sui-toggle--sm`. |

`Toggle` also accepts Radix `Toggle.Root` props (`pressed`, `defaultPressed`, `onPressedChange`,
`disabled`). `ToggleGroupItem` also accepts Radix `ToggleGroup.Item` props (`value` is required).

**ToggleGroup**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `type` | `'single' \| 'multiple'` | — | Required (Radix). Controls whether `value` is a `string` or a `string[]`. |
| `variant` | `'default' \| 'outline'` | — | Applied to every item that does not set its own `variant`. Also written to `data-variant`. |
| `size` | `'default' \| 'sm'` | — | Applied to every item that does not set its own `size`. Also written to `data-size`. |

Also accepts Radix `ToggleGroup.Root` props (`value`, `defaultValue`, `onValueChange`, `disabled`,
`rovingFocus`, `loop`, `orientation`).

`toggleVariants({ variant, size })` returns the toggle class string, for styling another element to look
like a toggle.

Styling hooks: `data-slot="toggle"`, `data-slot="toggle-group"`, `data-slot="toggle-group-item"`,
`.sui-toggle`, `.sui-toggle-group`, `[data-state='on']`.

## NumberInput

A numeric field with stepper buttons, arrow-key stepping, range clamping, fixed decimal places, and a
locale-aware decimal separator and thousands grouping. It is a text input with `role="spinbutton"`, not
`<input type="number">`.

```tsx
<Field label="Nightly rate">
  <NumberInput name="rate" min={0} precision={2} step={5} prefix="$" suffix="AUD" thousands locale="en-AU" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `number \| null` | — | Controlled value. `null` means empty. Leave it `undefined` for an uncontrolled field. |
| `defaultValue` | `number` | — | Initial value while uncontrolled. |
| `onValueChange` | `(value: number \| null) => void` | — | Called while typing with the parsed number, or `null` if the text is not a number yet. Also called on blur and on each step. |
| `min` | `number` | — | Lower bound, applied on blur and when stepping. Sets `aria-valuemin`. |
| `max` | `number` | — | Upper bound, applied on blur and when stepping. Sets `aria-valuemax`. |
| `step` | `number` | `1` | Amount added or subtracted by the arrow keys and the stepper buttons. |
| `precision` | `number` | — | Decimal places kept on blur (`2` for money, `0` for a count). While the field is not focused, the value is shown with exactly this many decimals. |
| `locale` | `string` | runtime locale | BCP 47 locale for the decimal separator and grouping (`'de-DE'` shows `1.250,5`). Pass it when server rendering so the server and browser match. |
| `prefix` | `ReactNode` | — | Content before the number (`aria-hidden`). |
| `suffix` | `ReactNode` | — | Content after the number. |
| `thousands` | `boolean` | `false` | Groups thousands while the field is not focused. |
| `steppers` | `boolean` | `true` | Shows the increase and decrease buttons. `false` hides them, and the arrow keys still step. |
| `wrapperClassName` | `string` | — | Class for the bordered wrapper. |
| `name` | `string` | — | Adds a hidden input holding the plain number. |
| `form` | `string` | — | Passed to both the visible input and the hidden input. |

Also accepts all `<input>` props except `value`, `defaultValue`, `onChange`, `type`, `prefix`, `min`,
`max` and `step`. The ref and `className` go to the visible text input.

- Typing keeps only digits, `-`, `.` and the locale's decimal separator. A partial entry such as `-` or
  `1.` stays as typed. A `.` counts as the decimal point even in a comma locale, unless the locale's own
  separator is also present (`1.250,5`).
- While typing, the value is not clamped or rounded. That happens on blur.
- ArrowUp and ArrowDown step from the current value, or from `min` or `0` when the field is empty, and
  the result is clamped. Without `precision`, the result keeps the finer of the step's decimals and the
  value's own (`1.5` stepped by `1` is `2.5`), with floating-point artefacts rounded off (`0.2 + 0.1` is
  `0.3`). A caller's `onKeyDown` runs first, and calling `preventDefault()` in it stops
  the step.
- The stepper buttons are `tabIndex={-1}` with the labels "Increase" and "Decrease". Each is disabled
  once the value reaches the bound it moves toward.
- `inputMode` is `'text'` when the value can be negative (no `min`, or `min < 0`), because phone number
  pads have no minus key. Otherwise it is `'numeric'` when `precision={0}` and `'decimal'` for anything
  else. Pass `inputMode` to override it.
- A controlled field also updates while focused, so a parent can clear it at any time.

Styling hooks: `data-slot="number-input"`, `data-disabled`, `.sui-number`, `.sui-number__input`,
`.sui-number__steppers`, `.sui-number__stepper`, `.sui-input-group__addon`.

## PhoneInput

A phone number with a country picker. The field shows the number spaced for reading. The value is always
E.164 (`+61412345678`).

```tsx
<Field label="Mobile">
  <PhoneInput name="mobile" defaultCountry="AU" preferredCountries={['AU', 'NZ']} />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `string` | — | Controlled value in E.164. `''` means empty. A value with a different country code also switches the selected country. |
| `defaultValue` | `string` | — | Initial E.164 number while uncontrolled. |
| `onValueChange` | `(value: string, parts: { country: Country; national: string }) => void` | — | Called with the E.164 string (`''` when empty) and its parts. `national` is the number without the country code or a trunk `0`. |
| `defaultCountry` | `string` | `'AU'` | ISO 3166 alpha-2 code selected before anything is typed. Read once, when the component mounts. |
| `countries` | `string[]` | all | Limits the list to these alpha-2 codes, in this order. |
| `preferredCountries` | `string[]` | — | Codes moved to the top of the full list. Ignored when `countries` is set. |
| `placeholder` | `string` | `'Phone number'` | Placeholder for the number. |
| `searchPlaceholder` | `string` | `'Search countries…'` | Placeholder for the country search box. |
| `wrapperClassName` | `string` | — | Class for the bordered wrapper. |
| `name` | `string` | — | Adds a hidden input holding the E.164 string. |
| `form` | `string` | — | Passed to both the visible input and the hidden input. |

Also accepts all `<input>` props except `value`, `defaultValue`, `onChange` and `type`. The ref and
`className` go to the number input (`type="tel"`, `inputMode="tel"`, `autoComplete="tel-national"` by
default).

- **Display.** Numbers with country code `+1` are shown as `(415) 555-0123`. Other numbers are grouped
  in threes. Formatting never rejects digits.
- **Trunk zero.** A leading `0` is shown as typed but dropped from the value (`0412 345 678` becomes
  `+61412345678`). Italy, San Marino, Vatican City, Côte d'Ivoire and Congo keep it, because there it
  is part of the number.
- **Pasting.** Text that starts with `+` (paste or autofill) selects the country from its dialling code.
  When several countries share a code, the selected country keeps it if it matches. Otherwise the main
  country for the code is used (`+1` United States, `+7` Russia, `+39` Italy, `+44` United Kingdom,
  `+61` Australia, `+262` Réunion, `+599` Curaçao).
- **Country picker.** The country button is labelled "Country: {name} (+{dial})". The list can be
  searched by name, exact alpha-2 code, or dialling code with or without the `+`. ArrowUp and ArrowDown
  move and Enter picks. After a pick, focus returns to the number input. Backspace in an empty number
  field opens the picker.
- **Length.** Digits beyond what the number can hold are dropped, so the field and the value always
  agree. `+1` numbers keep ten digits after the country code, and a `1` typed in front of ten digits is
  read as the trunk prefix. Other numbers keep at most 15 digits including the country code; a trunk
  `0` does not count.
- The component does not otherwise check whether a number is valid. Validate on the server.

Styling hooks: `data-slot="phone-input"`, `data-disabled`, `.sui-phone`, `.sui-phone__country`,
`.sui-phone__flag`, `.sui-phone__dial`, `.sui-phone__chevron`, `.sui-phone__panel`,
`.sui-phone__option-dial`, plus the `.sui-combobox__*` list classes.

## OtpInput

A one-time code entered one character per box. The boxes behave as one control: typing advances,
Backspace moves back, the arrow keys move between boxes, and pasting a whole code fills every box.

```tsx
'use client'

import { Field, OtpInput } from '@shining-technologies/ui'

export function VerifyCode({ onVerify }: { onVerify: (code: string) => void }) {
  return (
    <Field label="Verification code" description="We sent a 6-digit code to your phone.">
      <OtpInput name="code" length={6} groupEvery={3} autoFocus onComplete={onVerify} />
    </Field>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `length` | `number` | `6` | Number of boxes. |
| `value` | `string` | — | Controlled code. `''` means empty. |
| `defaultValue` | `string` | — | Initial code while uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Called with the characters in box order, leaving out empty boxes. |
| `onComplete` | `(value: string) => void` | — | Called whenever a change leaves every box filled. |
| `type` | `'numeric' \| 'alphanumeric'` | `'numeric'` | `numeric` accepts digits and opens a number pad on phones. `alphanumeric` accepts `A–Z`, `a–z` and `0–9`. |
| `groupEvery` | `number` | — | Adds a gap after every n boxes (`3` gives `123 456`). |
| `masked` | `boolean` | `false` | Shows dots instead of the characters. Masking is done in CSS. |
| `disabled` | `boolean` | from `Field` | Disables every box. |
| `required` | `boolean` | from `Field` | Sets `required` on every box, so an incomplete code blocks a native submission and is announced as required. |
| `autoFocus` | `boolean` | — | Focuses the first box on mount. |
| `name` | `string` | — | Adds a hidden input holding the code. |
| `aria-label` | `string` | `'One-time code'` outside a labelled `Field` | Name of the group. Inside a labelled `Field`, the field label is used. |

Also accepts all `<div>` props except `onChange` and `defaultValue`. The ref goes to the
`role="group"` wrapper.

**Deletion keeps positions.** Clearing the third box of `1234` leaves `1 2 _ 4`. The value is `'124'`,
so a code is complete exactly when `value.length === length`, and `onComplete` only fires then. Typing
into the gap fills it in place. A different value from a controlled parent, such as a reset to `''`, is
laid out again from the first box.

Keyboard: Backspace clears the current box, or the previous box (and moves to it) when the current one is
empty. Delete clears the current box. ArrowLeft and ArrowRight move between boxes. Focusing a box selects
its character. Pasting text at least `length` characters long replaces the whole code, and shorter text
is written from the focused box. The first box has `autoComplete="one-time-code"`, so SMS autofill lands
there. Each box is labelled "Character n of length".

Styling hooks: `data-slot="otp-input"`, `.sui-otp`, `.sui-otp__box`, `.sui-otp__box--masked`,
`[data-gap]`, `[data-filled]`.

## TagsInput

A list of short values typed one after another, such as skills, labels or email recipients. Each value
becomes a removable chip.

```tsx
'use client'

import { Field, TagsInput } from '@shining-technologies/ui'

export function Recipients() {
  return (
    <Field label="Recipients" description="Separate addresses with a comma or semicolon.">
      <TagsInput
        name="recipients"
        delimiters={[',', ';', 'Enter']}
        max={20}
        validate={(tag) => (tag.includes('@') ? null : 'Enter an email address.')}
      />
    </Field>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `string[]` | — | Controlled tags. `[]` means empty. |
| `defaultValue` | `string[]` | `[]` | Initial tags while uncontrolled. |
| `onValueChange` | `(value: string[]) => void` | — | Called when tags are added or removed. |
| `placeholder` | `string` | `'Add a tag…'` | Placeholder for the text box. Once `max` is reached it reads "Limit of {max} reached". |
| `max` | `number` | — | Maximum number of tags. Once reached, the text box is disabled. |
| `delimiters` | `string[]` | `[',', 'Enter']` | `KeyboardEvent.key` values that finish a tag. The same characters split pasted text (`'Enter'` and `'Tab'` count as a line break and a tab), and a line break always splits. |
| `validate` | `(tag: string, existing: string[]) => string \| null` | — | Return a message to reject a typed tag, or `null` to accept it. |
| `dedupe` | `boolean` | `true` | Silently ignores a tag that is already in the list. |
| `disabled` | `boolean` | from `Field` | Disables the text box and the remove buttons. |
| `required` | `boolean` | from `Field` | Sets `aria-required` on the text box. The browser does not enforce it, because the tags are submitted through hidden inputs. |
| `name` | `string` | — | Adds one hidden input per tag. |
| `aria-label` | `string` | `'Tags'` outside a labelled `Field` | Name of the text box and the chip list. Inside a labelled `Field`, the field label is used. |

Also accepts all `<div>` props except `onChange` and `defaultValue`. The ref and `className` go to the
bordered `.sui-tags` box. Other `<div>` props are spread onto that box as well, so passing `onMouseDown`
replaces the default click-to-focus behaviour.

- Tags are trimmed, and empty tags are ignored. Leaving the text box also adds whatever was typed.
- Backspace in an empty text box removes the last tag. An Enter that confirms an IME composition does not
  finish a tag.
- A pasted list is split at the delimiters, including any text already typed around the cursor.
- A typed tag that fails `validate` shows the message below the box (`role="alert"`), linked by
  `aria-describedby`, and sets `aria-invalid` on the text box. Pasted tags that fail are left out of the
  list, and the first of them goes back into the text box with its message so it can be corrected.
- Each chip has a "Remove {tag}" button, after which focus returns to the text box.

Styling hooks: `data-slot="tags-input"`, `data-disabled`, `.sui-tags-wrap`, `.sui-tags`,
`.sui-tags__list`, `.sui-tags__chip`, `.sui-tags__remove`, `.sui-tags__input`, `.sui-tags__error`.

## ColorInput

A colour entered three ways: the native colour picker, a hex text field, or a row of preset swatches.

```tsx
<Field label="Brand colour">
  <ColorInput name="brandColour" defaultValue="#0f766e" swatches={['#0f766e', '#1d4ed8', '#be123c']} />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `string` | — | Controlled hex colour. `''` means no colour. |
| `defaultValue` | `string` | `'#000000'` | Initial colour while uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Called with a normalised lowercase `#rrggbb` string. Never called with `''`. |
| `swatches` | `string[]` | `DEFAULT_SWATCHES` | Preset colours. Pass `[]` to hide them. |
| `disabled` | `boolean` | from `Field` | Disables the picker, the text field and the presets. |
| `required` | `boolean` | from `Field` | Sets `required` on the hex field, so an empty colour blocks a native submission and is announced as required. The native picker always holds a colour. |
| `name` | `string` | — | Adds a hidden input holding `#rrggbb`, or `''` when there is no colour. |
| `aria-label` | `string` | `'Colour'` | Name of the picker outside a labelled `Field`. Also used to label the hex field ("{label} hex value") and the preset group ("{label} presets"). Inside a labelled `Field`, without this prop, all three take the field label instead ("Brand colour hex value", "Brand colour presets"). |

Also accepts all `<div>` props except `onChange` and `defaultValue`. `className` goes to the outer
wrapper. The ref goes to the native `<input type="color">`.

- The hex field accepts `#rgb` or `#rrggbb`, with or without the `#`. It updates the value as soon as the
  text is a valid colour. While the text is not valid, the field has `aria-invalid`, and on blur it goes
  back to the current value.
- Each preset is a button labelled with its hex value, with `aria-pressed` set on the one that matches the
  current colour.
- An uncontrolled field starts at `#000000`, so it cannot be empty. Use a controlled `value=""` for an
  optional colour.

Styling hooks: `data-slot="color-input"`, `.sui-color`, `.sui-color__control`, `.sui-color__swatch`
(`[data-empty]`), `.sui-color__native`, `.sui-color__hex`, `.sui-color__swatches`, `.sui-color__preset`
(`[data-selected]`).

## RatingInput

A star rating that works like a slider: the arrow keys change it, and screen readers announce it as
"3 of 5 stars". With `readOnly` it becomes a display-only image.

```tsx
<Field label="How was your stay?">
  <RatingInput name="rating" allowHalf />
</Field>

<RatingInput value={4.5} allowHalf readOnly size="sm" caption="128 reviews" />
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `number` | — | Controlled rating. `0` means not rated. |
| `defaultValue` | `number` | `0` | Initial rating while uncontrolled. |
| `onValueChange` | `(value: number) => void` | — | Called with the new rating, clamped to `0`–`max`. |
| `max` | `number` | `5` | Number of stars. |
| `allowHalf` | `boolean` | `false` | Allows half stars from the keyboard (steps of 0.5) and from clicking the left half of a star. |
| `clearable` | `boolean` | `true` | Clicking the current rating resets it to `0`. |
| `readOnly` | `boolean` | `false` | Display only: `role="img"` with the label "{value} out of {max} {unit}s", not focusable, and no pointer or keyboard input. |
| `disabled` | `boolean` | from `Field` | Sets `aria-disabled` and removes the control from the tab order. |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Star size. |
| `unit` | `string` | `'star'` | Word used in the announced text. An `s` is appended. |
| `caption` | `string` | — | Text shown beside the stars. |
| `name` | `string` | — | Adds a hidden input holding the number. |

Also accepts all `<div>` props except `onChange` and `defaultValue`. The ref goes to the `role="slider"`
element. Outside a labelled `Field`, its name defaults to "Rating". Pass `aria-label` to set your own.

Keyboard: ArrowRight and ArrowUp add a step, ArrowLeft and ArrowDown subtract one, Home sets `0`, and End
sets `max`. A caller's `onKeyDown` runs first, and calling `preventDefault()` in it cancels the change.

Styling hooks: `data-slot="rating-input"`, `data-disabled`, `.sui-rating`, `.sui-rating--sm`,
`.sui-rating--lg`, `.sui-rating__stars`, `.sui-rating__star`, `.sui-rating__ghost`, `.sui-rating__fill`,
`.sui-rating__hit`, `.sui-rating__caption`.

## Slider

A single value, or a range with one thumb per value, built on Radix `Slider`. The number of thumbs comes
from the length of `value` or `defaultValue`, so no range flag is needed.

```tsx
<Field label="Price" description="Per night, AUD.">
  <Slider name="price" defaultValue={[80, 240]} min={0} max={500} step={10} />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| — | — | — | Radix `Slider.Root` props: `value` / `defaultValue` (`number[]`), `onValueChange`, `onValueCommit`, `min`, `max`, `step`, `minStepsBetweenThumbs`, `orientation`, `inverted`, `name`, `disabled`, `dir`, and all `<span>` props. |

- One thumb is rendered per value. With neither `value` nor `defaultValue`, one thumb is rendered.
- Inside a `Field`, each thumb is named by the field label (`aria-labelledby`), described by its help text
  and error, and marked invalid with the field. The first thumb receives the field id. In a two-thumb
  range the thumbs are announced as "{label} Minimum" and "{label} Maximum". With more thumbs they are
  "Value n of count".
- `aria-label` and `aria-labelledby` passed to `Slider` are forwarded to the thumbs, which is how you name
  a slider outside a `Field`. Your `aria-describedby` is combined with the field's.
- A required field is exposed only as `data-required`. A slider always holds a value, and `aria-required`
  is not valid on `role="slider"`.
- Keyboard behaviour is Radix's: arrow keys step, PageUp and PageDown take larger steps, and Home and End
  jump to the ends.

Styling hooks: `data-slot="slider"`, `data-required`, `data-disabled`, `data-orientation`, `.sui-slider`,
`.sui-slider__track`, `.sui-slider__range`, `.sui-slider__thumb`.

## FileUpload

A drop zone with a file list. The real control is a native `<input type="file">`, and the styled area is
its label, so keyboard access and the operating system's file picker work as usual. The component
validates files and reports rejections to you. How to show a rejection is up to you.

```tsx
'use client'

import { Field, FileUpload } from '@shining-technologies/ui'
import { useState } from 'react'

export function Attachments() {
  const [error, setError] = useState<string>()
  return (
    <Field label="Attachments" error={error}>
      <FileUpload
        name="attachments"
        multiple
        accept=".pdf,image/*"
        maxSize={10_000_000}
        maxFiles={5}
        onFilesAccepted={() => setError(undefined)}
        onFileRejected={(file, reason) =>
          setError(
            reason === 'size'
              ? `${file.name} is larger than 10 MB.`
              : reason === 'type'
                ? `${file.name} is not a PDF or an image.`
                : 'You can attach up to 5 files.',
          )
        }
      />
    </Field>
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `accept` | `string` | — | Like the native `accept` attribute (`'image/*,.pdf'`). It is also checked on dropped files: extensions against the file name, `type/*` against the MIME prefix, anything else against the exact MIME type. |
| `multiple` | `boolean` | `false` | Allows several files. Without it, a new file replaces the current one. |
| `maxSize` | `number` | — | Maximum size in bytes. Larger files are rejected. |
| `maxFiles` | `number` | `1` without `multiple`, unlimited with it | Files beyond this count are rejected with `'count'`. Without `multiple` the limit is 1 whatever this says. |
| `disabled` | `boolean` | `false` | Disables the zone and the remove buttons. A disabled `Field` also disables it. |
| `required` | `boolean` | from `Field` | Sets `required` on the file input while nothing is selected, so an empty selection blocks a native submission and is announced as required. |
| `value` | `UploadItem[]` | — | Controlled list. `[]` means empty. Without it, the component keeps its own list, which starts empty. |
| `onValueChange` | `(items: UploadItem[]) => void` | — | Called when files are added or removed. |
| `onFilesAccepted` | `(files: File[]) => void` | — | Called with the files added to the selection. |
| `onFileRejected` | `(file: File, reason: 'size' \| 'type' \| 'count') => void` | — | Called once for each rejected file. Checks run in the order type, size, count. |
| `children` | `ReactNode` | "Choose a file or drag it here" | Replaces the text inside the drop zone. |
| `hint` | `ReactNode` | "Up to {size}" when `maxSize` is set | Replaces the hint under the text. Linked to the file input with `aria-describedby`. |
| `name` | `string` | — | Adds a hidden file input holding the selected files. |

Also accepts all `<div>` props except `onChange`. The ref and `className` go to the outer wrapper.

`UploadItem` is `{ file: File; progress?: number; error?: string }`. To show upload progress, control
`value` and set `progress` (0–100) on each item. An item with `error` shows the error instead of the file
size, and no progress bar. Each row has a "Remove {file name}" button.

A native `form.reset()` does not clear the list, because the list is React state. Reset `value` instead,
or remount the component with a new `key`.

Styling hooks: `data-slot="file-upload"`, `.sui-dropzone-wrap`, `.sui-dropzone`, `.sui-dropzone--over`,
`[data-disabled]`, `.sui-dropzone__input`, `.sui-dropzone__icon`, `.sui-dropzone__label`,
`.sui-dropzone__action`, `.sui-dropzone__hint`, `.sui-dropzone__hint-slot` (wraps a custom `hint`,
`display: contents`), `.sui-dropzone__list`, `.sui-dropzone__file`,
`.sui-dropzone__file-name`, `.sui-dropzone__file-meta`, `.sui-dropzone__file-bar`.

## ImageUpload

A grid of image thumbnails with an "add" tile, for photos and avatars. Previews use object URLs and are
released when an image is removed.

```tsx
<Field label="Photos">
  <ImageUpload name="photos" maxFiles={6} maxSize={5_000_000} />
</Field>

<Field label="Profile picture">
  <ImageUpload name="avatar" multiple={false} shape="circle" />
</Field>
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `value` | `ImageItem[]` | — | Controlled list. `[]` means empty. Pass existing images as items with only `url` (and `name`). |
| `onValueChange` | `(items: ImageItem[]) => void` | — | Called when images are added or removed. |
| `onFilesAccepted` | `(files: File[]) => void` | — | Called with the files added to the list. |
| `onFileRejected` | `(file: File, reason: 'size' \| 'type' \| 'count') => void` | — | Called once for each rejected file. |
| `accept` | `string` | `'image/*'` | Narrows the accepted types (`'image/png,image/jpeg'`). Files whose MIME type does not start with `image/` are always rejected. |
| `multiple` | `boolean` | `true` | Allows several images. With `false`, the add tile is hidden once one image is present. |
| `maxSize` | `number` | — | Maximum size in bytes. |
| `maxFiles` | `number` | `1` without `multiple`, unlimited with it | Maximum number of images; more are rejected with `'count'`. The add tile is hidden once it is reached. Without `multiple` the limit is 1 whatever this says. |
| `shape` | `'square' \| 'circle'` | `'square'` | Tile shape. |
| `disabled` | `boolean` | `false` | Disables adding and removing. A disabled `Field` also disables it. |
| `required` | `boolean` | from `Field` | Sets `required` on the file input while there are no images, so an empty field blocks a native submission and is announced as required. |
| `hint` | `ReactNode` | "Up to {maxFiles} images, {size} each" when `maxSize` is set | Replaces the hint below the grid. Linked to the file input with `aria-describedby`. |
| `children` | `ReactNode` | "Add images", or "Add more" once there are images | Text in the add tile. |
| `name` | `string` | — | Adds a hidden file input holding the newly added files. Items that only have a `url` are not submitted. |

Also accepts all `<div>` props except `onChange`. The ref and `className` go to the outer element, which
is also the drop target.

When the grid is full, the add tile is hidden but stays in the document with its file input disabled.
That input carries the field id, description and invalid state, so the `Field` label and
`aria-describedby` never point at a missing element.

`ImageItem`:

| Key | Type | Description |
| --- | ---- | ----------- |
| `url` | `string` | Required. Thumbnail source: an object URL or a remote URL. |
| `file` | `File` | The file. Absent for an image that is already on the server. |
| `name` | `string` | Used as the `alt` text and in the "Remove {name}" label. Without it, "Image n" is used. |
| `size` | `number` | Shown as the caption. |
| `progress` | `number` | 0–100 while uploading. |
| `error` | `string` | Shown as the caption, with `data-error` on the tile. |

**Object URLs.** The component revokes only the object URLs it created. It revokes each one when its item
leaves the value, and on unmount if the component is uncontrolled. A controlled parent keeps its items
across unmounts, for example between wizard steps, and the thumbnails still work when the component
mounts again. If you discard such items for good, call `URL.revokeObjectURL(item.url)`. URLs you created
yourself, and remote URLs, are never revoked.

Styling hooks: `data-slot="image-upload"`, `data-shape`, `data-disabled`, `.sui-images`,
`.sui-images__grid`, `.sui-images__grid--over`, `.sui-images__tile` (`[data-error]`), `.sui-images__img`,
`.sui-images__progress`, `.sui-images__caption`, `.sui-images__remove`, `.sui-images__add`,
`.sui-images__add-label`.

## FloatingFormActions

A save bar for long forms, so the Save and Discard buttons stay visible while the user scrolls. It is not
rendered at all while `visible` is `false`.

```tsx
'use client'

import { FloatingFormActions } from '@shining-technologies/ui'

export function SaveBar({
  dirtyCount,
  saving,
  onSave,
  onDiscard,
}: {
  dirtyCount: number
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <FloatingFormActions
      visible={dirtyCount > 0}
      message={`${dirtyCount} unsaved changes`}
      submitting={saving}
      onSubmit={onSave}
      onCancel={onDiscard}
    />
  )
}
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `visible` | `boolean` | `true` | Renders the bar. Usually the form's dirty flag. |
| `message` | `ReactNode` | — | Text on the left, for example "3 unsaved changes". |
| `submitLabel` | `ReactNode` | `'Save changes'` | Submit button text. |
| `cancelLabel` | `ReactNode` | `'Discard'` | Cancel button text. |
| `onSubmit` | `() => void` | — | Click handler for the submit button. |
| `onCancel` | `() => void` | — | Click handler for the cancel button. The cancel button only appears when this is set. |
| `submitting` | `boolean` | `false` | Disables both buttons, shows a spinner in the submit button and marks it `aria-busy`. |
| `disabled` | `boolean` | `false` | Disables the submit button only. |
| `position` | `'sticky' \| 'fixed'` | `'sticky'` | `sticky` scrolls with the page. `fixed` pins the bar to the viewport. |
| `children` | `ReactNode` | — | Replaces both buttons. |

Also accepts all `<div>` props. The ref goes to the bar.

The built-in buttons are `type="button"`: they call `onSubmit` and `onCancel` and do not submit a
surrounding `<form>`. To submit a native form, pass your own button as `children`, for example
`<Button type="submit" form="listing-form">Save</Button>`.

Styling hooks: `data-slot="floating-form-actions"`, `.sui-form-actions`, `.sui-form-actions--sticky`,
`.sui-form-actions--fixed`, `.sui-form-actions__message`, `.sui-form-actions__buttons`.

## Helpers

### scorePassword

```ts
scorePassword(password: string, rules?: PasswordRule[]): PasswordStrengthResult
// { score: 0 | 1 | 2 | 3 | 4, label: string, passed: string[], failed: string[] }
```

The score is the number of rules passed, plus 1 for 16 or more characters, then capped at 4. A password
under 8 characters scores at most 1, and an empty password scores 0. `passed` and `failed` hold rule ids.

`DEFAULT_PASSWORD_RULES`: `length` (at least 12 characters), `case` (upper and lower case), `number`,
`symbol`. A `PasswordRule` is `{ id: string; label: string; test: (password: string) => boolean }`.

```tsx
import { DEFAULT_PASSWORD_RULES, type PasswordRule } from '@shining-technologies/ui'

// Module scope, so the array keeps the same identity between renders.
export const SIGNUP_RULES: PasswordRule[] = [
  ...DEFAULT_PASSWORD_RULES,
  { id: 'no-spaces-at-ends', label: 'No leading or trailing spaces', test: (p) => p === p.trim() },
]
```

### normalizeHex and DEFAULT_SWATCHES

`normalizeHex(value)` returns a lowercase `#rrggbb` string, expanding `#abc` to `#aabbcc` and adding a
missing `#`. Anything that is not a 3- or 6-digit hex colour returns `null`. `DEFAULT_SWATCHES` is the ten
colours `ColorInput` shows by default.

### formatBytes

`formatBytes(bytes, decimals = 1)` formats a size with decimal units (1 KB = 1000 B): `formatBytes(1_536_000)`
returns `'1.5 MB'`, and `formatBytes(512)` returns `'512 B'`.

### Countries

`COUNTRIES` lists 200+ countries as `Country` objects, sorted by name: `{ code: 'AU', name: 'Australia',
dial: '61', flag: '🇦🇺' }`.

| Function | Returns |
| -------- | ------- |
| `countryByCode(code)` | The country with this alpha-2 code (case-insensitive), or `undefined`. |
| `countryByDial(value)` | The country for the longest dialling code that `value` starts with (non-digits are ignored). Shared codes resolve to the main country, as described for [PhoneInput](#phoneinput). |
| `flagFor(code)` | The regional-indicator flag emoji for an alpha-2 code. |

Every helper in this section comes from a module without `'use client'`, so it can be used on the
server, in Server Components and Server Actions alike.

## Controlled and uncontrolled

Every stateful control follows one rule: **it is controlled exactly when `value` is not `undefined`.**
Each control also has an explicit empty value, which a controlled parent uses to clear it:

| Control | Empty value | Uncontrolled initial value |
| ------- | ----------- | -------------------------- |
| `Combobox` | `null` | `defaultValue`, or `null` |
| `MultiCombobox`, `TagsInput` | `[]` | `defaultValue`, or `[]` |
| `NumberInput` | `null` | `defaultValue`, or empty |
| `PhoneInput`, `OtpInput` | `''` | `defaultValue`, or empty |
| `ColorInput` | `''` | `defaultValue`, or `'#000000'` |
| `RatingInput` | `0` | `defaultValue`, or `0` |
| `FileUpload`, `ImageUpload` | `[]` | empty (no `defaultValue`) |

`onValueChange` is called in both modes. When you use a form library, keep the empty value in its
defaults (`null`, not `undefined`), or the control becomes uncontrolled and stops following the form
state.

`Input`, `InputGroup`, `Textarea` and `PasswordInput` are native inputs and follow React's usual
`value` / `defaultValue` rules. The Radix-based controls (`Checkbox`, `Switch`, `RadioGroup`, `Select`,
`Slider`, `Toggle`, `ToggleGroup`) follow Radix's rules: `checked`/`defaultChecked` or
`value`/`defaultValue`, with `onCheckedChange` or `onValueChange`.

## React Hook Form

Native inputs forward their ref to the `<input>` and pass `name`, `onChange` and `onBlur` through, so
`register` works with them directly: `Input`, `InputGroup`, `Textarea` and `PasswordInput`. The strength
meter follows `reset()` and `setValue()`.

Every other control reports its value through `onValueChange` or `onCheckedChange` and ignores a native
`onChange`, so connect it with `Controller`. Pass `field.ref` so that `shouldFocusError` can focus the
control. It is focusable for `NumberInput` and `PhoneInput` (the text input), `Combobox` and
`MultiCombobox` (the trigger), the Radix controls, and `ColorInput` (the native picker).

```tsx
'use client'

import {
  Checkbox,
  Combobox,
  Field,
  FloatingFormActions,
  Input,
  NumberInput,
  PasswordInput,
  PhoneInput,
  TagsInput,
  type ComboboxOption,
} from '@shining-technologies/ui'
import { Controller, useForm } from 'react-hook-form'

type Values = {
  email: string
  password: string
  phone: string
  seats: number | null
  ownerId: string | null
  skills: string[]
  terms: boolean
}

export function AccountForm({ owners, onSave }: { owners: ComboboxOption[]; onSave: (values: Values) => Promise<void> }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({
    // Empty values, not undefined, so every control stays controlled.
    defaultValues: { email: '', password: '', phone: '', seats: 1, ownerId: null, skills: [], terms: false },
  })

  return (
    <form id="account" onSubmit={handleSubmit(onSave)} noValidate>
      <Field label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register('email', { required: 'Enter an email address.' })} />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <PasswordInput
          strength
          {...register('password', { minLength: { value: 12, message: 'Use at least 12 characters.' } })}
        />
      </Field>

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Field label="Mobile">
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
        name="seats"
        control={control}
        rules={{ required: 'Enter a number of seats.' }}
        render={({ field, fieldState }) => (
          <Field label="Seats" error={fieldState.error?.message}>
            <NumberInput
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              min={1}
              precision={0}
            />
          </Field>
        )}
      />

      <Controller
        name="ownerId"
        control={control}
        render={({ field }) => (
          <Field label="Owner">
            <Combobox ref={field.ref} options={owners} value={field.value} onValueChange={field.onChange} clearable />
          </Field>
        )}
      />

      <Controller
        name="skills"
        control={control}
        render={({ field }) => (
          <Field label="Skills">
            <TagsInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />
          </Field>
        )}
      />

      <Controller
        name="terms"
        control={control}
        rules={{ validate: (accepted) => accepted || 'Accept the terms to continue.' }}
        render={({ field, fieldState }) => (
          <Field label="I accept the terms" orientation="horizontal" error={fieldState.error?.message} required>
            <Checkbox
              ref={field.ref}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
            />
          </Field>
        )}
      />

      <FloatingFormActions
        visible={isDirty}
        submitting={isSubmitting}
        onCancel={() => reset()}
        onSubmit={handleSubmit(onSave)}
      />
    </form>
  )
}
```

Notes:

- `Field` gets its error from `errors.<name>?.message` or `fieldState.error?.message`. It wires
  `aria-invalid` and `aria-describedby` to the control for you.
- `Combobox` and `MultiCombobox` do not accept `onBlur`, so React Hook Form's `onBlur` and `onTouched`
  validation modes do not see them. Validate them on change or on submit.
- `TagsInput`, `OtpInput`, `RatingInput` and `ColorInput` pass `onBlur` to a wrapper element. React's
  `onBlur` bubbles, so it fires when focus leaves any part of the control.
- For `Select`, `RadioGroup` and `Switch`, use `value`/`onValueChange` or `checked`/`onCheckedChange` the
  same way. `Slider` values are `number[]`.
- `FileUpload` and `ImageUpload` take `value={field.value}` and `onValueChange={field.onChange}` with an
  `UploadItem[]` or `ImageItem[]` default of `[]`.
- To give the control a specific id (for example the field name), pass `htmlFor` to `Field`.

## Native forms and Server Actions

Every control can take part in a plain `<form>`: `name` adds what the browser submits. Controls whose
visible element is not a native input (a button, a group of boxes, formatted text) render **hidden
inputs** that hold the value in a server-friendly format. You can render the whole form from a Server
Component and post it to a Server Action.

```tsx
// app/listings/new/page.tsx — a Server Component
import { Button, Checkbox, Combobox, Field, ImageUpload, Input, NumberInput, PhoneInput, TagsInput } from '@shining-technologies/ui'
import { createListing } from './actions'

export default function NewListingPage() {
  return (
    <form action={createListing}>
      <Field label="Title" required>
        <Input name="title" required />
      </Field>
      <Field label="Nightly rate">
        <NumberInput name="rate" min={0} precision={2} prefix="$" locale="en-AU" />
      </Field>
      <Field label="Contact number">
        <PhoneInput name="phone" defaultCountry="AU" />
      </Field>
      <Field label="Region">
        <Combobox
          name="region"
          options={[
            { value: 'syd', label: 'Sydney' },
            { value: 'mel', label: 'Melbourne' },
          ]}
        />
      </Field>
      <Field label="Amenities">
        <TagsInput name="amenities" />
      </Field>
      <Field label="Photos">
        <ImageUpload name="photos" maxFiles={6} />
      </Field>
      <Field label="Allow pets" orientation="horizontal">
        <Checkbox name="pets" />
      </Field>
      <Button type="submit">Create listing</Button>
    </form>
  )
}
```

```ts
// app/listings/new/actions.ts
'use server'

export async function createListing(formData: FormData) {
  const title = String(formData.get('title') ?? '')
  const rateText = String(formData.get('rate') ?? '') // '1250.5' or ''
  const rate = rateText === '' ? null : Number(rateText)
  const phone = String(formData.get('phone') ?? '') // '+61412345678' or ''
  const region = String(formData.get('region') ?? '') || null // 'syd' or null
  const amenities = formData.getAll('amenities').map(String) // one entry per tag
  const pets = formData.get('pets') === 'on' // absent when unchecked
  const photos = formData
    .getAll('photos')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  // Validate everything here: the browser only enforces `required` on native inputs.
}
```

### Values submitted by name

| Control | What `name` submits | Format |
| ------- | ------------------- | ------ |
| `Input`, `InputGroup`, `Textarea`, `PasswordInput` | The input itself | The text. |
| `NumberInput` | A hidden input (the visible text has no `name`) | The plain number with `.` as the decimal point, not grouped (`'1250.5'`). `''` when empty. Rounding and clamping happen on blur, so the field must lose focus first. |
| `PhoneInput` | A hidden input | E.164 (`'+61412345678'`). `''` when empty. |
| `Combobox` | A hidden input | The selected `value`. `''` when nothing is selected. |
| `MultiCombobox` | One hidden input per selected value | Read with `formData.getAll(name)`. Nothing is submitted when the selection is empty. |
| `TagsInput` | One hidden input per tag | Read with `formData.getAll(name)`. Nothing is submitted when there are no tags. |
| `OtpInput` | A hidden input | The characters in box order, leaving out empty boxes. Check `length` on the server. |
| `ColorInput` | A hidden input | Lowercase `#rrggbb`. `''` when there is no colour. |
| `RatingInput` | A hidden input | The number as a string (`'3'`, `'3.5'`). `'0'` when not rated. |
| `FileUpload` | A hidden `<input type="file">` holding the selection | `File` entries. Read with `formData.getAll(name)`. An empty selection may arrive as one empty `File` (size 0), so filter those out. |
| `ImageUpload` | A hidden `<input type="file">` | The newly added `File`s only. Images passed in as `url`-only items are not submitted. |
| `Checkbox`, `Switch` | A hidden checkbox rendered by Radix inside a `<form>` | `value` (default `'on'`) when checked. Absent when unchecked. |
| `RadioGroup` | Hidden radio inputs rendered by Radix | The selected item's `value`. Absent when nothing is selected. |
| `Select` | A hidden native `<select>` rendered by Radix | The selected `value`. `''` when nothing is selected. |
| `Slider` | One hidden input per thumb, rendered by Radix | The value as a string. A single thumb uses `name`. A range uses `name[]` for each thumb. |
| `Toggle`, `ToggleGroup` | Nothing | Mirror the state into your own hidden input if you need to submit it. |

Details that apply to all of them:

- **Disabled controls submit nothing.** The hidden inputs are disabled together with the control, just as
  native inputs are.
- **`required` is only enforced by the browser on native inputs.** It works for:
  - `Input`, `InputGroup`, `Textarea`, `PasswordInput`, `NumberInput` and `PhoneInput` (the visible input).
  - `OtpInput` (every box, so an incomplete code is blocked too) and `ColorInput` (the hex field).
  - `FileUpload` and `ImageUpload` (the file input, while nothing is selected).
  - `Checkbox`, `Switch`, `RadioGroup` and `Select`, when `required` reaches the Radix root.

  `Combobox`, `MultiCombobox`, `TagsInput` and `RatingInput` keep their values in hidden inputs, which
  cannot be required, so the browser does not block them. Check every value in the Server Action anyway.
- **The `form` attribute** (for a control outside its `<form>` element) is supported by `NumberInput` and
  `PhoneInput`, and by the Radix controls. The other controls' hidden inputs must be inside the `<form>`.
- **`form.reset()`** restores native inputs and `PasswordInput`. Controls that keep their value in React
  state (`NumberInput`, `PhoneInput`, `Combobox`, `MultiCombobox`, `TagsInput`, `OtpInput`, `ColorInput`,
  `RatingInput`, `FileUpload`, `ImageUpload`) are not reset. Remount the form with a new `key`, or control
  the values.

To show errors returned by the action (React 19), make the form a client component and pass the action's
state to `Field`:

```tsx
'use client'

import { Button, Field, Input } from '@shining-technologies/ui'
import { useActionState } from 'react'
import { saveProfile, type ProfileState } from './actions'

const initial: ProfileState = { errors: {} }

export function ProfileForm() {
  const [state, formAction, pending] = useActionState(saveProfile, initial)
  return (
    <form action={formAction}>
      <Field label="Display name" error={state.errors.name} required>
        <Input name="name" required />
      </Field>
      <Button type="submit" disabled={pending}>
        Save
      </Button>
    </form>
  )
}
```

Here `saveProfile` has the signature `(state: ProfileState, formData: FormData) => Promise<ProfileState>`,
and `ProfileState` is `{ errors: { name?: string } }`.

## Accessibility

- **One field, one set of attributes.** Inside a `Field`, each control receives its name, description,
  invalid state and disabled state from the field. Controls that `<label for>` can target (inputs,
  buttons) get the field id. Controls that it cannot name (`RadioGroup`, `Slider` thumbs, `RatingInput`,
  the `OtpInput` group, the chip list of `TagsInput`, the `ColorInput` hex field and presets, and the
  combobox listbox) are named with `aria-labelledby`. The radio group, the first slider thumb and the
  rating also carry the field id, and clicking the label focuses them. An explicit `aria-label` on the
  control takes precedence over the field label.
- **No nested controls.** The combobox clear and chip remove buttons sit beside the trigger, in a
  layer over it, never inside it.
- **Required.** The `*` in the label is decorative (`aria-hidden`). The required state reaches assistive
  technology through the control:

  | How it is exposed | Controls |
  | ----------------- | -------- |
  | Native `required` attribute | `Input`, `InputGroup`, `Textarea`, `PasswordInput`, `NumberInput`, `PhoneInput`, `OtpInput` (every box), `ColorInput` (the hex field) |
  | Native `required` while nothing is selected | `FileUpload`, `ImageUpload` |
  | `aria-required`, plus `required` on the hidden input Radix renders | `Checkbox`, `Switch`, `RadioGroup` |
  | `aria-required` only | `SelectTrigger`, `Combobox`, `MultiCombobox`, `TagsInput` |
  | `data-required` only (a slider always has a value) | `Slider` |
  | Not exposed | `RatingInput`: `aria-required` is not valid on `role="slider"`. Say "required" in the label text or description. |

  Each of `OtpInput`, `TagsInput`, `ColorInput`, `FileUpload` and `ImageUpload` also takes its own
  `required` prop, which takes precedence over the field.

- **Errors.** `Field` error messages are linked with `aria-describedby` and are not live regions. On
  submit, move focus to the first invalid control (React Hook Form's `shouldFocusError` does this when
  `field.ref` is passed). `TagsInput` validation messages use `role="alert"`.
- **Focus.** All boxed controls share one focus treatment: the border takes the ring colour and a soft
  halo is drawn around it. Buttons inside a box (show/hide, country, steppers, chip remove) show focus
  as a tint instead of a second ring. The border and halo are the theme tokens
  `--sui-field-focus-border` and `--sui-field-focus-ring`, and `--sui-field-invalid-ring` is used when the
  control is invalid. Set `--sui-field-focus-ring: none` for a border-only focus. See
  [theming.md](../theming.md).
- **Keyboard.** Popover lists (`Combobox`, `MultiCombobox`, the `PhoneInput` country picker) keep focus
  in their search box and use `aria-activedescendant`. `NumberInput` and `RatingInput` step with the arrow
  keys. `OtpInput` moves between boxes with the arrow keys and Backspace. Stepper buttons are left out of
  the tab order because the arrow keys do the same thing.
- **Announcements.** `PasswordInput` announces Caps Lock with `role="status"`, and the show/hide button
  reports its state with `aria-pressed`. The strength verdict and rule states are text, not colour.
  `RatingInput` announces "n of max stars".
- **Decorative parts.** Icons, the `InputGroup` prefix, the strength bars, flags and the textarea counter
  are `aria-hidden`.

See [accessibility.md](../accessibility.md) for the kit-wide approach.

## Related

- [Getting started](../getting-started.md): installing the package and importing `styles.css`.
- [Next.js](../nextjs.md): Server Components, client components and Server Actions.
- [Theming](../theming.md): colour, radius and the `--sui-field-*` focus tokens.
- [Date and time](date-time.md): `DateField`, `TimeField`, `DateTimeField` and `Calendar`, which join a
  `Field` the same way.
- [Button](button.md): the button used by `FloatingFormActions` and for submit buttons.
- [Overlay](overlay.md): `Popover` (used by the comboboxes and the phone picker) and
  `PortalContainerProvider`.
- [Feedback](feedback.md): `Spinner` and `Progress`, used for loading and upload progress.
- [Accessibility](../accessibility.md) and [Troubleshooting](../troubleshooting.md).

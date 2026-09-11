import {
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from '@shining-technologies/ui-kit-react'
import { useId } from 'react'

/*
 * Labelled controls for the gallery's own panels.
 *
 * Built from the kit rather than from bare `<select>` and `<input>` elements:
 * a gallery whose controls do not look like the library it demonstrates is
 * arguing against itself.
 */

/** A picker for lists long enough that a segmented control would wrap. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger id={id} className="pg__select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

/**
 * Two or three mutually exclusive values, all visible at once.
 *
 * Not a `<Field>`: the group has no single form control for a `for` attribute
 * to point at, so the name is published with `aria-labelledby` instead.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  const labelId = useId()
  return (
    <div className="pg__field">
      <span className="pg__label" id={labelId}>
        {label}
      </span>
      <ToggleGroup
        type="single"
        value={value}
        aria-labelledby={labelId}
        // Radix reports `''` when the pressed item is toggled off; a segmented
        // control has no "none", so that press is simply ignored.
        onValueChange={(next) => next && onChange(next as T)}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option} size="sm">
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export function Flag({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Field label={label} orientation="horizontal" disabled={disabled}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Field>
  )
}

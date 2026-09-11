import { forwardRef, useMemo, useState, type FocusEventHandler } from 'react'
import { CalendarIcon, CloseIcon } from '../lib/icons'
import { cn } from '../lib/cn'
import { useFieldControl, useTriggerName } from '../lib/field-context'
import { Calendar, fromIso, type IsoDate } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface DateFieldProps {
  value: IsoDate | undefined
  onChange: (value: IsoDate | undefined) => void
  /** Shown when nothing is chosen. */
  placeholder?: string
  /**
   * Accessible name. Inside a `<Field>` leave it out: the field's label names
   * the control. Outside one, pass it — the field is a button, not an input.
   */
  label?: string
  min?: IsoDate
  max?: IsoDate
  locale?: string
  /** Overrides the id a surrounding `<Field>` supplies. */
  id?: string
  /**
   * Submitted with a native `<form>`: a hidden input carries the value
   * (`yyyy-mm-dd`), since the visible control is a button.
   */
  name?: string
  /** Announced as required (`aria-required`); a hidden input cannot be validated natively. */
  required?: boolean
  /** Fires when the trigger loses focus — where a form library records "touched". */
  onBlur?: FocusEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
}

/**
 * A date field with the kit's own calendar behind it.
 *
 * A native `<input type="date">` is accessible and free, but it is also the one
 * control in a themed table that cannot be themed: its layout, its placeholder
 * and its picker belong to the browser, so a filter bar built from tokens ends
 * up with one control that ignores every one of them.
 *
 * This keeps the accessibility — a labelled control, a keyboard-navigable grid,
 * a clear button — and gives the appearance back to the project's tokens.
 */
export const DateField = forwardRef<HTMLButtonElement, DateFieldProps>(function DateField(
  {
    value,
    onChange,
    placeholder = 'Pick a date',
    label,
    min,
    max,
    locale,
    disabled,
    className,
    id,
    name,
    required,
    onBlur,
  },
  ref,
) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const date = fromIso(value)
  const isDisabled = disabled ?? field.disabled

  const formatted = useMemo(
    () => (date ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date) : null),
    [date, locale],
  )
  const trigger = useTriggerName(label, formatted, 'Date')

  return (
    <div className={cn('sui-date-field', className)} data-empty={date ? undefined : true}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            id={id ?? field.id}
            className="sui-date-field__trigger"
            disabled={isDisabled}
            {...trigger.props}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
            aria-required={(required ?? field.required) || undefined}
            onBlur={onBlur}
          >
            <CalendarIcon className="sui-date-field__icon" aria-hidden="true" />
            <span id={trigger.valueId} className="sui-date-field__value">
              {formatted ?? placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="sui-date-field__popover" align="start">
          <Calendar
            value={value}
            min={min}
            max={max}
            label={trigger.text}
            locale={locale}
            onChange={(next) => {
              onChange(next)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {/* A disabled field must not be clearable either. */}
      {date && !isDisabled ? (
        <button
          type="button"
          className="sui-date-field__clear"
          aria-label={`Clear ${trigger.text}`}
          onClick={() => onChange(undefined)}
        >
          <CloseIcon aria-hidden="true" />
        </button>
      ) : null}
      {name ? <input type="hidden" name={name} value={value ?? ''} disabled={isDisabled} /> : null}
    </div>
  )
})

'use client'

import { forwardRef, useState, type FocusEventHandler } from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId, useTriggerName } from '../form/field-context'
import { ClockIcon, CloseIcon } from '../icons/icons'
import { Clock } from './clock'
import { formatTime, toTime, type IsoTime } from './date-utils'
import { normaliseStep } from './internal'
import { Popover, PopoverContent, PopoverTrigger } from '../overlay/popover'

export interface TimeFieldProps {
  value: IsoTime | undefined
  onChange: (value: IsoTime | undefined) => void
  /** Shown when nothing is chosen. */
  placeholder?: string
  /**
   * Accessible name. Inside a `<Field>` leave it out: the field's label names
   * the control. Outside one, pass it — the field is a button, not an input.
   */
  label?: string
  /** Minutes the dial and the arrow keys step by, and what "Now" rounds down to. */
  minuteStep?: number
  hour12?: boolean
  /** Formats the trigger. `'en-US'` by default. */
  locale?: string
  /** Offer "Now" above the dial. */
  showNow?: boolean
  /** Overrides the id a surrounding `<Field>` supplies. */
  id?: string
  /**
   * Submitted with a native `<form>`: a hidden input carries the value
   * (`HH:mm`), since the visible control is a button.
   */
  name?: string
  /** Announced as required (`aria-required`); a hidden input cannot be validated natively. */
  required?: boolean
  /** Fires when the trigger loses focus — where a form library records "touched". */
  onBlur?: FocusEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
}

/** The current time, rounded down to the step — `'09:37'` at a step of 15 is `'09:30'`. */
function nowRounded(step: number): IsoTime {
  const now = new Date()
  return toTime(now.getHours(), Math.floor(now.getMinutes() / step) * step)
}

/**
 * A time field with the kit's own clock behind it.
 *
 * The counterpart to `<DateField>`, for the same reason it exists: everything
 * about `<input type="time">` — its layout, its stepper, its picker — belongs
 * to the browser, and one browser-shaped control in a themed form is the thing
 * people notice.
 */
export const TimeField = forwardRef<HTMLButtonElement, TimeFieldProps>(function TimeField(
  {
    value,
    onChange,
    placeholder = 'Pick a time',
    label,
    minuteStep = 5,
    hour12 = true,
    locale,
    showNow = true,
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
  const fieldLabelId = useFieldLabelId()
  const [open, setOpen] = useState(false)
  const isDisabled = disabled ?? field.disabled
  const formatted = formatTime(value, locale, hour12)
  const trigger = useTriggerName(label, formatted, 'Time')

  return (
    <div className={cn('sui-date-field', className)} data-empty={formatted ? undefined : true}>
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
            <ClockIcon className="sui-date-field__icon" aria-hidden="true" />
            <span id={trigger.valueId} className="sui-date-field__value">
              {formatted ?? placeholder}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="sui-date-field__popover" align="start">
          {showNow ? (
            <div className="sui-clock__quick">
              <button
                type="button"
                className="sui-range-panel__preset"
                onClick={() => {
                  onChange(nowRounded(normaliseStep(minuteStep)))
                  setOpen(false)
                }}
              >
                Now
              </button>
            </div>
          ) : null}
          <Clock
            value={value ?? '09:00'}
            label={trigger.text}
            aria-labelledby={label ? undefined : fieldLabelId}
            hour12={hour12}
            minuteStep={minuteStep}
            onChange={onChange}
            // Closing on the minute is what makes the two-step dial feel like
            // one action rather than a form with a hidden Done button.
            onDone={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {/* Only a value the field shows can be cleared, and a disabled field cannot be. */}
      {formatted && !isDisabled ? (
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

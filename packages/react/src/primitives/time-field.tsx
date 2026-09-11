import { useState } from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { ClockIcon, CloseIcon } from '../lib/icons'
import { Clock, formatTime, toTime, type IsoTime } from './clock'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface TimeFieldProps {
  value: IsoTime | undefined
  onChange: (value: IsoTime | undefined) => void
  /** Shown when nothing is chosen. */
  placeholder?: string
  /** Accessible name. Required — the field is a button, not a labelled input. */
  label: string
  /** Minutes the dial and the arrow keys step by. */
  minuteStep?: number
  hour12?: boolean
  locale?: string
  /** Offer "Now" above the dial. */
  showNow?: boolean
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
export function TimeField({
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
}: TimeFieldProps) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const formatted = formatTime(value, locale, hour12)

  return (
    <div className={cn('sui-date-field', className)} data-empty={formatted ? undefined : true}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={field.id}
            className="sui-date-field__trigger"
            disabled={disabled ?? field.disabled}
            aria-label={formatted ? `${label}: ${formatted}` : label}
            aria-describedby={field['aria-describedby']}
            aria-invalid={field['aria-invalid']}
          >
            <ClockIcon className="sui-date-field__icon" aria-hidden="true" />
            <span className="sui-date-field__value">{formatted ?? placeholder}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="sui-date-field__popover" align="start">
          {showNow ? (
            <div className="sui-clock__quick">
              <button
                type="button"
                className="sui-range-panel__preset"
                onClick={() => {
                  onChange(nowRounded(minuteStep))
                  setOpen(false)
                }}
              >
                Now
              </button>
            </div>
          ) : null}
          <Clock
            value={value ?? '09:00'}
            label={label}
            hour12={hour12}
            minuteStep={minuteStep}
            onChange={onChange}
            // Closing on the minute is what makes the two-step dial feel like
            // one action rather than a form with a hidden Done button.
            onDone={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {value ? (
        <button
          type="button"
          className="sui-date-field__clear"
          aria-label={`Clear ${label}`}
          onClick={() => onChange(undefined)}
        >
          <CloseIcon aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

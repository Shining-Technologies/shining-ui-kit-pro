import { forwardRef, useMemo, useState, type FocusEventHandler } from 'react'
import { cn } from '../lib/cn'
import { useFieldControl, useTriggerName } from '../lib/field-context'
import { CalendarIcon, CloseIcon } from '../lib/icons'
import { Calendar, fromIso, toIso, type IsoDate } from './calendar'
import { Clock, formatTime, fromTime, toTime, type IsoTime } from './clock'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/** `'2026-03-12T09:30'` — a local date and time, with no timezone attached. */
export type IsoDateTime = string

/** Split `'2026-03-12T09:30'` into its two halves; either may be missing. */
export function splitDateTime(value: string | undefined): {
  date: IsoDate | undefined
  time: IsoTime | undefined
} {
  if (!value) return { date: undefined, time: undefined }
  const [date, time] = value.split('T')
  return {
    date: date && fromIso(date) ? date : undefined,
    // Seconds are accepted on the way in and dropped: this field edits minutes.
    time: time && fromTime(time.slice(0, 5)) ? time.slice(0, 5) : undefined,
  }
}

/**
 * Join the halves back together. A date with no time is stored at midnight
 * here; `DateTimeField` passes its `defaultTime` instead, so the value matches
 * the time its clock face shows.
 */
export function joinDateTime(
  date: IsoDate | undefined,
  time: IsoTime | undefined,
): IsoDateTime | undefined {
  return date ? `${date}T${time ?? '00:00'}` : undefined
}

export interface DateTimeFieldProps {
  value: IsoDateTime | undefined
  onChange: (value: IsoDateTime | undefined) => void
  placeholder?: string
  /**
   * Accessible name. Inside a `<Field>` leave it out: the field's label names
   * the control. Outside one, pass it — the field is a button, not an input.
   */
  label?: string
  min?: IsoDate
  max?: IsoDate
  minuteStep?: number
  hour12?: boolean
  locale?: string
  /** Offer "Now" in the footer. */
  showNow?: boolean
  /**
   * The time a day gets when it is picked before any time is — and the time
   * the clock face shows until then, so what is on the dial is what is stored.
   * `HH:mm`; `'09:00'` by default.
   */
  defaultTime?: IsoTime
  /** Overrides the id a surrounding `<Field>` supplies. */
  id?: string
  /**
   * Submitted with a native `<form>`: a hidden input carries the value
   * (`yyyy-mm-ddTHH:mm`), since the visible control is a button.
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
 * A date and a time, chosen together.
 *
 * Two popovers side by side is the usual answer and it is the wrong one: an
 * appointment is a single fact, and splitting it makes people confirm twice and
 * leaves half a value behind whenever they only finish one. Here the calendar
 * and the clock share one panel and one Done, so the field is either empty or
 * complete — never half-set.
 */
export const DateTimeField = forwardRef<HTMLButtonElement, DateTimeFieldProps>(
  function DateTimeField(
    {
      value,
      onChange,
      placeholder = 'Pick a date and time',
      label,
      min,
      max,
      minuteStep = 5,
      hour12 = true,
      locale,
      showNow = true,
      defaultTime: defaultTimeProp = '09:00',
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
    const isDisabled = disabled ?? field.disabled
    const { date, time } = splitDateTime(value)
    // One default for both the dial and the value: the dial used to open on
    // 09:00 while a picked day was stored at midnight.
    const parsedDefault = fromTime(defaultTimeProp)
    const defaultTime = parsedDefault ? toTime(parsedDefault.hours, parsedDefault.minutes) : '09:00'

    const formatted = useMemo(() => {
      const parsed = fromIso(date)
      if (!parsed) return null
      const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
      const clock = formatTime(time, locale, hour12)
      return clock ? `${day}, ${clock}` : day
    }, [date, hour12, locale, time])
    const trigger = useTriggerName(label, formatted, 'Date and time')

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
              <CalendarIcon className="sui-date-field__icon" aria-hidden="true" />
              <span id={trigger.valueId} className="sui-date-field__value">
                {formatted ?? placeholder}
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent className="sui-datetime__popover" align="start">
            <div className="sui-datetime__panes">
              <Calendar
                value={date}
                min={min}
                max={max}
                label={`${trigger.text} — date`}
                locale={locale}
                onChange={(next) => onChange(joinDateTime(next, time ?? defaultTime))}
              />
              <div className="sui-datetime__divider" aria-hidden="true" />
              <Clock
                value={time ?? defaultTime}
                label={`${trigger.text} — time`}
                hour12={hour12}
                minuteStep={minuteStep}
                // Picking a time before a day is a reasonable order to work in;
                // today is the day people mean when they do.
                onChange={(next) => onChange(joinDateTime(date ?? toIso(new Date()), next))}
              />
            </div>

            <div className="sui-datetime__foot">
              {showNow ? (
                <button
                  type="button"
                  className="sui-range-panel__preset"
                  onClick={() => {
                    const now = new Date()
                    onChange(
                      joinDateTime(
                        toIso(now),
                        toTime(
                          now.getHours(),
                          Math.floor(now.getMinutes() / minuteStep) * minuteStep,
                        ),
                      ),
                    )
                  }}
                >
                  Now
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="sui-range-panel__preset"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* A disabled field must not be clearable either. */}
        {value && !isDisabled ? (
          <button
            type="button"
            className="sui-date-field__clear"
            aria-label={`Clear ${trigger.text}`}
            onClick={() => onChange(undefined)}
          >
            <CloseIcon aria-hidden="true" />
          </button>
        ) : null}
        {name ? (
          <input
            type="hidden"
            name={name}
            value={joinDateTime(date, time) ?? ''}
            disabled={isDisabled}
          />
        ) : null}
      </div>
    )
  },
)

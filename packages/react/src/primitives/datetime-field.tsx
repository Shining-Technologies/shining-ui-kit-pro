import { useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
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

/** Join the halves back together, once both are present. */
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
  /** Accessible name. Required — the field is a button, not a labelled input. */
  label: string
  min?: IsoDate
  max?: IsoDate
  minuteStep?: number
  hour12?: boolean
  locale?: string
  /** Offer "Now" in the footer. */
  showNow?: boolean
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
export function DateTimeField({
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
  disabled,
  className,
}: DateTimeFieldProps) {
  const field = useFieldControl()
  const [open, setOpen] = useState(false)
  const { date, time } = splitDateTime(value)

  const formatted = useMemo(() => {
    const parsed = fromIso(date)
    if (!parsed) return null
    const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
    const clock = formatTime(time, locale, hour12)
    return clock ? `${day}, ${clock}` : day
  }, [date, hour12, locale, time])

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
            <CalendarIcon className="sui-date-field__icon" aria-hidden="true" />
            <span className="sui-date-field__value">{formatted ?? placeholder}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="sui-datetime__popover" align="start">
          <div className="sui-datetime__panes">
            <Calendar
              value={date}
              min={min}
              max={max}
              label={`${label} — date`}
              locale={locale}
              onChange={(next) => onChange(joinDateTime(next, time))}
            />
            <div className="sui-datetime__divider" aria-hidden="true" />
            <Clock
              value={time ?? '09:00'}
              label={`${label} — time`}
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

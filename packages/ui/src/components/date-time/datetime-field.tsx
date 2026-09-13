'use client'

import { forwardRef, useId, useMemo, useState, type FocusEventHandler } from 'react'
import { cn } from '../../lib/cn'
import {
  FieldContext,
  useFieldControl,
  useFieldLabelId,
  useTriggerName,
} from '../form/field-context'
import { CalendarIcon, CloseIcon } from '../icons/icons'
import { Calendar } from './calendar'
import {
  formatTime,
  fromIso,
  fromTime,
  joinDateTime,
  splitDateTime,
  toIso,
  toTime,
  type IsoDate,
  type IsoDateTime,
  type IsoTime,
} from './date-utils'
import { DEFAULT_LOCALE, normaliseStep } from './internal'
import { TimeInput } from './time-input'
import { Popover, PopoverContent, PopoverTrigger } from '../overlay/popover'

export interface DateTimeFieldProps {
  value: IsoDateTime | undefined
  onChange: (value: IsoDateTime | undefined) => void
  placeholder?: string
  /**
   * Accessible name. Inside a `<Field>` leave it out: the field's label names
   * the control. Outside one, pass it — the field is a button, not an input.
   */
  label?: string
  /** The earliest day that can be chosen, typed into, or reached with "Now". */
  min?: IsoDate
  /** The latest day that can be chosen, typed into, or reached with "Now". */
  max?: IsoDate
  /** Minutes the arrow keys step the time by, and what "Now" rounds down to. */
  minuteStep?: number
  hour12?: boolean
  /** Formats the trigger and the calendar. `'en-US'` by default. */
  locale?: string
  /** Offer "Now" in the footer. It is disabled while today is outside `min`–`max`. */
  showNow?: boolean
  /**
   * The time a day has while no time is set — the time a day picked first is
   * stored at, the time the time input shows, and the time a value with a date
   * but no time is displayed and submitted at. `HH:mm`; `'09:00'` by default.
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

/** `day`, moved into `min`–`max`. A bound that is not a real date is ignored, as the calendar ignores it. */
function clampDay(day: IsoDate, min: IsoDate | undefined, max: IsoDate | undefined): IsoDate {
  // `yyyy-mm-dd` strings sort in date order, so they compare as they are.
  if (min && fromIso(min) && day < min) return min
  if (max && fromIso(max) && day > max) return max
  return day
}

/**
 * A date and a time, chosen together.
 *
 * Two popovers side by side is the usual answer and it is the wrong one: an
 * appointment is a single fact, and splitting it makes people confirm twice and
 * leaves half a value behind whenever they only finish one. Here the calendar
 * and a typed time share one panel and one Done, so the field is either empty
 * or complete — never half-set.
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
      locale = DEFAULT_LOCALE,
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
    const fieldLabelId = useFieldLabelId()
    const dateNameId = useId()
    const timeNameId = useId()
    const [open, setOpen] = useState(false)
    const isDisabled = disabled ?? field.disabled
    const { date, time } = splitDateTime(value)
    // One default for the time input, the stored value and the display, so a
    // day without a time is shown, edited and submitted at the same time.
    const parsedDefault = fromTime(defaultTimeProp)
    const defaultTime = parsedDefault ? toTime(parsedDefault.hours, parsedDefault.minutes) : '09:00'
    const shownTime = time ?? defaultTime

    const formatted = useMemo(() => {
      const parsed = fromIso(date)
      if (!parsed) return null
      const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
      const clock = formatTime(shownTime, locale, hour12)
      return clock ? `${day}, ${clock}` : day
    }, [date, hour12, locale, shownTime])
    const trigger = useTriggerName(label, formatted, 'Date and time')
    // Inside a labelled `<Field>` with no `label`, the panel's parts are named
    // by the field's visible label plus "date" / "time", as the trigger is.
    const namedByField = !label && fieldLabelId

    // Read on every render but used only inside the panel, which is never part
    // of server HTML, so the server's clock cannot cause a hydration mismatch.
    const today = toIso(new Date())
    const todayAllowed = clampDay(today, min, max) === today

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
            {namedByField ? (
              <>
                <span id={dateNameId} hidden>
                  date
                </span>
                <span id={timeNameId} hidden>
                  time
                </span>
              </>
            ) : null}

            <Calendar
              value={date}
              min={min}
              max={max}
              label={`${trigger.text} — date`}
              aria-labelledby={namedByField ? `${fieldLabelId} ${dateNameId}` : undefined}
              locale={locale}
              onChange={(next) => onChange(joinDateTime(next, shownTime))}
            />

            {/* The panel is portalled, but React still places it inside the
                surrounding Field: without this the time input would take the
                trigger's id and help text. */}
            <FieldContext.Provider value={null}>
              <div className="sui-datetime__time">
                <span className="sui-datetime__time-label" aria-hidden="true">
                  Time
                </span>
                <TimeInput
                  value={shownTime}
                  label={namedByField ? undefined : `${trigger.text} — time`}
                  aria-labelledby={namedByField ? `${fieldLabelId} ${timeNameId}` : undefined}
                  hour12={hour12}
                  minuteStep={minuteStep}
                  // Setting a time before a day is a reasonable order to work
                  // in; today is the day people mean when they do — or the
                  // nearest day `min`/`max` allow, so the value stays in range.
                  onChange={(next) => onChange(joinDateTime(date ?? clampDay(today, min, max), next))}
                />
              </div>
            </FieldContext.Provider>

            <div className="sui-datetime__foot">
              {showNow ? (
                <button
                  type="button"
                  className="sui-btn sui-btn--ghost sui-btn--sm"
                  // "Now" moved to another day would not be now: while today is
                  // out of range the button is unavailable rather than a lie.
                  disabled={!todayAllowed}
                  onClick={() => {
                    const now = new Date()
                    const step = normaliseStep(minuteStep)
                    onChange(
                      joinDateTime(
                        toIso(now),
                        toTime(now.getHours(), Math.floor(now.getMinutes() / step) * step),
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
                className="sui-btn sui-btn--primary sui-btn--sm"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
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
        {name ? (
          <input
            type="hidden"
            name={name}
            value={joinDateTime(date, shownTime) ?? ''}
            disabled={isDisabled}
          />
        ) : null}
      </div>
    )
  },
)

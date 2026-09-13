'use client'

import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId } from '../form/field-context'
import { ClockIcon } from '../icons/icons'
import { fromTime, toTime, type IsoTime } from './date-utils'
import { normaliseStep, stepMinutes } from './internal'

type Segment = 'hour' | 'minute'

export interface TimeInputProps {
  value: IsoTime | undefined
  onChange: (value: IsoTime) => void
  /** 12-hour segments with an AM/PM switch. `false` gives 00–23. */
  hour12?: boolean
  /** Minutes the arrow keys step by. A typed minute is kept as typed. */
  minuteStep?: number
  /**
   * Accessible name for the group. Inside a `<Field>` leave it out: the field's
   * label names the control.
   */
  label?: string
  /**
   * Id(s) of the element(s) that name the group, when the name is not the
   * surrounding `<Field>`'s label. `label` wins over it.
   */
  'aria-labelledby'?: string
  /** The clock icon at the start of the box. */
  icon?: boolean
  disabled?: boolean
  /** Overrides the id a surrounding `<Field>` supplies; it lands on the hour. */
  id?: string
  className?: string
}

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * A time, typed.
 *
 * The clock face is the right picker when the time is the whole question. Under
 * a calendar it is a second large target competing with the first, and "2:30"
 * is quicker to type than to dial. So this is the shape of `<input type="time">`
 * — an hour segment, a minute segment and an AM/PM switch in one field box —
 * drawn from tokens instead of by the browser.
 *
 * Each segment is a real text input with a numeric keyboard, so a phone gets
 * its digit pad. Typing fills a segment and moves on as soon as it cannot take
 * another digit (a `3` is already an hour; a `1` may become `11`). The arrow
 * keys step, Left and Right move between segments, and `a` / `p` pick the half
 * of the day.
 */
export const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(function TimeInput(
  {
    value,
    onChange,
    hour12 = true,
    minuteStep = 1,
    label,
    'aria-labelledby': labelledBy,
    icon = true,
    disabled,
    id,
    className,
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const isDisabled = disabled ?? field.disabled
  const parsed = fromTime(value)
  const hours = parsed?.hours ?? 0
  const minutes = parsed?.minutes ?? 0
  const period = hours < 12 ? 'am' : 'pm'
  const displayHour = hour12 ? hours % 12 || 12 : hours

  // Digits typed into a segment so far: a lone `1` waits for its second digit.
  const [pending, setPending] = useState<{ segment: Segment; digits: string } | null>(null)
  const hourRef = useRef<HTMLInputElement>(null)
  const minuteRef = useRef<HTMLInputElement>(null)

  const commit = (nextHours: number, nextMinutes: number) =>
    onChange(toTime(nextHours, nextMinutes))

  function setPeriod(next: 'am' | 'pm') {
    if (!parsed) commit(next === 'pm' ? 12 : 0, 0)
    else if (next !== period) commit(hours + (next === 'pm' ? 12 : -12), minutes)
  }

  function type(segment: Segment, digit: string) {
    const max = segment === 'minute' ? 59 : hour12 ? 12 : 23
    let digits = (pending?.segment === segment ? pending.digits : '') + digit
    // A digit that would overflow starts the segment again: `1`, `5` on a
    // 12-hour clock is five o'clock, not a fifteenth hour.
    if (Number(digits) > max) digits = digit
    const number = Number(digits)
    // Full once it has two digits, or once no second digit could follow.
    const full = digits.length === 2 || number * 10 > max

    if (segment === 'minute') commit(hours, number)
    else if (!hour12) commit(number, minutes)
    // `0` alone is not an hour on a 12-hour clock; `00` is twelve.
    else if (number !== 0 || full) commit((number % 12) + (period === 'pm' ? 12 : 0), minutes)

    if (full) {
      setPending(null)
      if (segment === 'hour') minuteRef.current?.focus()
    } else {
      setPending({ segment, digits })
    }
  }

  function step(segment: Segment, direction: 1 | -1) {
    if (segment === 'hour') {
      commit(hours + direction, minutes)
      return
    }
    // Onto the step's grid first (09:07 steps up to 09:10, not 09:12), rolling
    // past the hour as the clock face does.
    const next = stepMinutes(hours, minutes, normaliseStep(minuteStep), direction)
    commit(next.hours, next.minutes)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, segment: Segment) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const { key } = event
    if (/^\d$/.test(key)) {
      event.preventDefault()
      type(segment, key)
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault()
      setPending(null)
      step(segment, key === 'ArrowUp' ? 1 : -1)
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault()
      setPending(null)
      const target =
        key === 'ArrowRight' ? (segment === 'hour' ? minuteRef : null) : segment === 'minute' ? hourRef : null
      target?.current?.focus()
    } else if (hour12 && /^[ap]$/i.test(key)) {
      event.preventDefault()
      setPeriod(key.toLowerCase() === 'a' ? 'am' : 'pm')
    } else if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault()
      setPending(null)
    } else if (key.length === 1) {
      // Anything else printable would only be thrown away by the next render.
      event.preventDefault()
    }
  }

  // Hardware keys are handled on keydown and never reach this. A phone keyboard
  // reports `Unidentified` there, so its digit arrives as a change instead.
  function onSoftInput(event: ChangeEvent<HTMLInputElement>, segment: Segment) {
    const digit = event.target.value.replace(/\D/g, '').slice(-1)
    if (digit) type(segment, digit)
  }

  const segmentProps = (segment: Segment) => ({
    type: 'text',
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    role: 'spinbutton',
    className: 'sui-time-input__segment',
    placeholder: '--',
    disabled: isDisabled,
    'aria-invalid': field['aria-invalid'],
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => onKeyDown(event, segment),
    onChange: (event: ChangeEvent<HTMLInputElement>) => onSoftInput(event, segment),
    // The whole segment is selected, so the next digit replaces it.
    onFocus: (event: FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
    onMouseUp: (event: MouseEvent<HTMLInputElement>) => event.preventDefault(),
    onBlur: () => setPending(null),
  })

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      aria-labelledby={label ? undefined : (labelledBy ?? labelId)}
      aria-describedby={field['aria-describedby']}
      className={cn('sui-time-input', className)}
      data-slot="time-input"
      data-disabled={isDisabled || undefined}
      data-invalid={field['aria-invalid'] || undefined}
    >
      {icon ? <ClockIcon className="sui-time-input__icon" aria-hidden="true" /> : null}

      <span className="sui-time-input__segments">
        <input
          ref={hourRef}
          id={id ?? field.id}
          aria-label="Hour"
          aria-valuenow={parsed ? hours : undefined}
          aria-valuemin={0}
          aria-valuemax={23}
          aria-valuetext={
            parsed ? (hour12 ? `${displayHour} ${period.toUpperCase()}` : pad(hours)) : 'Empty'
          }
          value={parsed ? pad(displayHour) : ''}
          {...segmentProps('hour')}
        />
        <span className="sui-time-input__separator" aria-hidden="true">
          :
        </span>
        <input
          ref={minuteRef}
          aria-label="Minute"
          aria-valuenow={parsed ? minutes : undefined}
          aria-valuemin={0}
          aria-valuemax={59}
          aria-valuetext={parsed ? pad(minutes) : 'Empty'}
          value={parsed ? pad(minutes) : ''}
          {...segmentProps('minute')}
        />
      </span>

      {hour12 ? (
        <span className="sui-time-input__period" role="group" aria-label="AM or PM">
          {(['am', 'pm'] as const).map((option) => {
            const active = !!parsed && period === option
            return (
              <button
                key={option}
                type="button"
                className="sui-time-input__period-option"
                aria-pressed={active}
                data-active={active || undefined}
                disabled={isDisabled}
                onClick={() => setPeriod(option)}
              >
                {option.toUpperCase()}
              </button>
            )
          })}
        </span>
      ) : null}
    </div>
  )
})

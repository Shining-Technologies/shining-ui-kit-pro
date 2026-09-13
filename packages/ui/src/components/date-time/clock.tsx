'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { fromTime, toTime, type IsoTime } from './date-utils'
import { minuteMarks, normaliseStep, stepMinutes } from './internal'

export interface ClockProps {
  value?: IsoTime
  onChange: (value: IsoTime) => void
  /**
   * Minutes the arrow keys and the dial step by. The arrow keys snap to the
   * step; the dial offers the multiples of both five and the step (every 15
   * minutes at a step of 15, every 5 at a step of 1).
   */
  minuteStep?: number
  /** 12-hour dial with an AM/PM switch. `false` gives a 24-hour dial. */
  hour12?: boolean
  /** Accessible name for the dial. Ignored when `aria-labelledby` is set. */
  label?: string
  /** Id(s) of the element(s) that name the dial — a visible label elsewhere on the page. */
  'aria-labelledby'?: string
  /** Called once the minute has been picked — where a popover closes itself. */
  onDone?: (value: IsoTime) => void
  className?: string
}

/** Where a mark sits on the dial, as a percentage offset from the centre. */
function position(index: number, total: number, radius: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius }
}

/**
 * A clock face.
 *
 * The sibling of `<Calendar>`, and written for the same reason: the native time
 * picker is the other control that cannot be themed, and a filter bar with one
 * browser-coloured popover in it looks like a bug rather than a default.
 *
 * It reads like the analogue clock everyone already knows — pick the hour, the
 * dial turns to minutes, pick the minute — while the two digits in the header
 * are real spinbuttons, so the whole thing is also usable from the keyboard
 * without touching the face at all.
 */
export function Clock({
  value,
  onChange,
  minuteStep = 1,
  hour12 = true,
  label = 'Choose a time',
  'aria-labelledby': labelledBy,
  onDone,
  className,
}: ClockProps) {
  const parsed = fromTime(value)
  const hours = parsed?.hours ?? 12
  const minutes = parsed?.minutes ?? 0
  const step = normaliseStep(minuteStep)
  const [mode, setMode] = useState<'hour' | 'minute'>('hour')

  const meridiem = hours < 12 ? 'am' : 'pm'

  const set = (nextHours: number, nextMinutes: number, done = false) => {
    const next = toTime(nextHours, nextMinutes)
    onChange(next)
    if (done) onDone?.(next)
  }

  const marks = useMemo(() => {
    if (mode === 'minute') {
      // Placed by the minute they stand for, so a sparse face (every 15) still
      // puts 15 at three o'clock. Anything between them is reachable from the
      // header spinbutton.
      return minuteMarks(step).map((minute) => ({
        value: minute,
        text: String(minute).padStart(2, '0'),
        ...position(minute, 60, 38),
        inner: false,
      }))
    }
    const outer = Array.from({ length: 12 }, (_, index) => {
      const hour = index === 0 ? 12 : index
      return {
        value: hour12 ? hour : index,
        text: hour12 ? String(hour) : String(index).padStart(2, '0'),
        ...position(index, 12, 38),
        inner: false,
      }
    })
    if (hour12) return outer
    // 24-hour dials carry the afternoon on a second, tighter ring.
    return [
      ...outer,
      ...Array.from({ length: 12 }, (_, index) => ({
        value: index + 12,
        text: String(index + 12).padStart(2, '0'),
        ...position(index, 12, 24),
        inner: true,
      })),
    ]
  }, [hour12, mode, step])

  /** The hand's angle, in degrees clockwise from twelve. */
  const angle = mode === 'hour' ? ((hours % 12) / 12) * 360 : (minutes / 60) * 360
  const short = mode === 'hour' && !hour12 && hours >= 12

  function pick(mark: number) {
    if (mode === 'minute') {
      set(hours, mark, true)
      return
    }
    if (hour12) {
      // 12 on an am dial is midnight; 12 on a pm dial is noon.
      const base = mark === 12 ? 0 : mark
      set(meridiem === 'pm' ? base + 12 : base, minutes)
    } else {
      set(mark, minutes)
    }
    setMode('minute')
  }

  function spin(event: KeyboardEvent<HTMLButtonElement>, unit: 'hour' | 'minute') {
    const directions: Record<string, 1 | -1> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    if (unit === 'hour') {
      set(hours + direction, minutes)
      return
    }
    // Onto the step's grid, rolling past the hour as the header does.
    const next = stepMinutes(hours, minutes, step, direction)
    set(next.hours, next.minutes)
  }

  const displayHour = hour12 ? (hours % 12 === 0 ? 12 : hours % 12) : hours

  return (
    <div className={cn('sui-clock', className)} data-mode={mode}>
      <div className="sui-clock__head">
        <div className="sui-clock__time">
          <button
            type="button"
            role="spinbutton"
            aria-label="Hour"
            aria-valuenow={hours}
            aria-valuemin={0}
            aria-valuemax={23}
            aria-valuetext={`${displayHour} ${hour12 ? meridiem : "o'clock"}`}
            className="sui-clock__digit"
            data-active={mode === 'hour' || undefined}
            onClick={() => setMode('hour')}
            onKeyDown={(event) => spin(event, 'hour')}
          >
            {String(displayHour).padStart(2, '0')}
          </button>
          <span className="sui-clock__colon">:</span>
          <button
            type="button"
            role="spinbutton"
            aria-label="Minute"
            aria-valuenow={minutes}
            aria-valuemin={0}
            aria-valuemax={59}
            className="sui-clock__digit"
            data-active={mode === 'minute' || undefined}
            onClick={() => setMode('minute')}
            onKeyDown={(event) => spin(event, 'minute')}
          >
            {String(minutes).padStart(2, '0')}
          </button>
        </div>

        {hour12 ? (
          <div className="sui-clock__meridiem" role="group" aria-label="AM or PM">
            {(['am', 'pm'] as const).map((period) => (
              <button
                key={period}
                type="button"
                className="sui-clock__period"
                aria-pressed={meridiem === period}
                data-active={meridiem === period || undefined}
                onClick={() => {
                  if (meridiem === period) return
                  set(period === 'pm' ? hours + 12 : hours - 12, minutes)
                }}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="sui-clock__dial"
        role="group"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
      >
        <span
          className="sui-clock__hand"
          data-short={short || undefined}
          style={{ transform: `rotate(${angle}deg)` }}
          aria-hidden="true"
        />
        <span className="sui-clock__centre" aria-hidden="true" />

        {marks.map((mark) => {
          const selected =
            mode === 'hour' ? mark.value === (hour12 ? displayHour : hours) : mark.value === minutes
          return (
            <button
              key={`${mode}-${mark.value}-${mark.inner}`}
              type="button"
              className="sui-clock__mark"
              data-selected={selected || undefined}
              data-inner={mark.inner || undefined}
              style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
              aria-label={mode === 'hour' ? `${mark.text} hours` : `${mark.text} minutes`}
              onClick={() => pick(mark.value)}
            >
              {mark.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

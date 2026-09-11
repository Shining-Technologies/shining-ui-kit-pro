import { useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'

/** A time of day as `HH:mm` on a 24-hour clock — `'09:30'`, `'17:05'`. */
export type IsoTime = string

const TIME = /^(\d{1,2}):(\d{2})$/

/** Parse `HH:mm` into `{ hours, minutes }`; `null` if it is not one. */
export function fromTime(value: string | undefined | null): {
  hours: number
  minutes: number
} | null {
  if (!value) return null
  const match = TIME.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

/** `{ hours: 9, minutes: 5 }` → `'09:05'`. */
export function toTime(hours: number, minutes: number): IsoTime {
  return `${String(((hours % 24) + 24) % 24).padStart(2, '0')}:${String(
    ((minutes % 60) + 60) % 60,
  ).padStart(2, '0')}`
}

/** `'17:05'` → `'5:05 pm'`, in the viewer's locale. */
export function formatTime(
  value: string | undefined,
  locale?: string,
  hour12 = true,
): string | null {
  const parsed = fromTime(value)
  if (!parsed) return null
  const date = new Date(2000, 0, 1, parsed.hours, parsed.minutes)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12 }).format(
    date,
  )
}

export interface ClockProps {
  value?: IsoTime
  onChange: (value: IsoTime) => void
  /** Minutes the arrow keys and the dial step by. */
  minuteStep?: number
  /** 12-hour dial with an AM/PM switch. `false` gives a 24-hour dial. */
  hour12?: boolean
  /** Accessible name for the dial. */
  label?: string
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
  onDone,
  className,
}: ClockProps) {
  const parsed = fromTime(value)
  const hours = parsed?.hours ?? 12
  const minutes = parsed?.minutes ?? 0
  const [mode, setMode] = useState<'hour' | 'minute'>('hour')

  const meridiem = hours < 12 ? 'am' : 'pm'

  const set = (nextHours: number, nextMinutes: number, done = false) => {
    const next = toTime(nextHours, nextMinutes)
    onChange(next)
    if (done) onDone?.(next)
  }

  const marks = useMemo(() => {
    if (mode === 'minute') {
      // Twelve marks of five minutes: the readable face. Anything between them
      // is reachable from the header spinbutton and from `minuteStep`.
      return Array.from({ length: 12 }, (_, index) => ({
        value: index * 5,
        text: String(index * 5).padStart(2, '0'),
        ...position(index, 12, 38),
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
  }, [hour12, mode])

  /** The hand's angle, in degrees clockwise from twelve. */
  const angle = mode === 'hour' ? ((hours % 12) / 12) * 360 : (minutes / 60) * 360
  const short = mode === 'hour' && !hour12 && hours >= 12 && hours !== 0

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
    const step = unit === 'hour' ? 1 : minuteStep
    const moves: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
    }
    if (event.key in moves) {
      event.preventDefault()
      const delta = moves[event.key]!
      if (unit === 'hour') set(hours + delta, minutes)
      else {
        // Rolling past the hour should move the hour, as it does on the header.
        const total = hours * 60 + minutes + delta
        set(Math.floor((((total % 1440) + 1440) % 1440) / 60), ((total % 60) + 60) % 60)
      }
    }
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

      <div className="sui-clock__dial" role="group" aria-label={label}>
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

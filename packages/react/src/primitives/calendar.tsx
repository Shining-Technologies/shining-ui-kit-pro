import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../lib/icons'
import { cn } from '../lib/cn'

/** A calendar day, as `yyyy-mm-dd` in the viewer's own timezone. */
export type IsoDate = string

export interface CalendarProps {
  /** Selected day. */
  value?: IsoDate
  onChange: (value: IsoDate) => void
  /** Days before this one cannot be chosen. */
  min?: IsoDate
  /** Days after this one cannot be chosen. */
  max?: IsoDate
  /** Accessible name for the grid, e.g. `"From date"`. */
  label?: string
  locale?: string
  /** `1` = Monday (the default), `0` = Sunday. */
  weekStartsOn?: 0 | 1
  className?: string
}

const DAY = 86_400_000

/**
 * Format a `Date` as `yyyy-mm-dd` from its *local* parts.
 *
 * `toISOString()` would convert to UTC first, which moves the day by one for
 * roughly half the planet every evening — the single most common date bug
 * there is.
 */
export function toIso(date: Date): IsoDate {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Parse `yyyy-mm-dd` into a local midnight `Date`; `null` if it is not one. */
export function fromIso(value: string | undefined | null): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

/**
 * A month grid.
 *
 * Written rather than pulled in: this is a table library, the whole of a date
 * picker is a grid of buttons and some date arithmetic, and the dependency
 * that would replace it is larger than the table's own filter engine (§15).
 *
 * It follows the ARIA grid pattern — one tab stop, arrows move by day, PageUp
 * and PageDown by month — so a keyboard reaches every day without the mouse.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
  label = 'Choose a date',
  locale,
  weekStartsOn = 1,
  className,
}: CalendarProps) {
  const selected = fromIso(value)
  const today = useMemo(() => new Date(new Date().toDateString()), [])
  const [cursor, setCursor] = useState(() => startOfMonth(selected ?? today))
  // The day the grid's single tab stop sits on.
  const [focused, setFocused] = useState(() => selected ?? today)
  const gridRef = useRef<HTMLDivElement>(null)

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor),
    [cursor, locale],
  )

  const weekdays = useMemo(() => {
    // 2024-01-01 was a Monday, so this walks a real week in the right order.
    const monday = new Date(2024, 0, 1)
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(monday, (index + (weekStartsOn === 0 ? 6 : 0)) % 7)
      return { short: short.format(day), long: long.format(day) }
    })
  }, [locale, weekStartsOn])

  const days = useMemo(() => {
    const first = startOfMonth(cursor)
    // How many days of the previous month lead into this one.
    const lead = (first.getDay() - weekStartsOn + 7) % 7
    const start = addDays(first, -lead)
    return Array.from({ length: 42 }, (_, index) => addDays(start, index))
  }, [cursor, weekStartsOn])

  const lower = fromIso(min)
  const upper = fromIso(max)
  const isDisabled = (date: Date) =>
    (lower !== null && date.getTime() < lower.getTime()) ||
    (upper !== null && date.getTime() > upper.getTime())

  const moveFocus = (date: Date) => {
    setFocused(date)
    if (date.getMonth() !== cursor.getMonth() || date.getFullYear() !== cursor.getFullYear()) {
      setCursor(startOfMonth(date))
    }
    // The button for the new day may not exist until after this render.
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toIso(date)}"]`)?.focus()
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    if (event.key in moves) {
      event.preventDefault()
      moveFocus(addDays(focused, moves[event.key]!))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const offset = (focused.getDay() - weekStartsOn + 7) % 7
      moveFocus(addDays(focused, event.key === 'Home' ? -offset : 6 - offset))
      return
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const next = addMonths(focused, event.key === 'PageUp' ? -1 : 1)
      // Clamp to the target month's length: 31 January + 1 month is not 3 March.
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      moveFocus(new Date(next.getFullYear(), next.getMonth(), Math.min(focused.getDate(), lastDay)))
    }
  }

  return (
    <div className={cn('sui-calendar', className)}>
      <div className="sui-calendar__head">
        <button
          type="button"
          className="sui-calendar__nav"
          aria-label="Previous month"
          onClick={() => setCursor(addMonths(cursor, -1))}
        >
          <ChevronLeftIcon />
        </button>
        <span className="sui-calendar__caption" aria-live="polite">
          {monthLabel}
        </span>
        <button
          type="button"
          className="sui-calendar__nav"
          aria-label="Next month"
          onClick={() => setCursor(addMonths(cursor, 1))}
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={label}
        className="sui-calendar__grid"
        onKeyDown={onKeyDown}
      >
        <div role="row" className="sui-calendar__weekdays">
          {weekdays.map((day) => (
            <span key={day.long} role="columnheader" aria-label={day.long} title={day.long}>
              {day.short}
            </span>
          ))}
        </div>

        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" className="sui-calendar__week" key={week}>
            {days.slice(week * 7, week * 7 + 7).map((date) => {
              const iso = toIso(date)
              const outside = date.getMonth() !== cursor.getMonth()
              const isSelected = selected !== null && toIso(selected) === iso
              const disabled = isDisabled(date)
              return (
                <div role="gridcell" key={iso} aria-selected={isSelected}>
                  <button
                    type="button"
                    data-day={iso}
                    data-outside={outside || undefined}
                    data-today={toIso(today) === iso || undefined}
                    data-selected={isSelected || undefined}
                    className="sui-calendar__day"
                    disabled={disabled}
                    // One tab stop for the whole grid; arrows do the rest.
                    tabIndex={toIso(focused) === iso ? 0 : -1}
                    aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)}
                    onFocus={() => setFocused(date)}
                    onClick={() => onChange(iso)}
                  >
                    {date.getDate()}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Presets offered above a date range, because most ranges are one of these. */
export interface DateRangePreset {
  label: string
  /** Returns `[from, to]`. */
  range: () => [IsoDate, IsoDate]
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    range: () => {
      const today = toIso(new Date())
      return [today, today]
    },
  },
  {
    label: 'Last 7 days',
    range: () => [toIso(new Date(Date.now() - 6 * DAY)), toIso(new Date())],
  },
  {
    label: 'Last 30 days',
    range: () => [toIso(new Date(Date.now() - 29 * DAY)), toIso(new Date())],
  },
  {
    label: 'This month',
    range: () => {
      const now = new Date()
      return [toIso(startOfMonth(now)), toIso(now)]
    },
  },
]

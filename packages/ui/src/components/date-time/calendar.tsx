'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/icons'
import { cn } from '../../lib/cn'
import { useHydrated } from '../../hooks/use-hydrated'
import { fromIso, toIso, type IsoDate } from './date-utils'
import { addDays, addMonths, DEFAULT_LOCALE, startOfMonth } from './internal'

/** The ends of a range the calendar marks; either may still be missing. */
export interface CalendarRange {
  from?: IsoDate
  to?: IsoDate
}

export interface CalendarProps {
  /** Selected day. Ignored when `range` is set. */
  value?: IsoDate
  /** The day that was picked. With `range`, the caller decides which end it becomes. */
  onChange: (value: IsoDate) => void
  /**
   * Mark a range instead of one day: its ends filled, the days between tinted.
   * While only `from` is set, the span up to the day under the pointer (or the
   * keyboard focus) is previewed, so the second pick is never a guess.
   */
  range?: CalendarRange
  /** Months shown side by side: `1` (the default) or `2`. */
  months?: 1 | 2
  /** Days before this one cannot be chosen. */
  min?: IsoDate
  /** Days after this one cannot be chosen. */
  max?: IsoDate
  /** Accessible name for the grid, e.g. `"From date"`. Ignored when `aria-labelledby` is set. */
  label?: string
  /** Id(s) of the element(s) that name the grid — a visible label elsewhere on the page. */
  'aria-labelledby'?: string
  /** Formats the caption, weekday names and day labels. `'en-US'` by default. */
  locale?: string
  /** `1` = Monday (the default), `0` = Sunday. */
  weekStartsOn?: 0 | 1
  className?: string
}

/**
 * A month grid.
 *
 * Written rather than pulled in: this is a table library, the whole of a date
 * picker is a grid of buttons and some date arithmetic, and the dependency
 * that would replace it is larger than the table's own filter engine (§15).
 *
 * It follows the ARIA grid pattern — one tab stop, arrows move by day, PageUp
 * and PageDown by month — so a keyboard reaches every day without the mouse.
 * With two months the tab stop is shared: the arrows walk straight from one
 * month into the next.
 */
export function Calendar({
  value,
  onChange,
  range,
  months = 1,
  min,
  max,
  label = 'Choose a date',
  'aria-labelledby': labelledBy,
  locale = DEFAULT_LOCALE,
  weekStartsOn = 1,
  className,
}: CalendarProps) {
  const selected = range ? null : fromIso(value)
  const rangeFrom = range ? fromIso(range.from) : null
  const rangeTo = range ? fromIso(range.to) : null
  // The day the view follows: the selection, or the range's start.
  const anchorIso = range ? range.from : value
  const anchor = selected ?? rangeFrom
  // "Today" belongs to the browser's clock and timezone, which the server does
  // not share: marking it in server HTML would disagree with the hydrating
  // client for part of every day. So nothing is marked until after hydration.
  const hydrated = useHydrated()
  const today = useMemo(() => (hydrated ? new Date(new Date().toDateString()) : null), [hydrated])
  // Without a value the grid opens on the current month. (Around midnight on
  // the last day of a month, server and browser can still disagree on which
  // month that is; pass `value` to pin it.)
  const [cursor, setCursor] = useState(() => startOfMonth(anchor ?? new Date()))
  // The day the grid's single tab stop sits on, once the user has moved it.
  const [focused, setFocused] = useState<Date | null>(() => anchor)
  // The day under the pointer, for a range's preview.
  const [hovered, setHovered] = useState<Date | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const lastMonth = addMonths(cursor, months - 1)
  const inView = (date: Date) =>
    date.getTime() >= cursor.getTime() && startOfMonth(date).getTime() <= lastMonth.getTime()
  // Bring a day into view: as the first month when it is earlier than the
  // view, as the last when it is later.
  const reveal = (date: Date) => {
    if (inView(date)) return
    setCursor(
      date.getTime() < cursor.getTime() ? startOfMonth(date) : addMonths(date, -(months - 1)),
    )
  }

  // Follow a value set from outside while mounted — a preset, a parent's
  // reset — by showing its month, as the grid does when it first opens. Done
  // during render rather than in an effect, so the old month never flashes.
  const [followed, setFollowed] = useState(anchorIso)
  if (anchorIso !== followed) {
    setFollowed(anchorIso)
    if (anchor) {
      setFocused(anchor)
      reveal(anchor)
    }
  }

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )
  const dayLabel = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }), [locale])

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

  const shownMonths = useMemo(
    () =>
      Array.from({ length: months }, (_, offset) => {
        const first = addMonths(cursor, offset)
        // How many days of the previous month lead into this one.
        const lead = (first.getDay() - weekStartsOn + 7) % 7
        const start = addDays(first, -lead)
        return { first, days: Array.from({ length: 42 }, (_, index) => addDays(start, index)) }
      }),
    [cursor, months, weekStartsOn],
  )

  const lower = fromIso(min)
  const upper = fromIso(max)
  const isDisabled = (date: Date) =>
    (lower !== null && date.getTime() < lower.getTime()) ||
    (upper !== null && date.getTime() > upper.getTime())

  // The grid's one tab stop has to be a day that is on screen: after the month
  // buttons move the view, the remembered day may be in another month, and a
  // tab stop that is not rendered leaves the grid unreachable from the keyboard.
  // A choosable day is preferred; when `min`/`max` rule out the whole view,
  // the stop falls back to a day in view anyway — `aria-disabled` days still
  // take focus, and the arrows lead from there to one that can be chosen.
  const shown = (date: Date | null): date is Date => date !== null && inView(date)
  const candidates = [focused, anchor, today, ...shownMonths[0]!.days]
  const tabStop =
    candidates.find((date): date is Date => shown(date) && !isDisabled(date)) ??
    candidates.find(shown) ??
    cursor
  const tabStopIso = toIso(tabStop)
  // Where the arrow keys move from: the day with focus, or the tab stop.
  const active = focused ?? tabStop

  // The range as drawn: its committed ends, or its start and the previewed end.
  const previewing = rangeFrom !== null && rangeTo === null
  const rangeEnd = rangeTo ?? (previewing ? (hovered ?? focused) : null)
  const [low, high] =
    rangeFrom && rangeEnd
      ? rangeFrom.getTime() <= rangeEnd.getTime()
        ? [rangeFrom.getTime(), rangeEnd.getTime()]
        : [rangeEnd.getTime(), rangeFrom.getTime()]
      : rangeFrom
        ? [rangeFrom.getTime(), rangeFrom.getTime()]
        : [null, null]

  const moveFocus = (date: Date) => {
    setFocused(date)
    reveal(date)
    // The button for the new day may not exist until after this render.
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(`button[data-day="${toIso(date)}"]`)
        ?.focus()
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
      moveFocus(addDays(active, moves[event.key]!))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const offset = (active.getDay() - weekStartsOn + 7) % 7
      moveFocus(addDays(active, event.key === 'Home' ? -offset : 6 - offset))
      return
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const next = addMonths(active, event.key === 'PageUp' ? -1 : 1)
      // Clamp to the target month's length: 31 January + 1 month is not 3 March.
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      moveFocus(new Date(next.getFullYear(), next.getMonth(), Math.min(active.getDate(), lastDay)))
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('sui-calendar', months > 1 && 'sui-calendar--months', className)}
      data-range={range ? true : undefined}
    >
      {shownMonths.map(({ first, days }, index) => (
        <div className="sui-calendar__month" key={toIso(first)}>
          <div className="sui-calendar__head">
            {index === 0 ? (
              <button
                type="button"
                className="sui-calendar__nav"
                aria-label="Previous month"
                onClick={() => setCursor(addMonths(cursor, -1))}
              >
                <ChevronLeftIcon />
              </button>
            ) : (
              <span className="sui-calendar__nav-space" />
            )}
            <span className="sui-calendar__caption" aria-live="polite">
              {monthFormat.format(first)}
            </span>
            {index === months - 1 ? (
              <button
                type="button"
                className="sui-calendar__nav"
                aria-label="Next month"
                onClick={() => setCursor(addMonths(cursor, 1))}
              >
                <ChevronRightIcon />
              </button>
            ) : (
              <span className="sui-calendar__nav-space" />
            )}
          </div>

          <div
            role="grid"
            aria-label={
              labelledBy ? undefined : months > 1 ? `${label}, ${monthFormat.format(first)}` : label
            }
            aria-labelledby={labelledBy}
            className="sui-calendar__grid"
            onKeyDown={onKeyDown}
            onPointerLeave={() => setHovered(null)}
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
                  const outside = date.getMonth() !== first.getMonth()
                  // Side by side, a neighbouring month's days would appear
                  // twice, once in each grid: they are left blank instead.
                  if (outside && months > 1) {
                    return <div role="gridcell" key={iso} className="sui-calendar__cell" />
                  }
                  const time = date.getTime()
                  const isStart = low !== null && time === low
                  const isEnd = high !== null && time === high
                  const between = low !== null && high !== null && time > low && time < high
                  // A previewed end is drawn, but it is not chosen yet.
                  const previewEnd =
                    previewing &&
                    rangeEnd !== null &&
                    time === rangeEnd.getTime() &&
                    time !== rangeFrom?.getTime()
                  const isSelected = range
                    ? (isStart || isEnd || between) && !(previewing && (between || previewEnd))
                    : selected !== null && toIso(selected) === iso
                  const filled = range ? isSelected && (isStart || isEnd) : isSelected
                  const disabled = isDisabled(date)
                  return (
                    <div
                      role="gridcell"
                      key={iso}
                      className="sui-calendar__cell"
                      aria-selected={isSelected}
                      data-range-start={(range && isStart && low !== high) || undefined}
                      data-range-end={(range && isEnd && low !== high) || undefined}
                      data-in-range={(range && between) || undefined}
                    >
                      <button
                        type="button"
                        data-day={iso}
                        data-outside={outside || undefined}
                        data-today={(today !== null && toIso(today) === iso) || undefined}
                        data-selected={filled || undefined}
                        data-preview-end={(previewEnd && !filled) || undefined}
                        className="sui-calendar__day"
                        // `aria-disabled` rather than `disabled`: a disabled button
                        // cannot take focus, so the arrow keys would stall on it
                        // instead of moving through it to the next choosable day.
                        aria-disabled={disabled || undefined}
                        data-disabled={disabled || undefined}
                        // One tab stop for the whole grid; arrows do the rest.
                        tabIndex={tabStopIso === iso && !outside ? 0 : -1}
                        aria-label={dayLabel.format(date)}
                        onFocus={() => setFocused(date)}
                        onPointerEnter={range ? () => setHovered(date) : undefined}
                        onClick={() => {
                          if (!disabled) onChange(iso)
                        }}
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
      ))}
    </div>
  )
}

'use client'

import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useHydrated } from '../../hooks/use-hydrated'
import { cn } from '../../lib/cn'
import { toneClass, type AccentTone } from '../../lib/tone'
import { Button } from '../button/button'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/icons'
import { fromIso, toIso, type IsoDate } from './date-utils'
import { addDays, addMonths, DEFAULT_LOCALE, sameMonthAs, startOfMonth } from './internal'

export interface CalendarEvent {
  id: string
  /** The day it happens, or its first day. */
  date: IsoDate
  /** The last day of an event that spans several; it shows on each of them. */
  end?: IsoDate
  title: ReactNode
  /** Plain text for the event's accessible name when `title` is not a string. */
  textValue?: string
  /** A time to print before the title — `'09:30'`. */
  time?: string
  tone?: AccentTone
}

export interface EventCalendarProps {
  events: readonly CalendarEvent[]
  /** Any day in the month on show, controlled. */
  month?: IsoDate
  /** The month to open on. The current month by default. */
  defaultMonth?: IsoDate
  /** Called with the first day of the month the user moved to. */
  onMonthChange?: (month: IsoDate) => void
  /** A day was activated: its number clicked, or Enter pressed on it. */
  onDateClick?: (date: IsoDate) => void
  /** An event was clicked. Without this, events are text rather than buttons. */
  onEventClick?: (event: CalendarEvent) => void
  /** Events listed in a day before "+n more". `3` by default. */
  maxEventsPerDay?: number
  /** Controls at the end of the header — a view switch, a New button. */
  actions?: ReactNode
  /** Formats the month, weekday and day names. `'en-US'` by default. */
  locale?: string
  /** `1` = Monday (the default), `0` = Sunday. */
  weekStartsOn?: 0 | 1
  className?: string
  /** Names the calendar. Defaults to the month shown. */
  'aria-label'?: string
}

const DAY_MS = 86_400_000
const dayNumber = (date: Date) =>
  Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)

/**
 * A month of events: bookings, shifts, deadlines, leave, releases.
 *
 * `Calendar` picks a date; this shows what is on each one. The days follow the
 * grid pattern — one tab stop, arrow keys by day and week, Page Up and Page
 * Down by month, Home and End to the ends of the week — and Enter on a day
 * calls `onDateClick`. Events are their own buttons when `onEventClick` is set.
 * On a narrow screen each event shrinks to a coloured bar so the month still fits.
 */
export function EventCalendar({
  events,
  month,
  defaultMonth,
  onMonthChange,
  onDateClick,
  onEventClick,
  maxEventsPerDay = 3,
  actions,
  locale = DEFAULT_LOCALE,
  weekStartsOn = 1,
  className,
  'aria-label': ariaLabel,
}: EventCalendarProps) {
  const hydrated = useHydrated()
  const today = hydrated ? new Date(new Date().toDateString()) : null

  const [internalMonth, setInternalMonth] = useState(() =>
    startOfMonth(fromIso(defaultMonth) ?? new Date()),
  )
  const controlled = fromIso(month)
  const cursor = controlled ? startOfMonth(controlled) : internalMonth
  const [focused, setFocused] = useState<Date | null>(null)
  const gridRef = useRef<HTMLTableElement>(null)

  const setMonth = (next: Date) => {
    const first = startOfMonth(next)
    if (!controlled) setInternalMonth(first)
    onMonthChange?.(toIso(first))
  }

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )
  const dayLabel = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }), [locale])
  const weekdays = useMemo(() => {
    const monday = new Date(2024, 0, 1)
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(monday, (index + (weekStartsOn === 0 ? 6 : 0)) % 7)
      return { short: short.format(day), long: long.format(day) }
    })
  }, [locale, weekStartsOn])

  const weeks = useMemo(() => {
    const lead = (cursor.getDay() - weekStartsOn + 7) % 7
    const start = addDays(cursor, -lead)
    const days = Math.ceil((lead + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7) * 7
    return Array.from({ length: days / 7 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
    )
  }, [cursor, weekStartsOn])

  // Events by day number, a spanning event entered on every day it covers.
  const byDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    for (const event of events) {
      const from = fromIso(event.date)
      if (!from) continue
      const to = fromIso(event.end) ?? from
      for (let day = dayNumber(from); day <= Math.max(dayNumber(from), dayNumber(to)); day++) {
        const list = map.get(day)
        if (list) list.push(event)
        else map.set(day, [event])
      }
    }
    return map
  }, [events])

  const tabStop =
    focused && sameMonthAs(focused, cursor)
      ? focused
      : today && sameMonthAs(today, cursor)
        ? today
        : cursor

  const moveFocus = (date: Date) => {
    setFocused(date)
    if (!sameMonthAs(date, cursor)) setMonth(date)
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>(`[data-day="${toIso(date)}"]`)?.focus()
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const target = event.target as HTMLElement
    if (!target.dataset.day) return
    const active = fromIso(target.dataset.day)!
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next: Date | null = null
    if (event.key in moves) next = addDays(active, moves[event.key]!)
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const shifted = addMonths(active, event.key === 'PageUp' ? -1 : 1)
      const last = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate()
      next = new Date(shifted.getFullYear(), shifted.getMonth(), Math.min(active.getDate(), last))
    } else if (event.key === 'Home' || event.key === 'End') {
      const offset = (active.getDay() - weekStartsOn + 7) % 7
      next = addDays(active, event.key === 'Home' ? -offset : 6 - offset)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onDateClick?.(toIso(active))
      return
    }
    if (!next) return
    event.preventDefault()
    moveFocus(next)
  }

  const caption = monthFormat.format(cursor)

  return (
    <div data-slot="event-calendar" className={cn('sui-event-calendar', className)}>
      <div className="sui-event-calendar__header">
        <div className="sui-event-calendar__nav">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(cursor, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(cursor, 1))}
          >
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
        </div>
        <p className="sui-event-calendar__caption" aria-live="polite">
          {caption}
        </p>
        {actions ? <div className="sui-event-calendar__actions">{actions}</div> : null}
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-label={ariaLabel ?? caption}
        className="sui-event-calendar__grid"
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day.long} scope="col" abbr={day.long} className="sui-event-calendar__weekday">
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={toIso(week[0]!)}>
              {week.map((date) => {
                const iso = toIso(date)
                const list = byDay.get(dayNumber(date)) ?? []
                const shown = list.slice(0, maxEventsPerDay)
                const hidden = list.length - shown.length
                const outside = !sameMonthAs(date, cursor)
                const isToday = today !== null && date.getTime() === today.getTime()
                const count = list.length
                return (
                  <td
                    key={iso}
                    role="gridcell"
                    data-outside={outside || undefined}
                    data-today={isToday || undefined}
                    className="sui-event-calendar__day"
                  >
                    <button
                      type="button"
                      data-day={iso}
                      tabIndex={date.getTime() === tabStop.getTime() ? 0 : -1}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${dayLabel.format(date)}${count ? `, ${count} ${count === 1 ? 'event' : 'events'}` : ''}`}
                      className="sui-event-calendar__date sui-focusable"
                      onClick={() => {
                        setFocused(date)
                        onDateClick?.(iso)
                      }}
                    >
                      {date.getDate()}
                    </button>
                    {shown.length ? (
                      <ul className="sui-event-calendar__events">
                        {shown.map((item) => {
                          const name =
                            item.textValue ?? (typeof item.title === 'string' ? item.title : undefined)
                          const body = (
                            <>
                              {item.time ? (
                                <span className="sui-event-calendar__time">{item.time}</span>
                              ) : null}
                              <span className="sui-event-calendar__title">{item.title}</span>
                            </>
                          )
                          return (
                            <li
                              key={item.id}
                              className={cn(
                                'sui-event-calendar__event',
                                onEventClick && 'sui-event-calendar__event--button',
                                toneClass(item.tone ?? 'primary'),
                              )}
                            >
                              {onEventClick ? (
                                <button
                                  type="button"
                                  aria-label={name ? `${item.time ? `${item.time} ` : ''}${name}` : undefined}
                                  className="sui-event-calendar__event-button"
                                  onClick={() => onEventClick(item)}
                                >
                                  {body}
                                </button>
                              ) : (
                                body
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                    {hidden > 0 ? (
                      onDateClick ? (
                        <button
                          type="button"
                          className="sui-event-calendar__more"
                          aria-label={`${hidden} more on ${dayLabel.format(date)}`}
                          onClick={() => onDateClick(iso)}
                        >
                          +{hidden} more
                        </button>
                      ) : (
                        <span className="sui-event-calendar__more">+{hidden} more</span>
                      )
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

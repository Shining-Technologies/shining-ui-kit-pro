/*
 * The value formats of the date and time components, and the helpers that read
 * and write them.
 *
 * No `'use client'`: these are plain functions, and a Server Component that
 * imports one from a client module gets a client reference it cannot call. The
 * components import them from here; the family index exports them from here.
 */
import { addDays, DEFAULT_LOCALE, startOfMonth } from './internal'

/** A calendar day, as `yyyy-mm-dd` in the viewer's own timezone. */
export type IsoDate = string

/** A time of day as `HH:mm` on a 24-hour clock — `'09:30'`, `'17:05'`. */
export type IsoTime = string

/** `'2026-03-12T09:30'` — a local date and time, with no timezone attached. */
export type IsoDateTime = string

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
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  // `Date` rolls an impossible day over (31 February is 2 or 3 March), so a
  // date that does not read back as what was written was never a date.
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return date
}

/** A span of calendar days, both ends included. */
export interface DateRange {
  from: IsoDate
  to: IsoDate
}

/**
 * `{ from: '2026-09-03', to: '2026-09-12' }` → `'Sep 3 – 12, 2026'`, the way
 * the locale writes a span: what the two ends share is written once. `null`
 * when either end is not a date. `locale` defaults to `'en-US'`, never the
 * runtime's default, so server and browser render the same text.
 */
export function formatDateRange(
  range: DateRange | undefined,
  locale: string = DEFAULT_LOCALE,
): string | null {
  const from = fromIso(range?.from)
  const to = fromIso(range?.to)
  if (!from || !to) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).formatRange(from, to)
}

/** How many calendar days a range covers, both ends included: a single day is 1. */
export function countDays(range: DateRange): number {
  const from = fromIso(range.from)
  const to = fromIso(range.to)
  if (!from || !to) return 0
  // `Date.UTC` counts calendar days; local midnights are 23 or 25 hours apart
  // across a daylight-saving change.
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((day(to) - day(from)) / 86_400_000) + 1
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
    // Calendar days, not 24-hour blocks: across a daylight-saving change a
    // day is 23 or 25 hours long, and subtracting n × 24 hours lands a day out.
    range: () => [toIso(addDays(new Date(), -6)), toIso(new Date())],
  },
  {
    label: 'Last 30 days',
    range: () => [toIso(addDays(new Date(), -29)), toIso(new Date())],
  },
  {
    label: 'This month',
    range: () => {
      const now = new Date()
      return [toIso(startOfMonth(now)), toIso(now)]
    },
  },
]

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

/**
 * `'17:05'` → `'5:05 PM'`. `locale` defaults to `'en-US'`, never the runtime's
 * default, so server and browser render the same text.
 */
export function formatTime(
  value: string | undefined,
  locale: string = DEFAULT_LOCALE,
  hour12 = true,
): string | null {
  const parsed = fromTime(value)
  if (!parsed) return null
  const date = new Date(2000, 0, 1, parsed.hours, parsed.minutes)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12 }).format(
    date,
  )
}

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
 * the time its time input shows.
 */
export function joinDateTime(
  date: IsoDate | undefined,
  time: IsoTime | undefined,
): IsoDateTime | undefined {
  return date ? `${date}T${time ?? '00:00'}` : undefined
}

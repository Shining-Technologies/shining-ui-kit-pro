/**
 * Calendar dates for filtering.
 *
 * A date filter asks "which *day* is this row on?", and a timestamp has no day
 * until a time zone is chosen: 20:00 UTC on the 5th is the morning of the 6th
 * in Sydney. The previous engine answered with the local zone of whatever
 * process ran the filter, so a Next.js server in UTC and a browser in Sydney
 * returned different rows for the same filter — and a day boundary computed as
 * `midnight + 24h` was an hour off on daylight-saving days.
 *
 * Here every value is reduced to a `yyyy-mm-dd` string in an explicit zone,
 * and days are compared as strings. No arithmetic, no DST, and the same answer
 * wherever it runs when the same `timeZone` is passed.
 */

/** A calendar day, `yyyy-mm-dd`. */
export type CalendarDate = string

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** `true` when `value` is a real `yyyy-mm-dd` day (so not `2024-02-30`). */
export function isCalendarDate(value: string): boolean {
  const match = DATE_ONLY.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function dayFormatter(timeZone: string | undefined): Intl.DateTimeFormat {
  const key = timeZone ?? ''
  let formatter = formatters.get(key)
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        calendar: 'gregory',
        numberingSystem: 'latn',
      })
    } catch {
      throw new RangeError(`[shining-ui] "${timeZone}" is not a valid IANA time zone.`)
    }
    formatters.set(key, formatter)
  }
  return formatter
}

function formatDay(timestamp: number, timeZone: string | undefined): CalendarDate {
  let year = ''
  let month = ''
  let day = ''
  for (const part of dayFormatter(timeZone).formatToParts(timestamp)) {
    if (part.type === 'year') year = part.value
    else if (part.type === 'month') month = part.value
    else if (part.type === 'day') day = part.value
  }
  return `${year.padStart(4, '0')}-${month}-${day}`
}

/**
 * The calendar day a value falls on in `timeZone`, or `null` if it is not a date.
 *
 * - `"2024-03-05"` is already a day and is returned unchanged, in every zone.
 * - A `Date`, epoch milliseconds or an ISO timestamp is placed in `timeZone`
 *   (the runtime's zone when omitted).
 *
 * An ISO timestamp *without* an offset (`"2024-03-05T09:00"`) is read by the
 * runtime as its own local time; store timestamps with an offset or as UTC.
 */
export function toCalendarDate(value: unknown, timeZone?: string): CalendarDate | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    if (DATE_ONLY.test(trimmed)) return isCalendarDate(trimmed) ? trimmed : null
    const parsed = Date.parse(trimmed)
    return Number.isNaN(parsed) ? null : formatDay(parsed, timeZone)
  }
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : formatDay(time, timeZone)
  }
  if (typeof value === 'number') return Number.isFinite(value) ? formatDay(value, timeZone) : null
  return null
}

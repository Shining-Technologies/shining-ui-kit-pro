/*
 * Shared plumbing for the date and time components. Not exported from the
 * family index, and deliberately without `'use client'`: `date-utils` builds on
 * it, and that module has to stay callable from Server Components.
 */
import { DEFAULT_TABLE_LOCALE } from '../data-table/lib/format'

/**
 * The locale dates and times are formatted in when the application passes none.
 *
 * The table's constant, so a table and its date filters always agree, and fixed
 * rather than the runtime's default: a Node server and a browser rarely share a
 * default locale, and a month name rendered in one and hydrated in the other is
 * a hydration error.
 */
export const DEFAULT_LOCALE = DEFAULT_TABLE_LOCALE

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

/** Calendar days, not 24-hour blocks: a daylight-saving day is 23 or 25 hours long. */
export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const sameMonthAs = (date: Date, month: Date) =>
  date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()

/** A usable minute step: a whole number of minutes, at least one. */
export function normaliseStep(step: number | undefined): number {
  const whole = Math.floor(Number(step))
  return Number.isFinite(whole) && whole >= 1 ? whole : 1
}

/**
 * One arrow-key step of the minute, onto the step's grid first — 09:07 steps up
 * to 09:10 and down to 09:05 at a step of 5, not to 09:12 and 09:02. Rolling
 * past the hour moves the hour, and midnight wraps.
 */
export function stepMinutes(
  hours: number,
  minutes: number,
  step: number,
  direction: 1 | -1,
): { hours: number; minutes: number } {
  const snapped =
    direction > 0
      ? Math.floor(minutes / step) * step + step
      : Math.ceil(minutes / step) * step - step
  const total = (((hours * 60 + snapped) % 1440) + 1440) % 1440
  return { hours: Math.floor(total / 60), minutes: total % 60 }
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/**
 * The minutes a clock face offers for a step: every multiple of both five (the
 * readable face) and the step, so a mark can never be off the step's grid.
 * A step of 1 or 5 gives twelve marks, 15 gives four, 2 gives six (every ten).
 */
export function minuteMarks(step: number): number[] {
  const spacing = (5 * step) / gcd(5, step)
  const marks: number[] = []
  for (let minute = 0; minute < 60; minute += spacing) marks.push(minute)
  return marks
}

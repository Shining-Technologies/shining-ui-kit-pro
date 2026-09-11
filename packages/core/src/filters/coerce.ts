/** Value coercion shared by every filter predicate. All functions are total. */

/** `null` when the value cannot meaningfully be compared as text. */
export function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  return null
}

/** `null` when the value is not a finite number (or a numeric string). */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Milliseconds since epoch, or `null` when the value is not a usable date. */
export function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime()
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const t = Date.parse(value)
    return Number.isNaN(t) ? null : t
  }
  return null
}

/** Midnight (local time) of the day containing `timestamp`. */
export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** `true` for `null`, `undefined`, blank strings and empty arrays. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** Casefolded, accent-insensitive text used for `contains` / `startsWith` / … */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Read the two operands of a range operator, tolerating tuples and objects. */
export function toRange(value: unknown): [unknown, unknown] {
  if (Array.isArray(value)) return [value[0], value[1]]
  if (typeof value === 'object' && value !== null) {
    const o = value as Record<string, unknown>
    return [o.from ?? o.min ?? o.start, o.to ?? o.max ?? o.end]
  }
  return [value, undefined]
}

/** Always produce an array, so `multiSelect` works with scalar or list values. */
export function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  return [value]
}

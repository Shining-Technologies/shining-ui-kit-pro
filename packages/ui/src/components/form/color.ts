/**
 * Hex colour helpers, with no React and no `'use client'`, so a Server Action
 * can normalise the colour a form submitted the same way the field does.
 */

/** The swatches offered when the caller names none — one row of the ramp. */
export const DEFAULT_SWATCHES = [
  '#0f172a',
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `'#abc'` → `'#aabbcc'`; anything that is not a hex colour comes back `null`. */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!HEX.test(withHash)) return null
  if (withHash.length === 4) {
    const [, r, g, b] = withHash
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return withHash.toLowerCase()
}

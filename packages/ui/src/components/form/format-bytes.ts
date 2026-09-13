/**
 * Byte formatting, with no React and no `'use client'`, so a Server Component
 * or a Server Action can describe an upload limit in the words the field uses.
 */

/** `1536000` → `1.5 MB`. Decimal units, because that is what a file manager shows. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const power = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1000)))
  const value = bytes / 1000 ** power
  return `${power === 0 ? value : value.toFixed(decimals)} ${units[power]}`
}

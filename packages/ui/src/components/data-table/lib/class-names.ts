import type { CellAlign, ColumnResponsive } from '../../../core'

/** Alignment classes. Defined in CSS so they work without consumer Tailwind. */
export const ALIGN_CLASS: Record<CellAlign, string> = {
  left: 'sui-align-left',
  center: 'sui-align-center',
  right: 'sui-align-right',
}

/**
 * Responsive visibility is pure CSS: no resize listener, no layout thrash, and
 * it keeps working when the library is used without Tailwind (§23).
 */
export function responsiveClass(responsive: ColumnResponsive | undefined): string | undefined {
  if (!responsive) return undefined
  const classes: string[] = []
  if (responsive.hideBelow) classes.push(`sui-hide-below-${responsive.hideBelow}`)
  if (responsive.hideAbove) classes.push(`sui-hide-above-${responsive.hideAbove}`)
  return classes.length ? classes.join(' ') : undefined
}

/**
 * Column ids are user-supplied, so they are sanitised before being spliced into
 * a CSS custom property name.
 */
export function columnSizeVar(columnId: string, kind: 'header' | 'cell' = 'cell'): string {
  const safe = columnId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `--sui-${kind === 'header' ? 'h' : 'c'}-${safe}-size`
}

/** The variable holding a pinned column's sticky offset, in pixels. */
export function columnPinVar(columnId: string, side: 'left' | 'right'): string {
  const safe = columnId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `--sui-p${side === 'left' ? 'l' : 'r'}-${safe}`
}

/** `width: calc(var(--sui-c-name-size) * 1px)` — the value written on cells. */
export function columnSizeValue(columnId: string, kind: 'header' | 'cell' = 'cell'): string {
  return `calc(var(${columnSizeVar(columnId, kind)}) * 1px)`
}

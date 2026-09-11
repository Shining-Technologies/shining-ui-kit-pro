import type { ReactNode } from 'react'
import { ExternalLinkIcon } from '../../lib/icons'
import { cn } from '../../lib/cn'
import { Badge, type BadgeProps } from '../../primitives/badge'

/**
 * Ready-made cell renderers.
 *
 * None of these are required — a `cell` function can return any React you like.
 * They exist so the common cases (a status pill, a person, a money column) look
 * consistent and correct without every project re-deriving them (§11).
 */

export interface CellTextProps {
  children: ReactNode
  /** Clamp to one line with an ellipsis, and expose the full text on hover. */
  truncate?: boolean
  title?: string
  className?: string
}

export function CellText({ children, truncate = true, title, className }: CellTextProps) {
  return (
    <span
      className={cn('sui-cell-text', truncate && 'sui-cell-text--truncate', className)}
      title={title}
    >
      {children}
    </span>
  )
}

export interface CellBadgeProps extends BadgeProps {
  children: ReactNode
}

export function CellBadge(props: CellBadgeProps) {
  return <Badge {...props} />
}

export interface CellPersonProps {
  name: ReactNode
  /** Second line — an email, a handle, whatever identifies them further. */
  description?: ReactNode
  /** Third line, for ownership or state: "Handled by Sam", "Unassigned". */
  caption?: ReactNode
  imageSrc?: string
  /** Falls back to initials derived from `name`. */
  initials?: string
  /**
   * What the avatar's colour is derived from. Defaults to the name, so the
   * same person is the same colour in every table; pass a stable id when two
   * people share a name.
   */
  seed?: string
  /** `false` drops the avatar and keeps the text block. */
  avatar?: boolean
  className?: string
}

function initialsFrom(name: ReactNode): string {
  if (typeof name !== 'string') return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}

/**
 * A stable colour per person, drawn from the chart ramp.
 *
 * The ramp is generated from the project's own hues, so avatars stay on-brand
 * through a retheme — and it is a *tint* of the colour rather than the colour
 * itself, because nothing guarantees white initials would clear 4.5:1 on an
 * arbitrary project's chart colour.
 */
function toneFrom(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return (Math.abs(hash) % 5) + 1
}

export function CellPerson({
  name,
  description,
  caption,
  imageSrc,
  initials,
  seed,
  avatar = true,
  className,
}: CellPersonProps) {
  const key = seed ?? (typeof name === 'string' ? name : '')
  return (
    <div className={cn('sui-person', className)}>
      {avatar ? (
        <span className="sui-avatar" data-tone={key ? toneFrom(key) : undefined} aria-hidden="true">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="sui-avatar__image" loading="lazy" />
          ) : (
            <span className="sui-avatar__initials">{initials ?? initialsFrom(name)}</span>
          )}
        </span>
      ) : null}
      <span className="sui-person__text">
        <span className="sui-person__name">{name}</span>
        {description ? <span className="sui-person__description">{description}</span> : null}
        {caption ? <span className="sui-person__caption">{caption}</span> : null}
      </span>
    </div>
  )
}

export interface CellStackProps {
  /** The value itself. */
  children: ReactNode
  /** Supporting line underneath — a status pill, a time, a count. */
  secondary?: ReactNode
  className?: string
}

/**
 * Two lines in one cell.
 *
 * The pattern every dense admin table converges on: the identifier and the one
 * thing you always want to know about it — an id and its status, a date and its
 * time — instead of two columns that are only ever read together.
 */
export function CellStack({ children, secondary, className }: CellStackProps) {
  return (
    <div className={cn('sui-cell-stack', className)}>
      <span className="sui-cell-stack__primary">{children}</span>
      {secondary ? <span className="sui-cell-stack__secondary">{secondary}</span> : null}
    </div>
  )
}

/** The muted placeholder for "there is nothing here", so blanks read as answers. */
export function CellEmpty({ children = '—' }: { children?: ReactNode }) {
  return <span className="sui-muted">{children}</span>
}

export interface CellProgressProps {
  value: number
  max?: number
  /** Show the numeric value next to the bar. */
  showValue?: boolean
  label: string
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}

export function CellProgress({
  value,
  max = 100,
  showValue = true,
  label,
  tone = 'accent',
  className,
}: CellProgressProps) {
  const clamped = Math.max(0, Math.min(value, max))
  const percent = max === 0 ? 0 : (clamped / max) * 100

  return (
    <div className={cn('sui-progress', className)}>
      <div
        className="sui-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('sui-progress__bar', `sui-progress__bar--${tone}`)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue ? <span className="sui-progress__value">{Math.round(percent)}%</span> : null}
    </div>
  )
}

export interface CellNumberProps {
  value: number | null | undefined
  /** Any `Intl.NumberFormat` options: currency, percent, compact… */
  options?: Intl.NumberFormatOptions
  locale?: string
  fallback?: ReactNode
  className?: string
}

export function CellNumber({ value, options, locale, fallback = '—', className }: CellNumberProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={cn('sui-muted', className)}>{fallback}</span>
  }
  return (
    <span className={cn('sui-tabular', className)}>
      {new Intl.NumberFormat(locale, options).format(value)}
    </span>
  )
}

export interface CellDateProps {
  value: Date | string | number | null | undefined
  options?: Intl.DateTimeFormatOptions
  locale?: string
  fallback?: ReactNode
  className?: string
}

export function CellDate({
  value,
  options = { dateStyle: 'medium' },
  locale,
  fallback = '—',
  className,
}: CellDateProps) {
  const date = value === null || value === undefined ? null : new Date(value)
  if (!date || Number.isNaN(date.getTime())) {
    return <span className={cn('sui-muted', className)}>{fallback}</span>
  }
  return (
    <time dateTime={date.toISOString()} className={cn('sui-tabular', className)}>
      {new Intl.DateTimeFormat(locale, options).format(date)}
    </time>
  )
}

export interface CellLinkProps {
  href: string
  children: ReactNode
  external?: boolean
  className?: string
}

export function CellLink({ href, children, external, className }: CellLinkProps) {
  return (
    <a
      href={href}
      className={cn('sui-link', className)}
      // A row click handler must not also fire when following a link.
      onClick={(event) => event.stopPropagation()}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {children}
      {external ? (
        <>
          <ExternalLinkIcon className="sui-link__icon" aria-hidden="true" />
          <span className="sui-sr-only"> (opens in a new tab)</span>
        </>
      ) : null}
    </a>
  )
}

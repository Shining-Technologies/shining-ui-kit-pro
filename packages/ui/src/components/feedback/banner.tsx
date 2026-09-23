'use client'

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { toneClass } from '../../lib/tone'
import type { StatusTone } from '../badge/status-badge'
import { CheckCircleIcon, CloseIcon, InfoIcon, TriangleAlertIcon } from '../icons/icons'

const DEFAULT_ICON: Partial<Record<StatusTone, ReactNode>> = {
  info: <InfoIcon />,
  primary: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <TriangleAlertIcon />,
  destructive: <TriangleAlertIcon />,
}

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What the message means. `'info'` by default. */
  tone?: StatusTone
  /** Pass `null` to suppress the tone's default glyph. */
  icon?: ReactNode
  /** A short bold lead-in before the message. */
  title?: ReactNode
  /** Buttons or links at the end of the strip — "Upgrade", "Retry", "Learn more". */
  action?: ReactNode
  /**
   * Show a close button. Without `onDismiss` the banner hides itself; with it,
   * the caller is told and decides (to remember the dismissal, say).
   */
  dismissible?: boolean
  /** Called when the close button is pressed. Implies `dismissible`. */
  onDismiss?: () => void
  /** The close button's accessible name. `'Dismiss'` by default. */
  dismissLabel?: string
}

/**
 * A message about the whole application rather than one section of it — a
 * trial ending, maintenance tonight, a connection lost — shown as a full-width
 * strip, usually above the header or the page content.
 *
 * `Alert` is the in-page note; `Banner` is the same meaning at the edge of the
 * page, with room for an action and a close button. A destructive banner is
 * `role="alert"`; the rest are `role="status"`, which a screen reader reads
 * when it next pauses rather than mid-sentence.
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    className,
    tone = 'info',
    icon,
    title,
    action,
    dismissible,
    onDismiss,
    dismissLabel = 'Dismiss',
    children,
    ...props
  },
  ref,
) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  const glyph = icon === undefined ? DEFAULT_ICON[tone] : icon
  const closable = dismissible || Boolean(onDismiss)

  return (
    <div
      ref={ref}
      data-slot="banner"
      data-tone={tone}
      role={tone === 'destructive' ? 'alert' : 'status'}
      className={cn('sui-banner', toneClass(tone), className)}
      {...props}
    >
      {glyph ? (
        <span className="sui-banner__icon" aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      <p className="sui-banner__message">
        {title ? <strong className="sui-banner__title">{title}</strong> : null}
        {title && children ? ' ' : null}
        {children}
      </p>
      {action ? <div className="sui-banner__action">{action}</div> : null}
      {closable ? (
        <button
          type="button"
          className="sui-banner__close sui-focusable"
          aria-label={dismissLabel}
          onClick={() => {
            if (onDismiss) onDismiss()
            else setHidden(true)
          }}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  )
})

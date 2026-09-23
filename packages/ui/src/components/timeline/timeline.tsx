import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { toneClass, type AccentTone } from '../../lib/tone'

/*
 * Markup only: a timeline renders as a Server Component, so an activity feed
 * or an audit log fetched on the server ships no client JavaScript.
 */

export const timelineVariants = cva('sui-timeline', {
  variants: {
    variant: {
      /** Markers on a rail, the time under each title. An activity feed, a record's history. */
      default: '',
      /** Dense rows with the time in a column of its own: an audit log. */
      compact: 'sui-timeline--compact',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface TimelineProps
  extends HTMLAttributes<HTMLOListElement>, VariantProps<typeof timelineVariants> {}

/**
 * Events in order: what happened to a record, who did it and when.
 *
 * An ordered list, because the order is the information. Each `TimelineItem`
 * is one event; a `TimelineHeading` splits the list by day ("Today",
 * "Yesterday") without leaving it. The rail is drawn by CSS between markers,
 * so it cannot run past the last event.
 */
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { className, variant, ...props },
  ref,
) {
  return (
    <ol
      ref={ref}
      data-slot="timeline"
      className={cn(timelineVariants({ variant }), className)}
      {...props}
    />
  )
})

export interface TimelineItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> {
  /** What happened: "Invoice paid", "Ada Park approved the request". */
  title: ReactNode
  /** When, as it should read: `'2 hours ago'`, `'Sep 12, 09:30'`. */
  time?: ReactNode
  /**
   * The machine-readable moment (`'2026-09-12T09:30'`), put on a `<time>`
   * element so the displayed text can stay relative.
   */
  dateTime?: string
  /** The marker: a glyph, or a `UserAvatar` for a feed of people. Without one, a dot. */
  icon?: ReactNode
  /** The marker's colour. `'neutral'` by default. */
  tone?: AccentTone
  /** An event that has not happened yet: a hollow marker and muted text. */
  pending?: boolean
  /** Details under the title: a comment, a diff, attachments. */
  children?: ReactNode
}

export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(function TimelineItem(
  { className, title, time, dateTime, icon, tone = 'neutral', pending, children, ...props },
  ref,
) {
  const stamp =
    time != null ? (
      <time className="sui-timeline__time" dateTime={dateTime}>
        {time}
      </time>
    ) : null

  return (
    <li
      ref={ref}
      data-slot="timeline-item"
      data-pending={pending || undefined}
      className={cn('sui-timeline__item', toneClass(tone), className)}
      {...props}
    >
      <span
        className={cn('sui-timeline__marker', icon != null && 'sui-timeline__marker--icon')}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="sui-timeline__body">
        <div className="sui-timeline__title">{title}</div>
        {stamp}
        {children != null ? <div className="sui-timeline__content">{children}</div> : null}
      </div>
    </li>
  )
})

/** A day or period label inside a `Timeline` — "Today", "Last week". */
export const TimelineHeading = forwardRef<HTMLLIElement, LiHTMLAttributes<HTMLLIElement>>(
  function TimelineHeading({ className, ...props }, ref) {
    return (
      <li
        ref={ref}
        data-slot="timeline-heading"
        className={cn('sui-timeline__heading', className)}
        {...props}
      />
    )
  },
)

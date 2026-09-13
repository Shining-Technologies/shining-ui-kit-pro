'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { TrendDownIcon, TrendUpIcon } from '../icons/icons'
import { Skeleton } from '../feedback/skeleton'

export const statsCardVariants = cva('sui-stats-card', {
  variants: {
    size: { sm: 'sui-stats-card--sm', default: '', lg: 'sui-stats-card--lg' },
    /** A card that is itself the control gets the affordance; a static one must not. */
    interactive: { true: 'sui-stats-card--interactive', false: '' },
  },
  defaultVariants: { size: 'default', interactive: false },
})

export type StatsTrend = 'up' | 'down' | 'neutral'

export interface StatsCardProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onClick'>,
    VariantProps<typeof statsCardVariants> {
  label: ReactNode
  value: ReactNode
  /** The change itself — `'+12.4%'`, `'−3 jobs'`. */
  change?: ReactNode
  /**
   * Whether the change is good news. Explicit rather than inferred from the
   * sign: a fall in churn is an `up`, and only the caller knows that.
   */
  trend?: StatsTrend
  /**
   * Read by assistive tech after the change, for what its colour and arrow
   * show. Defaults to `'favourable'` for `trend="up"`, `'unfavourable'` for
   * `'down'`, and nothing for `'neutral'`. Pass `''` to say nothing.
   */
  trendLabel?: string
  description?: ReactNode
  /** A `<Badge>`, usually — the period the figure covers, or a state. */
  badge?: ReactNode
  icon?: ReactNode
  /** Swap the value for a placeholder while the figure is still in flight. */
  loading?: boolean
  onClick?: () => void
  /** A sparkline or mini chart, rendered full-bleed under the figure. */
  chart?: ReactNode
}

/**
 * One metric, with everything a dashboard actually needs around it: chrome,
 * icon, trend, footnote and loading state — the case common enough that every
 * app would otherwise rebuild it slightly differently. For figures inside a
 * card you are already composing, use `MetricTile`.
 *
 * Clicking is opt-in through `onClick`. It adds a real `<button>` stretched
 * over the card, so the card is reachable by keyboard without anyone adding a
 * `tabIndex`. The button sits beside the content rather than around it: a
 * button may only hold phrasing content, and a chart (a `Sparkline` renders a
 * `<div>`) would make that invalid HTML. It is named by the label and the
 * figure and described by the footnote.
 */
export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(function StatsCard(
  {
    className,
    label,
    value,
    change,
    trend = 'neutral',
    trendLabel,
    description,
    badge,
    icon,
    loading = false,
    onClick,
    chart,
    size,
    interactive,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const id = useId()
  const clickable = Boolean(onClick)
  const TrendIcon = trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : null
  const spokenTrend =
    trendLabel ?? (trend === 'up' ? 'favourable' : trend === 'down' ? 'unfavourable' : '')
  const hasFoot = change !== undefined || Boolean(description)

  const labelId = `${id}-label`
  const valueId = `${id}-value`
  const footId = `${id}-foot`

  return (
    <div
      ref={ref}
      data-slot="stats-card"
      data-trend={trend}
      aria-busy={loading || undefined}
      className={cn(statsCardVariants({ size, interactive: clickable || interactive }), className)}
      // With a button, the caller's naming belongs to the button; without one,
      // the card is the element and keeps it.
      aria-label={clickable ? undefined : ariaLabel}
      aria-labelledby={clickable ? undefined : ariaLabelledBy}
      aria-describedby={clickable ? undefined : ariaDescribedBy}
      {...props}
    >
      <span className="sui-stats-card__head">
        <span id={labelId} className="sui-stats-card__label">
          {label}
        </span>
        {badge ? <span className="sui-stats-card__badge">{badge}</span> : null}
        {icon ? (
          <span className="sui-stats-card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </span>

      {loading ? (
        <Skeleton as="span" className="sui-stats-card__value-skeleton" />
      ) : (
        <span id={valueId} className="sui-stats-card__value">
          {value}
        </span>
      )}

      {hasFoot ? (
        <span id={footId} className="sui-stats-card__foot">
          {change !== undefined ? (
            <span className={cn('sui-stats-card__change', `sui-stats-card__change--${trend}`)}>
              {TrendIcon ? <TrendIcon /> : null}
              {change}
              {spokenTrend ? <span className="sui-visually-hidden">, {spokenTrend}</span> : null}
            </span>
          ) : null}
          {description ? <span className="sui-stats-card__note">{description}</span> : null}
        </span>
      ) : null}

      {chart ? <div className="sui-stats-card__chart">{chart}</div> : null}

      {clickable ? (
        <button
          type="button"
          className="sui-stats-card__action sui-focusable"
          onClick={onClick}
          aria-label={ariaLabel}
          aria-labelledby={
            ariaLabel ? undefined : (ariaLabelledBy ?? (loading ? labelId : `${labelId} ${valueId}`))
          }
          aria-describedby={ariaDescribedBy ?? (hasFoot ? footId : undefined)}
        />
      ) : null}
    </div>
  )
})

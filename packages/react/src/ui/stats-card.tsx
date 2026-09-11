import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '../lib/cn'
import { TrendDownIcon, TrendUpIcon } from '../lib/icons'
import { Skeleton } from '../primitives/skeleton'

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
 * One metric, with everything a dashboard actually needs around it.
 *
 * `Stat` is the bare figure for use inside a card you are already composing;
 * this is the whole tile — chrome, icon, trend, footnote and loading state —
 * for the case that is common enough that every app would otherwise rebuild it
 * slightly differently.
 *
 * Clicking is opt-in through `onClick`, and it upgrades the element to a real
 * `<button>` rather than putting a handler on a `<div>`, so it is reachable by
 * keyboard without anyone remembering to add a `tabIndex`.
 */
export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(function StatsCard(
  {
    className,
    label,
    value,
    change,
    trend = 'neutral',
    description,
    badge,
    icon,
    loading = false,
    onClick,
    chart,
    size,
    interactive,
    ...props
  },
  ref,
) {
  const clickable = Boolean(onClick)
  const TrendIcon = trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : null

  const content = (
    <>
      <div className="sui-stats-card__head">
        <span className="sui-stats-card__label">{label}</span>
        {badge ? <span className="sui-stats-card__badge">{badge}</span> : null}
        {icon ? (
          <span className="sui-stats-card__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="sui-stats-card__value-skeleton" />
      ) : (
        <span className="sui-stats-card__value">{value}</span>
      )}

      {change !== undefined || description ? (
        <div className="sui-stats-card__foot">
          {change !== undefined ? (
            <span className={cn('sui-stats-card__change', `sui-stats-card__change--${trend}`)}>
              {TrendIcon ? <TrendIcon /> : null}
              {change}
            </span>
          ) : null}
          {description ? <span className="sui-stats-card__note">{description}</span> : null}
        </div>
      ) : null}

      {chart ? <div className="sui-stats-card__chart">{chart}</div> : null}
    </>
  )

  if (clickable) {
    return (
      <button
        ref={ref as unknown as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        data-slot="stats-card"
        data-trend={trend}
        className={cn(statsCardVariants({ size, interactive: true }), 'sui-focusable', className)}
        {...(props as HTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      ref={ref}
      data-slot="stats-card"
      data-trend={trend}
      className={cn(statsCardVariants({ size, interactive }), className)}
      {...props}
    >
      {content}
    </div>
  )
})

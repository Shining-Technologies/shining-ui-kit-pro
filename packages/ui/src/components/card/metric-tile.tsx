import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { TrendDownIcon, TrendUpIcon } from '../icons/icons'
import { toneClass, type AccentTone } from '../../lib/tone'
import { Skeleton } from '../feedback/skeleton'
import type { StatsTrend } from './stats-card'

/** What a tile shows. Split from the DOM props so `SummaryCard` can take a list of them. */
export interface MetricTileData {
  label: ReactNode
  value: ReactNode
  /** A footnote under the figure — the period, the comparison, the unit. */
  hint?: ReactNode
  /** The change itself, e.g. `'+6'`. */
  delta?: ReactNode
  /** Whether the change is good news. Explicit, as on `StatsCard`. */
  trend?: StatsTrend
  /**
   * Read by assistive tech after the delta, for what its colour and arrow show.
   * Defaults to `'favourable'` for `trend="up"`, `'unfavourable'` for `'down'`,
   * and nothing for `'neutral'`. Pass `''` to say nothing.
   */
  trendLabel?: string
  /** Paints an accent rule on the leading edge. Omit for a plain tile. */
  tone?: AccentTone
  /** `full` stretches the tile across every column of its `MetricGrid`. */
  span?: 'auto' | 'full'
  /** Swap the value for a placeholder while it is still in flight. */
  loading?: boolean
}

export interface MetricTileProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, MetricTileData {}

/**
 * A figure on a recessed tile — for the headline numbers *inside* a card.
 *
 * `StatsCard` is a card of its own and would put a box inside a box here. This
 * is filled rather than bordered, so a row of them reads as one strip of
 * figures that belongs to the card around it.
 */
export const MetricTile = forwardRef<HTMLDivElement, MetricTileProps>(function MetricTile(
  {
    className,
    label,
    value,
    hint,
    delta,
    trend = 'neutral',
    trendLabel,
    tone,
    span,
    loading,
    ...props
  },
  ref,
) {
  const TrendIcon = trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : null
  // The colour and arrow say whether the change is good news; this says it in words.
  const spokenTrend =
    trendLabel ?? (trend === 'up' ? 'favourable' : trend === 'down' ? 'unfavourable' : '')

  return (
    <div
      ref={ref}
      data-slot="metric-tile"
      aria-busy={loading || undefined}
      className={cn(
        'sui-metric-tile',
        tone && ['sui-metric-tile--accent', toneClass(tone)],
        span === 'full' && 'sui-metric-tile--full',
        className,
      )}
      {...props}
    >
      <span className="sui-metric-tile__label">{label}</span>
      <span className="sui-metric-tile__row">
        {loading ? (
          <Skeleton className="sui-metric-tile__skeleton" />
        ) : (
          <span className="sui-metric-tile__value">{value}</span>
        )}
        {delta !== undefined && !loading ? (
          <span className={cn('sui-metric-tile__delta', `sui-metric-tile__delta--${trend}`)}>
            {TrendIcon ? <TrendIcon /> : null}
            {delta}
            {spokenTrend ? <span className="sui-visually-hidden">, {spokenTrend}</span> : null}
          </span>
        ) : null}
      </span>
      {hint ? <span className="sui-metric-tile__hint">{hint}</span> : null}
    </div>
  )
})

export interface MetricGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * A fixed column count, or `auto` to fit as many ~9rem tiles as the width
   * allows. Fixed counts drop to one column on a phone-width screen.
   */
  columns?: 1 | 2 | 3 | 4 | 'auto'
}

/** Lays out `MetricTile`s in even columns. */
export const MetricGrid = forwardRef<HTMLDivElement, MetricGridProps>(function MetricGrid(
  { className, columns = 2, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="metric-grid"
      className={cn('sui-metric-grid', columns === 'auto' && 'sui-metric-grid--auto', className)}
      style={
        columns === 'auto'
          ? style
          : ({ '--sui-metric-columns': columns, ...style } as CSSProperties)
      }
      {...props}
    />
  )
})

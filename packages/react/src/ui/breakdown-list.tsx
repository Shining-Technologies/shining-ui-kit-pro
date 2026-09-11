import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { toneClass, type AccentTone } from '../lib/tone'
import { Skeleton } from '../primitives/skeleton'
import { Empty, SegmentedBar } from './feedback'

export interface BreakdownItem {
  /**
   * Stable identity. Falls back to the position, not the label: two buckets
   * may share a label, and colliding keys make React drop or merge rows.
   */
  key?: string
  label: string
  value: number
  tone?: AccentTone
  /** A secondary line under the label, e.g. what the bucket means. */
  hint?: ReactNode
}

export interface BreakdownListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  items: BreakdownItem[]
  /** The eyebrow over the rows, e.g. `'By status'`. Also names the list. */
  title?: ReactNode
  /** What the shares are of. Defaults to the sum of `items`. */
  total?: number
  /** A slim bar under each row, sized by its share of the total. */
  showShare?: boolean
  /** The share as a percentage beside each value. */
  showPercent?: boolean
  /** A stacked bar of the whole distribution above the rows. */
  showSummary?: boolean
  /** Renders a figure. Defaults to the locale's number format. */
  formatValue?: (value: number) => ReactNode
  /** Shown instead of rows when `items` is empty. */
  empty?: ReactNode
  /** Placeholder rows while the counts are in flight. */
  loading?: boolean
}

const defaultFormat = (value: number) => value.toLocaleString()

/**
 * A count per bucket: dot, label, figure — the "by status" block of a summary.
 *
 * Data in rather than rows composed, because the part worth getting right is
 * the arithmetic around the rows: the total, the shares, the zero-safe
 * percentages and the empty state. A bucket of zero still renders — "none
 * rejected" is information, and a row that vanishes at zero shifts the layout
 * every time it comes back.
 */
export const BreakdownList = forwardRef<HTMLDivElement, BreakdownListProps>(function BreakdownList(
  {
    className,
    items,
    title,
    total,
    showShare = false,
    showPercent = false,
    showSummary = false,
    formatValue = defaultFormat,
    empty = 'No records yet.',
    loading = false,
    ...props
  },
  ref,
) {
  const titleId = useId()
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0)
  // Clamped: a `total` smaller than a bucket (a stale total, overlapping
  // buckets) must not push a share bar out through the side of its track.
  const shareOf = (value: number) => (sum > 0 ? Math.min(100, Math.max(0, (value / sum) * 100)) : 0)

  let body: ReactNode
  if (loading) {
    body = (
      <div className="sui-breakdown__loading" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="sui-breakdown__skeleton" />
        ))}
      </div>
    )
  } else if (items.length === 0) {
    body = <Empty variant="inline" title={empty} />
  } else {
    body = (
      <>
        {showSummary ? (
          <SegmentedBar
            className="sui-breakdown__summary"
            segments={items}
            label={typeof title === 'string' ? title : undefined}
          />
        ) : null}
        <ul className="sui-breakdown__list" aria-labelledby={title ? titleId : undefined}>
          {items.map((item, index) => {
            const share = shareOf(item.value)
            return (
              <li
                key={item.key ?? index}
                className={cn('sui-breakdown__item', toneClass(item.tone))}
                data-empty={item.value === 0 || undefined}
              >
                <span className="sui-breakdown__dot" aria-hidden="true" />
                <span className="sui-breakdown__label">
                  {item.label}
                  {item.hint ? <span className="sui-breakdown__hint">{item.hint}</span> : null}
                </span>
                <span className="sui-breakdown__value">
                  {showPercent ? (
                    <span className="sui-breakdown__percent">{Math.round(share)}%</span>
                  ) : null}
                  {formatValue(item.value)}
                </span>
                {showShare ? (
                  <span className="sui-breakdown__share" aria-hidden="true">
                    <span
                      className="sui-breakdown__share-fill"
                      style={{ transform: `scaleX(${share / 100})` }}
                    />
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </>
    )
  }

  return (
    <div ref={ref} data-slot="breakdown-list" className={cn('sui-breakdown', className)} {...props}>
      {title ? (
        <div id={titleId} className="sui-breakdown__title">
          {title}
        </div>
      ) : null}
      {body}
    </div>
  )
})

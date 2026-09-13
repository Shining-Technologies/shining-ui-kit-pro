import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLElement> {
  /**
   * `span` for a placeholder inside phrasing-only content — a `<button>`, a
   * link, a label — where a `div` is invalid HTML. It is displayed as a block
   * either way.
   */
  as?: 'div' | 'span'
}

/** A shimmering placeholder block. Purely decorative, hidden from assistive tech. */
export const Skeleton = forwardRef<HTMLElement, SkeletonProps>(function Skeleton(
  { className, as: Comp = 'div', ...props },
  ref,
) {
  return (
    <Comp
      ref={ref as never}
      aria-hidden="true"
      className={cn('sui-skeleton', className)}
      {...props}
    />
  )
})

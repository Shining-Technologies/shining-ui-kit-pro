import { ChevronDownIcon, ChevronUpIcon, SortIcon } from '../../lib/icons'
import { cn } from '../../lib/cn'

export interface SortIndicatorProps {
  direction: 'asc' | 'desc' | false
  /** 1-based position in a multi-column sort; `0` when this is the only sort. */
  index: number
  className?: string
}

/**
 * The arrow next to a sortable header.
 *
 * Purely decorative: the header button's accessible name already announces the
 * current direction, and the `<th>` carries `aria-sort` (§39).
 */
export function SortIndicator({ direction, index, className }: SortIndicatorProps) {
  return (
    <span className={cn('sui-sort', direction && 'sui-sort--active', className)} aria-hidden="true">
      {direction === 'asc' ? (
        <ChevronUpIcon />
      ) : direction === 'desc' ? (
        <ChevronDownIcon />
      ) : (
        <SortIcon className="sui-sort__idle" />
      )}
      {index > 0 ? <span className="sui-sort__index">{index}</span> : null}
    </span>
  )
}

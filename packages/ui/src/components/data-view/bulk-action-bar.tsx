'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { DEFAULT_TABLE_LOCALE } from '../data-table/lib/format'
import { CloseIcon } from '../icons/icons'

const defaultFormat = new Intl.NumberFormat(DEFAULT_TABLE_LOCALE)

export interface BulkActionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** How many items are selected. The bar renders nothing at `0`. */
  count: number
  /** How many items there are, for "3 of 40 selected". */
  total?: number
  /** Clears the selection. Without it there is no Clear button. */
  onClear?: () => void
  /** The Clear button's text. `'Clear selection'` by default. */
  clearLabel?: string
  /** Formats the counts. Defaults to `en-US` grouping, the same on server and client. */
  formatNumber?: (value: number) => string
  /** Replaces the "3 of 40 selected" text. */
  label?: ReactNode
  /** Actions that apply to every selected item — Export, Assign, Delete. */
  children?: ReactNode
}

/**
 * The "N selected" band, with the actions that apply to the whole selection.
 *
 * The DataTable renders this for its row selection (actions come from
 * `slots.selectionActions`); on its own it serves a card grid, a list or a
 * board that has a selection of its own. The count is a polite live region, so
 * a screen reader hears the new count as the selection changes — without the
 * action buttons being read out each time.
 */
export const BulkActionBar = forwardRef<HTMLDivElement, BulkActionBarProps>(function BulkActionBar(
  {
    className,
    count,
    total,
    onClear,
    clearLabel = 'Clear selection',
    formatNumber = defaultFormat.format,
    label,
    children,
    ...props
  },
  ref,
) {
  if (count <= 0) return null

  const hasActions = children != null && children !== false
  // With actions, only the count is live; without, the bar is the live region
  // as it has always been for the table.
  const live = { role: 'status', 'aria-live': 'polite' } as const

  return (
    <div
      ref={ref}
      data-slot="bulk-action-bar"
      className={cn('sui-selection-bar', className)}
      {...(hasActions ? {} : live)}
      {...props}
    >
      <span className="sui-selection-bar__count" {...(hasActions ? live : {})}>
        {label ?? (
          <>
            <strong>{formatNumber(count)}</strong>
            {total !== undefined ? ` of ${formatNumber(total)}` : ''} selected
          </>
        )}
      </span>
      {hasActions ? (
        <div className="sui-selection-bar__actions" role="group" aria-label="Bulk actions">
          {children}
        </div>
      ) : null}
      {onClear ? (
        <button type="button" className="sui-selection-bar__clear" onClick={onClear}>
          <CloseIcon aria-hidden="true" />
          {clearLabel}
        </button>
      ) : null}
    </div>
  )
})

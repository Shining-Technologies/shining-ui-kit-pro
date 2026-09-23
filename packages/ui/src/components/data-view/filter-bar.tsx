'use client'

import {
  Children,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Names the group for assistive tech. `'Filters'` by default. */
  'aria-label'?: string
}

/**
 * One line of controls that narrow a list: a `SearchInput`, a few `Select`s or
 * `Combobox`es, toggle `Chip`s, and actions pushed to the end with
 * `FilterBarActions`. It wraps onto more lines as the width runs out, and on a
 * phone the search takes a line of its own.
 *
 * For a DataTable use its own toolbar, which is wired to the table's state;
 * this is the same look for a card grid, a list, a board or a calendar.
 */
export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  { className, 'aria-label': label = 'Filters', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-slot="filter-bar"
      className={cn('sui-filter-bar', className)}
      {...props}
    />
  )
})

/** The end of a `FilterBar`: view switches, Export, New. */
export const FilterBarActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function FilterBarActions({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="filter-bar-actions"
        className={cn('sui-filter-bar__actions', className)}
        {...props}
      />
    )
  },
)

export interface FilterChipsProps extends HTMLAttributes<HTMLDivElement> {
  /** Shows a "Clear all" button after the chips. */
  onClearAll?: () => void
  /** The button's text. `'Clear all'` by default. */
  clearLabel?: string
  /** Replaces the announced "2 filters applied". */
  summary?: (count: number) => string
  /** One removable `Chip` per applied filter. */
  children?: ReactNode
}

/**
 * The filters in force, as removable chips, with "Clear all".
 *
 * A filter set in a popover is invisible once the popover closes; this is what
 * keeps it on screen. The count is announced politely as filters come and go.
 * With no chips it renders nothing.
 */
export const FilterChips = forwardRef<HTMLDivElement, FilterChipsProps>(function FilterChips(
  {
    className,
    onClearAll,
    clearLabel = 'Clear all',
    summary = (count) => `${count} ${count === 1 ? 'filter' : 'filters'} applied`,
    children,
    ...props
  },
  ref,
) {
  const count = Children.toArray(children).filter(isValidElement).length
  if (count === 0) return null

  return (
    <div
      ref={ref}
      data-slot="filter-chips"
      className={cn('sui-active-filters', 'sui-filter-chips', className)}
      {...props}
    >
      <span className="sui-sr-only" role="status">
        {summary(count)}
      </span>
      {children}
      {onClearAll ? (
        <button type="button" className="sui-filter-chips__clear sui-focusable" onClick={onClearAll}>
          {clearLabel}
        </button>
      ) : null}
    </div>
  )
})

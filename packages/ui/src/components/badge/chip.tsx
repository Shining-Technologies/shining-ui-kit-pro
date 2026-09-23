'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { toneClass } from '../../lib/tone'
import { CloseIcon } from '../icons/icons'
import type { StatusTone } from './status-badge'

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** The chip's colour. `'neutral'` by default. */
  tone?: StatusTone
  size?: 'sm' | 'default'
  /** A glyph or an avatar before the label. */
  icon?: ReactNode
  /**
   * Makes the chip a toggle — a quick filter such as "Open" or "Assigned to
   * me" — rendered as a `<button aria-pressed>`. Use with `onSelectedChange`.
   */
  selected?: boolean
  /** Called with the new state when a toggle chip is pressed. */
  onSelectedChange?: (selected: boolean) => void
  /** Adds a remove button after the label: an entered tag, an applied filter. */
  onRemove?: () => void
  /** The remove button's accessible name. `'Remove'` by default; name what is removed. */
  removeLabel?: string
  disabled?: boolean
}

/**
 * A compact token: a tag on a record, an applied filter, a quick-filter toggle.
 *
 * `Badge` states a fact and cannot be operated. A chip can be: pressed (a
 * toggle, with `selected`) or removed (with `onRemove`), or both. The two
 * controls are separate buttons, never one nested in the other, so each keeps
 * its own name and tab stop. The DataTable's active-filter chips use the same
 * `sui-chip` styling, so filters look alike inside and outside a table.
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    className,
    tone = 'neutral',
    size = 'default',
    icon,
    selected,
    onSelectedChange,
    onRemove,
    removeLabel = 'Remove',
    disabled,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const toggle = selected !== undefined || onSelectedChange !== undefined
  const classes = cn(
    'sui-chip',
    toneClass(tone),
    tone !== 'neutral' && 'sui-chip--toned',
    size === 'sm' && 'sui-chip--sm',
    onRemove && 'sui-chip--removable',
    toggle && 'sui-chip--toggle',
    className,
  )
  const content = (
    <>
      {icon ? (
        <span className="sui-chip__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="sui-chip__text">{children}</span>
    </>
  )
  const remove = onRemove ? (
    <button
      type="button"
      className="sui-chip__remove sui-focusable"
      aria-label={removeLabel}
      disabled={disabled}
      onClick={onRemove}
    >
      <CloseIcon />
    </button>
  ) : null

  if (toggle && !onRemove) {
    return (
      <button
        ref={ref as never}
        type="button"
        data-slot="chip"
        data-selected={selected || undefined}
        aria-pressed={Boolean(selected)}
        disabled={disabled}
        className={cn(classes, 'sui-focusable')}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) onSelectedChange?.(!selected)
        }}
        {...props}
      >
        {content}
      </button>
    )
  }

  return (
    <span
      ref={ref as never}
      data-slot="chip"
      data-selected={toggle && selected ? true : undefined}
      data-disabled={disabled || undefined}
      className={classes}
      onClick={toggle ? undefined : onClick}
      {...props}
    >
      {toggle ? (
        <button
          type="button"
          className="sui-chip__toggle sui-focusable"
          aria-pressed={Boolean(selected)}
          disabled={disabled}
          onClick={(event) => {
            onClick?.(event)
            if (!event.defaultPrevented) onSelectedChange?.(!selected)
          }}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {remove}
    </span>
  )
})

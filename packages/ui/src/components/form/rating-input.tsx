'use client'

import { forwardRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId } from './field-context'
import { useControllableState } from '../../hooks/use-controllable-state'
import { StarIcon } from '../icons/icons'

export interface RatingInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /**
   * Controlled rating when defined; `0` is "not rated". Leave it `undefined`
   * (and use `defaultValue`) for an uncontrolled field.
   */
  value?: number
  /** Initial rating while uncontrolled. */
  defaultValue?: number
  /** Submitted with a native `<form>` through a hidden input holding the number. */
  name?: string
  onValueChange?: (value: number) => void
  /** How many stars. Five, unless the scale genuinely is not. */
  max?: number
  /** Allow halves — `3.5` of 5. */
  allowHalf?: boolean
  /** Clicking the current rating clears it back to zero. */
  clearable?: boolean
  /** Display only: no pointer, no tab stop, no keyboard. */
  readOnly?: boolean
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  /** Word for one unit, used in the labels a screen reader reads. */
  unit?: string
  /** Shown beside the stars — a count, an average. */
  caption?: string
}

/**
 * A star rating.
 *
 * A `slider` under the surface, which is where the keyboard comes from: arrows
 * move by one (or a half), Home and End jump to the ends, and the value is
 * announced as "3 of 5 stars" rather than as an unlabelled button press.
 */
export const RatingInput = forwardRef<HTMLDivElement, RatingInputProps>(function RatingInput(
  {
    className,
    value: valueProp,
    defaultValue,
    name,
    onValueChange,
    max = 5,
    allowHalf = false,
    clearable = true,
    readOnly = false,
    disabled,
    size = 'default',
    unit = 'star',
    caption,
    onKeyDown: onKeyDownProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  // Controlled exactly when `value` is defined, as everywhere in the kit.
  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue: defaultValue ?? 0,
    onChange: onValueChange,
  })
  const [hover, setHover] = useState<number | null>(null)
  const isDisabled = disabled ?? field.disabled
  const interactive = !readOnly && !isDisabled
  const shown = hover ?? value
  const step = allowHalf ? 0.5 : 1

  function set(next: number) {
    const clamped = Math.max(0, Math.min(max, next))
    if (clamped !== value) setValue(clamped)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDownProp?.(event)
    if (!interactive || event.defaultPrevented) return
    const moves: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
    }
    if (event.key in moves) {
      event.preventDefault()
      set(value + moves[event.key]!)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      set(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      set(max)
    }
  }

  return (
    <div
      ref={ref}
      data-slot="rating-input"
      className={cn('sui-rating', size !== 'default' && `sui-rating--${size}`, className)}
      data-disabled={isDisabled || undefined}
      role={readOnly ? 'img' : 'slider'}
      aria-label={
        readOnly
          ? `${value} out of ${max} ${unit}s`
          : (props['aria-label'] ?? (labelId ? undefined : 'Rating'))
      }
      // A `<label for>` cannot reach a div, so a surrounding field's label
      // names the slider through its id instead.
      aria-labelledby={readOnly || props['aria-label'] ? undefined : labelId}
      aria-valuenow={readOnly ? undefined : value}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : max}
      aria-valuetext={readOnly ? undefined : `${value} of ${max} ${unit}s`}
      aria-describedby={field['aria-describedby']}
      aria-invalid={readOnly ? undefined : field['aria-invalid']}
      aria-disabled={isDisabled && !readOnly ? true : undefined}
      id={field.id}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
      {...props}
    >
      <span className="sui-rating__stars">
        {Array.from({ length: max }, (_, index) => {
          const position = index + 1
          const fill = Math.max(0, Math.min(1, shown - index))
          return (
            <span key={position} className="sui-rating__star">
              <StarIcon className="sui-rating__ghost" />
              {/* The filled star is clipped to the fraction, which is what makes
                  a half — and any other fraction — possible without a half icon. */}
              <span className="sui-rating__fill" style={{ width: `${fill * 100}%` }}>
                <StarIcon filled />
              </span>
              {interactive ? (
                /* A span, not a button: the row is already a `slider` with the
                   keyboard to match, and a focusable control inside another
                   interactive control is a WCAG failure (nested-interactive). */
                <span
                  role="presentation"
                  className="sui-rating__hit"
                  onMouseMove={(event) => {
                    if (!allowHalf) return setHover(position)
                    const box = event.currentTarget.getBoundingClientRect()
                    setHover(event.clientX - box.left < box.width / 2 ? position - 0.5 : position)
                  }}
                  onMouseEnter={() => !allowHalf && setHover(position)}
                  onClick={(event) => {
                    // Read the half from the click itself: a touch has no
                    // hover before it, so the hover state would say "whole".
                    let next = position
                    if (allowHalf) {
                      const box = event.currentTarget.getBoundingClientRect()
                      if (box.width > 0 && event.clientX - box.left < box.width / 2) {
                        next = position - 0.5
                      }
                    }
                    set(clearable && next === value ? 0 : next)
                  }}
                />
              ) : null}
            </span>
          )
        })}
      </span>

      {caption ? <span className="sui-rating__caption">{caption}</span> : null}
      {name ? (
        <input type="hidden" name={name} value={String(value)} disabled={isDisabled} />
      ) : null}
    </div>
  )
})

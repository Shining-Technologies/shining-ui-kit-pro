'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface SegmentedControlOption {
  value: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  /** The accessible name when `label` is not text, for example an icon-only segment. */
  'aria-label'?: string
}

export interface SegmentedControlProps extends Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'children' | 'orientation' | 'dir'
> {
  options: SegmentedControlOption[]
  size?: 'sm' | 'default'
  /** Stretch the segments to fill the row. */
  fill?: boolean
}

/**
 * One choice out of two to five, shown all at once: a view switch (List or
 * Board) or a period (Day, Week or Month).
 *
 * It is a radio group rather than tabs or toggle buttons: exactly one segment
 * is always selected, and ←/→ move the selection. That is what a screen reader
 * user expects from a single-choice control. When the choice shows different
 * panels, use `Tabs`. When each option is a separate route, use `SectionTabs`.
 *
 * With no `value` or `defaultValue`, the first option starts selected, so the
 * control is never left with nothing chosen.
 */
export const SegmentedControl = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  SegmentedControlProps
>(function SegmentedControl(
  { className, options, size = 'default', fill = false, value, defaultValue, ...props },
  ref,
) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="segmented-control"
      orientation="horizontal"
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? options[0]?.value) : undefined}
      className={cn(
        'sui-segmented',
        size === 'sm' && 'sui-segmented--sm',
        fill && 'sui-segmented--fill',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          aria-label={option['aria-label']}
          className="sui-segmented__item sui-focusable"
        >
          {option.icon ? (
            <span className="sui-segmented__icon" aria-hidden="true">
              {option.icon}
            </span>
          ) : null}
          {option.label !== undefined && option.label !== null && option.label !== '' ? (
            <span className="sui-segmented__label">{option.label}</span>
          ) : null}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
})

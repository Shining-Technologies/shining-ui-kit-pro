'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { VariantProps } from 'class-variance-authority'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '../../lib/cn'
import { progressVariants } from './progress-variants'

export interface ProgressProps
  extends
    Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'>,
    VariantProps<typeof progressVariants> {
  /** Clamped to `0`–`max`. `null` renders the indeterminate animation. */
  value?: number | null
  /** A positive number; anything else is treated as `100`. */
  max?: number
}

export const Progress = forwardRef<ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  function Progress({ className, value = 0, max = 100, size, tone, ...props }, ref) {
    // Radix rejects a max that is not positive and a value outside 0–max: it
    // logs an error and drops `aria-valuenow`, while the bar is still drawn. So
    // both are made valid here, and what is announced matches what is shown.
    const safeMax = Number.isFinite(max) && max > 0 ? max : 100
    const indeterminate = value === null
    const clamped = indeterminate
      ? null
      : Math.min(safeMax, Math.max(0, typeof value === 'number' && Number.isFinite(value) ? value : 0))
    const pct = clamped === null ? 0 : (clamped / safeMax) * 100

    return (
      <ProgressPrimitive.Root
        ref={ref}
        data-slot="progress"
        value={clamped}
        max={safeMax}
        className={cn(
          progressVariants({ size, tone }),
          indeterminate && 'sui-progress--indeterminate',
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="sui-progress__indicator"
          // Translating a full-width bar rather than animating `width` keeps the
          // whole thing on the compositor, so a page of them stays smooth.
          style={indeterminate ? undefined : { transform: `translateX(-${100 - pct}%)` }}
        />
      </ProgressPrimitive.Root>
    )
  },
)

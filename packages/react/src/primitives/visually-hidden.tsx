import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** Visible to screen readers, invisible on screen. */
export const VisuallyHidden = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function VisuallyHidden({ className, ...props }, ref) {
    return <span ref={ref} className={cn('sui-sr-only', className)} {...props} />
  },
)

import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** Visible to screen readers, invisible on screen. */
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('sui-sr-only', className)} {...props} />
}

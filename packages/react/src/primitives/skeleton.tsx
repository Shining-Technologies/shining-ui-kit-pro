import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** A shimmering placeholder block. Purely decorative, hidden from assistive tech. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('sui-skeleton', className)} {...props} />
}

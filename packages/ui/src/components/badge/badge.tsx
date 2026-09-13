import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * `tone` says what the badge *means*; `variant` says how loudly it says it.
 *
 * Splitting the two is what keeps the set small: six tones times three
 * variants covers what would otherwise be eighteen hand-written variants, and
 * every tone resolves to a project token rather than a shipped colour.
 */
export const badgeVariants = cva('sui-badge', {
  variants: {
    tone: {
      neutral: 'sui-badge--neutral',
      primary: 'sui-badge--primary',
      success: 'sui-badge--success',
      warning: 'sui-badge--warning',
      destructive: 'sui-badge--destructive',
      info: 'sui-badge--info',
    },
    variant: {
      soft: 'sui-badge--soft',
      solid: 'sui-badge--solid',
      outline: 'sui-badge--outline',
    },
  },
  defaultVariants: { tone: 'neutral', variant: 'soft' },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Render the child element instead of a `<span>` — for a badge that links. */
  asChild?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, variant, asChild, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'span'
  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ tone, variant }), className)}
      {...props}
    />
  )
})

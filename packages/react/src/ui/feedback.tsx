import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'

/* -------------------------------------------------------------------- spinner */

export const spinnerVariants = cva('sui-spinner', {
  variants: {
    size: { sm: 'sui-spinner--sm', default: '', lg: 'sui-spinner--lg' },
  },
  defaultVariants: { size: 'default' },
})

export interface SpinnerProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof spinnerVariants> {
  /** Announced to assistive tech. Pass `null` for a purely decorative spinner. */
  label?: string | null
}

/**
 * An indeterminate activity indicator.
 *
 * It inherits `currentColor`, so a spinner inside a primary button is legible
 * without anyone having to pass it a colour.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size, label = 'Loading', ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="spinner"
      role={label ? 'status' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
})

/* ------------------------------------------------------------------- progress */

export const progressVariants = cva('sui-progress', {
  variants: {
    size: { sm: 'sui-progress--sm', default: '', lg: 'sui-progress--lg' },
    tone: {
      primary: '',
      success: 'sui-progress--success',
      warning: 'sui-progress--warning',
      destructive: 'sui-progress--destructive',
    },
  },
  defaultVariants: { size: 'default', tone: 'primary' },
})

export interface ProgressProps
  extends
    Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'>,
    VariantProps<typeof progressVariants> {
  /** `null` renders the indeterminate animation. */
  value?: number | null
  max?: number
}

export const Progress = forwardRef<ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  function Progress({ className, value = 0, max = 100, size, tone, ...props }, ref) {
    const indeterminate = value === null
    const pct = indeterminate ? 0 : Math.min(100, Math.max(0, ((value ?? 0) / max) * 100))

    return (
      <ProgressPrimitive.Root
        ref={ref}
        data-slot="progress"
        value={indeterminate ? null : value}
        max={max}
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

/* --------------------------------------------------------------------- empty */

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

/** The "nothing here yet" panel: what is missing, why, and what to do about it. */
export const Empty = forwardRef<HTMLDivElement, EmptyStateProps>(function Empty(
  { className, icon, title, description, actions, children, ...props },
  ref,
) {
  return (
    <div ref={ref} data-slot="empty" className={cn('sui-empty', className)} {...props}>
      {icon ? (
        <span className="sui-empty__media" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="sui-empty__title">{title}</p>
      {description ? <p className="sui-empty__description">{description}</p> : null}
      {children}
      {actions ? <div className="sui-empty__actions">{actions}</div> : null}
    </div>
  )
})

/* ----------------------------------------------------------------------- kbd */

/** A keyboard key. `<kbd>` is the right element and carries its own semantics. */
export const Kbd = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Kbd(
  { className, ...props },
  ref,
) {
  return <kbd ref={ref} data-slot="kbd" className={cn('sui-kbd', className)} {...props} />
})

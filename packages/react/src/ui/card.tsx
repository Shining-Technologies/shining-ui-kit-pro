import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { toneClass, type AccentTone } from '../lib/tone'

export const cardVariants = cva('sui-card', {
  variants: {
    variant: {
      /** A panel: border, surface fill and the project's resting elevation. */
      default: '',
      /** Same panel with no shadow, for a page that is already dense. */
      flat: 'sui-card--flat',
      /** Structure only — no chrome. Useful for grouping without a box. */
      ghost: 'sui-card--ghost',
    },
    interactive: { true: 'sui-card--interactive', false: '' },
  },
  defaultVariants: { variant: 'default', interactive: false },
})

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean
}

/**
 * A surface for one coherent piece of content.
 *
 * Composed rather than configured: `Card` owns the box and the vertical rhythm,
 * and the header / content / footer parts own their own padding. That is what
 * lets a card hold a full-bleed chart or table — the part that needs to escape
 * the padding simply is not wrapped in `CardContent`.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, interactive, asChild, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  )
})

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a rule under the header. */
  bordered?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, bordered, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn('sui-card__header', bordered && 'sui-card__header--bordered', className)}
      {...props}
    />
  )
})

export interface CardTitleProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The element to render. A `div` by default, which is invisible to heading
   * navigation; pass the level that fits the page outline (`h2` under the
   * page's `h1`, say) so screen-reader users can jump between cards.
   */
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = forwardRef<HTMLDivElement, CardTitleProps>(function CardTitle(
  { className, as = 'div', ...props },
  ref,
) {
  const Comp = as as ElementType
  return (
    <Comp
      ref={ref}
      data-slot="card-title"
      className={cn('sui-card__title', className)}
      {...props}
    />
  )
})

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn('sui-card__description', className)}
      {...props}
    />
  )
})

/** Sits at the top-right of the header, spanning the title and description. */
export const CardAction = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardAction({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-action"
        className={cn('sui-card__action', className)}
        {...props}
      />
    )
  },
)

export const cardIconVariants = cva('sui-card__icon', {
  variants: {
    size: { sm: 'sui-card__icon--sm', default: '', lg: 'sui-card__icon--lg' },
  },
  defaultVariants: { size: 'default' },
})

export interface CardIconProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof cardIconVariants> {
  /** The tint behind the glyph. */
  tone?: AccentTone
}

/**
 * A tinted glyph tile at the start of the header.
 *
 * Placed first inside `CardHeader`, it takes its own column and spans the
 * title and description, so the text block stays left-aligned beside it and a
 * `CardAction` still lands at the far right.
 */
export const CardIcon = forwardRef<HTMLSpanElement, CardIconProps>(function CardIcon(
  { className, size, tone = 'primary', ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="card-icon"
      aria-hidden="true"
      className={cn(cardIconVariants({ size }), toneClass(tone), className)}
      {...props}
    />
  )
})

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn('sui-card__content', className)}
        {...props}
      />
    )
  },
)

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a rule above the footer. */
  bordered?: boolean
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, bordered, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn('sui-card__footer', bordered && 'sui-card__footer--bordered', className)}
      {...props}
    />
  )
})

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode
  value: ReactNode
  /** Change since the comparison period, e.g. `'+12.4%'`. */
  delta?: ReactNode
  /**
   * Whether the delta is good news. Explicit rather than inferred from the
   * sign — a fall in churn is an `up`, and only the caller knows that.
   */
  trend?: 'up' | 'down' | 'flat'
  icon?: ReactNode
}

/**
 * A single metric: label, value and optional change.
 *
 * Common enough in the dashboards this kit is built for that leaving every app
 * to re-derive the type scale and the delta colours would guarantee they drift.
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  { className, label, value, delta, trend = 'flat', icon, ...props },
  ref,
) {
  return (
    <div ref={ref} data-slot="stat" className={cn('sui-stat', className)} {...props}>
      <span className="sui-stat__label">{label}</span>
      <span className="sui-stat__value">{value}</span>
      {delta !== undefined && (
        <span className={cn('sui-stat__delta', `sui-stat__delta--${trend}`)}>
          {icon}
          {delta}
        </span>
      )}
    </div>
  )
})

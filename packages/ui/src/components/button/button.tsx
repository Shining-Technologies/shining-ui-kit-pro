import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Variant and size names follow shadcn/ui. */
export const buttonVariants = cva('sui-btn sui-focusable', {
  variants: {
    variant: {
      default: 'sui-btn--primary',
      primary: 'sui-btn--primary',
      secondary: 'sui-btn--secondary',
      outline: 'sui-btn--outline',
      ghost: 'sui-btn--ghost',
      destructive: 'sui-btn--destructive',
      link: 'sui-btn--link',
    },
    size: {
      default: 'sui-btn--default',
      sm: 'sui-btn--sm',
      lg: 'sui-btn--lg',
      icon: 'sui-btn--icon',
      'icon-sm': 'sui-btn--icon-sm',
      'icon-lg': 'sui-btn--icon-lg',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a `<button>`, keeping the styling. */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, type = 'button', ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type })}
      {...props}
    />
  )
})

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Announced as a group of related actions. */
  'aria-label'?: string
}

/**
 * Buttons rendered as one segmented control.
 *
 * A plain `<div>` with `role="group"` rather than a toolbar: these are ordinary
 * buttons that happen to sit together, and claiming toolbar semantics would
 * change the arrow-key behaviour screen-reader users expect.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { className, ...props },
  ref,
) {
  return <div ref={ref} role="group" className={cn('sui-button-group', className)} {...props} />
})

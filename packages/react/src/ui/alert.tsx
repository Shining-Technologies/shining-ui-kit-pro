import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckCircleIcon, InfoIcon, TriangleAlertIcon } from '../lib/icons'

export const alertVariants = cva('sui-alert', {
  variants: {
    tone: {
      neutral: '',
      info: 'sui-alert--info',
      success: 'sui-alert--success',
      warning: 'sui-alert--warning',
      destructive: 'sui-alert--destructive',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

/** The glyph each tone gets when the caller does not supply one. */
const DEFAULT_ICON: Record<string, ReactNode> = {
  info: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <TriangleAlertIcon />,
  destructive: <TriangleAlertIcon />,
}

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  /** Pass `null` to suppress the tone's default glyph. */
  icon?: ReactNode | null
}

/**
 * A message about the page it sits on.
 *
 * `role="alert"` only for the destructive tone: the role interrupts a screen
 * reader mid-sentence, which is right for an error and rude for a tip.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, tone = 'neutral', icon, children, ...props },
  ref,
) {
  const glyph = icon === undefined ? DEFAULT_ICON[tone ?? 'neutral'] : icon

  return (
    <div
      ref={ref}
      data-slot="alert"
      role={tone === 'destructive' ? 'alert' : 'note'}
      className={cn(alertVariants({ tone }), glyph && 'sui-alert--with-icon', className)}
      {...props}
    >
      {glyph ? (
        <span className="sui-alert__icon" aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      {children}
    </div>
  )
})

export const AlertTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertTitle({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert-title"
        className={cn('sui-alert__title', className)}
        {...props}
      />
    )
  },
)

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert-description"
        className={cn('sui-alert__description', className)}
        {...props}
      />
    )
  },
)

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { toneClass, type AccentTone } from '../../lib/tone'

export const circularProgressVariants = cva('sui-circular-progress', {
  variants: {
    size: {
      sm: 'sui-circular-progress--sm',
      default: '',
      lg: 'sui-circular-progress--lg',
      xl: 'sui-circular-progress--xl',
    },
  },
  defaultVariants: { size: 'default' },
})

export interface CircularProgressProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof circularProgressVariants> {
  /** Clamped to `0`–`max`. `null` spins: work is happening, but how much is unknown. */
  value?: number | null
  /** A positive number; anything else is treated as `100`. */
  max?: number
  /** The ring's colour. `'primary'` by default. */
  tone?: AccentTone
  /** Print the percentage in the middle of the ring (`lg` and `xl` sizes have room for it). */
  showValue?: boolean
  /** Anything else in the middle of the ring — a count, an icon. Replaces `showValue`. */
  children?: ReactNode
}

/**
 * Progress as a ring: for a tile, an avatar-sized slot or a card header, where
 * a bar has no room to be long enough to read.
 *
 * Markup and an SVG only, so it renders as a Server Component. The arc uses
 * `pathLength="100"`, which makes the dash offset the percentage itself — no
 * circumference arithmetic, and no drift between the two ends at any size.
 */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  function CircularProgress(
    { className, value = 0, max = 100, size, tone = 'primary', showValue, children, ...props },
    ref,
  ) {
    const safeMax = Number.isFinite(max) && max > 0 ? max : 100
    const indeterminate = value === null
    const clamped = indeterminate
      ? null
      : Math.min(safeMax, Math.max(0, typeof value === 'number' && Number.isFinite(value) ? value : 0))
    const pct = clamped === null ? 0 : Math.round((clamped / safeMax) * 100)
    const centre = children ?? (showValue && !indeterminate ? `${pct}%` : null)

    return (
      <div
        ref={ref}
        role="progressbar"
        data-slot="circular-progress"
        data-state={indeterminate ? 'indeterminate' : pct === 100 ? 'complete' : 'loading'}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped ?? undefined}
        aria-valuetext={indeterminate ? undefined : `${pct}%`}
        className={cn(circularProgressVariants({ size }), toneClass(tone), className)}
        {...props}
      >
        <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <circle className="sui-circular-progress__track" cx="18" cy="18" r="15.5" />
          <circle
            className="sui-circular-progress__indicator"
            cx="18"
            cy="18"
            r="15.5"
            pathLength={100}
            strokeDasharray={indeterminate ? '28 100' : '100 100'}
            strokeDashoffset={indeterminate ? 0 : 100 - pct}
          />
        </svg>
        {centre != null ? <span className="sui-circular-progress__value">{centre}</span> : null}
      </div>
    )
  },
)

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
import { toneClass, type AccentTone } from '../lib/tone'

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

export const emptyVariants = cva('sui-empty', {
  variants: {
    variant: {
      /** The centred panel that fills a page or a card. */
      panel: '',
      /** One quiet line, for a list inside a card that still has other content. */
      inline: 'sui-empty--inline',
    },
  },
  defaultVariants: { variant: 'panel' },
})

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof emptyVariants> {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

/**
 * The "nothing here yet" panel: what is missing, why, and what to do about it.
 *
 * `variant="inline"` is the same statement at the volume of a sentence — for a
 * breakdown or a feed that is empty *inside* a card whose figures are still
 * worth reading, where a centred panel would shout over them.
 */
export const Empty = forwardRef<HTMLDivElement, EmptyStateProps>(function Empty(
  { className, variant, icon, title, description, actions, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="empty"
      className={cn(emptyVariants({ variant }), className)}
      {...props}
    >
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

/* ---------------------------------------------------------------- status dot */

export const statusDotVariants = cva('sui-status-dot', {
  variants: {
    size: { sm: 'sui-status-dot--sm', default: '', lg: 'sui-status-dot--lg' },
    /** A ring that radiates from the dot: "this is live", not "this is on". */
    pulse: { true: 'sui-status-dot--pulse', false: '' },
  },
  defaultVariants: { size: 'default', pulse: false },
})

export interface StatusDotProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof statusDotVariants> {
  tone?: AccentTone
  /** Text beside the dot. Without it, pass `aria-label` or the dot is decorative. */
  label?: ReactNode
}

/**
 * A state at its smallest: a dot, and usually a word.
 *
 * The colour is never the only signal — with no `label` and no `aria-label` the
 * dot is hidden from assistive tech, on the assumption that the text next to it
 * already says what it means.
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
  { className, tone = 'neutral', label, size, pulse, ...props },
  ref,
) {
  const named = label == null && Boolean(props['aria-label'])
  const decorative = label == null && !named

  return (
    <span
      ref={ref}
      data-slot="status-dot"
      data-tone={tone}
      role={named ? 'img' : undefined}
      aria-hidden={decorative ? true : undefined}
      className={cn(statusDotVariants({ size, pulse }), toneClass(tone), className)}
      {...props}
    >
      <span className="sui-status-dot__mark" aria-hidden="true" />
      {label != null ? <span className="sui-status-dot__label">{label}</span> : null}
    </span>
  )
})

/* ------------------------------------------------------------- segmented bar */

export interface SegmentedBarSegment {
  /** Stable identity. Falls back to the position, as two segments may share a label. */
  key?: string
  label: string
  value: number
  tone?: AccentTone
}

export const segmentedBarVariants = cva('sui-segmented-bar', {
  variants: {
    size: { sm: 'sui-segmented-bar--sm', default: '', lg: 'sui-segmented-bar--lg' },
  },
  defaultVariants: { size: 'default' },
})

export interface SegmentedBarProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof segmentedBarVariants> {
  segments: SegmentedBarSegment[]
  /** What the bar measures, e.g. `'Requests by status'`. Prefixes the spoken summary. */
  label?: string
}

/**
 * A whole, split by share: where a set of records sits right now.
 *
 * `Progress` answers "how far along is one thing"; this answers "how is the
 * lot distributed". Segments size by `flex-grow` on their raw value, so no
 * percentages are computed and rounding can never leave the bar a pixel short.
 * The bar is one image to assistive tech, with the counts spelled out as its
 * name — a row of coloured boxes means nothing read aloud one at a time.
 */
export const SegmentedBar = forwardRef<HTMLDivElement, SegmentedBarProps>(function SegmentedBar(
  { className, segments, label, size, ...props },
  ref,
) {
  // Paired with the position in `segments`, so a key does not shift when an
  // earlier segment drops to zero and leaves the bar.
  const visible = segments
    .map((segment, index) => [segment, index] as const)
    .filter(([segment]) => segment.value > 0)
  const summary = segments.map((segment) => `${segment.label} ${segment.value}`).join(', ')

  return (
    <div
      ref={ref}
      data-slot="segmented-bar"
      role="img"
      aria-label={label ? `${label}: ${summary}` : summary || 'No data'}
      className={cn(segmentedBarVariants({ size }), className)}
      {...props}
    >
      {visible.map(([segment, index]) => (
        <span
          key={segment.key ?? index}
          className={cn('sui-segmented-bar__segment', toneClass(segment.tone))}
          style={{ flexGrow: segment.value }}
        />
      ))}
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

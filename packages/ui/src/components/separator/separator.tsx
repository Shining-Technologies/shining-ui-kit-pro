import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  /**
   * Purely visual (the default): hidden from assistive tech. Set `false` when
   * the rule separates content a screen-reader user should know is divided.
   */
  decorative?: boolean
}

/**
 * A rule between content.
 *
 * A plain element with the same attributes Radix's Separator renders — `role`,
 * `aria-orientation` and `data-orientation` — so it is a Server Component and
 * needs no dependency.
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { className, orientation = 'horizontal', decorative = true, ...props },
  ref,
) {
  const semantics = decorative
    ? { role: 'none' }
    : {
        role: 'separator',
        'aria-orientation': orientation === 'vertical' ? orientation : undefined,
      }

  return (
    <div
      ref={ref}
      data-orientation={orientation}
      {...semantics}
      className={cn('sui-separator', `sui-separator--${orientation}`, className)}
      {...props}
    />
  )
})

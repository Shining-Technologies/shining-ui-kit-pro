import * as Primitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export const TooltipProvider = Primitive.Provider

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How long to hover before it opens. */
  delayDuration?: number
  className?: string
}

/**
 * Tooltips are a convenience only: every control that carries one also has an
 * accessible name of its own, so nothing is lost on touch devices.
 *
 * It carries its own provider so that a tooltip works wherever it is dropped —
 * inside a table cell in an application that has never mounted one. Nesting is
 * legal; mount `TooltipProvider` yourself only to share a delay across a screen.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  delayDuration = 300,
  className,
}: TooltipProps) {
  return (
    <Primitive.Provider delayDuration={delayDuration}>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content side={side} sideOffset={6} className={cn('sui-tooltip', className)}>
            {content}
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  )
}

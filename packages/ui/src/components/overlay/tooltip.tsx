'use client'

import * as Primitive from '@radix-ui/react-tooltip'
import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { usePortalContainer } from './portal-container'

/** Set by `TooltipProvider`, so a `Tooltip` knows it need not bring its own. */
const HasTooltipProvider = createContext(false)

export type TooltipProviderProps = ComponentPropsWithoutRef<typeof Primitive.Provider>

/**
 * Shares one delay — and the "skip the delay when moving between tooltips"
 * behaviour — across everything under it. Optional: see `Tooltip`.
 */
export function TooltipProvider(props: TooltipProviderProps) {
  return (
    <HasTooltipProvider.Provider value={true}>
      <Primitive.Provider {...props} />
    </HasTooltipProvider.Provider>
  )
}

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Distance from the trigger, in px. */
  sideOffset?: number
  /**
   * How long to hover before it opens. Defaults to the surrounding
   * `TooltipProvider`'s delay, or 300ms without one.
   */
  delayDuration?: number
  /** Controlled open state. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * Tooltips are a convenience only: every control that carries one also has an
 * accessible name of its own, so nothing is lost on touch devices.
 *
 * It brings its own provider when there is none above it, so a tooltip works
 * wherever it is dropped — inside a table cell in an application that has never
 * mounted one. Under a `TooltipProvider` it defers to that one instead, so the
 * shared delay and skip-delay actually apply.
 *
 * The child must accept a ref and spread props (any kit control does). A
 * disabled `<button>` receives no pointer events, so wrap it in a focusable
 * `<span tabIndex={0}>` to explain why it is disabled.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align,
  sideOffset = 6,
  delayDuration,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: TooltipProps) {
  const container = usePortalContainer()
  const provided = useContext(HasTooltipProvider)

  // Nothing to say: render the trigger alone rather than an empty bubble.
  if (content == null || content === false || content === '') return <>{children}</>

  const tooltip = (
    <Primitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={delayDuration}
    >
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal container={container}>
        <Primitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn('sui-tooltip', className)}
        >
          {content}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )

  if (provided) return tooltip
  return <Primitive.Provider delayDuration={delayDuration ?? 300}>{tooltip}</Primitive.Provider>
}

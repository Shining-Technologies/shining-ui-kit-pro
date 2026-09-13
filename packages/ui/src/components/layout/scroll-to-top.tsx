'use client'

import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button/button'
import { ArrowUpIcon } from '../icons/icons'

export interface ScrollToTopProps {
  /** How far down the page it takes before the button appears, in px. */
  threshold?: number
  /** The scrolling element. Defaults to the window. */
  target?: HTMLElement | null
  label?: string
  className?: string
}

/**
 * Back to the top of a long page.
 *
 * Appears only past `threshold`, because a control that is always there on a
 * short page is chrome for nothing. Jumps rather than scrolling smoothly under
 * `prefers-reduced-motion: reduce`: an explicit `behavior: 'smooth'` overrides
 * the stylesheet's `scroll-behavior`, so the choice has to be made here.
 */
export function ScrollToTop({
  threshold = 400,
  target,
  label = 'Back to top',
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const scroller: HTMLElement | Window = target ?? window
    const read = () =>
      target ? target.scrollTop : (window.scrollY ?? document.documentElement.scrollTop)

    const onScroll = () => setVisible(read() > threshold)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [target, threshold])

  if (!visible) return null

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={label}
      className={cn('sui-scroll-top', className)}
      onClick={() =>
        (target ?? window).scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      }
    >
      <ArrowUpIcon />
    </Button>
  )
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

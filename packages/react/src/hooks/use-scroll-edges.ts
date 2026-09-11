import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataAttributes } from '../types/components'

/** Which edges of the scroll container still have content beyond them. */
export interface ScrollEdges {
  /** Content is hidden to the left (or to the right, in RTL). */
  start: boolean
  /** Content continues past the trailing edge. */
  end: boolean
  /** The body has been scrolled down at all. */
  top: boolean
}

const NONE: ScrollEdges = { start: false, end: false, top: false }

export interface ScrollEdgesResult {
  ref: (node: HTMLDivElement | null) => void
  edges: ScrollEdges
  /** Data attributes for the container's prop bag. */
  attributes: DataAttributes
}

/**
 * Track how far the table's scroll container has been scrolled.
 *
 * This exists to make two effects honest rather than permanent: a pinned column
 * only casts its shadow while there is something scrolled underneath it, and the
 * sticky header only lifts off the rows once they have moved. A table that fits
 * its container should look like a table that fits its container.
 *
 * Measurement is cheap and passive — a scroll listener plus a `ResizeObserver`
 * for the cases (column resize, data change, window resize) where the overflow
 * changes without anybody scrolling.
 */
export function useScrollEdges(): ScrollEdgesResult {
  const [edges, setEdges] = useState<ScrollEdges>(NONE)
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const frame = useRef(0)

  const measure = useCallback(() => {
    const node = nodeRef.current
    if (!node) return
    // `scrollLeft` is negative in RTL; the magnitude is what matters here.
    const left = Math.abs(node.scrollLeft)
    const maxLeft = node.scrollWidth - node.clientWidth
    const next: ScrollEdges = {
      start: left > 1,
      // 1px of slack: sub-pixel layout makes the exact equality unreliable.
      end: maxLeft - left > 1,
      top: node.scrollTop > 1,
    }
    setEdges((current) =>
      current.start === next.start && current.end === next.end && current.top === next.top
        ? current
        : next,
    )
  }, [])

  // Coalesce bursts (a scroll and a resize in the same frame) into one measure.
  const schedule = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      measure()
    })
  }, [measure])

  const cleanup = useRef<(() => void) | undefined>(undefined)

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      cleanup.current?.()
      cleanup.current = undefined
      nodeRef.current = node
      if (!node) {
        setEdges(NONE)
        return
      }

      node.addEventListener('scroll', schedule, { passive: true })

      // The container's own size and the table's size both change the overflow.
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
      observer?.observe(node)
      if (node.firstElementChild) observer?.observe(node.firstElementChild)

      cleanup.current = () => {
        node.removeEventListener('scroll', schedule)
        observer?.disconnect()
      }
      measure()
    },
    [measure, schedule],
  )

  useEffect(
    () => () => {
      cleanup.current?.()
      if (frame.current) cancelAnimationFrame(frame.current)
    },
    [],
  )

  return {
    ref,
    edges,
    attributes: {
      'data-overflow-start': edges.start || undefined,
      'data-overflow-end': edges.end || undefined,
      'data-scrolled': edges.top || undefined,
    },
  }
}

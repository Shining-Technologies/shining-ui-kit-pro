'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { ImageBlock } from '../design'

interface Box {
  left: number
  top: number
  width: number
  height: number
  /** Width of the box the picture may fill (its column). */
  cell: number
}

interface DragState {
  startX: number
  startPx: number
  cellPx: number
  /** +1 when moving right grows the image, -1 for the left edge. */
  dir: 1 | -1
}

const MIN_WIDTH = 40
const HARD_MAX = 700
const KEY_STEP = 10
const FINE_STEP = 1
const PAGE_STEP = 50

/** The width the server allows is the column's share of the design width, not what the canvas has room for. */
const clamp = (px: number, limit: number) =>
  Math.round(Math.min(Math.max(limit || HARD_MAX, MIN_WIDTH), HARD_MAX, Math.max(MIN_WIDTH, px)))

interface Props {
  block: ImageBlock
  /** The positioned element the handles are drawn in; the image is found inside it. */
  frame: HTMLElement | null
  /** The most the server allows: the column's share of the design width. */
  maxWidth?: number
  /** A width while dragging (null when not). */
  onLive: (width: number | null) => void
  /** One update per gesture. */
  onCommit: (width: number) => void
}

/**
 * Resize handles on the selected image, adapted from the nexus form
 * designer's: the left and right edges and the bottom-right corner, drawn on
 * the picture. The right-edge handle is the keyboard slider. The width is in
 * pixels and never more than the column.
 */
export function ImageResizeHandles({ block, frame, maxWidth, onLive, onCommit }: Props) {
  const [box, setBox] = useState<Box | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const state = useRef<DragState | null>(null)
  const dragValue = useRef<number | null>(null)
  const onLiveRef = useRef(onLive)
  useEffect(() => {
    onLiveRef.current = onLive
  })

  // Leaving mid-drag must not leave the canvas showing a preview nobody owns.
  useEffect(
    () => () => {
      if (state.current) {
        state.current = null
        dragValue.current = null
        onLiveRef.current(null)
      }
    },
    [],
  )

  const image = useCallback(
    () => frame?.querySelector<HTMLImageElement>('img.seb-image') ?? null,
    [frame],
  )
  const cellWidth = useCallback(() => {
    const column = image()?.closest<HTMLElement>('.seb-col-inner') ?? frame
    return column?.getBoundingClientRect().width ?? 0
  }, [image, frame])

  const measure = useCallback(() => {
    const img = image()
    if (!img || !frame) return setBox((prev) => (prev ? null : prev))
    const a = img.getBoundingClientRect()
    const f = frame.getBoundingClientRect()
    if (a.width === 0) return setBox((prev) => (prev ? null : prev))
    const next = {
      left: a.left - f.left,
      top: a.top - f.top,
      width: a.width,
      height: a.height,
      cell: cellWidth(),
    }
    setBox((prev) =>
      prev &&
      prev.left === next.left &&
      prev.top === next.top &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.cell === next.cell
        ? prev
        : next,
    )
  }, [image, frame, cellWidth])

  useLayoutEffect(measure)
  useLayoutEffect(() => {
    if (!frame) return
    frame.addEventListener('load', measure, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(frame)
    return () => {
      frame.removeEventListener('load', measure, true)
      observer?.disconnect()
    }
  }, [frame, measure])

  const maximum = Math.max(MIN_WIDTH, Math.min(HARD_MAX, maxWidth ?? HARD_MAX))
  const current = block.width === 'full' ? clamp(box?.width ?? 0, maximum) : block.width
  const shown = drag ?? current

  const begin = (event: PointerEvent<HTMLElement>, dir: 1 | -1) => {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    state.current = {
      startX: event.clientX,
      // From the stored width, not from what the canvas shows: dragging never shrinks it unless
      // the pointer goes inward.
      startPx: current,
      cellPx: cellWidth(),
      dir,
    }
    dragValue.current = null
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s) return
    // A centred picture grows on both sides, so an edge follows the pointer at half the change.
    const factor = block.align === 'center' ? 2 : 1
    const next = clamp(s.startPx + factor * s.dir * (event.clientX - s.startX), maximum)
    dragValue.current = next
    setDrag(next)
    onLive(next)
  }
  const end = () => {
    const done = dragValue.current
    state.current = null
    dragValue.current = null
    setDrag(null)
    onLive(null)
    if (done !== null && done !== block.width) onCommit(done)
  }
  const cancel = () => {
    if (!state.current) return
    state.current = null
    dragValue.current = null
    setDrag(null)
    onLive(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const step = event.shiftKey ? FINE_STEP : KEY_STEP
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step
    else if (event.key === 'PageUp') next = current + PAGE_STEP
    else if (event.key === 'PageDown') next = current - PAGE_STEP
    else if (event.key === 'Home') next = MIN_WIDTH
    else if (event.key === 'End') next = maximum
    if (next === null) return
    event.preventDefault()
    event.stopPropagation()
    const width = Math.min(maximum, Math.max(MIN_WIDTH, next))
    if (width !== block.width) onCommit(width)
  }

  if (!box) return null
  const middle = box.top + box.height / 2
  const handlers = {
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: cancel,
    onClick: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  }
  return (
    <div className="seb-handles" data-testid="image-resize-handles">
      <span
        aria-hidden="true"
        className="seb-handle seb-handle-ew"
        data-testid="image-handle-left"
        style={{ left: box.left + 8, top: middle }}
        onPointerDown={(e) => begin(e, -1)}
        {...handlers}
      />
      <button
        type="button"
        role="slider"
        aria-label="Image width"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={maximum}
        aria-valuenow={shown}
        aria-valuetext={`${shown} px`}
        className="seb-handle seb-handle-ew"
        data-testid="image-handle-right"
        style={{ left: box.left + box.width - 8, top: middle }}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => begin(e, 1)}
        {...handlers}
      />
      <span
        aria-hidden="true"
        className="seb-handle seb-handle-nwse"
        data-testid="image-handle-corner"
        style={{ left: box.left + box.width - 8, top: box.top + box.height - 8 }}
        onPointerDown={(e) => begin(e, 1)}
        {...handlers}
      />
      {drag !== null && (
        <span
          role="status"
          className="seb-handle-tip"
          style={{ left: box.left + box.width / 2, top: box.top + 8 }}
        >
          {drag} px
        </span>
      )}
    </div>
  )
}

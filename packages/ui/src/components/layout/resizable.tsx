'use client'

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/cn'

export interface ResizablePanelGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  /** `'horizontal'` puts the panels side by side (the default); `'vertical'` stacks them. */
  direction?: 'horizontal' | 'vertical'
  /** Panel sizes in percent, one per panel, controlled. */
  sizes?: number[]
  /** Called with every panel's size (in percent) while a handle moves: persist them to restore a layout. */
  onSizesChange?: (sizes: number[]) => void
  /** `ResizablePanel`s with a `ResizableHandle` between each pair, as direct children. */
  children: ReactNode
}

interface PanelLimits {
  defaultSize?: number
  minSize: number
  maxSize: number
}

interface GroupContextValue {
  direction: 'horizontal' | 'vertical'
  sizes: number[]
  limits: PanelLimits[]
  panelId: (index: number) => string
  resize: (handle: number, delta: number) => void
  setSize: (handle: number, size: number) => void
  element: () => HTMLDivElement | null
}

const GroupContext = createContext<GroupContextValue | null>(null)
/** The index of the panel a child sits at, or — for a handle — of the panel before it. */
const IndexContext = createContext(0)

function useGroup(part: string): GroupContextValue {
  const context = useContext(GroupContext)
  if (!context) throw new Error(`${part} must be rendered inside a ResizablePanelGroup.`)
  return context
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Panels whose sizes the user sets by dragging the handles between them: a
 * list beside its detail, an editor over its preview, a file tree beside a file.
 *
 * Sizes are percentages of the group, so a layout survives any window width.
 * Each handle is a focusable `role="separator"` carrying the size of the panel
 * before it: the arrow keys move it by 5% (1% with Shift), Home and End take
 * that panel to its smallest and largest.
 */
export const ResizablePanelGroup = forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  function ResizablePanelGroup(
    { className, direction = 'horizontal', sizes: sizesProp, onSizesChange, children, ...props },
    ref,
  ) {
    const baseId = useId()
    const root = useRef<HTMLDivElement | null>(null)

    // Panels are found among the direct children, in order.
    const nodes = Children.toArray(children).filter(isValidElement)
    const limits: PanelLimits[] = nodes
      .filter((node) => node.type === ResizablePanel)
      .map((node) => {
        const { defaultSize, minSize = 10, maxSize = 100 } = node.props as ResizablePanelProps
        return { defaultSize, minSize, maxSize }
      })

    const initial = useMemo(() => {
      const given = limits.reduce((sum, panel) => sum + (panel.defaultSize ?? 0), 0)
      const unsized = limits.filter((panel) => panel.defaultSize === undefined).length
      const share = unsized ? Math.max(0, 100 - given) / unsized : 0
      return limits.map((panel) => panel.defaultSize ?? share)
      // Only the first render's defaults count, as for any `default*` prop.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [sizes, setSizes] = useControllableState({
      value: sizesProp,
      defaultValue: initial,
      onChange: onSizesChange,
    })

    const context: GroupContextValue = {
      direction,
      sizes,
      limits,
      panelId: (index) => `${baseId}-panel-${index}`,
      element: () => root.current,
      // Moves the boundary after panel `handle` by `delta` percent, within both
      // neighbours' limits: what one panel gains the other gives up.
      resize: (handle, delta) => {
        const a = limits[handle]
        const b = limits[handle + 1]
        const sizeA = sizes[handle]
        const sizeB = sizes[handle + 1]
        if (!a || !b || sizeA === undefined || sizeB === undefined) return
        const total = sizeA + sizeB
        const nextA = clamp(sizeA + delta, Math.max(a.minSize, total - b.maxSize), Math.min(a.maxSize, total - b.minSize))
        if (nextA === sizeA) return
        const next = [...sizes]
        next[handle] = nextA
        next[handle + 1] = total - nextA
        setSizes(next)
      },
      setSize: (handle, size) => {
        const current = sizes[handle]
        if (current !== undefined) context.resize(handle, size - current)
      },
    }

    let panelIndex = -1
    return (
      <GroupContext.Provider value={context}>
        <div
          ref={(node) => {
            root.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          data-slot="resizable-group"
          data-direction={direction}
          className={cn('sui-resizable', `sui-resizable--${direction}`, className)}
          {...props}
        >
          {nodes.map((node) => {
            if (node.type === ResizablePanel) panelIndex++
            return (
              <IndexContext.Provider key={node.key} value={Math.max(0, panelIndex)}>
                {node}
              </IndexContext.Provider>
            )
          })}
        </div>
      </GroupContext.Provider>
    )
  },
)

export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Starting size in percent. Panels without one share what is left equally. */
  defaultSize?: number
  /** Smallest size in percent. `10` by default. */
  minSize?: number
  /** Largest size in percent. `100` by default. */
  maxSize?: number
}

export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(
  function ResizablePanel(
    // The limits are read by the group from the element's props.
    { className, style, defaultSize: _default, minSize: _min, maxSize: _max, ...props },
    ref,
  ) {
    const group = useGroup('ResizablePanel')
    const index = useContext(IndexContext)
    const size = group.sizes[index] ?? 0
    return (
      <div
        ref={ref}
        id={group.panelId(index)}
        data-slot="resizable-panel"
        className={cn('sui-resizable__panel', className)}
        style={{ flex: `${size} 1 0px`, ...style }}
        {...props}
      />
    )
  },
)

export interface ResizableHandleProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a grip on the handle, for a divider that should look draggable. */
  withHandle?: boolean
  /** The handle's accessible name. `'Resize panels'` by default. */
  'aria-label'?: string
}

export const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(
  function ResizableHandle(
    { className, withHandle, 'aria-label': label = 'Resize panels', onKeyDown, ...props },
    ref,
  ) {
    const group = useGroup('ResizableHandle')
    const index = useContext(IndexContext)
    const before = group.limits[index]
    const size = group.sizes[index] ?? 0
    const drag = useRef<{ start: number; extent: number; size: number } | null>(null)
    const horizontal = group.direction === 'horizontal'

    const position = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY)

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || !before) return
      const step = event.shiftKey ? 1 : 5
      const back = horizontal ? 'ArrowLeft' : 'ArrowUp'
      const forward = horizontal ? 'ArrowRight' : 'ArrowDown'
      if (event.key === back) group.resize(index, -step)
      else if (event.key === forward) group.resize(index, step)
      else if (event.key === 'Home') group.setSize(index, before.minSize)
      else if (event.key === 'End') group.setSize(index, before.maxSize)
      else return
      event.preventDefault()
    }

    return (
      <div
        ref={ref}
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-controls={group.panelId(index)}
        aria-valuenow={Math.round(size)}
        aria-valuemin={before?.minSize ?? 0}
        aria-valuemax={before?.maxSize ?? 100}
        data-slot="resizable-handle"
        className={cn('sui-resizable__handle sui-focusable', className)}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          const root = group.element()
          if (!root || event.button !== 0) return
          const rect = root.getBoundingClientRect()
          const extent = horizontal ? rect.width : rect.height
          if (!extent) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { start: position(event), extent, size }
          event.preventDefault()
        }}
        onPointerMove={(event) => {
          const current = drag.current
          if (!current) return
          const moved = ((position(event) - current.start) / current.extent) * 100
          group.setSize(index, current.size + moved)
        }}
        onPointerUp={(event) => {
          drag.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
        {...props}
      >
        {withHandle ? <span className="sui-resizable__grip" aria-hidden="true" /> : null}
      </div>
    )
  },
)

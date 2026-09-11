import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'

/** One plotted measure. */
export interface ChartSeries {
  /** Key into each datum. */
  key: string
  /** Legend and tooltip label. Defaults to `key`. */
  label?: string
  /**
   * Any CSS colour. Defaults to `--sui-chart-N`, which the project generator
   * derives from the brand colours — so leaving it unset is usually right.
   */
  color?: string
}

export type ChartDatum = Record<string, string | number | null | undefined>

export interface ChartMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export const DEFAULT_MARGIN: ChartMargin = { top: 12, right: 12, bottom: 26, left: 40 }

/** The token a series falls back to, cycling past five series. */
export function seriesColor(series: ChartSeries, index: number): string {
  return series.color ?? `var(--sui-chart-${(index % 5) + 1})`
}

/**
 * Width to draw at before — or instead of — a real measurement.
 *
 * A chart that renders nothing until it has been measured renders nothing at
 * all on the server, in a test environment, and in any browser where the
 * observer is unavailable. Drawing at a plausible width instead means the
 * markup is always complete and the first real measurement only corrects it.
 */
export const FALLBACK_CHART_WIDTH = 640

/**
 * Measure the element the chart will fill.
 *
 * Charts are drawn at real pixel sizes rather than in a scaled `viewBox`,
 * because a scaled viewBox stretches the type and the stroke widths along with
 * the geometry — a wide chart ends up with wide letters.
 *
 * In a browser the callback ref runs during commit, so the correct width is
 * known before the first paint and the fallback is never seen.
 */
export function useMeasure<T extends HTMLElement>(
  fallbackWidth = FALLBACK_CHART_WIDTH,
): [(node: T | null) => void, { width: number; height: number }] {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect()
    if (!node) return

    // Server rendering and jsdom both lack ResizeObserver; the element's own
    // reported size is the best available answer there.
    if (typeof ResizeObserver !== 'undefined') {
      observer.current = new ResizeObserver(([entry]) => {
        if (!entry) return
        const box = entry.contentRect
        setSize({ width: Math.round(box.width), height: Math.round(box.height) })
      })
      observer.current.observe(node)
    }
    setSize({ width: node.clientWidth, height: node.clientHeight })
  }, [])

  useEffect(() => () => observer.current?.disconnect(), [])

  return [ref, { width: size.width || fallbackWidth, height: size.height }]
}

export interface TooltipState {
  /** A number is pixels; a string is any CSS length, e.g. a `calc()`. */
  x: number | string
  y: number | string
  label: ReactNode
  rows: { color: string; label: ReactNode; value: ReactNode }[]
}

export interface ChartContainerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'children' | 'hidden'
> {
  /** Drawing height in pixels. Width always fills the container. */
  height?: number
  series: ChartSeries[]
  /** Hide series by clicking the legend. Omit the legend entirely with `false`. */
  legend?: boolean | 'interactive'
  hidden?: Set<string>
  onToggleSeries?: (key: string) => void
  tooltip?: TooltipState | null
  /** Rendered when there is nothing to plot. */
  emptyMessage?: ReactNode
  isEmpty?: boolean
  children: (size: { width: number; height: number }) => ReactNode
}

/**
 * The frame every chart shares: sizing, legend, tooltip and the empty state.
 *
 * A render-prop rather than a wrapper component so each chart type receives the
 * measured pixel box and can lay itself out, instead of guessing and then
 * correcting after the first paint.
 */
export function ChartContainer({
  className,
  height = 220,
  series,
  legend = true,
  hidden,
  onToggleSeries,
  tooltip,
  emptyMessage = 'No data to display',
  isEmpty,
  children,
  ...props
}: ChartContainerProps) {
  const [ref, size] = useMeasure<HTMLDivElement>()

  const legendItems = useMemo(
    () =>
      series.map((s, i) => ({
        key: s.key,
        label: s.label ?? s.key,
        color: seriesColor(s, i),
      })),
    [series],
  )

  const interactive = legend === 'interactive' && Boolean(onToggleSeries)

  return (
    <div data-slot="chart" className={cn('sui-chart', className)} {...props}>
      <div ref={ref} className="sui-chart__canvas" style={{ height }}>
        {isEmpty ? (
          <div className="sui-chart__empty">{emptyMessage}</div>
        ) : (
          children({ width: size.width, height })
        )}

        {tooltip ? (
          <div
            className="sui-chart__tooltip"
            role="tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.label !== undefined && tooltip.label !== null ? (
              <div className="sui-chart__tooltip-label">{tooltip.label}</div>
            ) : null}
            {tooltip.rows.map((row, i) => (
              <div key={i} className="sui-chart__tooltip-row">
                <span
                  className="sui-chart__swatch"
                  style={{ '--sui-series-color': row.color } as CSSProperties}
                />
                <span>{row.label}</span>
                <span className="sui-chart__tooltip-value">{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {legend && legendItems.length > 0 ? (
        <ul className="sui-chart__legend">
          {legendItems.map((item) => {
            const isHidden = hidden?.has(item.key) ?? false
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className="sui-chart__legend-item sui-focusable"
                  data-interactive={interactive}
                  data-hidden={isHidden}
                  aria-pressed={interactive ? !isHidden : undefined}
                  disabled={!interactive}
                  onClick={interactive ? () => onToggleSeries?.(item.key) : undefined}
                >
                  <span
                    className="sui-chart__swatch"
                    style={{ '--sui-series-color': item.color } as CSSProperties}
                  />
                  <span className="sui-chart__legend-label">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * Track which series the viewer has switched off.
 *
 * Uncontrolled by design — hiding a series is a viewing preference, not
 * application state, and lifting it would make every chart call site carry it.
 */
export function useHiddenSeries(): [Set<string>, (key: string) => void] {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const toggle = useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }, [])
  return [hidden, toggle]
}

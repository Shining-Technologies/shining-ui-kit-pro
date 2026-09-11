import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
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

/** The numbers behind a chart: one row per datum, one column per measure. */
export interface ChartTableData {
  /** Read out before the table, so its numbers belong to this chart. */
  caption?: string
  /** Header for the first column — what each row is. */
  labelHeader: string
  /** Value-column headers, in the order of each row's `values`. */
  columns: string[]
  rows: { label: string; values: (number | null)[] }[]
}

/** The table-view props every full SVG chart accepts — named as in the Recharts set. */
export interface ChartTableProps {
  /**
   * A table carrying every plotted value: in the accessibility tree whenever
   * this is on, visually hidden until a "Show data" toggle reveals it. Off by
   * default here (the Recharts set has it on) — turn it on wherever the
   * numbers matter, because the drawing is one image to a screen reader.
   */
  showTableToggle?: boolean
  /** Label for the toggle. Defaults to "Show data" / "Hide data". */
  tableToggleLabel?: [show: string, hide: string]
}

export interface ChartContainerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'hidden'>,
    ChartTableProps {
  /** Drawing height in pixels. Width always fills the container. */
  height?: number
  series: ChartSeries[]
  /** Hide series by clicking the legend. Omit the legend entirely with `false`. */
  legend?: boolean | 'interactive'
  hidden?: Set<string>
  onToggleSeries?: (key: string) => void
  tooltip?: TooltipState | null
  /**
   * Text for the polite live region: the active point, when the keyboard moved
   * to it. A tooltip is never announced by itself, so this is how a
   * screen-reader user hears where they are.
   */
  announcement?: string | null
  /** Rows for the table view. Nothing is rendered without them. */
  table?: ChartTableData
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
  announcement,
  table,
  showTableToggle = false,
  tableToggleLabel = ['Show data', 'Hide data'],
  emptyMessage = 'No data to display',
  isEmpty,
  children,
  ...props
}: ChartContainerProps) {
  const [ref, size] = useMeasure<HTMLDivElement>()
  const [tableOpen, setTableOpen] = useState(false)
  const tableId = useId()

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
  const canShowTable = showTableToggle && !isEmpty && Boolean(table?.rows.length)

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

        {/*
          Always mounted, so a screen reader is already listening when the
          first point is reached: a live region that appears together with its
          text is usually not announced at all.
        */}
        <div className="sui-visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement ?? ''}
        </div>
      </div>

      {legend && legendItems.length > 0 ? (
        <ul className="sui-chart__legend">
          {legendItems.map((item) => {
            const isHidden = hidden?.has(item.key) ?? false
            const content = (
              <>
                <span
                  className="sui-chart__swatch"
                  style={{ '--sui-series-color': item.color } as CSSProperties}
                />
                <span className="sui-chart__legend-label">{item.label}</span>
              </>
            )
            // A button only when there is something to press: a disabled one is
            // announced as "unavailable", which a key to the colours never is.
            return (
              <li key={item.key}>
                {interactive ? (
                  <button
                    type="button"
                    className="sui-chart__legend-item sui-focusable"
                    data-interactive
                    data-hidden={isHidden}
                    aria-pressed={!isHidden}
                    onClick={() => onToggleSeries?.(item.key)}
                  >
                    {content}
                  </button>
                ) : (
                  <span className="sui-chart__legend-item" data-hidden={isHidden}>
                    {content}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}

      {canShowTable && table ? (
        <>
          <button
            type="button"
            className="sui-chart__table-toggle sui-focusable"
            aria-expanded={tableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((open) => !open)}
          >
            {tableOpen ? tableToggleLabel[1] : tableToggleLabel[0]}
          </button>
          {/* In the DOM whenever it is on, only visually hidden until asked for. */}
          <div
            id={tableId}
            className={cn('sui-chart__table', !tableOpen && 'sui-visually-hidden')}
          >
            <table>
              <caption className="sui-visually-hidden">{table.caption ?? 'Chart data'}</caption>
              <thead>
                <tr>
                  <th scope="col">{table.labelHeader}</th>
                  {table.columns.map((column, i) => (
                    <th key={`${column}-${i}`} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={`${row.label}-${r}`}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, i) => (
                      // Full precision: the axis and tooltip are compact, and
                      // the table is where the exact figure has to be.
                      <td key={table.columns[i] ?? i}>
                        {value === null ? '—' : value.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * Which datum is highlighted, and whether the keyboard put it there.
 *
 * The pointer and the keyboard drive one state, so a focused chart shows
 * exactly the marker and tooltip a hover would. Only a keyboard move is
 * announced: reading out every datum the mouse passes over would drown
 * everything else a screen reader is saying.
 *
 * `indices` are the data indices that can be reached, in order — every datum
 * of a cartesian chart, only the drawn slices of a pie.
 */
export function useActivePoint(
  indices: readonly number[],
  options: {
    /** Let Up/Down step as well as Left/Right: a pie has no horizontal. */
    upDown?: boolean
  } = {},
) {
  const { upDown = false } = options
  const [state, setState] = useState<{ index: number | null; keyboard: boolean }>({
    index: null,
    keyboard: false,
  })

  const hover = useCallback((index: number | null) => {
    setState((current) =>
      current.index === index && !current.keyboard ? current : { index, keyboard: false },
    )
  }, [])

  /** Clear the pointer's point — or only `index`, when leaving one mark. */
  const leave = useCallback((index?: number) => {
    setState((current) =>
      index === undefined || current.index === index ? { index: null, keyboard: false } : current,
    )
  }, [])

  // A point the data no longer has (it shrank, or the slice was emptied) is
  // no point at all rather than an index into nothing.
  const index = state.index !== null && indices.includes(state.index) ? state.index : null

  const onKeyDown = (event: KeyboardEvent<Element>) => {
    if (indices.length === 0) return
    const at = index === null ? -1 : indices.indexOf(index)
    const last = indices.length - 1
    const forward = event.key === 'ArrowRight' || (upDown && event.key === 'ArrowDown')
    const back = event.key === 'ArrowLeft' || (upDown && event.key === 'ArrowUp')
    let next: number
    if (forward) next = at < 0 ? 0 : Math.min(last, at + 1)
    else if (back) next = at < 0 ? last : Math.max(0, at - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else if (event.key === 'Escape' && index !== null) {
      event.preventDefault()
      setState({ index: null, keyboard: false })
      return
    } else return
    // The arrows would otherwise scroll the page out from under the chart.
    event.preventDefault()
    setState({ index: indices[next] ?? null, keyboard: true })
  }

  // Leaving clears the keyboard's point; a pointer still over the chart keeps
  // its own.
  const onBlur = () =>
    setState((current) => (current.keyboard ? { index: null, keyboard: false } : current))

  return {
    /** The highlighted datum, or `null`. */
    index,
    /** Whether the keyboard put it there, so it should be announced. */
    keyboard: state.keyboard && index !== null,
    hover,
    leave,
    /** Spread onto the focusable plot. */
    keyboardProps: { tabIndex: indices.length > 0 ? 0 : undefined, onKeyDown, onBlur },
  }
}

/** "Feb: Booked 3, Completed 1" — a tooltip as one sentence for the live region. */
export function describeTooltip(tooltip: TooltipState | null): string {
  if (!tooltip) return ''
  const text = (node: ReactNode) =>
    typeof node === 'string' || typeof node === 'number' ? String(node) : ''
  const rows = tooltip.rows
    .map((row) => [text(row.label), text(row.value)].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ')
  const label = text(tooltip.label)
  return label && rows ? `${label}: ${rows}` : label || rows
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

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import {
  DEFAULT_HEIGHT,
  formatFull,
  resolveResponsive,
  seriesColor,
  sizeForWidth,
  type ChartSize,
  type Responsive,
  type ValueFormatter,
} from './theme'

/** One plotted measure. */
export interface ChartSeries {
  /** Key into each datum. */
  key: string
  /** Legend, tooltip and table-header label. Defaults to `key`. */
  label?: string
  /**
   * Any CSS colour. Defaults to the next `--sui-chart-*` slot, which the
   * project generator derives from the brand — so leaving it unset is usually
   * right, and is what keeps a chart following a project switch.
   */
  color?: string
}

export type ChartDatum = Record<string, string | number | null | undefined>

/** A series with its slot colour and hidden state already resolved. */
export interface ResolvedSeries extends ChartSeries {
  label: string
  color: string
  hidden: boolean
}

/**
 * Measure an element, in the browser and everywhere else.
 *
 * A chart that renders nothing until it has been measured renders nothing at
 * all on the server, in a test environment, or in any browser without
 * `ResizeObserver`. Drawing at a plausible width instead means the markup is
 * always complete and the first real measurement only corrects it.
 */
export const FALLBACK_CHART_WIDTH = 640

export function useChartWidth<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
  ChartSize,
] {
  const [width, setWidth] = useState(0)
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect()
    if (!node) return
    if (typeof ResizeObserver !== 'undefined') {
      observer.current = new ResizeObserver(([entry]) => {
        if (entry) setWidth(Math.round(entry.contentRect.width))
      })
      observer.current.observe(node)
    }
    setWidth(node.clientWidth)
  }, [])

  useEffect(() => () => observer.current?.disconnect(), [])

  const resolved = width || FALLBACK_CHART_WIDTH
  return [ref, resolved, sizeForWidth(resolved)]
}

/**
 * Track which series the viewer has switched off.
 *
 * Uncontrolled by design — hiding a series is a viewing preference, not
 * application state, and lifting it would make every call site carry it.
 */
export function useHiddenSeries(initial?: string[]): [Set<string>, (key: string) => void] {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(initial ?? []))
  const toggle = useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }, [])
  return [hidden, toggle]
}

/** Resolve labels, palette slots and hidden state for a series list. */
export function useResolvedSeries(series: ChartSeries[], hidden: Set<string>): ResolvedSeries[] {
  return useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        label: s.label ?? s.key,
        color: seriesColor(i, s.color),
        hidden: hidden.has(s.key),
      })),
    [series, hidden],
  )
}

/** Props every chart in this folder accepts. */
export interface BaseChartProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'children' | 'onClick'
> {
  /** Card heading. Omit to render the plot on its own. */
  title?: ReactNode
  /** One line under the title. */
  description?: ReactNode
  /** Filters or a range picker, placed on the header's trailing edge. */
  actions?: ReactNode
  /**
   * Plot height in pixels, one per size bucket, or a function of the measured
   * box — a horizontal bar chart needs a height that grows with its category
   * count, which no fixed number can express. Width always fills the
   * container. Defaults to a height that shrinks with the container.
   */
  height?: Responsive<number> | ((context: { size: ChartSize; width: number }) => number)
  /**
   * `'auto'` (default) shows a legend from two series up — one series needs no
   * legend, because the title already names what is plotted. `'interactive'`
   * additionally lets a click hide a series.
   */
  legend?: 'auto' | 'always' | 'interactive' | false
  /** Shown instead of the plot when there is nothing to draw. */
  emptyMessage?: ReactNode
  /** Replaces the plot with a shimmer while data is on its way. */
  loading?: boolean
  /**
   * A table carrying every plotted value, always in the accessibility tree and
   * revealed on request. This is the relief the palette's contrast requires,
   * and the only way a screen-reader user gets the numbers — leave it on.
   */
  showTableToggle?: boolean
  /** Label for the toggle. Defaults to "Show data" / "Hide data". */
  tableToggleLabel?: [show: string, hide: string]
}

interface ChartFrameProps extends BaseChartProps {
  series: ResolvedSeries[]
  onToggleSeries?: (key: string) => void
  isEmpty?: boolean
  /** Rows for the accessible table view: `[label, ...values]` per datum. */
  tableRows?: { label: string; values: (number | null)[] }[]
  /** Header for the table's first column. */
  tableLabelHeader?: string
  /**
   * Value-column headers. Defaults to one per series, which is right whenever
   * a row is a datum and a column is a measure. A part-to-whole chart inverts
   * that — a row *is* the series — so it passes a single column instead.
   */
  tableColumns?: string[]
  valueFormatter?: ValueFormatter
  children: (context: {
    size: ChartSize
    width: number
    height: number
    /**
     * A plain-text name for the plot — the `title` when it is a string, else
     * the frame's `aria-label`. Pass it to the Recharts chart's `title` prop:
     * its focusable `<svg>` otherwise carries an empty `<title>` and is
     * announced with no name at all.
     */
    label?: string
  }) => ReactNode
}

/**
 * The frame every chart shares: header, sizing, legend, empty and loading
 * states, and the table view.
 *
 * A render prop rather than a wrapper, so each chart receives the measured box
 * and its size bucket and can lay *itself* out — the axis-tick and margin
 * decisions differ per chart type and cannot be made generically up here.
 */
export function ChartFrame({
  className,
  title,
  description,
  actions,
  height,
  legend = 'auto',
  emptyMessage = 'No data to display',
  loading = false,
  showTableToggle = true,
  tableToggleLabel = ['Show data', 'Hide data'],
  series,
  onToggleSeries,
  isEmpty,
  tableRows,
  tableLabelHeader = '',
  tableColumns,
  valueFormatter = formatFull,
  children,
  ...props
}: ChartFrameProps) {
  const columns = tableColumns ?? series.map((s) => s.label)
  const [ref, width, size] = useChartWidth<HTMLDivElement>()
  const [tableOpen, setTableOpen] = useState(false)
  const tableId = useId()
  const titleId = useId()
  const ariaLabel = props['aria-label']
  const label = typeof title === 'string' ? title : ariaLabel
  // A titled chart is a figure named by its title, so a screen reader meets
  // the name before the plot, the legend and the table it groups. Anything the
  // caller passes for `role` or the label spreads over these.
  const figureProps = title
    ? {
        role: 'figure' as const,
        'aria-labelledby': ariaLabel || props['aria-labelledby'] ? undefined : titleId,
      }
    : {}

  const plotHeight =
    typeof height === 'function'
      ? height({ size, width })
      : (resolveResponsive(height, size) ?? DEFAULT_HEIGHT[size])
  const interactive = legend === 'interactive' && Boolean(onToggleSeries)
  // One series needs no legend: there is a single colour, and the title
  // already says what it belongs to. A box with one swatch restates the title.
  const showLegend =
    legend !== false && series.length > 0 && (legend === 'auto' ? series.length > 1 : true)
  const hasHeader = Boolean(title || description || actions)
  // No table while the plot is a shimmer: whatever is in `data` at that point
  // is the previous request's answer or nothing at all, and offering it as
  // "the numbers behind this chart" would be a lie either way.
  const canShowTable = showTableToggle && !loading && Boolean(tableRows?.length)

  return (
    <div data-slot="chart" className={cn('sui-viz', className)} {...figureProps} {...props}>
      {hasHeader ? (
        <div className="sui-viz__header">
          <div className="sui-viz__heading">
            {title ? (
              <div id={titleId} className="sui-viz__title">
                {title}
              </div>
            ) : null}
            {description ? <div className="sui-viz__description">{description}</div> : null}
          </div>
          {actions ? <div className="sui-viz__actions">{actions}</div> : null}
        </div>
      ) : null}

      <div ref={ref} className="sui-viz__canvas" style={{ height: plotHeight }}>
        {loading ? (
          <div className="sui-viz__loading" role="status" aria-live="polite">
            <span className="sui-visually-hidden">Loading chart</span>
          </div>
        ) : isEmpty ? (
          <div className="sui-viz__empty">{emptyMessage}</div>
        ) : (
          children({ size, width, height: plotHeight, label })
        )}
      </div>

      {showLegend ? (
        <ul className="sui-viz__legend">
          {series.map((item) => (
            <li key={item.key}>
              {/* A button only when there is something to press: a disabled one
                  is announced as "unavailable", which a key to the colours never is. */}
              {interactive ? (
                <button
                  type="button"
                  className="sui-viz__legend-item sui-focusable"
                  data-interactive
                  data-hidden={item.hidden}
                  aria-pressed={!item.hidden}
                  onClick={() => onToggleSeries?.(item.key)}
                >
                  <span
                    className="sui-viz__swatch"
                    style={{ '--sui-series-color': item.color } as CSSProperties}
                  />
                  <span className="sui-viz__legend-label">{item.label}</span>
                </button>
              ) : (
                <span className="sui-viz__legend-item" data-hidden={item.hidden}>
                  <span
                    className="sui-viz__swatch"
                    style={{ '--sui-series-color': item.color } as CSSProperties}
                  />
                  <span className="sui-viz__legend-label">{item.label}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {canShowTable ? (
        <>
          <button
            type="button"
            className="sui-viz__table-toggle sui-focusable"
            aria-expanded={tableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((open) => !open)}
          >
            {tableOpen ? tableToggleLabel[1] : tableToggleLabel[0]}
          </button>
          {/*
            Always in the DOM, only visually hidden. A chart is an image to a
            screen reader however carefully it is drawn, so the numbers have to
            exist in text — gating them behind a toggle the reader has to find
            first would make them optional.
          */}
          <div id={tableId} className={cn('sui-viz__table', !tableOpen && 'sui-visually-hidden')}>
            <table>
              <caption className="sui-visually-hidden">
                {typeof title === 'string' ? title : 'Chart data'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{tableLabelHeader}</th>
                  {columns.map((column, i) => (
                    <th key={`${column}-${i}`} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows?.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, i) => (
                      <td key={columns[i] ?? i}>{value === null ? '—' : valueFormatter(value)}</td>
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

/** Build table rows from a dataset, honouring the series order. */
export function tableRowsFrom(
  data: ChartDatum[],
  xKey: string,
  series: ChartSeries[],
  labelFormatter?: (label: string | number) => string,
): { label: string; values: (number | null)[] }[] {
  return data.map((datum) => {
    const raw = datum[xKey]
    const label = raw === null || raw === undefined ? '' : String(raw)
    return {
      label: labelFormatter ? labelFormatter(raw as string | number) : label,
      values: series.map((s) => {
        const value = datum[s.key]
        return typeof value === 'number' && Number.isFinite(value) ? value : null
      }),
    }
  })
}

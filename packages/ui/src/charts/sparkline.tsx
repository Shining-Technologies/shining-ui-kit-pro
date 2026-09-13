'use client'

import { useId, useMemo, type HTMLAttributes, type ReactElement } from 'react'
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { cn } from '../lib/cn'
import { finiteExtent } from './axes'
import {
  CHART_SURFACE,
  DOT_RADIUS,
  LINE_WIDTH,
  MARK_GAP,
  seriesColor,
} from './theme'

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Plain numbers, oldest first. Nulls break the line rather than bridging it. */
  data: (number | null)[]
  /** Any CSS colour. Defaults to the first chart slot. */
  color?: string
  variant?: 'line' | 'area'
  /** Mark the most recent point. Default `true`. */
  showEndPoint?: boolean
  /** Drawing height in pixels. Default `40`. */
  height?: number
  /**
   * Read out by assistive technology in place of the drawing. Without it the
   * sparkline is hidden from the accessibility tree, which is correct when the
   * figure beside it already says everything.
   */
  ariaLabel?: string
}

/**
 * Shape without magnitude.
 *
 * No axes, no gridlines, no tooltip: a sparkline answers "which way, and how
 * steadily", and the figure it sits beside answers "how much". Adding
 * furniture to it turns it into a small bad chart.
 */
export function Sparkline({
  data,
  color,
  variant = 'area',
  showEndPoint = true,
  height = 40,
  ariaLabel,
  className,
  ...props
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, '')
  const stroke = color ?? seriesColor(0)

  const points = useMemo(() => data.map((value, i) => ({ i, value })), [data])
  const domain = useMemo(() => {
    const range = finiteExtent(data.filter((v): v is number => typeof v === 'number'))
    if (!range) return undefined
    const [min, max] = range
    // A flat series has no range to scale into; pad it so the line sits in the
    // middle of the box instead of collapsing onto an edge.
    const pad = (max - min || Math.abs(max) || 1) * 0.15
    return [min - pad, max + pad] as [number, number]
  }, [data])

  if (points.length === 0) return null

  const endDot = showEndPoint ? endPointDot({ lastIndex: points.length - 1, fill: stroke }) : false

  return (
    <div
      className={cn('sui-viz__sparkline', className)}
      style={{ height }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'area' ? (
          <AreaChart data={points} margin={{ top: 4, right: 5, bottom: 2, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={domain} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={LINE_WIDTH}
              fill={`url(#${gradientId})`}
              // Only the last point is marked: the sparkline's job is the
              // shape, and a dot on every reading obscures it.
              dot={endDot}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={points} margin={{ top: 4, right: 5, bottom: 2, left: 0 }}>
            <YAxis hide domain={domain} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={LINE_WIDTH}
              strokeLinecap="round"
              dot={endDot}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Mark the last reading and nothing else.
 *
 * A dot renderer rather than a second one-point series: `AreaChart` only
 * accepts `Area` children, so a `Line` added alongside is dropped without a
 * word and the marker silently never appears.
 */
function endPointDot(options: {
  lastIndex: number
  fill: string
}): (props: DotRenderProps) => ReactElement {
  const { lastIndex, fill } = options
  return ({ cx, cy, index }) => {
    const key = `sparkline-dot-${index}`
    if (index !== lastIndex || cx === undefined || cy === undefined) return <g key={key} />
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={DOT_RADIUS}
        fill={fill}
        // The surface ring keeps the marker legible where it sits on top of
        // the line's own stroke.
        stroke={CHART_SURFACE}
        strokeWidth={MARK_GAP}
      />
    )
  }
}

/** The subset of Recharts' dot props this uses. */
interface DotRenderProps {
  cx?: number
  cy?: number
  index: number
}

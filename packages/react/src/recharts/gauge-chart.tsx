import { useMemo, type ReactNode } from 'react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { ChartFrame, type BaseChartProps } from './chart-frame'
import { formatFull, formatPercent, seriesColor, type ValueFormatter } from './theme'

/** How far along a gauge is allowed to read as fine, strained, or in trouble. */
export interface GaugeThresholds {
  /** At or above this share of the target, the arc reads as healthy. */
  good: number
  /** Below `good` and at or above this, it reads as strained. */
  warning: number
}

export interface GaugeChartProps extends Omit<BaseChartProps, 'legend'> {
  /** Where the measure currently stands. */
  value: number
  /** What counts as full. Default `100`. */
  target?: number
  /** Centre figure. Defaults to the share of target as a percentage. */
  centerValue?: ReactNode
  /** Caption under the centre figure. Defaults to `"of <target>"`. */
  centerLabel?: ReactNode
  /**
   * Colour the arc by how it is doing rather than by identity.
   *
   * Off by default: severity colour is a claim about the data, and most gauges
   * are a neutral share of a target with no opinion attached. Turn it on for
   * the ones that do have one — an SLA, a utilisation ceiling, a budget.
   */
  thresholds?: GaugeThresholds
  /** Any CSS colour for the arc. Defaults to the first chart slot. */
  color?: string
  valueFormatter?: ValueFormatter
}

const FULL_CIRCLE_START = 90
const FULL_CIRCLE_END = -270

/**
 * One measure against what it is aiming at.
 *
 * A gauge is a stat tile that also shows how much room is left, which is the
 * only reason to spend a whole card on a single number. When there is no
 * target to read against, a plain `Stat` says the same thing in less space.
 *
 * ```tsx
 * <GaugeChart title="SLA" value={94.2} target={100} centerLabel="on time" />
 * ```
 */
export function GaugeChart({
  value,
  target = 100,
  centerValue,
  centerLabel,
  thresholds,
  color,
  valueFormatter = formatFull,
  height = { xs: 180, sm: 200, md: 220, lg: 240 },
  showTableToggle = false,
  ...frameProps
}: GaugeChartProps) {
  const share = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0

  const arcColor = useMemo(() => {
    if (color) return color
    if (!thresholds) return seriesColor(0)
    if (share >= thresholds.good) return 'var(--sui-success)'
    if (share >= thresholds.warning) return 'var(--sui-warning)'
    return 'var(--sui-destructive)'
  }, [color, thresholds, share])

  const data = [{ name: 'value', value: share * 100, fill: arcColor }]

  return (
    <ChartFrame
      {...frameProps}
      height={height}
      legend={false}
      showTableToggle={showTableToggle}
      series={[]}
      isEmpty={!Number.isFinite(value)}
    >
      {({ size, height: plotHeight }) => {
        const outer = Math.max(48, Math.min(plotHeight / 2 - 6, 130))
        const inner = Math.round(outer * 0.74)

        return (
          <div className="sui-viz__radial">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={data}
                startAngle={FULL_CIRCLE_START}
                endAngle={FULL_CIRCLE_END}
                innerRadius={inner}
                outerRadius={outer}
                barSize={outer - inner}
              >
                {/*
                  The axis is what makes the arc mean anything: without a fixed
                  0–100 domain Recharts scales the single datum to fill the
                  ring, and every value would draw a full circle.
                */}
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  dataKey="value"
                  cornerRadius={(outer - inner) / 2}
                  background={{ fill: 'var(--sui-muted)' }}
                  isAnimationActive={false}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="sui-viz__center">
              {/*
                The figure is the chart. It carries the accessible name for the
                whole thing, so the arc beside it can stay decorative.
              */}
              <div
                className="sui-viz__center-value sui-viz__center-value--hero"
                role="img"
                aria-label={`${valueFormatter(value)} of ${valueFormatter(target)}`}
                data-size={size}
              >
                {centerValue ?? formatPercent(share * 100, share * 100 >= 99.5 ? 0 : 1)}
              </div>
              <div className="sui-viz__center-label">
                {centerLabel ?? `of ${valueFormatter(target)}`}
              </div>
            </div>
          </div>
        )
      }}
    </ChartFrame>
  )
}

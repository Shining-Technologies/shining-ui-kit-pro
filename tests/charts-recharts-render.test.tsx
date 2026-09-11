/**
 * Does anything actually get drawn?
 *
 * The other chart test file covers the frame, which renders fine in a DOM with
 * no layout. Recharts itself does not: it measures its container and draws
 * nothing at all when the answer is zero, which is exactly what happy-dom
 * reports. So this file installs a `ResizeObserver` that reports a real box
 * and asserts on the geometry — without it, every chart here could be silently
 * rendering an empty `<svg>` and the suite would still be green.
 */
import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  BarChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline,
  TrendChart,
  type ChartDatum,
} from '@shining-ui-kit/react/recharts'

const BOX = { width: 800, height: 320 }
const original = window.ResizeObserver

beforeAll(() => {
  window.ResizeObserver = class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [
          { target, contentRect: { ...BOX, top: 0, left: 0, right: 800, bottom: 320, x: 0, y: 0 } },
        ] as unknown as ResizeObserverEntry[],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver

  // Recharts reads the wrapper's own box as well as the observer's report.
  for (const prop of ['clientWidth', 'offsetWidth'] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: BOX.width })
  }
  for (const prop of ['clientHeight', 'offsetHeight'] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: BOX.height })
  }
})

afterAll(() => {
  window.ResizeObserver = original
})

const months: ChartDatum[] = [
  { month: 'Jan', booked: 120, completed: 96 },
  { month: 'Feb', booked: 148, completed: 131 },
  { month: 'Mar', booked: 96, completed: 88 },
]
const series = [
  { key: 'booked', label: 'Booked' },
  { key: 'completed', label: 'Completed' },
]

function surface(container: HTMLElement) {
  return container.querySelector('.recharts-surface')
}

/**
 * The horizontal extent of a rounded-rectangle path.
 *
 * Every second number is *not* an x: an `A` command carries seven parameters
 * and only the last two are a point, so the radii and flags have to be skipped
 * or the corners read as coordinates and the measurement comes out wildly
 * wide.
 */
const N = String.raw`-?[\d.]+`
const POINT = new RegExp(String.raw`[ML]\s*(${N})\s*,\s*${N}`, 'g')
const ARC_END = new RegExp(
  String.raw`A\s*${N}\s*,\s*${N}\s*,\s*${N}\s*,\s*[01]\s*,\s*[01]\s*,\s*(${N})\s*,\s*${N}`,
  'g',
)

function pathWidth(d: string): number {
  const xs = [...d.matchAll(POINT), ...d.matchAll(ARC_END)].map((match) => Number(match[1]))
  return xs.length ? Math.max(...xs) - Math.min(...xs) : 0
}

describe('the plot is really drawn', () => {
  it('draws one path per series in a line chart', () => {
    const { container } = render(<TrendChart data={months} xKey="month" series={series} />)
    expect(surface(container)).toBeInTheDocument()
    expect(container.querySelectorAll('.recharts-line-curve')).toHaveLength(2)
  })

  it('fills the area under the line, and keeps the line on top of it', () => {
    const { container } = render(
      <TrendChart data={months} xKey="month" series={series} variant="area" />,
    )
    expect(container.querySelectorAll('.recharts-area-area').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.recharts-area-curve').length).toBeGreaterThan(0)
  })

  it('draws a rectangle per bar', () => {
    const { container } = render(<BarChart data={months} xKey="month" series={series} />)
    expect(container.querySelectorAll('.recharts-rectangle').length).toBeGreaterThanOrEqual(
      months.length * series.length,
    )
  })

  it('caps bar thickness so a slot is never filled edge to edge', () => {
    const { container } = render(
      <BarChart data={months} xKey="month" series={[series[0]!]} orientation="columns" />,
    )
    // Three categories across 800px: uncapped, each bar would be ~180px wide
    // and the band would have no air left in it at all. Recharts draws the bar
    // as a path, so the width is read back off the rendered geometry rather
    // than trusted from the prop that was passed in.
    const bars = [...container.querySelectorAll('.recharts-rectangle')]
    expect(bars.length).toBe(months.length)

    for (const bar of bars) {
      expect(pathWidth(bar.getAttribute('d') ?? '')).toBeLessThanOrEqual(24)
    }
  })

  it('draws a wedge per slice, separated by the surface colour', () => {
    const { container } = render(
      <DonutChart
        data={[
          { key: 'a', label: 'A', value: 4 },
          { key: 'b', label: 'B', value: 6 },
        ]}
      />,
    )
    const sectors = container.querySelectorAll('.recharts-pie-sector')
    expect(sectors).toHaveLength(2)
    expect(sectors[0]?.querySelector('path')).toHaveAttribute('stroke', 'var(--sui-chart-surface)')
  })

  it('draws the gauge arc against a fixed domain, not a self-scaled one', () => {
    const { container } = render(<GaugeChart value={25} target={100} />)
    expect(container.querySelectorAll('.recharts-radial-bar-sector').length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: '25 of 100' })).toHaveTextContent('25.0%')
  })

  it('draws a symbol per point', () => {
    const { container } = render(
      <ScatterChart
        data={[
          { days: 4, value: 2400 },
          { days: 11, value: 5200 },
        ]}
        xKey="days"
        yKey="value"
      />,
    )
    expect(container.querySelectorAll('.recharts-symbols')).toHaveLength(2)
  })

  it('draws a sparkline with a marked end point and no axes', () => {
    const { container } = render(<Sparkline data={[3, 7, 5, 12]} ariaLabel="Trend" />)
    expect(container.querySelectorAll('.recharts-area-curve').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.recharts-cartesian-axis-tick')).toHaveLength(0)
    // Exactly one marker: the last reading, and no other. A dot on every
    // point is the failure mode this guards against.
    const dots = container.querySelectorAll('circle')
    expect(dots).toHaveLength(1)
    expect(dots[0]).toHaveAttribute('stroke', 'var(--sui-chart-surface)')
  })

  it('paints gridlines from the border token and never dashes them', () => {
    const { container } = render(<TrendChart data={months} xKey="month" series={series} />)
    const lines = [...container.querySelectorAll('.recharts-cartesian-grid line')]
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line).toHaveAttribute('stroke', 'var(--sui-border)')
      expect(line).not.toHaveAttribute('stroke-dasharray')
    }
  })
})

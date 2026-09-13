/**
 * Chart audit regressions.
 *
 * Edge-case data (empty, one point, all zero, negative, NaN, very long) and the
 * accessibility contract for the Recharts set — plus the packaging promise that
 * the root entry never reaches `recharts`.
 *
 * Recharts measures its container and draws nothing in a DOM with no layout, so
 * this file installs a `ResizeObserver` that reports a real box, like
 * `charts-recharts-render.test.tsx` does.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import {
  BarChart as RcBarChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline as RcSparkline,
  TrendChart,
  valueAxisProps,
} from '@shining-technologies/ui/charts'
import { finiteExtent, zeroBasedDomain } from '../src/charts/axes'

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
  for (const prop of ['clientWidth', 'offsetWidth'] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: BOX.width })
  }
  for (const prop of ['clientHeight', 'offsetHeight'] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: BOX.height })
  }
})

afterAll(() => {
  window.ResizeObserver = original
  for (const prop of ['clientWidth', 'offsetWidth', 'clientHeight', 'offsetHeight'] as const) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop]
  }
})

const LOTS = 150_000

function allPaths(container: HTMLElement): string[] {
  return [...container.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '')
}

function yTicks(container: HTMLElement): number[] {
  // Recharts 2 draws tick labels inside the axis group; Recharts 3 moves them
  // to a separate z-index layer beside it. Read whichever this version drew.
  const selector = [
    '.recharts-yAxis .recharts-cartesian-axis-tick-value',
    '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value',
  ].join(', ')
  return [...container.querySelectorAll(selector)].map((t) => Number(t.textContent))
}

/** Vertical extent of a Recharts rectangle path, from its M/L points. */
function pathHeight(d: string): number {
  const ys = [...d.matchAll(/[ML]\s*-?[\d.]+\s*,\s*(-?[\d.]+)/g)].map((m) => Number(m[1]))
  return ys.length ? Math.max(...ys) - Math.min(...ys) : 0
}

// -------------------------------------------------------------- Recharts

describe('Recharts: legend', () => {
  const trend = [
    { m: 'a', v: 1, w: 2 },
    { m: 'b', v: 2, w: 3 },
  ]
  const two = [{ key: 'v' }, { key: 'w' }]

  it('is a plain list when nothing can be toggled', () => {
    const { container } = render(<TrendChart data={trend} xKey="m" series={two} legend="always" />)
    expect(container.querySelectorAll('.sui-viz__legend li')).toHaveLength(2)
    // A disabled button would be announced as "unavailable".
    expect(container.querySelector('.sui-viz__legend button')).toBeNull()
  })

  it('is a set of toggle buttons when series can be hidden', () => {
    const { container } = render(<TrendChart data={trend} xKey="m" series={two} />)
    const buttons = container.querySelectorAll('.sui-viz__legend button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).not.toBeDisabled()
  })
})

describe('Recharts: edge-case data', () => {
  it('starts all-negative bars at zero, so their lengths compare', () => {
    const { container } = render(
      <RcBarChart
        data={[
          { m: 'a', v: -100 },
          { m: 'b', v: -50 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
        orientation="columns"
      />,
    )
    const ticks = yTicks(container)
    expect(Math.max(...ticks)).toBe(0)
    const heights = [...container.querySelectorAll('.recharts-rectangle')].map((bar) =>
      pathHeight(bar.getAttribute('d') ?? ''),
    )
    expect(heights).toHaveLength(2)
    expect(heights[1]! / heights[0]!).toBeCloseTo(0.5, 1)
  })

  it('keeps zero on a trend axis for negative data, with evenly spaced ticks', () => {
    const { container } = render(
      <TrendChart
        data={[
          { m: 'a', v: -10 },
          { m: 'b', v: -5 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
        valueFormatter={String}
      />,
    )
    const ticks = yTicks(container)
    expect(Math.max(...ticks)).toBe(0)
    const steps = ticks.slice(1).map((t, i) => t - ticks[i]!)
    expect(new Set(steps).size).toBe(1)
  })

  it('still starts a positive trend axis at zero', () => {
    const { container } = render(
      <TrendChart
        data={[
          { m: 'a', v: 40 },
          { m: 'b', v: 90 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
        valueFormatter={String}
      />,
    )
    expect(Math.min(...yTicks(container))).toBe(0)
  })

  it('ranks categories deterministically when a value is NaN', () => {
    render(
      <RcBarChart
        title="Ranked"
        data={[
          { k: 'nan', v: Number.NaN },
          { k: 'five', v: 5 },
          { k: 'three', v: 3 },
        ]}
        xKey="k"
        series={[{ key: 'v' }]}
        sort="desc"
      />,
    )
    const rows = screen.getAllByRole('rowheader').map((cell) => cell.textContent)
    expect(rows).toEqual(['five', 'three', 'nan'])
  })

  it('shows the empty state for no data, all-zero slices and a NaN gauge', () => {
    render(
      <div>
        <TrendChart data={[]} xKey="m" series={[{ key: 'v' }]} emptyMessage="trend empty" />
        <DonutChart data={[{ key: 'a', value: 0 }]} emptyMessage="donut empty" />
        <GaugeChart value={Number.NaN} emptyMessage="gauge empty" />
      </div>,
    )
    expect(screen.getByText('trend empty')).toBeInTheDocument()
    expect(screen.getByText('donut empty')).toBeInTheDocument()
    expect(screen.getByText('gauge empty')).toBeInTheDocument()
  })

  it('draws a single-point trend and a one-group scatter', () => {
    const { container } = render(
      <div>
        <TrendChart data={[{ m: 'a', v: 1 }]} xKey="m" series={[{ key: 'v' }]} />
        <ScatterChart data={[{ x: 1, y: 2 }]} xKey="x" yKey="y" />
        <RcSparkline data={[Number.NaN, 1, 2]} />
      </div>,
    )
    expect(allPaths(container).join(' ')).not.toContain('NaN')
  })

  it('sizes the value axis for a very long series without spreading it', () => {
    const values = Array.from({ length: LOTS }, (_, i) => i)
    expect(() => valueAxisProps({ size: 'md', values })).not.toThrow()
    expect(finiteExtent([...values, Number.NaN])).toEqual([0, LOTS - 1])
    expect(zeroBasedDomain([-3, -1])).toEqual(['auto', 0])
    expect(zeroBasedDomain([-3, 4])).toEqual([0, 'auto'])
    expect(zeroBasedDomain([])).toEqual([0, 'auto'])
  })
})

describe('Recharts: accessibility', () => {
  const data = [
    { m: 'Jan', a: 1 },
    { m: 'Feb', a: 3 },
  ]

  it('names the focusable plot with the chart title', () => {
    const { container } = render(
      <TrendChart title="Bookings" data={data} xKey="m" series={[{ key: 'a' }]} />,
    )
    expect(container.querySelector('svg.recharts-surface > title')?.textContent).toBe('Bookings')
    expect(screen.getByRole('figure', { name: 'Bookings' })).toBeInTheDocument()
  })

  it('takes the plot name from aria-label when the title is not text', () => {
    const { container } = render(
      <RcBarChart
        title={<strong>Jobs</strong>}
        aria-label="Jobs by month"
        data={data}
        xKey="m"
        series={[{ key: 'a' }]}
      />,
    )
    expect(container.querySelector('svg.recharts-surface > title')?.textContent).toBe(
      'Jobs by month',
    )
    expect(screen.getByRole('figure', { name: 'Jobs by month' })).toBeInTheDocument()
  })

  it('names every donut wedge, which Recharts draws as an image', () => {
    const { container } = render(
      <DonutChart
        data={[
          { key: 'done', label: 'Done', value: 3 },
          { key: 'open', label: 'Open', value: 1 },
        ]}
      />,
    )
    const names = [...container.querySelectorAll('.recharts-sector')].map((s) =>
      s.getAttribute('aria-label'),
    )
    expect(names).toEqual(['Done: 3, 75%', 'Open: 1, 25%'])
  })

  it('has no axe violations with the plot drawn', async () => {
    const { container } = render(
      <div>
        <TrendChart title="Trend" data={data} xKey="m" series={[{ key: 'a' }]} />
        <RcBarChart title="Bars" data={data} xKey="m" series={[{ key: 'a' }]} />
        <DonutChart title="Share" data={[{ key: 'x', value: 2 }]} />
      </div>,
    )
    expect((await axe(container)).violations).toEqual([])
  })
})

// ------------------------------------------------------------- SSR + packaging

describe('server rendering', () => {
  // V2 has only the Recharts set; the SVG charts this also rendered are gone.
  it('renders both chart sets with no window or document', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    try {
      const html = renderToString(
        <div>
          <TrendChart title="SSR" data={[{ m: 'a', v: 1 }]} xKey="m" series={[{ key: 'v' }]} />
          <GaugeChart value={50} />
          <RcSparkline data={[1, 2]} ariaLabel="Spark" />
        </div>,
      )
      expect(html).toContain('sui-viz')
      expect(html).toContain('SSR')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('the root entry never reaches recharts', () => {
  const src = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
  const SPECIFIER = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g

  function resolveModule(from: string, specifier: string): string | null {
    const base = resolve(dirname(from), specifier)
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
    ]) {
      if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate
    }
    return null
  }

  /** Every bare specifier reachable from `entry` through relative imports. */
  function externalImports(entry: string): Set<string> {
    const seen = new Set<string>()
    const external = new Set<string>()
    const queue = [entry]
    while (queue.length) {
      const file = queue.pop()!
      if (seen.has(file)) continue
      seen.add(file)
      for (const match of readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
        const specifier = match[1] ?? match[2]!
        if (!specifier.startsWith('.')) {
          external.add(specifier)
          continue
        }
        const next = resolveModule(file, specifier)
        if (next) queue.push(next)
      }
    }
    return external
  }

  it('imports neither recharts nor react-virtual from the root graph', () => {
    const external = externalImports(join(src, 'index.ts'))
    expect(external.has('react')).toBe(true) // the walker is really walking
    expect([...external].filter((s) => s === 'recharts' || s.startsWith('recharts/'))).toEqual([])
    expect(external.has('@tanstack/react-virtual')).toBe(false)
  })

  it('keeps recharts inside its own entry', () => {
    // V2: the Recharts entry is `src/charts/index.ts` (`/charts`).
    expect(externalImports(join(src, 'charts', 'index.ts')).has('recharts')).toBe(true)
  })
})

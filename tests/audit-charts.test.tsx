/**
 * Chart audit regressions.
 *
 * Edge-case data (empty, one point, all zero, negative, NaN, very long) and the
 * accessibility contract, for both chart sets — plus the packaging promise that
 * the root entry never reaches `recharts`.
 *
 * Recharts measures its container and draws nothing in a DOM with no layout, so
 * this file installs a `ResizeObserver` that reports a real box, like
 * `charts-recharts-render.test.tsx` does.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { BarChart, LineChart, PieChart, Sparkline } from '@shining-technologies/ui-kit-react'
import {
  BarChart as RcBarChart,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline as RcSparkline,
  TrendChart,
  valueAxisProps,
} from '@shining-technologies/ui-kit-react/recharts'
import { extent } from '../packages/react/src/charts/scale'
import { finiteExtent, zeroBasedDomain } from '../packages/react/src/recharts/axes'

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

// ------------------------------------------------------------ SVG charts

describe('SVG charts: edge-case data', () => {
  it('draws the valid slices of a pie when one slice is NaN', () => {
    const { container } = render(
      <PieChart
        data={[
          { key: 'bad', value: Number.NaN },
          { key: 'good', value: 3 },
        ]}
      />,
    )
    const slices = container.querySelectorAll('.sui-chart__slice')
    expect(slices).toHaveLength(1)
    expect(allPaths(container).join(' ')).not.toContain('NaN')
  })

  it('shows the empty state for a pie of zeros and negatives', () => {
    render(
      <PieChart
        data={[
          { key: 'a', value: 0 },
          { key: 'b', value: -4 },
        ]}
        emptyMessage="Nothing yet"
      />,
    )
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })

  it('skips non-finite readings in a sparkline instead of emitting NaN paths', () => {
    const { container } = render(<Sparkline data={[1, Number.NaN, 3, Infinity]} />)
    const d = container.querySelector('.sui-chart__line')?.getAttribute('d') ?? ''
    expect(d).not.toContain('NaN')
    expect(d).toMatch(/^M/)
  })

  it('renders a very long sparkline without overflowing the stack', () => {
    const data = Array.from({ length: LOTS }, (_, i) => Math.sin(i / 100))
    expect(() => render(<Sparkline data={data} smooth={false} />)).not.toThrow()
  })

  it('applies the sparkline height inline, so the stylesheet cannot override it', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} height={48} style={{ opacity: 0.5 }} color="red" />,
    )
    const svg = container.querySelector('svg')!
    expect(svg.style.height).toBe('48px')
    // A consumer style merges rather than replacing the series colour.
    expect(svg.style.opacity).toBe('0.5')
    expect(svg.style.getPropertyValue('--sui-series-color')).toBe('red')
  })

  it('gives every all-negative bar a real height, with zero on the axis', () => {
    const { container } = render(
      <BarChart
        data={[
          { m: 'a', v: -100 },
          { m: 'b', v: -50 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
      />,
    )
    const heights = [...container.querySelectorAll('.sui-chart__bar')].map((b) =>
      Number(b.getAttribute('height')),
    )
    expect(heights).toHaveLength(2)
    // Bars start at zero, so -50 is half as long as -100.
    expect(heights[1]).toBeGreaterThan(0)
    expect(heights[1]! / heights[0]!).toBeCloseTo(0.5, 1)
    const labels = [...container.querySelectorAll('.sui-chart__axis text')].map(
      (t) => t.textContent,
    )
    expect(labels).toContain('0')
  })

  it('draws an all-zero line without NaN', () => {
    const { container } = render(
      <LineChart
        data={[
          { m: 'a', v: 0 },
          { m: 'b', v: 0 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
      />,
    )
    expect(allPaths(container).join(' ')).not.toContain('NaN')
  })

  it('centres a single point, where its tooltip is placed', () => {
    const { container } = render(
      <LineChart data={[{ m: 'a', v: 5 }]} xKey="m" series={[{ key: 'v' }]} />,
    )
    const point = container.querySelector('.sui-chart__point')!
    // 800 wide, margins 40 / 12: the plot's centre is 40 + 748 / 2.
    expect(Number(point.getAttribute('cx'))).toBe(414)
  })

  it('treats a null reading as a gap, not a zero', () => {
    const { container } = render(
      <LineChart
        data={[
          { m: 'a', v: 5 },
          { m: 'b', v: null },
          { m: 'c', v: 7 },
        ]}
        xKey="m"
        series={[{ key: 'v' }]}
      />,
    )
    const d = container.querySelector('.sui-chart__line')?.getAttribute('d') ?? ''
    // Two points: one move and one line — no detour down to zero for "b".
    expect(d.match(/[ML]/g)).toHaveLength(2)
  })

  it('marks the hovered reading, not the next drawn point, when the data has a gap', () => {
    const { container } = render(
      <LineChart
        data={[
          { m: 'a', v: 1 },
          { m: 'b', v: null },
          { m: 'c', v: 3 },
        ]}
        xKey="m"
        series={[{ key: 'v', label: 'Value' }]}
      />,
    )
    const svg = container.querySelector('svg')!
    // The last index sits at the plot's right edge: 40 + 748.
    fireEvent.mouseMove(svg, { clientX: 788, clientY: 100 })
    const marker = container.querySelector('circle[r="4.5"]')
    expect(marker).not.toBeNull()
    expect(Number(marker!.getAttribute('cx'))).toBe(788)

    // Over the gap: a dash in the tooltip, and no marker invented at zero.
    fireEvent.mouseMove(svg, { clientX: 414, clientY: 100 })
    expect(container.querySelector('circle[r="4.5"]')).toBeNull()
    expect(container.querySelector('.sui-chart__tooltip-value')?.textContent).toBe('—')
  })

  it('finds the extent of a very long series without spreading it', () => {
    const values = Array.from({ length: LOTS }, (_, i) => i)
    expect(extent([...values, Number.NaN])).toEqual([0, LOTS - 1])
    expect(extent([])).toBeNull()
  })
})

describe('SVG charts: accessibility', () => {
  const data = [
    { m: 'Jan', a: 1, b: 2 },
    { m: 'Feb', a: 3, b: 1 },
  ]
  const series = [
    { key: 'a', label: 'Booked' },
    { key: 'b', label: 'Completed' },
  ]

  it('names each chart image with a summary of what it plots', () => {
    render(<LineChart data={data} xKey="m" series={series} />)
    // An application rather than an image: the chart takes the arrow keys.
    expect(
      screen.getByRole('application', {
        name: 'Line chart of Booked and Completed, 2 points from Jan to Feb.',
      }),
    ).toBeInTheDocument()
  })

  it('names a pie by its slices and shares', () => {
    render(
      <PieChart
        data={[
          { key: 'done', label: 'Done', value: 3 },
          { key: 'open', label: 'Open', value: 1 },
        ]}
      />,
    )
    expect(
      screen.getByRole('application', { name: 'Donut chart: Done 75%, Open 25%.' }),
    ).toBeInTheDocument()
  })

  it('lets the caller say what the chart shows', () => {
    render(<BarChart data={data} xKey="m" series={series} ariaLabel="Bookings doubled in Feb" />)
    expect(screen.getByRole('application', { name: 'Bookings doubled in Feb' })).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <LineChart data={data} xKey="m" series={series} />
        <BarChart data={data} xKey="m" series={series} stacked />
        <PieChart data={[{ key: 'x', value: 1 }]} />
      </div>,
    )
    expect((await axe(container)).violations).toEqual([])
  })
})

// -------------------------------------------------------------- Recharts

describe('SVG charts: keyboard and data view', () => {
  const slices = [
    { key: 'done', label: 'Done', value: 3 },
    { key: 'none', label: 'None', value: 0 },
    { key: 'open', label: 'Open', value: 1 },
  ]

  it('steps a pie through its drawn slices and announces each one', () => {
    const { container } = render(<PieChart data={slices} />)
    const chart = screen.getByRole('application')
    const live = container.querySelector('[aria-live="polite"]')!
    expect(chart).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(chart, { key: 'ArrowDown' })
    expect(live.textContent).toMatch(/^Done/)
    // The empty slice has no arc, so the next step skips it.
    fireEvent.keyDown(chart, { key: 'ArrowDown' })
    expect(live.textContent).toMatch(/^Open/)
    fireEvent.keyDown(chart, { key: 'Escape' })
    expect(live.textContent).toBe('')
  })

  it('offers a pie as a table of values and shares', () => {
    render(<PieChart data={slices} showTableToggle />)
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('Done')
    expect(screen.getByRole('rowheader', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '3',
      '75',
      '1',
      '25',
    ])
  })

  it('draws a one-reading sparkline as a level line rather than nothing', () => {
    const { container } = render(<Sparkline data={[5]} />)
    const d = container.querySelector('.sui-chart__line')?.getAttribute('d') ?? ''
    expect(d).toMatch(/^M1,[\d.]+ L99,[\d.]+$/)
  })
})

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
  it('renders both chart sets with no window or document', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)
    try {
      const html = renderToString(
        <div>
          <LineChart data={[{ m: 'a', v: 1 }]} xKey="m" series={[{ key: 'v' }]} />
          <PieChart data={[{ key: 'x', value: 1 }]} />
          <Sparkline data={[1, 2]} />
          <TrendChart title="SSR" data={[{ m: 'a', v: 1 }]} xKey="m" series={[{ key: 'v' }]} />
          <GaugeChart value={50} />
        </div>,
      )
      // The SVG set draws at the fallback width on the server, never empty.
      expect(html).toContain('aria-label="Line chart of v, 1 point at a."')
      expect(html).toContain('sui-viz')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('the root entry never reaches recharts', () => {
  const src = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/react/src')
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
    expect(externalImports(join(src, 'recharts.ts')).has('recharts')).toBe(true)
  })
})

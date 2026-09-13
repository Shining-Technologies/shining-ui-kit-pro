/**
 * Chart regressions found while writing `docs/charts.md`: the legend default,
 * scatter labels and per-axis formatters in tooltips and tables, the gauge's
 * table view, donut colour by key and share in the tooltip, table row keys,
 * the chart surface fallback and a fixed formatting locale.
 *
 * Tooltips only render while Recharts has a hovered item, and Recharts draws
 * nothing in a DOM with no layout, so this file reports a real box the way
 * `charts-recharts-render.test.tsx` does.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import {
  BarChart,
  CHART_SURFACE,
  ChartTooltipContent,
  DEFAULT_CHART_LOCALE,
  DonutChart,
  GaugeChart,
  ScatterChart,
  Sparkline,
  TrendChart,
  formatFull,
  type ChartDatum,
} from '@shining-technologies/ui/charts'

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

afterEach(() => vi.restoreAllMocks())

const months: ChartDatum[] = [
  { month: 'Jan', booked: 1200, completed: 960 },
  { month: 'Feb', booked: 1480, completed: 1310 },
]
const two = [
  { key: 'booked', label: 'Booked' },
  { key: 'completed', label: 'Completed' },
]
const quotes: ChartDatum[] = [
  { client: 'Acme', days: 4, value: 2400, channel: 'Web' },
  { client: 'Borden', days: 11, value: 5200, channel: 'Referral' },
]

/** Text of every value cell in body row `index` (0-based) of the only table. */
const rowValues = (index: number) => {
  const body = within(screen.getByRole('table')).getAllByRole('rowgroup')[1]!
  return within(body).getAllByRole('row')[index]!.querySelectorAll('td')
}

const texts = (nodes: NodeListOf<Element>) => [...nodes].map((node) => node.textContent)

// ------------------------------------------------------------------ legend
describe('legend default', () => {
  it('shows no legend for a single series on any chart', () => {
    const { container } = render(
      <div>
        <TrendChart data={months} xKey="month" series={[two[0]!]} />
        <BarChart data={months} xKey="month" series={[two[0]!]} />
        <DonutChart data={[{ key: 'a', value: 1 }]} />
        <ScatterChart data={quotes.slice(0, 1)} xKey="days" yKey="value" groupKey="channel" />
      </div>,
    )
    expect(container.querySelectorAll('.sui-viz__legend')).toHaveLength(0)
  })

  it('shows toggle buttons from two series up', () => {
    render(<TrendChart data={months} xKey="month" series={two} />)
    expect(screen.getByRole('button', { name: 'Booked' })).toHaveAttribute('aria-pressed', 'true')
  })

  it("still honours 'interactive' for one series and 'always' as a plain list", () => {
    const { container, rerender } = render(
      <TrendChart data={months} xKey="month" series={[two[0]!]} legend="interactive" />,
    )
    expect(screen.getByRole('button', { name: 'Booked' })).toBeInTheDocument()
    rerender(<TrendChart data={months} xKey="month" series={two} legend="always" />)
    expect(container.querySelector('.sui-viz__legend button')).toBeNull()
  })
})

// --------------------------------------------------------------- tooltips
describe('tooltip content', () => {
  it('reads its heading from the hovered datum when given labelKey', () => {
    render(
      <ChartTooltipContent
        active
        labelKey="client"
        payload={[{ name: 'days', dataKey: 'days', value: 4, payload: { client: 'Acme', days: 4 } }]}
      />,
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('Acme')
  })

  it('formats each row with its own formatter, then the shared one', () => {
    render(
      <ChartTooltipContent
        active
        valueFormatter={(v) => `~${v}`}
        valueFormatters={{ days: (v) => `${v} d` }}
        payload={[
          { name: 'days', dataKey: 'days', value: 4 },
          { name: 'value', dataKey: 'value', value: 2400 },
        ]}
      />,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('4 d')
    expect(tooltip).toHaveTextContent('~2400')
  })

  it('names the hovered scatter point by labelKey and formats its axes', () => {
    const { container } = render(
      <ScatterChart
        data={quotes}
        xKey="days"
        yKey="value"
        labelKey="client"
        xFormatter={(v) => `${v} days`}
        yFormatter={(v) => `$${v}`}
      />,
    )
    const symbols = container.querySelectorAll('.recharts-scatter-symbol')
    expect(symbols.length).toBe(2)
    fireEvent.mouseEnter(symbols[1]!)
    const tooltip = container.querySelector('.sui-viz__tooltip')
    expect(tooltip).toHaveTextContent('Borden')
    expect(tooltip).toHaveTextContent('11 days')
    expect(tooltip).toHaveTextContent('$5200')
  })

  it("shows a donut slice's share of the total, and the total", () => {
    const { container } = render(
      <DonutChart
        data={[
          { key: 'done', label: 'Done', value: 3 },
          { key: 'open', label: 'Open', value: 1 },
        ]}
      />,
    )
    fireEvent.mouseEnter(container.querySelectorAll('.recharts-pie-sector')[0]!)
    const tooltip = container.querySelector('.sui-viz__tooltip')
    expect(tooltip).toHaveTextContent('3 (75%)')
    expect(tooltip).toHaveTextContent('of 4 total')
  })
})

// ------------------------------------------------------------- table view
describe('the table view uses the chart formatter', () => {
  it('on TrendChart and BarChart', () => {
    const { unmount } = render(
      <TrendChart data={months} xKey="month" series={two} valueFormatter={(v) => `$${v}`} />,
    )
    expect(texts(rowValues(0))).toEqual(['$1200', '$960'])
    unmount()
    render(<BarChart data={months} xKey="month" series={two} valueFormatter={(v) => `${v} jobs`} />)
    expect(texts(rowValues(1))).toEqual(['1480 jobs', '1310 jobs'])
  })

  it('per axis on ScatterChart', () => {
    render(
      <ScatterChart
        data={quotes}
        xKey="days"
        yKey="value"
        xFormatter={(v) => `${v} days`}
        yFormatter={(v) => `$${v}`}
      />,
    )
    expect(texts(rowValues(0))).toEqual(['4 days', '$2400'])
  })

  it('on DonutChart and GaugeChart', () => {
    const { unmount } = render(
      <DonutChart data={[{ key: 'a', label: 'A', value: 1200 }]} valueFormatter={(v) => `${v} h`} />,
    )
    expect(texts(rowValues(0))).toEqual(['1200 h'])
    unmount()
    render(<GaugeChart value={50} target={80} showTableToggle valueFormatter={(v) => `${v} ms`} />)
    expect(texts(rowValues(1))).toEqual(['80 ms'])
  })

  it('keeps full precision when no formatter is given', () => {
    render(<TrendChart data={months} xKey="month" series={two} />)
    expect(texts(rowValues(0))).toEqual(['1,200', '960'])
  })
})

describe('GaugeChart table view', () => {
  it('is off by default', () => {
    render(<GaugeChart title="SLA" value={94.2} />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Show data' })).toBeNull()
  })

  it('lists the value and the target when switched on', async () => {
    const { container } = render(<GaugeChart title="SLA" value={94.2} target={100} showTableToggle />)
    expect(screen.getByRole('button', { name: 'Show data' })).toBeInTheDocument()
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows.map((row) => row.textContent)).toEqual(['MeasureValue', 'Current94.2', 'Target100'])
    expect((await axe(container)).violations).toEqual([])
  })
})

describe('GaugeChart accessibility', () => {
  it('has no axe violations with the ring drawn', async () => {
    const { container } = render(
      <div>
        <GaugeChart title="SLA" value={94.2} target={100} />
        <GaugeChart value={40} thresholds={{ good: 0.9, warning: 0.6 }} />
      </div>,
    )
    // The ring really is drawn, so the check is not passing on an empty svg.
    expect(container.querySelectorAll('.recharts-radial-bar-sector').length).toBeGreaterThan(0)
    expect((await axe(container)).violations).toEqual([])
  })

  it('keeps the decorative ring out of the accessibility tree and the tab order', () => {
    const { container } = render(<GaugeChart title="SLA" value={94.2} target={100} />)
    const sector = container.querySelector('.recharts-radial-bar-sector')!
    expect(sector.closest('[aria-hidden="true"]')).not.toBeNull()
    // Nothing in the tab order. Recharts 3 puts `tabindex="-1"` on its z-index
    // layers, which is focusable only by script and allowed under aria-hidden.
    expect(
      sector
        .closest('[aria-hidden="true"]')!
        .querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex^="-"])'),
    ).toBeNull()
    expect(screen.getByRole('img', { name: '94.2 of 100' })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'SLA' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------- colours
describe('DonutChart colours', () => {
  const swatches = (container: HTMLElement) =>
    Object.fromEntries(
      [...container.querySelectorAll('.sui-viz__legend-item')].map((item) => [
        item.textContent,
        item.querySelector('.sui-viz__swatch')!.getAttribute('style'),
      ]),
    )

  it('follow the slice key, not its position', () => {
    const slices = [
      { key: 'done', label: 'Done', value: 5 },
      { key: 'active', label: 'Active', value: 3 },
      { key: 'cancelled', label: 'Cancelled', value: 1 },
    ]
    const first = render(<DonutChart data={slices} />)
    const before = swatches(first.container)
    first.unmount()
    const second = render(<DonutChart data={[...slices].reverse()} />)
    expect(swatches(second.container)).toEqual(before)
    // Slots go to the keys in sorted order: `active` takes the first.
    expect(before.Active).toContain('var(--chart-1)')
  })
})

// --------------------------------------------------------------- row keys
describe('table rows', () => {
  it('render repeated labels without duplicate React keys', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ScatterChart
        data={[
          { client: 'Acme', days: 4, value: 2400 },
          { client: 'Acme', days: 9, value: 3100 },
        ]}
        xKey="days"
        yKey="value"
        labelKey="client"
      />,
    )
    expect(within(screen.getByRole('table')).getAllByRole('rowheader')).toHaveLength(2)
    const messages = error.mock.calls.map((call) => call.map(String).join(' '))
    expect(messages.filter((message) => message.includes('same key'))).toEqual([])
  })
})

// ---------------------------------------------------------- chart surface
describe('chart surface', () => {
  it('is not declared on .sui-viz, so an ancestor value wins', () => {
    const css = readFileSync(resolve(__dirname, '../src/styles/charts-recharts.css'), 'utf8')
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/--sui-chart-surface\s*:/)
  })

  it('falls back to the card inside the var(), where every mark reads it', () => {
    expect(CHART_SURFACE).toBe('var(--sui-chart-surface, var(--card))')
  })

  it('resolves on a standalone Sparkline', () => {
    const { container } = render(<Sparkline data={[3, 7, 5, 12]} />)
    expect(container.querySelector('circle')).toHaveAttribute('stroke', CHART_SURFACE)
  })
})

// ----------------------------------------------------------------- locale
describe('formatting locale', () => {
  it("defaults to 'en-US', not the runtime's locale", () => {
    expect(DEFAULT_CHART_LOCALE).toBe('en-US')
    const toLocaleString = vi.spyOn(Number.prototype, 'toLocaleString')
    render(<TrendChart data={months} xKey="month" series={two} />)
    expect(toLocaleString).toHaveBeenCalled()
    for (const call of toLocaleString.mock.calls) expect(call[0]).toBe('en-US')
  })

  it('takes a locale prop for the tooltip and table', () => {
    expect(formatFull(1234.5, 'de-DE')).toBe('1.234,5')
    render(<TrendChart data={months} xKey="month" series={two} locale="de-DE" />)
    expect(texts(rowValues(0))).toEqual(['1.200', '960'])
  })
})

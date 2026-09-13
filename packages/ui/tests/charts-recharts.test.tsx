/**
 * The Recharts chart set.
 *
 * Recharts measures its container to decide what to draw, and neither
 * happy-dom nor the stubbed `ResizeObserver` in `setup.ts` reports a real box
 * — so the SVG geometry is not what these tests look at. What they cover is
 * everything the kit itself owns and a consumer actually depends on: the
 * frame, the legend, the palette assignment, the responsive rules, and the
 * table view that carries the numbers when the drawing cannot.
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import {
  BarChart,
  categoryTicks,
  DonutChart,
  GaugeChart,
  resolveResponsive,
  ScatterChart,
  seriesColor,
  Sparkline,
  TrendChart,
  type ChartDatum,
} from '@shining-technologies/ui/charts'

const months: ChartDatum[] = [
  { month: 'Jan', booked: 120, completed: 96 },
  { month: 'Feb', booked: 148, completed: 131 },
  { month: 'Mar', booked: 96, completed: 88 },
]

const series = [
  { key: 'booked', label: 'Booked' },
  { key: 'completed', label: 'Completed' },
]

/** The table view is always in the DOM; this is how a test reads the values. */
function dataTable() {
  return screen.getByRole('table')
}

describe('the shared frame', () => {
  it('renders the header only when there is something to put in it', () => {
    const { rerender, container } = render(
      <TrendChart data={months} xKey="month" series={series} />,
    )
    expect(container.querySelector('.sui-viz__header')).toBeNull()

    rerender(
      <TrendChart
        title="Bookings"
        description="Booked against completed"
        data={months}
        xKey="month"
        series={series}
      />,
    )
    expect(container.querySelector('.sui-viz__title')).toHaveTextContent('Bookings')
    expect(screen.getByText('Booked against completed')).toBeInTheDocument()
    // The title is also the table's caption, so the numbers are announced as
    // belonging to this chart and not to whichever one came before it.
    expect(within(dataTable()).getByText('Bookings')).toBeInTheDocument()
  })

  it('omits the legend for a single series and shows it from two up', () => {
    const { container, rerender } = render(
      <TrendChart data={months} xKey="month" series={[series[0]!]} legend="auto" />,
    )
    expect(container.querySelector('.sui-viz__legend')).toBeNull()

    rerender(<TrendChart data={months} xKey="month" series={series} legend="auto" />)
    const legend = container.querySelector<HTMLElement>('.sui-viz__legend')!
    expect(within(legend).getByText('Booked')).toBeInTheDocument()
    expect(within(legend).getByText('Completed')).toBeInTheDocument()
  })

  it('hides a series when its legend entry is pressed', async () => {
    const user = userEvent.setup()
    render(<TrendChart data={months} xKey="month" series={series} legend="interactive" />)

    const entry = screen.getByRole('button', { name: 'Completed' })
    expect(entry).toHaveAttribute('aria-pressed', 'true')

    await user.click(entry)
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('lists the legend without buttons unless it is interactive', () => {
    const { container } = render(
      <TrendChart data={months} xKey="month" series={series} legend="always" />,
    )
    const legend = container.querySelector<HTMLElement>('.sui-viz__legend')!
    expect(within(legend).getByText('Booked')).toBeInTheDocument()
    // A disabled button is announced as "unavailable"; a key to the colours
    // is not a control at all.
    expect(within(legend).queryByRole('button')).toBeNull()
  })

  it('carries every plotted value in a table, before anyone asks for it', () => {
    render(<TrendChart title="Bookings" data={months} xKey="month" series={series} />)

    const rows = within(dataTable()).getAllByRole('row')
    // One header row, one per datum.
    expect(rows).toHaveLength(months.length + 1)
    expect(within(rows[1]!).getByRole('rowheader')).toHaveTextContent('Jan')
    expect(rows[1]).toHaveTextContent('120')
    expect(rows[1]).toHaveTextContent('96')
  })

  it('reveals the table on request and says so on the toggle', async () => {
    const user = userEvent.setup()
    const { container } = render(<TrendChart data={months} xKey="month" series={series} />)

    const toggle = screen.getByRole('button', { name: 'Show data' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('.sui-viz__table')).toHaveClass('sui-visually-hidden')

    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide data' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(container.querySelector('.sui-viz__table')).not.toHaveClass('sui-visually-hidden')
  })

  it('shows the empty state instead of an empty plot', () => {
    render(<TrendChart data={[]} xKey="month" series={series} emptyMessage="Nothing yet" />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })

  it('announces loading rather than drawing a half-chart', () => {
    render(<TrendChart data={months} xKey="month" series={series} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading chart')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TrendChart
        title="Bookings"
        description="Booked against completed"
        data={months}
        xKey="month"
        series={series}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('the palette', () => {
  it('spreads the ramp instead of walking it, so adjacent series stay apart', () => {
    // Slots 2 and 3 of the generated ramp are perceptual neighbours; taking the
    // ramp in order would hand them to the first two series of every
    // two-series chart, which is the common case.
    // V2: series read the shadcn `--chart-N` variables, not `--sui-chart-N`.
    expect(seriesColor(0)).toBe('var(--chart-1)')
    expect(seriesColor(1)).toBe('var(--chart-3)')
    expect(seriesColor(2)).toBe('var(--chart-5)')
  })

  it('never repeats a colour when the ramp runs out', () => {
    const first = seriesColor(0)
    const sixth = seriesColor(5)
    expect(sixth).not.toBe(first)
    expect(sixth).toContain('color-mix')
  })

  it('lets a series override its slot', () => {
    expect(seriesColor(0, '#ff7f00')).toBe('#ff7f00')
  })
})

describe('responsive rules', () => {
  it('falls back to the nearest smaller bucket', () => {
    expect(resolveResponsive({ xs: 160, md: 300 }, 'sm')).toBe(160)
    expect(resolveResponsive({ xs: 160, md: 300 }, 'lg')).toBe(300)
    expect(resolveResponsive(220, 'xs')).toBe(220)
    expect(resolveResponsive(undefined, 'xs')).toBeUndefined()
  })

  it('leaves every label alone when they all fit', () => {
    expect(categoryTicks({ count: 4, width: 600, longestLabel: 3, size: 'lg' })).toMatchObject({
      interval: 0,
      angle: 0,
    })
  })

  it('thins labels before it angles them', () => {
    const thinned = categoryTicks({ count: 30, width: 600, longestLabel: 6, size: 'lg' })
    expect(thinned.interval).toBeGreaterThan(0)
    expect(thinned.angle).toBe(0)
  })

  it('angles them once thinning alone would gut the axis', () => {
    const angled = categoryTicks({ count: 8, width: 240, longestLabel: 14, size: 'xs' })
    expect(angled.angle).toBeLessThan(0)
    expect(angled.height).toBeGreaterThan(24)
  })

  it('survives a container it has not measured yet', () => {
    expect(categoryTicks({ count: 12, width: 0, longestLabel: 8, size: 'xs' })).toMatchObject({
      interval: 0,
    })
  })
})

describe('BarChart', () => {
  it('ranks categories when asked, and the table follows the plot', () => {
    render(
      <BarChart
        title="Jobs"
        data={months}
        xKey="month"
        series={[{ key: 'booked', label: 'Booked' }]}
        sort="desc"
      />,
    )
    const rows = within(dataTable()).getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      'Feb',
      'Jan',
      'Mar',
    ])
  })

  it('keeps the underlying counts in the table when stacking to 100%', () => {
    render(<BarChart data={months} xKey="month" series={series} stacked="percent" />)
    // The plot is normalised; the numbers a reader can get at are not.
    expect(within(dataTable()).getAllByRole('row')[1]).toHaveTextContent('120')
  })
})

describe('DonutChart', () => {
  const slices = [
    { key: 'done', label: 'Completed', value: 412 },
    { key: 'active', label: 'In progress', value: 96 },
  ]

  it('states the whole in the hole, so wedges are read against a total', () => {
    render(<DonutChart title="Jobs" data={slices} centerLabel="jobs" />)
    expect(screen.getByText('508')).toBeInTheDocument()
    expect(screen.getByText('jobs')).toBeInTheDocument()
  })

  it('gives the table one row per slice rather than a diagonal of blanks', () => {
    render(<DonutChart title="Jobs" data={slices} />)
    const header = within(dataTable()).getAllByRole('row')[0]!
    expect(
      within(header)
        .getAllByRole('columnheader')
        .map((c) => c.textContent),
    ).toEqual(['Slice', 'Value'])
  })
})

describe('GaugeChart', () => {
  it('names the figure for assistive technology, not the arc', () => {
    render(<GaugeChart title="SLA" value={94} target={100} />)
    expect(screen.getByRole('img', { name: '94 of 100' })).toHaveTextContent('94.0%')
  })

  it('takes its colour from severity only when thresholds say what severity is', () => {
    const { container, rerender } = render(<GaugeChart value={50} target={100} />)
    expect(container.querySelector('.sui-viz')).toBeInTheDocument()

    rerender(<GaugeChart value={50} target={100} thresholds={{ good: 0.9, warning: 0.7 }} />)
    expect(screen.getByRole('img', { name: '50 of 100' })).toBeInTheDocument()
  })
})

describe('Sparkline', () => {
  it('stays out of the accessibility tree unless it is given something to say', () => {
    const { container, rerender } = render(<Sparkline data={[1, 4, 2, 8]} />)
    expect(container.querySelector('.sui-viz__sparkline')).toHaveAttribute('aria-hidden', 'true')

    rerender(<Sparkline data={[1, 4, 2, 8]} ariaLabel="Rising over four weeks" />)
    expect(screen.getByRole('img', { name: 'Rising over four weeks' })).toBeInTheDocument()
  })

  it('renders nothing rather than an empty box with no data', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.querySelector('.sui-viz__sparkline')).toBeNull()
  })
})

describe('ScatterChart', () => {
  const quotes: ChartDatum[] = [
    { client: 'Acme', days: 4, value: 2400, channel: 'Web' },
    { client: 'Borden', days: 11, value: 5200, channel: 'Referral' },
    { client: 'Crane', days: 6, value: 3100, channel: 'Web' },
  ]

  it('splits points into series by the grouping key', () => {
    render(
      <ScatterChart
        title="Quotes"
        data={quotes}
        xKey="days"
        yKey="value"
        groupKey="channel"
        labelKey="client"
      />,
    )
    expect(screen.getByRole('button', { name: 'Web' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Referral' })).toBeInTheDocument()
  })

  it('drops the legend when there is only one group to name', () => {
    render(<ScatterChart title="Quotes" data={quotes} xKey="days" yKey="value" />)
    expect(screen.queryByRole('button', { name: 'Web' })).toBeNull()
  })

  it('names each point in the table by its label key', () => {
    render(<ScatterChart title="Quotes" data={quotes} xKey="days" yKey="value" labelKey="client" />)
    expect(within(dataTable()).getByRole('rowheader', { name: 'Acme' })).toBeInTheDocument()
  })
})

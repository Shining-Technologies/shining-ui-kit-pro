/*
 * DateRangeField: one trigger, a calendar (one month, or two) that picks a start
 * and an end, presets beside it, and only complete ranges reported.
 */
import {
  Calendar,
  DateRangeField,
  Field,
  countDays,
  formatDateRange,
  type DateRange,
} from '@shining-technologies/ui'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

// Intl writes a span with thin spaces round the dash.
const T = ' – '
const day = (label: RegExp | string) => screen.getByRole('button', { name: label })

function Controlled({
  initial,
  onChange,
  ...props
}: {
  initial?: DateRange
  onChange?: (value: DateRange | undefined) => void
  min?: string
  max?: string
}) {
  const [value, setValue] = useState(initial)
  return (
    <DateRangeField
      label="Stay"
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      presets={[]}
      {...props}
    />
  )
}

describe('date range helpers', () => {
  it('formats a range the way the locale writes a span', () => {
    expect(formatDateRange({ from: '2026-09-03', to: '2026-09-12' })).toBe(`Sep 3${T}12, 2026`)
    expect(formatDateRange({ from: '2026-09-28', to: '2026-10-02' })).toBe(`Sep 28${T}Oct 2, 2026`)
    expect(formatDateRange({ from: '2026-09-03', to: 'nope' })).toBeNull()
    expect(formatDateRange(undefined)).toBeNull()
  })

  it('counts calendar days, both ends included, across a daylight-saving change', () => {
    expect(countDays({ from: '2026-09-03', to: '2026-09-03' })).toBe(1)
    expect(countDays({ from: '2026-03-01', to: '2026-03-31' })).toBe(31)
    expect(countDays({ from: '2026-10-01', to: '2026-10-31' })).toBe(31)
  })
})

describe('DateRangeField', () => {
  it('picks a start, then an end, and reports only the complete range', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={{ from: '2026-09-01', to: '2026-09-02' }} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: `Stay: Sep 1${T}2, 2026` }))
    // One month by default, with the previous and next buttons.
    expect(screen.getAllByRole('grid')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument()

    await user.click(day('Thursday, September 10, 2026'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Now pick the last day')).toBeInTheDocument()

    await user.click(day('Monday, October 5, 2026'))
    expect(onChange).toHaveBeenCalledWith({ from: '2026-09-10', to: '2026-10-05' })
    // A complete range closes the panel.
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.getByRole('button', { name: `Stay: Sep 10${T}Oct 5, 2026` })).toBeInTheDocument()
  })

  it('accepts the two ends in either order', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={{ from: '2026-09-01', to: '2026-09-02' }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /^Stay:/ }))
    await user.click(day('Friday, September 18, 2026'))
    await user.click(day('Saturday, September 5, 2026'))
    expect(onChange).toHaveBeenCalledWith({ from: '2026-09-05', to: '2026-09-18' })
  })

  it('previews the span under the pointer and marks the committed range as selected', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={{ from: '2026-09-03', to: '2026-09-06' }} />)
    await user.click(screen.getByRole('button', { name: /^Stay:/ }))

    const cell = (label: string) => day(label).closest('[role="gridcell"]')!
    expect(cell('Thursday, September 3, 2026')).toHaveAttribute('aria-selected', 'true')
    expect(cell('Friday, September 4, 2026')).toHaveAttribute('data-in-range')
    expect(cell('Sunday, September 6, 2026')).toHaveAttribute('data-range-end')

    await user.click(day('Monday, September 14, 2026'))
    await user.hover(day('Thursday, September 17, 2026'))
    expect(cell('Tuesday, September 15, 2026')).toHaveAttribute('data-in-range')
    // Previewed, not chosen.
    expect(cell('Tuesday, September 15, 2026')).toHaveAttribute('aria-selected', 'false')
    expect(day('Thursday, September 17, 2026')).toHaveAttribute('data-preview-end')
  })

  it('leaves the value alone when the panel closes half-picked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={{ from: '2026-09-01', to: '2026-09-02' }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /^Stay:/ }))
    await user.click(day('Thursday, September 10, 2026'))
    await user.keyboard('{Escape}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: `Stay: Sep 1${T}2, 2026` })).toBeInTheDocument()
  })

  it('applies a preset in one click, and disables one that reaches past min', async () => {
    const user = userEvent.setup()
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 19, 12) })
    try {
      const onChange = vi.fn()
      render(
        <DateRangeField label="Period" value={undefined} onChange={onChange} min="2026-09-01" />,
      )
      await user.click(screen.getByRole('button', { name: 'Period' }))
      const presets = within(screen.getByRole('group', { name: 'Presets' }))
      expect(presets.getByRole('button', { name: 'Last 30 days' })).toBeDisabled()
      await user.click(presets.getByRole('button', { name: 'Last 7 days' }))
      expect(onChange).toHaveBeenCalledWith({ from: '2026-09-13', to: '2026-09-19' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears from the trigger and submits an ISO 8601 interval', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <form>
        <Controlled initial={{ from: '2026-09-03', to: '2026-09-12' }} />
      </form>,
    )
    const hidden = () => container.querySelector('input[type="hidden"]') as HTMLInputElement | null
    // `Controlled` passes no name; render one that does.
    expect(hidden()).toBeNull()

    const named = render(
      <DateRangeField
        label="Trip"
        name="trip"
        value={{ from: '2026-09-03', to: '2026-09-12' }}
        onChange={() => {}}
      />,
    )
    expect(named.container.querySelector('input[name="trip"]')).toHaveValue('2026-09-03/2026-09-12')

    await user.click(screen.getByRole('button', { name: 'Clear Stay' }))
    expect(screen.getByRole('button', { name: 'Stay' })).toHaveTextContent('Pick a date range')
  })

  it('takes its name from a surrounding Field and has no axe violations', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Field label="Booking" description="Check-in to check-out.">
        <DateRangeField value={{ from: '2026-09-03', to: '2026-09-12' }} onChange={() => {}} />
      </Field>,
    )
    expect(screen.getByRole('button', { name: `Booking Sep 3${T}12, 2026` })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('button', { name: /^Booking/ }))
    expect(screen.getAllByRole('grid', { name: /Booking/ })).toHaveLength(1)
  })

  it('shows two months side by side when asked', async () => {
    const user = userEvent.setup()
    render(
      <DateRangeField
        label="Stay"
        months={2}
        value={{ from: '2026-09-03', to: '2026-09-12' }}
        onChange={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: /^Stay:/ }))
    expect(screen.getAllByRole('grid')).toHaveLength(2)
  })

  it('renders on the server', () => {
    const html = renderToString(
      <DateRangeField
        label="Stay"
        value={{ from: '2026-09-03', to: '2026-09-12' }}
        onChange={() => {}}
      />,
    )
    expect(html).toContain(`Sep 3${T}12, 2026`)
  })
})

describe('Calendar with two months', () => {
  it('walks from one month into the next with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Calendar value="2026-09-30" months={2} onChange={() => {}} />)
    const grids = screen.getAllByRole('grid')
    expect(grids).toHaveLength(2)
    // Days of a neighbouring month are left blank, never shown twice.
    expect(screen.getAllByRole('button', { name: 'Thursday, October 1, 2026' })).toHaveLength(1)

    day('Wednesday, September 30, 2026').focus()
    await user.keyboard('{ArrowRight}')
    await vi.waitFor(() => expect(day('Thursday, October 1, 2026')).toHaveFocus())
    expect(screen.getAllByRole('grid')).toHaveLength(2)
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })
})

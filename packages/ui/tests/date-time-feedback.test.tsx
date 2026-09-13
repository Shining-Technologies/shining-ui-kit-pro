/*
 * Regression tests for the date-time and feedback release audit: one block per
 * defect, numbered as in the audit.
 */
import {
  Calendar,
  Clock,
  DateField,
  DateTimeField,
  Field,
  Progress,
  SegmentedBar,
  StatusDot,
  TimeField,
  formatTime,
} from '@shining-technologies/ui'
import * as dateTimeFamily from '@shining-technologies/ui/date-time'
import * as feedbackFamily from '@shining-technologies/ui/feedback'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as dateUtils from '../src/components/date-time/date-utils'
import * as progressVariantsModule from '../src/components/feedback/progress-variants'

const SRC = resolve(__dirname, '../src')
const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/
const read = (path: string) => readFileSync(join(SRC, path), 'utf8')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/* ------------------------------------------- 1. helpers are server-safe */

describe('1. pure helpers are exported from server-safe modules', () => {
  const HELPERS = [
    'toIso',
    'fromIso',
    'DATE_RANGE_PRESETS',
    'fromTime',
    'toTime',
    'formatTime',
    'splitDateTime',
    'joinDateTime',
  ]

  it("keeps 'use client' off the helper modules", () => {
    for (const file of [
      'components/date-time/date-utils.ts',
      'components/date-time/internal.ts',
      'components/feedback/progress-variants.ts',
    ]) {
      expect(DIRECTIVE.test(read(file)), file).toBe(false)
    }
  })

  it('exports each helper from those modules, under the same names', () => {
    const family = dateTimeFamily as Record<string, unknown>
    const utils = dateUtils as Record<string, unknown>
    for (const name of HELPERS) {
      expect(family[name], name).toBeDefined()
      expect(family[name], name).toBe(utils[name])
    }
    expect(feedbackFamily.progressVariants).toBe(progressVariantsModule.progressVariants)
  })

  it('re-exports only components and hooks from client modules in the barrels', async () => {
    // A component (PascalCase) or a hook is fine from a client module; a plain
    // function or a constant is not, because a Server Component cannot call it.
    const allowed = (name: string) => /^(?:[A-Z][a-z]\w*|use[A-Z]\w*)$/.test(name) && !HELPERS.includes(name)
    const offenders: string[] = []
    for (const family of ['date-time', 'feedback']) {
      const barrel = read(`components/${family}/index.ts`)
      for (const match of barrel.matchAll(/export\s+(\*|\{([^}]*)\})\s*from\s*['"]\.\/([\w-]+)['"]/g)) {
        const base = `components/${family}/${match[3]}`
        const file = existsSync(join(SRC, `${base}.ts`)) ? `${base}.ts` : `${base}.tsx`
        if (!DIRECTIVE.test(read(file))) continue
        const names =
          match[1] === '*'
            ? Object.keys(await import(/* @vite-ignore */ join(SRC, file)))
            : match[2]!
                .split(',')
                .map((raw) => raw.trim())
                .filter((name) => name && !name.startsWith('type '))
        for (const name of names) {
          if (!allowed(name)) offenders.push(`${family}: ${name} from ${match[3]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

/* ------------------------------------------ 2. deterministic formatting */

/** A runtime whose default locale is `locale`, for every `Intl.DateTimeFormat` not told one. */
function runtimeLocale(locale: string) {
  const real = Intl
  // A `function`, not an arrow: the components call it with `new`.
  const DateTimeFormat = Object.assign(
    function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
      return new real.DateTimeFormat(locales ?? locale, options)
    },
    real.DateTimeFormat,
  )
  vi.stubGlobal('Intl', Object.create(real, { DateTimeFormat: { value: DateTimeFormat } }))
  // Guard: the stub really changes the default.
  expect(new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2026, 2, 1))).toBe(
    new real.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, 2, 1)),
  )
}

describe('2. date and time formatting defaults to en-US', () => {
  it('ignores the runtime default locale', () => {
    runtimeLocale('de-DE')
    expect(formatTime('17:05')).toMatch(/^5:05\sPM$/)
    render(
      <>
        <DateField value="2026-03-12" onChange={() => {}} label="Start" />
        <TimeField value="17:05" onChange={() => {}} label="Arrival" />
        <DateTimeField value="2026-03-12T17:05" onChange={() => {}} label="Slot" />
        <Calendar value="2026-03-12" onChange={() => {}} />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Start: Mar 12, 2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Arrival: 5:05\sPM$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Slot: Mar 12, 2026, 5:05\sPM$/ })).toBeInTheDocument()
    expect(screen.getByText('March 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thursday, March 12, 2026' })).toBeInTheDocument()
  })

  it('renders the same server HTML under different runtime locales', () => {
    // Radix's popper warns about useLayoutEffect under renderToString; not under test here.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ui = (
      <>
        <Calendar value="2026-03-12" onChange={() => {}} />
        <DateTimeField value="2026-03-12T17:05" onChange={() => {}} label="Slot" />
      </>
    )
    runtimeLocale('de-DE')
    const german = renderToString(ui)
    vi.unstubAllGlobals()
    runtimeLocale('ja-JP')
    const japanese = renderToString(ui)
    expect(german).toBe(japanese)
    expect(german).toContain('March 2026')
  })

  it('still honours an explicit locale', () => {
    render(
      <>
        <DateField value="2026-03-12" onChange={() => {}} label="Start" locale="de-DE" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Start: 12.03.2026' })).toBeInTheDocument()
  })
})

/* --------------------------------------------------- 3. minuteStep */

function StepClock({ initial, step }: { initial: string; step?: number }) {
  const [value, setValue] = useState(initial)
  return <Clock value={value} onChange={setValue} minuteStep={step} />
}

describe('3. minuteStep on the clock', () => {
  it('snaps the arrow keys to the step', () => {
    render(
      <>
        <StepClock initial="09:07" step={15} />
      </>,
    )
    const minute = screen.getByRole('spinbutton', { name: 'Minute' })
    const hour = screen.getByRole('spinbutton', { name: 'Hour' })
    fireEvent.keyDown(minute, { key: 'ArrowUp' })
    expect(minute).toHaveTextContent('15')
    fireEvent.keyDown(minute, { key: 'ArrowDown' })
    fireEvent.keyDown(minute, { key: 'ArrowDown' })
    expect(minute).toHaveTextContent('45')
    expect(hour).toHaveTextContent('08')
  })

  it('snaps down from a minute between steps', () => {
    render(
      <>
        <StepClock initial="09:07" step={15} />
      </>,
    )
    const minute = screen.getByRole('spinbutton', { name: 'Minute' })
    fireEvent.keyDown(minute, { key: 'ArrowDown' })
    expect(minute).toHaveTextContent('00')
  })

  it.each([
    [1, ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']],
    [2, ['00', '10', '20', '30', '40', '50']],
    [15, ['00', '15', '30', '45']],
    [0, ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']],
  ])('offers only minutes on a step of %s on the dial', async (step, expected) => {
    const user = userEvent.setup()
    render(
      <>
        <StepClock initial="09:00" step={step} />
      </>,
    )
    await user.click(screen.getByRole('spinbutton', { name: 'Minute' }))
    const dial = screen.getByRole('group', { name: 'Choose a time' })
    expect(within(dial).getAllByRole('button').map((mark) => mark.textContent)).toEqual(expected)
  })
})

/* ---------------------------------------------- 4. DateTimeField range */

describe('4. DateTimeField keeps typed times and Now inside min/max', () => {
  it('puts a time typed before any day on the nearest allowed day', async () => {
    const user = userEvent.setup()
    const early = vi.fn()
    const { unmount } = render(
      <>
        <DateTimeField value={undefined} onChange={early} label="Visit" min="2099-01-01" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Visit' }))
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: 'ArrowUp' })
    expect(early).toHaveBeenLastCalledWith('2099-01-01T10:00')
    unmount()

    const late = vi.fn()
    render(
      <>
        <DateTimeField value={undefined} onChange={late} label="Visit" max="2000-01-01" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Visit' }))
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: 'ArrowUp' })
    expect(late).toHaveBeenLastCalledWith('2000-01-01T10:00')
  })

  it('uses today when today is allowed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <>
        <DateTimeField value={undefined} onChange={onChange} label="Visit" min="2000-01-01" max="2099-12-31" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Visit' }))
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Hour' }), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(`${dateUtils.toIso(new Date())}T10:00`)
  })

  it('disables Now while today is outside the range', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { unmount } = render(
      <>
        <DateTimeField value={undefined} onChange={onChange} label="Visit" min="2099-01-01" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Visit' }))
    const now = screen.getByRole('button', { name: 'Now' })
    expect(now).toBeDisabled()
    await user.click(now)
    expect(onChange).not.toHaveBeenCalled()
    unmount()

    render(
      <>
        <DateTimeField value={undefined} onChange={onChange} label="Visit" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Visit' }))
    await user.click(screen.getByRole('button', { name: 'Now' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.stringMatching(new RegExp(`^${dateUtils.toIso(new Date())}T`)))
  })
})

/* ------------------------------------------ 5. a day without a time */

describe('5. DateTimeField shows and submits a day without a time at defaultTime', () => {
  it('uses the same time in the trigger, the time input and the form', async () => {
    const user = userEvent.setup()
    render(
      <>
        <form data-testid="form">
          <DateTimeField
            value="2026-03-12"
            onChange={() => {}}
            label="Slot"
            defaultTime="14:30"
            name="slot"
          />
        </form>
      </>,
    )
    const trigger = screen.getByRole('button', { name: /^Slot: Mar 12, 2026, 2:30\sPM$/ })
    const form = screen.getByTestId('form') as HTMLFormElement
    expect(new FormData(form).get('slot')).toBe('2026-03-12T14:30')

    await user.click(trigger)
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveValue('02')
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveValue('30')
  })
})

/* -------------------------------------------------- 6. clear buttons */

describe('6. clear buttons follow one rule: a value the field can show', () => {
  it('hides them for invalid values and shows them for valid ones', () => {
    const fields = (date: string, time: string, dateTime: string) => (
      <>
        <DateField value={date} onChange={() => {}} label="Date" />
        <TimeField value={time} onChange={() => {}} label="Time" />
        <DateTimeField value={dateTime} onChange={() => {}} label="Slot" />
      </>
    )
    const { rerender } = render(fields('2026-02-31', '25:00', 'garbage'))
    expect(screen.queryAllByRole('button', { name: /^Clear/ })).toHaveLength(0)

    rerender(fields('2026-03-12', '09:30', '2026-03-12T09:30'))
    expect(screen.getAllByRole('button', { name: /^Clear/ }).map((button) => button.getAttribute('aria-label'))).toEqual([
      'Clear Date',
      'Clear Time',
      'Clear Slot',
    ])
  })
})

/* ------------------------------------------------------ 7. Progress */

describe('7. Progress clamps what it gives Radix', () => {
  it('keeps aria values in range and logs nothing', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <>
        <Progress value={150} aria-label="Over" />
        <Progress value={-5} aria-label="Under" />
        <Progress value={5} max={0} aria-label="No max" />
        <Progress value={null} aria-label="Unknown" />
      </>,
    )
    const over = screen.getByRole('progressbar', { name: 'Over' })
    expect(over).toHaveAttribute('aria-valuenow', '100')
    expect(over).toHaveAttribute('data-state', 'complete')
    expect(over.querySelector('.sui-progress__indicator')).toHaveStyle({ transform: 'translateX(-0%)' })
    expect(screen.getByRole('progressbar', { name: 'Under' })).toHaveAttribute('aria-valuenow', '0')
    const noMax = screen.getByRole('progressbar', { name: 'No max' })
    expect(noMax).toHaveAttribute('aria-valuemax', '100')
    expect(noMax).toHaveAttribute('aria-valuenow', '5')
    expect(screen.getByRole('progressbar', { name: 'Unknown' })).not.toHaveAttribute('aria-valuenow')
    expect(error).not.toHaveBeenCalled()
  })
})

/* ----------------------------------------------------- 8. StatusDot */

describe('8. StatusDot counts every way of naming it', () => {
  it('is a named image with aria-labelledby or title', () => {
    render(
      <>
        <span id="dot-name">Degraded</span>
        <StatusDot tone="warning" aria-labelledby="dot-name" data-testid="labelled" />
        <StatusDot tone="info" title="Syncing" data-testid="titled" />
      </>,
    )
    expect(screen.getByTestId('labelled')).not.toHaveAttribute('aria-hidden')
    expect(screen.getByRole('img', { name: 'Degraded' })).toBe(screen.getByTestId('labelled'))
    expect(screen.getByRole('img', { name: 'Syncing' })).toBe(screen.getByTestId('titled'))
  })
})

/* -------------------------------------------------- 9. SegmentedBar */

describe('9. SegmentedBar with a label and no segments', () => {
  it('says there is no data', () => {
    render(
      <>
        <SegmentedBar label="Requests" segments={[]} />
        <SegmentedBar segments={[]} />
      </>,
    )
    expect(screen.getAllByRole('img').map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Requests: No data',
      'No data',
    ])
  })
})

/* ------------------------------------------ 10. panels named by Field */

describe('10. the pickers inside a labelled Field take its label', () => {
  it('names the DateField calendar from the Field label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Start date">
          <DateField value={undefined} onChange={() => {}} />
        </Field>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Start date' }))
    expect(screen.getByRole('grid', { name: 'Start date' })).toBeInTheDocument()
  })

  it('names the TimeField dial from the Field label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Arrival">
          <TimeField value={undefined} onChange={() => {}} />
        </Field>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Arrival' }))
    expect(screen.getByRole('group', { name: 'Arrival' })).toBeInTheDocument()
  })

  it('names the DateTimeField calendar and time input from the Field label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Appointment">
          <DateTimeField value={undefined} onChange={() => {}} />
        </Field>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Appointment' }))
    expect(screen.getByRole('grid', { name: 'Appointment date' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Appointment time' })).toBeInTheDocument()
  })

  it('keeps the fallback outside a Field, and an explicit label wins inside one', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <>
        <DateField value={undefined} onChange={() => {}} />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Date' }))
    expect(screen.getByRole('grid', { name: 'Date' })).toBeInTheDocument()
    unmount()

    render(
      <>
        <Field label="Visible">
          <DateField value={undefined} onChange={() => {}} label="Service date" />
        </Field>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Service date' }))
    expect(screen.getByRole('grid', { name: 'Service date' })).toBeInTheDocument()
  })
})

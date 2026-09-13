/**
 * Regression tests for the form-control audit: each block pins a defect that
 * was found and fixed, named for what used to go wrong.
 */
import {
  Calendar,
  Checkbox,
  ColorInput,
  Combobox,
  DATE_RANGE_PRESETS,
  DateField,
  DateTimeField,
  Field,
  FileUpload,
  ImageUpload,
  MultiCombobox,
  NumberInput,
  OtpInput,
  PasswordInput,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  RatingInput,
  Select,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  TagsInput,
  TimeField,
  fromIso,
  toIso,
  type ComboboxOption,
  type ImageItem,
} from '@shining-technologies/ui'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

/** Render inside a `<form>` and read back what a native submission would send. */
function renderInForm(children: ReactNode) {
  const utils = render(
    <>
      <form data-testid="form">{children}</form>
    </>,
  )
  const data = () => new FormData(screen.getByTestId('form') as HTMLFormElement)
  return { ...utils, data }
}

/** `process.env.TZ = undefined` would store the string "undefined". */
function restoreZone(original: string | undefined) {
  if (original === undefined) delete process.env.TZ
  else process.env.TZ = original
}

const REGIONS: ComboboxOption[] = [
  { value: 'syd', label: 'Sydney' },
  { value: 'mel', label: 'Melbourne' },
  { value: 'bne', label: 'Brisbane' },
]

/* ------------------------------------------------------------------ combobox */

describe('combobox', () => {
  it('calls an inline onSearch once per query, not once per parent render', async () => {
    const calls: string[] = []
    const user = userEvent.setup()
    function Server() {
      const [renders, setRenders] = useState(0)
      return (
        <Combobox
          options={REGIONS}
          searchDebounce={0}
          loading={renders % 2 === 1}
          // A new function every render, and a parent that re-renders on every
          // call: the shape of `onSearch={(q) => fetch(q)}` with a pending flag.
          onSearch={(query) => {
            calls.push(query)
            if (calls.length < 25) setRenders((count) => count + 1)
          }}
        />
      )
    }
    render(
      <>
        <Server />
      </>,
    )
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')
    expect(calls).toEqual([''])
  })

  it('honours its own disabled prop inside a Field', () => {
    render(
      <>
        <Field label="Region">
          <Combobox options={REGIONS} disabled />
        </Field>
      </>,
    )
    expect(screen.getByRole('combobox', { name: 'Region' })).toBeDisabled()
  })

  it('keeps showing the picked option after server results move on', async () => {
    const user = userEvent.setup()
    function Server() {
      const [options, setOptions] = useState(REGIONS)
      const [value, setValue] = useState<string | null>(null)
      return (
        <>
          <Combobox options={options} value={value} onValueChange={setValue} onSearch={() => {}} />
          <button type="button" onClick={() => setOptions([{ value: 'per', label: 'Perth' }])}>
            new results
          </button>
        </>
      )
    }
    render(
      <>
        <Server />
      </>,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Melbourne' }))
    await user.click(screen.getByRole('button', { name: 'new results' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('Melbourne')
  })

  it('works uncontrolled and submits through name', async () => {
    const user = userEvent.setup()
    const { data } = renderInForm(<Combobox options={REGIONS} name="region" defaultValue="syd" />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Sydney')
    expect(data().get('region')).toBe('syd')

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Brisbane' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('Brisbane')
    expect(data().get('region')).toBe('bne')
  })

  it('submits every value of the multi variant', () => {
    const { data } = renderInForm(
      <MultiCombobox options={REGIONS} name="regions" defaultValue={['syd', 'mel']} />,
    )
    expect(data().getAll('regions')).toEqual(['syd', 'mel'])
  })

  it('points the search box at the active option, with ids unique per instance', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Combobox options={REGIONS} aria-label="First" />
        <Combobox options={REGIONS} aria-label="Second" />
      </>,
    )
    const [first, second] = screen.getAllByRole('combobox')
    await user.click(first!)
    const search = await screen.findByPlaceholderText('Search…')
    await user.keyboard('{ArrowDown}')
    const active = search.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    expect(document.getElementById(active!)).toHaveTextContent('Melbourne')
    const firstList = first!.getAttribute('aria-controls')

    await user.keyboard('{Escape}')
    await user.click(second!)
    await screen.findByPlaceholderText('Search…')
    expect(second!.getAttribute('aria-controls')).not.toBe(firstList)
  })

  it('clears from the keyboard when clearable', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <Combobox options={REGIONS} value="syd" onValueChange={onValueChange} clearable />
      </>,
    )
    screen.getByRole('combobox').focus()
    await user.keyboard('{Delete}')
    expect(onValueChange).toHaveBeenCalledWith(null)
  })
})

/* --------------------------------------------------------------------- phone */

describe('phone input', () => {
  it('keeps a Canadian number Canadian when the value comes back round', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [phone, setPhone] = useState('')
      return <PhoneInput value={phone} onValueChange={setPhone} aria-label="Phone" />
    }
    render(
      <>
        <Controlled />
      </>,
    )
    await user.click(screen.getByRole('button', { name: /Country/ }))
    await user.type(screen.getByLabelText('Search countries'), 'Canada')
    await user.keyboard('{Enter}')
    await user.type(screen.getByLabelText('Phone'), '6045550123')
    expect(screen.getByRole('button', { name: /Country: Canada/ })).toBeInTheDocument()
  })

  it('reaches a country from the keyboard alone', async () => {
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput defaultCountry="AU" countries={['AU', 'NZ', 'GB']} aria-label="Phone" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: /Country/ }))
    const search = screen.getByLabelText('Search countries')
    await user.keyboard('{ArrowDown}')
    expect(
      document.getElementById(search.getAttribute('aria-activedescendant')!),
    ).toHaveTextContent('New Zealand')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /Country: New Zealand/ })).toBeInTheDocument()
  })

  it('takes defaultValue without a controlled/uncontrolled warning, and submits E.164', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { data } = renderInForm(
      <PhoneInput name="phone" defaultValue="+442079460958" aria-label="Phone" />,
    )
    expect(screen.getByLabelText('Phone')).toHaveValue('207 946 095 8')
    expect(data().get('phone')).toBe('+442079460958')
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('lets a pasted international number choose its own country', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput defaultCountry="AU" onValueChange={onValueChange} aria-label="Phone" />
      </>,
    )
    await user.click(screen.getByLabelText('Phone'))
    await user.paste('+44 20 7946 0958')
    expect(onValueChange).toHaveBeenLastCalledWith('+442079460958', expect.anything())
    expect(screen.getByRole('button', { name: /United Kingdom/ })).toBeInTheDocument()
  })

  it('drops the trunk 0 from E.164 but keeps it on screen while controlled', async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    function Controlled() {
      const [phone, setPhone] = useState('')
      return (
        <PhoneInput
          defaultCountry="AU"
          name="phone"
          value={phone}
          onValueChange={(next) => {
            seen.push(next)
            setPhone(next)
          }}
          aria-label="Phone"
        />
      )
    }
    const { data } = renderInForm(<Controlled />)
    await user.type(screen.getByLabelText('Phone'), '0412345678')
    expect(seen.at(-1)).toBe('+61412345678')
    // The 0 alone emits nothing, and the round trip must not erase it.
    expect(seen[0]).toBe('')
    expect(screen.getByLabelText('Phone')).toHaveValue('041 234 567 8')
    expect(data().get('phone')).toBe('+61412345678')
  })

  it('keeps the leading 0 where it belongs to the number', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput defaultCountry="IT" onValueChange={onValueChange} aria-label="Phone" />
      </>,
    )
    await user.type(screen.getByLabelText('Phone'), '0612345678')
    expect(onValueChange).toHaveBeenLastCalledWith('+390612345678', expect.anything())
  })
})

/* -------------------------------------------------------------------- number */

describe('number input', () => {
  it('never emits NaN when stepping from a half-typed draft', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <NumberInput onValueChange={onValueChange} aria-label="Amount" />
      </>,
    )
    const input = screen.getByLabelText('Amount')
    await user.type(input, '-')
    expect(input).not.toHaveAttribute('aria-valuenow', 'NaN')
    await user.keyboard('{ArrowUp}')
    for (const [value] of onValueChange.mock.calls) expect(Number.isNaN(value)).toBe(false)
    expect(onValueChange).toHaveBeenLastCalledWith(1)
  })

  it('shows the precision it keeps once the field is left', () => {
    render(
      <>
        <NumberInput value={12.5} precision={2} aria-label="Price" />
      </>,
    )
    expect(screen.getByLabelText('Price')).toHaveValue('12.50')
  })

  it('submits the number, not the grouped text', () => {
    const { data } = renderInForm(
      <NumberInput name="price" defaultValue={1250} thousands aria-label="Price" />,
    )
    expect(data().get('price')).toBe('1250')
  })

  it('still runs a caller onKeyDown', async () => {
    const onKeyDown = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <NumberInput onKeyDown={onKeyDown} aria-label="Amount" />
      </>,
    )
    await user.type(screen.getByLabelText('Amount'), '{ArrowUp}')
    expect(onKeyDown).toHaveBeenCalled()
  })
})

/* ----------------------------------------------------------------------- otp */

describe('one-time code', () => {
  it('pastes a single character into its box instead of replacing the code', async () => {
    const user = userEvent.setup()
    render(
      <>
        <OtpInput length={6} defaultValue="123" />
      </>,
    )
    await user.click(screen.getByLabelText('Character 4 of 6'))
    await user.paste('4')
    expect(screen.getByLabelText('Character 1 of 6')).toHaveValue('1')
    expect(screen.getByLabelText('Character 4 of 6')).toHaveValue('4')
  })

  it('replaces the character in a filled box rather than pushing it along', () => {
    render(
      <>
        <OtpInput length={4} defaultValue="12" />
      </>,
    )
    // The caret beside an existing "1" sends both characters.
    fireEvent.change(screen.getByLabelText('Character 1 of 4'), { target: { value: '15' } })
    expect(screen.getByLabelText('Character 1 of 4')).toHaveValue('5')
    expect(screen.getByLabelText('Character 2 of 4')).toHaveValue('2')
  })

  it('submits the code and takes its name from a Field', () => {
    const { data } = renderInForm(
      <Field label="Verification code">
        <OtpInput length={4} name="code" defaultValue="4821" />
      </Field>,
    )
    expect(data().get('code')).toBe('4821')
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument()
  })
})

/* ---------------------------------------------------------------------- tags */

describe('tags input', () => {
  it('works uncontrolled and submits one entry per tag', () => {
    const { data } = renderInForm(<TagsInput name="skills" defaultValue={['roofing', 'solar']} />)
    expect(data().getAll('skills')).toEqual(['roofing', 'solar'])
  })

  it('is named by the Field label, not the generic default', () => {
    render(
      <>
        <Field label="Skills">
          <TagsInput />
        </Field>
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Skills' })).toBeInTheDocument()
  })

  it('ties a validation message to the input', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput validate={() => 'Not allowed'} aria-label="Tags" />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await user.type(input, 'x{Enter}')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Not allowed')
  })
})

/* -------------------------------------------------------------------- colour */

describe('colour input', () => {
  it('works uncontrolled and submits the hex', async () => {
    const user = userEvent.setup()
    const { data } = renderInForm(<ColorInput name="brand" defaultValue="#abc" />)
    expect(data().get('brand')).toBe('#aabbcc')
    await user.click(screen.getByRole('button', { name: '#22c55e' }))
    expect(screen.getByLabelText('Colour hex value')).toHaveValue('#22c55e')
    expect(data().get('brand')).toBe('#22c55e')
  })

  it('is named by the Field label', () => {
    render(
      <>
        <Field label="Brand colour">
          <ColorInput />
        </Field>
      </>,
    )
    // The hex field and the presets carry the label too ("Brand colour hex value").
    const swatch = screen.getByLabelText('Brand colour', { selector: 'input[type="color"]' })
    expect(swatch).toHaveAttribute('type', 'color')
    // Not overridden by the generic `aria-label="Colour"`.
    expect(swatch).toHaveAccessibleName('Brand colour')
  })
})

/* -------------------------------------------------------------------- rating */

describe('rating', () => {
  it('works uncontrolled, submits, and takes its name from a Field', async () => {
    const user = userEvent.setup()
    const { data } = renderInForm(
      <Field label="Quality">
        <RatingInput name="quality" />
      </Field>,
    )
    const slider = screen.getByRole('slider', { name: 'Quality' })
    slider.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '2')
    expect(data().get('quality')).toBe('2')
  })
})

/* ------------------------------------------------------------------- uploads */

describe('file upload', () => {
  it('replaces the file in single mode rather than rejecting the new one', async () => {
    const onFileRejected = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <Field label="Contract">
          <FileUpload onFileRejected={onFileRejected} />
        </Field>
      </>,
    )
    const input = screen.getByLabelText(/Contract/)
    await user.upload(input, new File(['a'], 'first.pdf', { type: 'application/pdf' }))
    await user.upload(input, new File(['b'], 'second.pdf', { type: 'application/pdf' }))
    expect(onFileRejected).not.toHaveBeenCalled()
    expect(screen.getByText('second.pdf')).toBeInTheDocument()
    expect(screen.queryByText('first.pdf')).not.toBeInTheDocument()
  })

  it('is disabled by a disabled Field', () => {
    render(
      <>
        <Field label="Contract" disabled>
          <FileUpload />
        </Field>
      </>,
    )
    expect(screen.getByLabelText(/Contract/)).toBeDisabled()
  })
})

describe('image upload', () => {
  it('holds a dropped or picked file to the narrower accept list', async () => {
    const onFileRejected = vi.fn()
    const user = userEvent.setup({ applyAccept: false })
    render(
      <>
        <Field label="Logo">
          <ImageUpload accept="image/png" onFileRejected={onFileRejected} />
        </Field>
      </>,
    )
    const jpeg = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Logo'), jpeg)
    expect(onFileRejected).toHaveBeenCalledWith(jpeg, 'type')
  })
})

/* ----------------------------------------------------------------- calendar */

describe('calendar', () => {
  it('keeps a tab stop in the grid after the month buttons move the view', async () => {
    const user = userEvent.setup()
    render(<Calendar value="2026-03-12" onChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    const stops = screen
      .getAllByRole('gridcell')
      .map((cell) => cell.querySelector('button')!)
      .filter((button) => button.tabIndex === 0)
    expect(stops).toHaveLength(1)
    expect(stops[0]!.dataset.day).toMatch(/^2026-04-/)
  })

  it('leaves out-of-range days focusable but not choosable', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Calendar value="2026-03-12" min="2026-03-10" onChange={onChange} />)
    const early = document.querySelector<HTMLButtonElement>('[data-day="2026-03-05"]')!
    expect(early).toHaveAttribute('aria-disabled', 'true')
    expect(early).not.toBeDisabled()
    await user.click(early)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects a day that does not exist instead of rolling it over', () => {
    expect(fromIso('2026-02-31')).toBeNull()
    expect(fromIso('2026-13-01')).toBeNull()
    expect(fromIso('2024-02-29')?.getDate()).toBe(29)
  })

  it('round-trips local dates without shifting a day, either side of UTC', () => {
    const original = process.env.TZ
    try {
      for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Dhaka', 'UTC']) {
        process.env.TZ = zone
        expect(new Date(2026, 0, 1).getTimezoneOffset()).not.toBeNaN()
        for (const iso of ['2026-01-01', '2026-03-08', '2026-03-29', '2026-11-01', '2026-12-31']) {
          expect(toIso(fromIso(iso)!)).toBe(iso)
        }
      }
    } finally {
      restoreZone(original)
    }
  })

  it('counts "Last 7 days" in calendar days across a daylight-saving change', () => {
    const original = process.env.TZ
    process.env.TZ = 'America/New_York'
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      // 00:30 on 9 March 2026, the morning after clocks went forward.
      vi.setSystemTime(new Date(2026, 2, 9, 0, 30))
      expect(DATE_RANGE_PRESETS[1]!.range()).toEqual(['2026-03-03', '2026-03-09'])
    } finally {
      vi.useRealTimers()
      restoreZone(original)
    }
  })
})

/* ------------------------------------------------------------- date fields */

describe('date fields', () => {
  it('joins a Field and submits through name', () => {
    const { data } = renderInForm(
      <Field label="Service date" description="The day the crew arrives" required>
        <DateField value="2026-03-12" onChange={() => {}} label="Service date" name="date" />
      </Field>,
    )
    const trigger = screen.getByRole('button', { name: /Service date:/ })
    expect(trigger).toHaveAccessibleDescription('The day the crew arrives')
    expect(trigger).toHaveAttribute('aria-required', 'true')
    expect(data().get('date')).toBe('2026-03-12')
  })

  it('takes its name from the Field label, with the value, when no label is passed', () => {
    render(
      <>
        <Field label="Start date">
          <DateField value="2026-03-12" onChange={() => {}} />
        </Field>
        <Field label="Arrival">
          <TimeField value={undefined} onChange={() => {}} />
        </Field>
        <Field label="Visible">
          <DateTimeField value={undefined} onChange={() => {}} label="Explicit" />
        </Field>
      </>,
    )
    // The visible label and the shown value together — not a second, hidden name.
    const date = screen.getByRole('button', { name: /^Start date .*2026/ })
    expect(date).not.toHaveAttribute('aria-label')
    expect(screen.getByRole('button', { name: 'Arrival' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear Date' })).toBeInTheDocument()
    // An explicit label still wins.
    expect(screen.getByRole('button', { name: 'Explicit' })).toBeInTheDocument()
  })

  it('offers no clear button while disabled', () => {
    render(
      <>
        <DateField value="2026-03-12" onChange={() => {}} label="Date" disabled />
        <TimeField value="09:30" onChange={() => {}} label="Time" disabled />
        <DateTimeField value="2026-03-12T09:30" onChange={() => {}} label="Slot" disabled />
      </>,
    )
    expect(screen.queryByRole('button', { name: /^Clear/ })).not.toBeInTheDocument()
  })

  it('forwards a ref to the trigger', () => {
    let node: HTMLButtonElement | null = null
    render(
      <>
        <TimeField
          ref={(element) => {
            node = element
          }}
          value={undefined}
          onChange={() => {}}
          label="Arrival"
        />
      </>,
    )
    expect(node).toBe(screen.getByRole('button', { name: 'Arrival' }))
  })
})

/* ----------------------------------------------------- radix controls in a field */

describe('radix controls inside a Field', () => {
  it('wires the select trigger to the label and description', () => {
    render(
      <>
        <Field label="Status" description="Who can see it">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
          </Select>
        </Field>
      </>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    expect(trigger).toHaveAccessibleDescription('Who can see it')
  })

  it('names a radio group from the Field label', async () => {
    render(
      <>
        <Field label="Plan" disabled>
          <RadioGroup>
            <RadioGroupItem value="a" aria-label="A" />
          </RadioGroup>
        </Field>
      </>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument()
    await act(async () => {})
    expect(screen.getByRole('radio', { name: 'A' })).toBeDisabled()
  })
})

/* =================================================================== */
/*                          second audit                                */
/* =================================================================== */

/* --------------------------------------------- one controlled/uncontrolled rule */

describe('controlled exactly when value is defined', () => {
  it('leaves Combobox, MultiCombobox, ColorInput and RatingInput uncontrolled with value={undefined}', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Combobox options={REGIONS} value={undefined} aria-label="Region" />
        <MultiCombobox options={REGIONS} value={undefined} aria-label="Regions" />
        <ColorInput value={undefined} swatches={['#22c55e']} />
        <RatingInput value={undefined} aria-label="Quality" />
      </>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Region' }))
    await user.click(await screen.findByRole('option', { name: 'Brisbane' }))
    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveTextContent('Brisbane')

    await user.click(screen.getByRole('combobox', { name: 'Regions' }))
    await user.click(await screen.findByRole('option', { name: 'Sydney' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('combobox', { name: 'Regions' })).toHaveTextContent('Sydney')

    await user.click(screen.getByRole('button', { name: '#22c55e' }))
    expect(screen.getByLabelText('Colour hex value')).toHaveValue('#22c55e')

    const rating = screen.getByRole('slider', { name: 'Quality' })
    rating.focus()
    await user.keyboard('{ArrowRight}')
    expect(rating).toHaveAttribute('aria-valuenow', '1')
  })

  it("lets a controlled parent clear every control through the control's empty value", async () => {
    const user = userEvent.setup()
    function Form() {
      const [filled, setFilled] = useState(true)
      return (
        <>
          <Combobox options={REGIONS} value={filled ? 'syd' : null} aria-label="Region" />
          <MultiCombobox options={REGIONS} value={filled ? ['mel'] : []} aria-label="Regions" />
          <ColorInput value={filled ? '#22c55e' : ''} name="colour" />
          <RatingInput value={filled ? 3 : 0} aria-label="Quality" />
          <OtpInput length={4} value={filled ? '1234' : ''} />
          <TagsInput value={filled ? ['vip'] : []} aria-label="Tags" />
          <NumberInput value={filled ? 12 : null} aria-label="Amount" />
          <PhoneInput value={filled ? '+61412345678' : ''} aria-label="Phone" />
          <button type="button" onClick={() => setFilled(false)}>
            clear
          </button>
        </>
      )
    }
    const { data } = renderInForm(<Form />)
    await user.click(screen.getByRole('button', { name: 'clear' }))

    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveTextContent('Select…')
    expect(screen.getByRole('combobox', { name: 'Regions' })).toHaveTextContent('Select…')
    expect(screen.getByLabelText('Colour hex value')).toHaveValue('')
    expect(data().get('colour')).toBe('')
    expect(screen.getByRole('slider', { name: 'Quality' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByLabelText('Character 1 of 4')).toHaveValue('')
    expect(screen.queryByText('vip')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toHaveValue('')
    expect(screen.getByLabelText('Phone')).toHaveValue('')
  })

  it('clears a controlled NumberInput even while it has focus', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<number | null>(null)
      return (
        <>
          <NumberInput value={value} onValueChange={setValue} aria-label="Amount" />
          {/* Pressed from the keyboard shortcut layer: focus stays in the field. */}
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setValue(null)}
          >
            reset
          </button>
        </>
      )
    }
    render(
      <>
        <Controlled />
      </>,
    )
    const input = screen.getByLabelText('Amount')
    await user.type(input, '42')
    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(input).toHaveFocus()
    expect(input).toHaveValue('')
  })
})

/* ------------------------------------------------------------ password input */

describe('password input, second audit', () => {
  it('re-scores after a form library writes the DOM value directly', async () => {
    const user = userEvent.setup()
    function Resettable() {
      const ref = useRef<HTMLInputElement>(null)
      const [, rerender] = useState(0)
      return (
        <>
          <Field label="Password">
            <PasswordInput ref={ref} strength />
          </Field>
          <button
            type="button"
            onClick={() => {
              // What React Hook Form's `reset()` does to a registered field.
              ref.current!.value = ''
              rerender((count) => count + 1)
            }}
          >
            reset
          </button>
        </>
      )
    }
    render(
      <>
        <Resettable />
      </>,
    )
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Passphrase')
    expect(screen.getByText('Strong')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'reset' }))
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('re-scores after a native form reset', async () => {
    const user = userEvent.setup()
    render(
      <>
        <form data-testid="form">
          <PasswordInput strength aria-label="Password" />
        </form>
      </>,
    )
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Passphrase')
    expect(screen.getByText('Strong')).toBeInTheDocument()
    await act(async () => {
      ;(screen.getByTestId('form') as HTMLFormElement).reset()
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('describes the input with the field, the hint and the strength verdict', () => {
    render(
      <>
        <Field label="Password" description="Twelve or more.">
          <PasswordInput strength hint="A phrase is easiest." />
        </Field>
      </>,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAccessibleDescription(
      /^Twelve or more\. A phrase is easiest\. Password strength: /,
    )
    // A field that rates the password is choosing a new one.
    expect(input).toHaveAttribute('autocomplete', 'new-password')
  })
})

/* ------------------------------------------------------ slider, switch, checkbox */

describe('slider, switch and checkbox inside a Field', () => {
  it('wires the slider thumb to the label, description, error and required', () => {
    render(
      <>
        <Field label="Budget" description="Per night." error="Too low." required>
          <Slider defaultValue={[40]} />
        </Field>
      </>,
    )
    const thumb = screen.getByRole('slider', { name: 'Budget' })
    expect(thumb).toHaveAccessibleDescription('Per night. Too low.')
    expect(thumb).toHaveAttribute('aria-invalid', 'true')
    // Not `aria-required`, which a slider may not carry; a slider always has a value.
    expect(thumb).not.toHaveAttribute('aria-required')
    expect(thumb.closest('[data-slot="slider"]')).toHaveAttribute('data-required', 'true')
  })

  it('names each thumb of a range, and is disabled by the Field', () => {
    render(
      <>
        <Field label="Price" disabled>
          <Slider defaultValue={[20, 80]} />
        </Field>
      </>,
    )
    const min = screen.getByRole('slider', { name: 'Price Minimum' })
    expect(screen.getByRole('slider', { name: 'Price Maximum' })).toBeInTheDocument()
    expect(min).toHaveAttribute('data-disabled')
    expect(min).not.toHaveAttribute('tabindex')
  })

  it('announces a required, invalid switch and checkbox', () => {
    render(
      <>
        <Field label="Email me" required error="Pick one.">
          <Switch />
        </Field>
        <Field label="I accept" required error="Accept to continue.">
          <Checkbox />
        </Field>
      </>,
    )
    const toggle = screen.getByRole('switch', { name: 'Email me' })
    expect(toggle).toHaveAttribute('aria-required', 'true')
    expect(toggle).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('checkbox', { name: 'I accept' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})

/* ----------------------------------------------------------------------- otp */

describe('one-time code, second audit', () => {
  const box = (n: number, of = 4) => screen.getByLabelText(`Character ${n} of ${of}`)

  it('empties a middle box in place instead of sliding the rest left', async () => {
    const onValueChange = vi.fn()
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <OtpInput
          length={4}
          defaultValue="1234"
          onValueChange={onValueChange}
          onComplete={onComplete}
        />
      </>,
    )
    await user.click(box(3))
    await user.keyboard('{Backspace}')
    expect([1, 2, 3, 4].map((n) => (box(n) as HTMLInputElement).value)).toEqual(['1', '2', '', '4'])
    // The value is the characters in order with the hole left out — incomplete.
    expect(onValueChange).toHaveBeenLastCalledWith('124')
    expect(onComplete).not.toHaveBeenCalled()

    // The hole is filled where it is.
    await user.keyboard('9')
    expect([1, 2, 3, 4].map((n) => (box(n) as HTMLInputElement).value)).toEqual([
      '1',
      '2',
      '9',
      '4',
    ])
    expect(onComplete).toHaveBeenLastCalledWith('1294')
  })

  it('keeps the hole across a controlled round trip, and Backspace in an empty box clears the one before', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [code, setCode] = useState('1234')
      return <OtpInput length={4} value={code} onValueChange={setCode} name="code" />
    }
    const { data } = renderInForm(<Controlled />)
    await user.click(box(3))
    await user.keyboard('{Backspace}')
    expect((box(4) as HTMLInputElement).value).toBe('4')
    expect(data().get('code')).toBe('124')
    // Now in the empty third box: Backspace empties the second and moves there.
    await user.keyboard('{Backspace}')
    expect([1, 2, 3, 4].map((n) => (box(n) as HTMLInputElement).value)).toEqual(['1', '', '', '4'])
    expect(box(2)).toHaveFocus()
  })
})

/* ---------------------------------------------------------------------- tags */

describe('tags input, second audit', () => {
  it('splits a paste on its own delimiters, and always on line breaks', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput aria-label="Emails" delimiters={[';', 'Enter']} />
      </>,
    )
    await user.click(screen.getByRole('textbox', { name: 'Emails' }))
    await user.paste('a@x.com; b@x.com, c\nd@x.com')
    const tags = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(tags).toEqual(['a@x.com', 'b@x.com, c', 'd@x.com'])
  })

  it('keeps what was already typed when a list is pasted after it', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput aria-label="Tags" />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await user.type(input, 'roof')
    await user.paste('ing, solar')
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'roofing',
      'solar',
    ])
  })
})

/* -------------------------------------------------------------------- number */

describe('number input, second audit', () => {
  it("types and shows the locale's decimal separator", async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    const { data } = renderInForm(
      <>
        <NumberInput
          locale="de-DE"
          precision={2}
          thousands
          name="price"
          onValueChange={onValueChange}
          aria-label="Preis"
        />
        <button type="button">elsewhere</button>
      </>,
    )
    const input = screen.getByLabelText('Preis')
    await user.type(input, '1250,5')
    expect(onValueChange).toHaveBeenLastCalledWith(1250.5)
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(input).toHaveValue('1.250,50')
    expect(data().get('price')).toBe('1250.5')

    // A keypad `.` still means the decimal point.
    await user.clear(input)
    await user.type(input, '2.5')
    expect(onValueChange).toHaveBeenLastCalledWith(2.5)
  })

  it('asks for a keyboard that can type what the field accepts', () => {
    render(
      <>
        <NumberInput aria-label="Signed" />
        <NumberInput aria-label="Price" min={0} />
        <NumberInput aria-label="Count" min={0} precision={0} />
      </>,
    )
    // A phone's number pads have no minus key.
    expect(screen.getByLabelText('Signed')).toHaveAttribute('inputmode', 'text')
    expect(screen.getByLabelText('Price')).toHaveAttribute('inputmode', 'decimal')
    expect(screen.getByLabelText('Count')).toHaveAttribute('inputmode', 'numeric')
  })
})

/* -------------------------------------------------------------- image upload */

describe('image upload, second audit', () => {
  it('keeps a controlled parent’s thumbnails alive across an unmount, and revokes on removal', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const user = userEvent.setup()
    function Wizard() {
      const [items, setItems] = useState<ImageItem[]>([])
      const [step, setStep] = useState(1)
      return (
        <>
          {step === 1 ? (
            <Field label="Photos">
              <ImageUpload value={items} onValueChange={setItems} />
            </Field>
          ) : (
            <p>Step two</p>
          )}
          <button type="button" onClick={() => setStep((current) => (current === 1 ? 2 : 1))}>
            toggle
          </button>
        </>
      )
    }
    try {
      render(
        <>
          <Wizard />
        </>,
      )
      await user.upload(
        screen.getByLabelText('Photos'),
        new File(['x'], 'roof.png', { type: 'image/png' }),
      )
      const src = screen.getByRole('img', { name: 'roof.png' }).getAttribute('src')
      await user.click(screen.getByRole('button', { name: 'toggle' }))
      await user.click(screen.getByRole('button', { name: 'toggle' }))
      expect(revoke).not.toHaveBeenCalled()
      expect(screen.getByRole('img', { name: 'roof.png' })).toHaveAttribute('src', src)

      // The remounted instance can still release what an earlier one made.
      await user.click(screen.getByRole('button', { name: 'Remove roof.png' }))
      expect(revoke).toHaveBeenCalledWith(src)
    } finally {
      revoke.mockRestore()
    }
  })

  it('revokes its URLs on unmount when uncontrolled', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const user = userEvent.setup()
    try {
      const { unmount } = render(
        <>
          <Field label="Photos">
            <ImageUpload />
          </Field>
        </>,
      )
      await user.upload(
        screen.getByLabelText('Photos'),
        new File(['x'], 'roof.png', { type: 'image/png' }),
      )
      const src = screen.getByRole('img', { name: 'roof.png' }).getAttribute('src')
      unmount()
      expect(revoke).toHaveBeenCalledWith(src)
    } finally {
      revoke.mockRestore()
    }
  })

  it('never revokes a URL the caller made', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const user = userEvent.setup()
    function Controlled() {
      const [items, setItems] = useState<ImageItem[]>([{ url: 'blob:caller-owned', name: 'mine' }])
      return <ImageUpload value={items} onValueChange={setItems} />
    }
    try {
      render(
        <>
          <Controlled />
        </>,
      )
      await user.click(screen.getByRole('button', { name: 'Remove mine' }))
      expect(revoke).not.toHaveBeenCalled()
    } finally {
      revoke.mockRestore()
    }
  })
})

/* ------------------------------------------------------------ date and time */

describe('date and time, second audit', () => {
  /** An in-month day of whatever month the open calendar shows. */
  const someDay = () =>
    within(screen.getByRole('grid'))
      .getAllByRole('button')
      .find((button) => !button.hasAttribute('data-outside'))!

  it('stores the time the time input shows when a day is picked first', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <DateTimeField value={undefined} onChange={onChange} label="Appointment" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Appointment' }))
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveValue('09')
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveValue('00')
    const day = someDay()
    await user.click(day)
    expect(onChange).toHaveBeenLastCalledWith(`${day.dataset.day}T09:00`)
  })

  it('takes a defaultTime for both the time input and the value', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <DateTimeField
          value={undefined}
          onChange={onChange}
          label="Appointment"
          defaultTime="14:30"
        />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Appointment' }))
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveValue('02')
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveValue('30')
    const day = someDay()
    await user.click(day)
    expect(onChange).toHaveBeenLastCalledWith(`${day.dataset.day}T14:30`)
  })
})

describe('calendar, second audit', () => {
  const tabStops = () =>
    screen
      .getAllByRole('gridcell')
      .map((cell) => cell.querySelector('button')!)
      .filter((button) => button.tabIndex === 0)

  it('shows the month of a value set from outside while mounted', () => {
    const { rerender } = render(<Calendar value="2026-03-12" onChange={() => {}} locale="en-AU" />)
    expect(screen.getByText('March 2026')).toBeInTheDocument()
    rerender(<Calendar value="2026-07-04" onChange={() => {}} locale="en-AU" />)
    expect(screen.getByText('July 2026')).toBeInTheDocument()
    expect(tabStops().map((button) => button.dataset.day)).toEqual(['2026-07-04'])
  })

  it('keeps a rendered tab stop when min and max rule out the whole month', async () => {
    const user = userEvent.setup()
    render(<Calendar value="2026-03-12" min="2026-05-01" onChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    const stops = tabStops()
    expect(stops).toHaveLength(1)
    expect(stops[0]!.dataset.day).toMatch(/^2026-04-/)
    expect(stops[0]).toHaveAttribute('aria-disabled', 'true')
  })

  it('marks today only after hydration, so server and browser timezones cannot disagree', () => {
    const original = process.env.TZ
    vi.useFakeTimers({ toFake: ['Date'] })
    // Midday UTC on 12 March: already the 13th in Kiritimati, still the 12th in Pago Pago.
    vi.setSystemTime(new Date(Date.UTC(2026, 2, 12, 12)))
    const ui = <Calendar value="2026-03-12" onChange={() => {}} />
    const container = document.createElement('div')
    document.body.append(container)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let root: ReturnType<typeof hydrateRoot> | undefined
    try {
      process.env.TZ = 'Pacific/Kiritimati'
      container.innerHTML = renderToString(ui)
      expect(container.querySelector('[data-today]')).toBeNull()

      process.env.TZ = 'Pacific/Pago_Pago'
      act(() => {
        root = hydrateRoot(container, ui, { onRecoverableError: (e) => console.error(e) })
      })
      const complaints = error.mock.calls
        .map((call) => call.map(String).join(' '))
        .filter((message) => /hydrat|did not match|server HTML/i.test(message))
      expect(complaints).toEqual([])
      expect(container.querySelector('[data-today]')).toHaveAttribute('data-day', '2026-03-12')
    } finally {
      act(() => root?.unmount())
      container.remove()
      error.mockRestore()
      vi.useRealTimers()
      restoreZone(original)
    }
  })
})

/* ------------------------------------------------------------------ combobox */

describe('combobox, second audit', () => {
  it('labels a value that is not in options from selectedOption / selectedOptions', () => {
    render(
      <>
        <Combobox
          options={[]}
          value="per"
          selectedOption={{ value: 'per', label: 'Perth' }}
          aria-label="City"
        />
        <MultiCombobox
          options={[]}
          value={['per', 'dar']}
          selectedOptions={[
            { value: 'per', label: 'Perth' },
            { value: 'dar', label: 'Darwin' },
          ]}
          aria-label="Cities"
        />
      </>,
    )
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveTextContent('Perth')
    const cities = screen.getByRole('combobox', { name: 'Cities' })
    expect(cities).toHaveTextContent('Perth')
    expect(cities).toHaveTextContent('Darwin')
  })

  it('shows an unknown value as itself rather than as the placeholder', () => {
    render(
      <>
        <Combobox options={[]} value="per" aria-label="City" />
      </>,
    )
    expect(screen.getByRole('combobox', { name: 'City' })).toHaveTextContent('per')
    expect(screen.getByRole('combobox', { name: 'City' })).not.toHaveTextContent('Select…')
  })
})

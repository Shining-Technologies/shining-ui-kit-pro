import {
  Clock,
  ColorInput,
  DateTimeField,
  Field,
  ImageUpload,
  NumberInput,
  OtpInput,
  PasswordInput,
  PhoneInput,
  RatingInput,
  TagsInput,
  Textarea,
  TimeField,
  countryByDial,
  formatTime,
  fromTime,
  joinDateTime,
  normalizeHex,
  splitDateTime,
  toTime,
} from '@shining-technologies/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

describe('password input', () => {
  it('reveals and re-masks the password', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Password">
          <PasswordInput defaultValue="hunter2" />
        </Field>
      </>,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('scores what is typed, without the caller controlling the value', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Password">
          <PasswordInput strength />
        </Field>
      </>,
    )
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Passphrase')
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('drops the reveal button when it is turned off', () => {
    render(
      <>
        <PasswordInput revealable={false} aria-label="Confirm" />
      </>,
    )
    expect(screen.queryByRole('button', { name: /password/i })).not.toBeInTheDocument()
  })
})

describe('phone input', () => {
  it('emits E.164 regardless of how the number is spaced', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput defaultCountry="AU" onValueChange={onValueChange} aria-label="Phone" />
      </>,
    )
    await user.type(screen.getByLabelText('Phone'), '412 345 678')
    expect(onValueChange).toHaveBeenLastCalledWith('+61412345678', expect.anything())
  })

  it('selects the country a saved number belongs to', () => {
    render(
      <>
        <PhoneInput value="+14155550123" aria-label="Phone" />
      </>,
    )
    expect(screen.getByRole('button', { name: /United States/ })).toBeInTheDocument()
  })

  it('finds a country by dialling code as well as by name', async () => {
    const user = userEvent.setup()
    render(
      <>
        <PhoneInput defaultCountry="AU" aria-label="Phone" />
      </>,
    )
    await user.click(screen.getByRole('button', { name: /Country/ }))
    await user.type(screen.getByLabelText('Search countries'), '+64')
    expect(screen.getByRole('option', { name: /New Zealand/ })).toBeInTheDocument()
  })

  it('resolves the longest matching dialling code first', () => {
    expect(countryByDial('61412345678')?.code).toBe('AU')
    expect(countryByDial('35312345678')?.code).toBe('IE')
  })
})

describe('number input', () => {
  it('shows no stepper buttons unless asked, and still steps from the keyboard', async () => {
    const user = userEvent.setup()
    render(<NumberInput defaultValue={2} aria-label="Baths" />)
    expect(screen.queryByRole('button', { name: 'Increase' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Decrease' })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Baths'))
    await user.keyboard('{ArrowUp}')
    expect(screen.getByLabelText('Baths')).toHaveValue('3')
  })

  it('steps, and clamps to the range', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<number | null>(9)
      return (
        <NumberInput
          value={value}
          onValueChange={setValue}
          min={1}
          max={10}
          steppers
          aria-label="Beds"
        />
      )
    }
    render(
      <>
        <Controlled />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByLabelText('Beds')).toHaveValue('10')

    // At the ceiling the control stops rather than running past it.
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })

  it('keeps a half-typed number instead of emptying the field', async () => {
    const user = userEvent.setup()
    render(
      <>
        <NumberInput aria-label="Amount" />
      </>,
    )
    const input = screen.getByLabelText('Amount')
    await user.type(input, '-1.')
    expect(input).toHaveValue('-1.')
  })

  it('rounds to the given precision on blur', async () => {
    const user = userEvent.setup()
    render(
      <>
        <NumberInput aria-label="Price" precision={2} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.type(screen.getByLabelText('Price'), '12.349')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.getByLabelText('Price')).toHaveValue('12.35')
  })
})

describe('one-time code', () => {
  it('spreads a pasted code across every box and reports completion', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <OtpInput onComplete={onComplete} />
      </>,
    )
    const first = screen.getByLabelText('Character 1 of 6')
    await user.click(first)
    await user.paste('123456')

    expect(first).toHaveValue('1')
    expect(screen.getByLabelText('Character 6 of 6')).toHaveValue('6')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('ignores letters in a numeric code', async () => {
    const user = userEvent.setup()
    render(
      <>
        <OtpInput length={4} />
      </>,
    )
    await user.type(screen.getByLabelText('Character 1 of 4'), 'a1')
    expect(screen.getByLabelText('Character 1 of 4')).toHaveValue('1')
  })
})

describe('tags input', () => {
  it('commits on a delimiter and removes with backspace', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [tags, setTags] = useState<string[]>([])
      return <TagsInput value={tags} onValueChange={setTags} aria-label="Skills" />
    }
    render(
      <>
        <Controlled />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Skills' })
    await user.type(input, 'react,typescript,')
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()

    await user.type(input, '{Backspace}')
    expect(screen.queryByText('typescript')).not.toBeInTheDocument()
  })

  it('splits a pasted list into separate tags', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput aria-label="Recipients" />
      </>,
    )
    await user.click(screen.getByRole('textbox', { name: 'Recipients' }))
    await user.paste('one, two, three')
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('stops at the limit', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput aria-label="Tags" max={1} />
      </>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'one,two,')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})

describe('colour input', () => {
  it('normalises shorthand hex', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('0a6b5a')).toBe('#0a6b5a')
    expect(normalizeHex('not a colour')).toBeNull()
  })

  it('picks a preset', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <ColorInput value="#000000" onValueChange={onValueChange} swatches={['#ef4444']} />
      </>,
    )
    await user.click(screen.getByRole('button', { name: '#ef4444' }))
    expect(onValueChange).toHaveBeenCalledWith('#ef4444')
  })
})

describe('rating', () => {
  it('is a slider that the arrow keys move', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState(2)
      return <RatingInput value={value} onValueChange={setValue} aria-label="Rating" />
    }
    render(
      <>
        <Controlled />
      </>,
    )
    const slider = screen.getByRole('slider', { name: 'Rating' })
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '3')

    await user.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuenow', '5')
  })
})

describe('time', () => {
  it('parses and formats a 24-hour time', () => {
    expect(fromTime('09:30')).toEqual({ hours: 9, minutes: 30 })
    expect(fromTime('25:00')).toBeNull()
    expect(toTime(9, 5)).toBe('09:05')
    expect(formatTime('17:05', 'en-AU')).toMatch(/5:05/)
  })

  it('picks an hour, then a minute', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState('09:00')
      return <Clock value={value} onChange={setValue} />
    }
    render(
      <>
        <Controlled />
      </>,
    )
    await user.click(screen.getByRole('button', { name: '3 hours' }))
    // The dial turns to minutes on its own once the hour is chosen.
    await user.click(screen.getByRole('button', { name: '15 minutes' }))
    expect(screen.getByRole('spinbutton', { name: 'Hour' })).toHaveTextContent('03')
    expect(screen.getByRole('spinbutton', { name: 'Minute' })).toHaveTextContent('15')
  })

  it('keeps the time when the field is cleared and re-opened', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<string | undefined>('14:30')
      return <TimeField value={value} onChange={setValue} label="Arrival" />
    }
    render(
      <>
        <Controlled />
      </>,
    )
    expect(screen.getByRole('button', { name: /Arrival: 2:30/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear Arrival' }))
    expect(screen.getByRole('button', { name: 'Arrival' })).toBeInTheDocument()
  })
})

describe('date and time', () => {
  it('splits and rejoins its two halves', () => {
    expect(splitDateTime('2026-09-18T14:00')).toEqual({ date: '2026-09-18', time: '14:00' })
    expect(splitDateTime('2026-09-18T14:00:59').time).toBe('14:00')
    expect(splitDateTime(undefined)).toEqual({ date: undefined, time: undefined })
    expect(joinDateTime('2026-09-18', undefined)).toBe('2026-09-18T00:00')
    expect(joinDateTime(undefined, '09:00')).toBeUndefined()
  })

  it('shows the day and the time in one trigger', () => {
    render(
      <>
        <DateTimeField value="2026-09-18T14:00" onChange={vi.fn()} label="Appointment" />
      </>,
    )
    // The wording is the runner's locale; what matters is that one trigger
    // carries both halves.
    const trigger = screen.getByRole('button', { name: /^Appointment:/ })
    expect(trigger).toHaveAccessibleName(/2026/)
    expect(trigger).toHaveAccessibleName(/2:00/)
  })
})

describe('image upload', () => {
  it('shows a preview per image and removes it again', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [items, setItems] = useState<Parameters<typeof ImageUpload>[0]['value']>([])
      return <ImageUpload value={items} onValueChange={setItems} />
    }
    render(
      <>
        <Field label="Photos">
          <Controlled />
        </Field>
      </>,
    )
    const file = new File(['x'], 'roof.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Photos'), file)

    expect(screen.getByRole('img', { name: 'roof.png' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove roof.png' }))
    expect(screen.queryByRole('img', { name: 'roof.png' })).not.toBeInTheDocument()
  })

  it('rejects a file that is not an image', async () => {
    const onFileRejected = vi.fn()
    const user = userEvent.setup()
    render(
      <>
        <Field label="Photos">
          {/* The picker's own filter is widened so the component's validation
              is what does the rejecting, which is the thing under test. */}
          <ImageUpload accept="" onFileRejected={onFileRejected} />
        </Field>
      </>,
    )
    await user.upload(
      screen.getByLabelText('Photos'),
      new File(['x'], 'notes.pdf', { type: 'application/pdf' }),
    )
    expect(onFileRejected).toHaveBeenCalledWith(expect.any(File), 'type')
  })
})

describe('textarea', () => {
  it('counts what is typed against the limit', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Notes">
          <Textarea showCount maxLength={100} />
        </Field>
      </>,
    )
    await user.type(screen.getByLabelText('Notes'), 'four')
    expect(screen.getByText('4 / 100')).toBeInTheDocument()
  })
})

describe('accessibility', () => {
  it('has no axe violations across the new fields', async () => {
    const { container } = render(
      <>
        <form>
          <Field label="Password" description="Eight characters or more.">
            <PasswordInput />
          </Field>
          <Field label="Mobile">
            <PhoneInput defaultCountry="AU" />
          </Field>
          <Field label="Bedrooms">
            <NumberInput defaultValue={2} min={1} />
          </Field>
          <Field label="Verification code">
            <OtpInput length={4} />
          </Field>
          <Field label="Skills">
            <TagsInput value={['react']} />
          </Field>
          <Field label="Brand colour">
            <ColorInput value="#0a6b5a" />
          </Field>
          <Field label="Rating">
            <RatingInput value={3} />
          </Field>
          <Field label="Arrival">
            <TimeField value="09:30" onChange={vi.fn()} label="Arrival" />
          </Field>
          <Field label="Notes">
            <Textarea showCount maxLength={50} />
          </Field>
        </form>
      </>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

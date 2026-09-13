/**
 * Regression tests for the release audit of the form family: each block pins a
 * defect that was found in the reference docs pass and fixed.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  Checkbox,
  ColorInput,
  Combobox,
  DEFAULT_PASSWORD_RULES,
  DEFAULT_SWATCHES,
  Field,
  FileUpload,
  FloatingFormActions,
  ImageUpload,
  MultiCombobox,
  NumberInput,
  OtpInput,
  PasswordInput,
  PasswordStrengthIndicator,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  TagsInput,
  ToggleGroup,
  ToggleGroupItem,
  formatBytes,
  normalizeHex,
  scorePassword,
  type ComboboxOption,
} from '@shining-technologies/ui'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

const SRC = resolve(__dirname, '..', 'src')
const FORM = join(SRC, 'components', 'form')
const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

const REGIONS: ComboboxOption[] = [
  { value: 'syd', label: 'Sydney' },
  { value: 'mel', label: 'Melbourne' },
  { value: 'bne', label: 'Brisbane' },
]

function renderInForm(children: ReactNode) {
  const utils = render(
    <>
      <form data-testid="form">{children}</form>
    </>,
  )
  const data = () => new FormData(screen.getByTestId('form') as HTMLFormElement)
  return { ...utils, data }
}

/* 1 ------------------------------------------------------------- checkbox */

describe('checkbox indeterminate glyph', () => {
  it('draws the dash for an uncontrolled indeterminate checkbox', () => {
    const { container } = render(
      <>
        <Checkbox defaultChecked="indeterminate" aria-label="Some rows" />
      </>,
    )
    const indicator = container.querySelector('.sui-checkbox__indicator')!
    expect(indicator).toHaveAttribute('data-state', 'indeterminate')
    expect(indicator.querySelector('.sui-checkbox__minus')).not.toBeNull()
    // The stylesheet is what picks the glyph from the state.
    const css = read(join(SRC, 'styles', 'inputs.css'))
    expect(css).toContain(".sui-checkbox__indicator[data-state='indeterminate'] .sui-checkbox__check")
    expect(css).toContain(
      ".sui-checkbox__indicator:not([data-state='indeterminate']) .sui-checkbox__minus",
    )
  })
})

/* 2 --------------------------------------------------------- toggle group */

describe('toggle group styling', () => {
  it("applies the group's variant and size to its items, and lets an item override them", () => {
    render(
      <>
        <ToggleGroup type="single" variant="outline" size="sm" aria-label="View">
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem value="list" variant="default" size="default">
            List
          </ToggleGroupItem>
        </ToggleGroup>
      </>,
    )
    const grid = screen.getByRole('radio', { name: 'Grid' })
    expect(grid).toHaveClass('sui-toggle--outline', 'sui-toggle--sm')
    const list = screen.getByRole('radio', { name: 'List' })
    expect(list).not.toHaveClass('sui-toggle--outline')
    expect(list).not.toHaveClass('sui-toggle--sm')
  })
})

/* 3 ---------------------------------------------------------- radio group */

describe('radio group in a field', () => {
  it('is the target of the label, announces its orientation, and takes focus from a label click', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Plan">
          <RadioGroup defaultValue="b" orientation="horizontal">
            <RadioGroupItem value="a" aria-label="A" />
            <RadioGroupItem value="b" aria-label="B" />
          </RadioGroup>
        </Field>
      </>,
    )
    const group = screen.getByRole('radiogroup', { name: 'Plan' })
    const label = screen.getByText('Plan')
    expect(group.id).toBeTruthy()
    expect(label).toHaveAttribute('for', group.id)
    expect(group).toHaveAttribute('aria-orientation', 'horizontal')

    await user.click(label)
    expect(screen.getByRole('radio', { name: 'B' })).toHaveFocus()

    // The arrows across the orientation still move, as a radio group's should:
    // Radix's roving focus given `orientation="horizontal"` would ignore ArrowUp.
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus()
  })
})

/* 4, 5, 6 -------------------------------------------------------- combobox */

describe('combobox trigger contents', () => {
  it('keeps the clear button out of the trigger and still clears', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <Combobox
          options={REGIONS}
          defaultValue="syd"
          onValueChange={onValueChange}
          clearable
          aria-label="Region"
        />
      </>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Region' })
    expect(trigger.querySelector('button, [role="button"]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(trigger).toHaveTextContent('Select…')
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument()
  })

  it('keeps the chip remove buttons out of the trigger and still removes', async () => {
    const user = userEvent.setup()
    const { data } = renderInForm(
      <MultiCombobox options={REGIONS} name="regions" defaultValue={['syd', 'mel']} aria-label="Regions" />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Regions' })
    expect(trigger.querySelector('button, [role="button"]')).toBeNull()
    expect(trigger).toHaveTextContent('Sydney')
    await user.click(screen.getByRole('button', { name: 'Remove Sydney' }))
    expect(data().getAll('regions')).toEqual(['mel'])
    expect(trigger).not.toHaveTextContent('Sydney')
  })

  it('has no axe violations with a value, chips and a field', async () => {
    const { container } = render(
      <>
        <Field label="Region" required>
          <Combobox options={REGIONS} defaultValue="mel" clearable />
        </Field>
        <Field label="Regions" description="Pick any.">
          <MultiCombobox options={REGIONS} defaultValue={['syd', 'mel', 'bne']} maxChips={2} />
        </Field>
      </>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('names the listbox from the field label, an aria-label, or the placeholder', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <>
        <Field label="Region">
          <Combobox options={REGIONS} />
        </Field>
      </>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Region' }))
    expect(await screen.findByRole('listbox', { name: 'Region' })).toBeInTheDocument()
    unmount()

    const second = render(
      <>
        <MultiCombobox options={REGIONS} aria-label="Cities" />
      </>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Cities' }))
    expect(await screen.findByRole('listbox', { name: 'Cities' })).toBeInTheDocument()
    second.unmount()

    render(
      <>
        <Combobox options={REGIONS} placeholder="Choose a region" />
      </>,
    )
    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('listbox', { name: 'Choose a region' })).toBeInTheDocument()
  })

  it('does nothing on Enter while loading', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <Combobox options={REGIONS} loading onValueChange={onValueChange} aria-label="Region" />
      </>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Region' }))
    await screen.findByPlaceholderText('Search…')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

/* 7 ---------------------------------------------------------------- number */

describe('number input stepping', () => {
  it("keeps the value's own decimals when precision is not set", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <NumberInput defaultValue={1.5} onValueChange={onValueChange} aria-label="Amount" />
      </>,
    )
    const input = screen.getByLabelText('Amount')
    input.focus()
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(2.5)
    expect(input).toHaveValue('2.5')
  })

  it('still rounds off floating-point artefacts at the step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <NumberInput defaultValue={0.2} step={0.1} onValueChange={onValueChange} aria-label="Rate" />
      </>,
    )
    screen.getByLabelText('Rate').focus()
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(0.3)
  })
})

/* 8 ----------------------------------------------------------------- phone */

describe('phone input length', () => {
  it('keeps a North American number to ten digits in the field and the value alike', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { data } = renderInForm(
      <PhoneInput defaultCountry="US" name="phone" onValueChange={onValueChange} aria-label="Phone" />,
    )
    const input = screen.getByLabelText('Phone')
    await user.type(input, '41555501234567')
    expect(input).toHaveValue('(415) 555-0123')
    expect(onValueChange).toHaveBeenLastCalledWith('+14155550123', expect.anything())
    expect(data().get('phone')).toBe('+14155550123')
  })

  it('reads a leading 1 in front of ten digits as the trunk prefix', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <PhoneInput defaultCountry="US" onValueChange={onValueChange} aria-label="Phone" />
      </>,
    )
    await user.type(screen.getByLabelText('Phone'), '14155550123')
    expect(onValueChange).toHaveBeenLastCalledWith('+14155550123', expect.anything())
    expect(screen.getByLabelText('Phone')).toHaveValue('(415) 555-0123')
  })

  it('stops every other number at fifteen digits, with the field showing what the value holds', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <PhoneInput defaultCountry="GB" onValueChange={onValueChange} aria-label="Phone" />
      </>,
    )
    const input = screen.getByLabelText('Phone')
    await user.type(input, '12345678901234567890')
    const last = onValueChange.mock.calls.at(-1)![0] as string
    expect(last.replace(/\D/g, '')).toHaveLength(15)
    expect(`+44${(input as HTMLInputElement).value.replace(/\D/g, '')}`).toBe(last)
  })
})

/* 9 -------------------------------------------------------------- required */

describe('required from a field', () => {
  it('reaches the code, tags, colour and upload controls', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Field label="Code" required>
          <OtpInput length={4} />
        </Field>
        <Field label="Skills" required>
          <TagsInput />
        </Field>
        <Field label="Brand colour" required>
          <ColorInput />
        </Field>
        <Field label="Contract" required>
          <FileUpload />
        </Field>
        <Field label="Photos" required>
          <ImageUpload />
        </Field>
      </>,
    )
    for (const n of [1, 2, 3, 4]) {
      expect(screen.getByLabelText(`Character ${n} of 4`)).toBeRequired()
    }
    expect(screen.getByRole('textbox', { name: 'Skills' })).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('textbox', { name: 'Brand colour hex value' })).toBeRequired()

    const contract = screen.getByLabelText(/Contract/)
    expect(contract).toBeRequired()
    await user.upload(contract, new File(['a'], 'terms.pdf', { type: 'application/pdf' }))
    // Satisfied once a file is held: the picker itself is emptied after each pick.
    expect(contract).not.toBeRequired()

    // The label reads "Photos*": the required marker is part of its text.
    const photos = screen.getByLabelText(/Photos/)
    expect(photos).toBeRequired()
    await user.upload(photos, new File(['x'], 'roof.png', { type: 'image/png' }))
    expect(screen.getByLabelText(/Photos/)).not.toBeRequired()
  })

  it('lets the control’s own required prop win', () => {
    render(
      <>
        <Field label="Code" required>
          <OtpInput length={2} required={false} />
        </Field>
      </>,
    )
    expect(screen.getByLabelText('Character 1 of 2')).not.toBeRequired()
  })
})

/* 10 --------------------------------------------------------- floating bar */

describe('floating form actions', () => {
  it('marks the submit button busy while submitting', () => {
    render(
      <>
        <FloatingFormActions submitting onSubmit={() => undefined} />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute('aria-busy', 'true')
  })
})

/* 12 ------------------------------------------------------ single-file mode */

describe('single-file pickers', () => {
  it('FileUpload reports only the file it keeps, and refuses the rest as a count', () => {
    const onFilesAccepted = vi.fn()
    const onFileRejected = vi.fn()
    const { container } = render(
      <>
        <FileUpload maxFiles={3} onFilesAccepted={onFilesAccepted} onFileRejected={onFileRejected} />
      </>,
    )
    const a = new File(['a'], 'a.pdf', { type: 'application/pdf' })
    const b = new File(['b'], 'b.pdf', { type: 'application/pdf' })
    fireEvent.drop(container.querySelector('.sui-dropzone')!, { dataTransfer: { files: [a, b] } })
    expect(onFilesAccepted).toHaveBeenCalledWith([a])
    expect(onFileRejected).toHaveBeenCalledWith(b, 'count')
    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.queryByText('b.pdf')).not.toBeInTheDocument()
  })

  it('ImageUpload without multiple holds one image whatever maxFiles says', () => {
    const onValueChange = vi.fn()
    const onFileRejected = vi.fn()
    const { container } = render(
      <>
        <ImageUpload
          multiple={false}
          maxFiles={3}
          onValueChange={onValueChange}
          onFileRejected={onFileRejected}
        />
      </>,
    )
    const a = new File(['a'], 'a.png', { type: 'image/png' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })
    fireEvent.drop(container.querySelector('.sui-images')!, { dataTransfer: { files: [a, b] } })
    expect(onValueChange.mock.calls.at(-1)![0]).toHaveLength(1)
    expect(onFileRejected).toHaveBeenCalledWith(b, 'count')
  })
})

/* 13 ------------------------------------------------- upload field wiring */

describe('upload field wiring', () => {
  it('ImageUpload keeps the label target and its description when the grid is full', () => {
    render(
      <>
        <Field label="Logo" description="Square, at least 256px.">
          <ImageUpload
            multiple={false}
            maxSize={1_000_000}
            value={[{ url: 'https://example.com/logo.png', name: 'logo' }]}
            onValueChange={() => undefined}
          />
        </Field>
      </>,
    )
    const label = screen.getByText('Logo').closest('label')!
    const target = document.getElementById(label.htmlFor)
    expect(target).toBeInstanceOf(HTMLInputElement)
    expect(target).toBeDisabled()
    const described = (target!.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
    expect(described).toContain('Square, at least 256px.')
    expect(described).toContain(`${formatBytes(1_000_000)} each`)
  })

  it('FileUpload and ImageUpload describe their input with a custom hint', () => {
    render(
      <>
        <Field label="Contract">
          <FileUpload hint="PDF only" />
        </Field>
        <Field label="Photos">
          <ImageUpload hint="JPEG or PNG" />
        </Field>
      </>,
    )
    expect(screen.getByLabelText(/Contract/)).toHaveAccessibleDescription('PDF only')
    expect(screen.getByLabelText('Photos')).toHaveAccessibleDescription('JPEG or PNG')
  })
})

/* 14 ----------------------------------------------------------- colour name */

describe('colour input naming', () => {
  it('names the hex field and the presets from the field label', () => {
    render(
      <>
        <Field label="Brand colour">
          <ColorInput swatches={['#22c55e']} />
        </Field>
        <ColorInput swatches={['#22c55e']} />
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Brand colour hex value' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Brand colour presets' })).toBeInTheDocument()
    // Outside a field the generic names stay.
    expect(screen.getByRole('textbox', { name: 'Colour hex value' })).toBeInTheDocument()
  })
})

/* 15 ------------------------------------------------------------ tags paste */

describe('tags input paste validation', () => {
  it('shows the message for a pasted tag that fails and keeps it for correcting', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TagsInput
          aria-label="Emails"
          validate={(tag) => (tag.includes('@') ? null : 'Enter an email address.')}
        />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Emails' })
    await user.click(input)
    await user.paste('a@x.com, nope, b@x.com')
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'a@x.com',
      'b@x.com',
    ])
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address.')
    expect(input).toHaveValue('nope')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})

/* 16 ------------------------------------------------------- server helpers */

describe('pure helpers stay server-callable', () => {
  it("lives in modules without 'use client', and the barrel exports it from there", () => {
    // The directive as the first statement, as tests/boundaries.test.ts reads it.
    const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/
    for (const file of ['password-rules.ts', 'color.ts', 'format-bytes.ts']) {
      expect(DIRECTIVE.test(read(join(FORM, file))), file).toBe(false)
    }
    const barrel = read(join(FORM, 'index.ts'))
    expect(barrel).toContain("export { DEFAULT_PASSWORD_RULES, scorePassword } from './password-rules'")
    expect(barrel).toContain("export { DEFAULT_SWATCHES, normalizeHex } from './color'")
    expect(barrel).toContain("export { formatBytes } from './format-bytes'")
    // And no client module exports them any more.
    for (const file of ['password-strength.tsx', 'color-input.tsx', 'file-upload.tsx']) {
      expect(read(join(FORM, file)), file).not.toMatch(
        /export (const|function) (DEFAULT_PASSWORD_RULES|scorePassword|DEFAULT_SWATCHES|normalizeHex|formatBytes)\b/,
      )
    }
  })

  it('still works from the package entry', () => {
    expect(scorePassword('Str0ng!Passphrase', DEFAULT_PASSWORD_RULES).label).toBe('Strong')
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(DEFAULT_SWATCHES.length).toBeGreaterThan(0)
    expect(formatBytes(1_536_000)).toBe('1.5 MB')
  })
})

/* 17 --------------------------------------------------------- strength live */

describe('password strength announcements', () => {
  it('announces the verdict politely', () => {
    render(
      <>
        <PasswordStrengthIndicator password="abc" />
      </>,
    )
    const verdict = screen.getByText('Too short')
    expect(verdict).toHaveAttribute('aria-live', 'polite')
    expect(verdict).toHaveAttribute('aria-atomic', 'true')
  })

  it('can leave announcing to something else', () => {
    render(
      <>
        <PasswordStrengthIndicator password="abc" announce={false} />
      </>,
    )
    expect(screen.getByText('Too short')).not.toHaveAttribute('aria-live')
  })

  it('describes a PasswordInput with the verdict once', () => {
    render(
      <>
        <Field label="Password">
          <PasswordInput strength />
        </Field>
      </>,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAccessibleDescription(/Password strength: Too short/)
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ')
    const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    expect(text.match(/Password strength/g)).toHaveLength(1)
  })
})

/* axe over the changed controls together ---------------------------------- */

describe('accessibility of the audited controls', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <form>
          <Field label="Plan">
            <RadioGroup defaultValue="a" orientation="horizontal">
              <RadioGroupItem value="a" aria-label="A" />
              <RadioGroupItem value="b" aria-label="B" />
            </RadioGroup>
          </Field>
          <Field label="Brand colour" required>
            <ColorInput />
          </Field>
          <Field label="Code" required>
            <OtpInput length={4} />
          </Field>
          <Field label="Skills" required>
            <TagsInput defaultValue={['react']} />
          </Field>
          <Field label="Logo" description="Square." required>
            <ImageUpload
              multiple={false}
              maxSize={1_000_000}
              value={[{ url: 'https://example.com/logo.png', name: 'logo' }]}
              onValueChange={() => undefined}
            />
          </Field>
          <Field label="Contract" required>
            <FileUpload hint="PDF only" />
          </Field>
          <Checkbox defaultChecked="indeterminate" aria-label="Some rows" />
        </form>
      </>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    expect(within(container).getAllByRole('radio')).toHaveLength(2)
  })
})

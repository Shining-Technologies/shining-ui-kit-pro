import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Clock,
  ColorInput,
  Combobox,
  DateField,
  DateTimeField,
  Field,
  Fieldset,
  FileUpload,
  FloatingFormActions,
  ImageUpload,
  Input,
  InputGroup,
  Label,
  MultiCombobox,
  NumberInput,
  OtpInput,
  PasswordInput,
  PasswordStrengthIndicator,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  RatingInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  TagsInput,
  Textarea,
  TimeField,
  type ImageItem,
  type UploadItem,
} from '@shining-ui-kit/react'
import { useState } from 'react'
import { REGIONS } from '../data'
import { Demo } from './Demo'

const SKILLS = [
  { value: 'react', label: 'React', group: 'Front end' },
  { value: 'ts', label: 'TypeScript', group: 'Front end' },
  { value: 'css', label: 'CSS', group: 'Front end' },
  { value: 'node', label: 'Node', group: 'Back end' },
  { value: 'pg', label: 'PostgreSQL', group: 'Back end' },
  { value: 'go', label: 'Go', description: 'Not on this team yet', group: 'Back end' },
]

/**
 * Every field a form is built from.
 *
 * One page rather than several on purpose: the point of the kit is that a text
 * field, a date picker and an image upload sit on the same baseline, take the
 * same label treatment and repaint from the same tokens — which is only visible
 * when they are next to each other.
 */
export function FormInputs() {
  const [budget, setBudget] = useState([40])
  const [quantity, setQuantity] = useState<number | null>(3)
  const [price, setPrice] = useState<number | null>(1250)
  const [password, setPassword] = useState('summer2024')
  const [phone, setPhone] = useState('+61412345678')
  const [region, setRegion] = useState<string | null>('syd')
  const [regions, setRegions] = useState<string[]>(['syd', 'mel'])
  const [skills, setSkills] = useState<string[]>(['react', 'ts'])
  const [date, setDate] = useState<string | undefined>('2026-09-18')
  const [time, setTime] = useState<string | undefined>('09:30')
  const [slot, setSlot] = useState<string | undefined>('2026-09-18T14:00')
  const [inlineDate, setInlineDate] = useState('2026-09-18')
  const [inlineTime, setInlineTime] = useState('10:15')
  const [files, setFiles] = useState<UploadItem[]>([])
  const [photos, setPhotos] = useState<ImageItem[]>([])
  const [avatar, setAvatar] = useState<ImageItem[]>([])
  const [code, setCode] = useState('')
  const [tags, setTags] = useState<string[]>(['end of lease', 'urgent'])
  const [colour, setColour] = useState('#0a6b5a')
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [dirty, setDirty] = useState(true)

  return (
    <div className="stack">
      <Demo
        title="Field"
        note="Label, control, help text and error, wired together — the control never has to be told the ids."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Full name" description="As it appears on the account." required>
            <Input placeholder="Priya Raman" />
          </Field>
          <Field label="Email" error="That address is already in use.">
            <Input type="email" defaultValue="priya@example.com" />
          </Field>
          <Field label="Disabled" description="The field disables its own control." disabled>
            <Input placeholder="Not editable" />
          </Field>
          <Fieldset legend="Grouped">
            <Field label="Read only">
              <Input defaultValue="ACC-4821" readOnly />
            </Field>
          </Fieldset>
        </div>
      </Demo>

      <Demo
        title="Text"
        note="One control per kind of text, so the keyboard on a phone and the browser's own autofill both get it right."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Email" description="type=email — an @ key on mobile.">
            <InputGroup type="email" placeholder="you@example.com" prefix="@" />
          </Field>
          <Field label="Website" description="type=url.">
            <InputGroup type="url" placeholder="example.com" prefix="https://" />
          </Field>
          <Field label="Search">
            <InputGroup type="search" placeholder="Find a job…" prefix="⌕" />
          </Field>
          <Field label="Amount" description="An addon on each side.">
            <InputGroup defaultValue="1250.00" prefix="$" suffix="AUD" />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Number"
        note="Not input[type=number]: that one silently empties itself on a stray character and changes value when you scroll past it. This steps from the buttons and the arrow keys, formats on blur and clamps to its range."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Bedrooms" description={`min 1, max 10 — currently ${quantity ?? '—'}`}>
            <NumberInput value={quantity} onValueChange={setQuantity} min={1} max={10} />
          </Field>
          <Field label="Quote" description="Two decimals, grouped thousands, a prefix and a unit.">
            <NumberInput
              value={price}
              onValueChange={setPrice}
              min={0}
              step={50}
              precision={2}
              thousands
              prefix="$"
              suffix="AUD"
            />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Password"
        note="The reveal button is the default: masking is a shoulder-surfing defence, not a security boundary, and it costs far more in mistyped passwords than it saves."
        inline={false}
      >
        <div className="grid-2">
          <Field label="New password" description="With the strength meter and its checklist.">
            <PasswordInput
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              strength
            />
          </Field>
          <Field label="Confirm password" description="No reveal, no meter — it only has to match.">
            <PasswordInput revealable={false} placeholder="Type it again" />
          </Field>
          <Field
            label="Meter only"
            description="showRules={false}, for a sign-up form already long."
          >
            <Input value={password} readOnly />
            <PasswordStrengthIndicator password={password} showRules={false} />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Phone"
        note={`The country is a control rather than four characters to type, because +61 and +1 decide how the rest is parsed. The value is always E.164 — right now ${phone || '(empty)'}.`}
        inline={false}
      >
        <div className="grid-2">
          <Field label="Mobile" description="The full list, searchable by name or dialling code.">
            <PhoneInput value={phone} onValueChange={setPhone} />
          </Field>
          <Field label="Office" description="Preferred countries first, then everywhere else.">
            <PhoneInput defaultCountry="NZ" preferredCountries={['AU', 'NZ', 'GB', 'US']} />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Description"
        note="A plain box by default. Auto-grow moves everything under it on every keystroke, which is right for a composer and wrong for a dense form — so it is opt-in."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Access notes" description="Gate codes, pets, parking.">
            <Textarea rows={3} placeholder="Anything the crew should know…" />
          </Field>
          <Field label="Summary" description="Grows to eight rows, then scrolls. With a counter.">
            <Textarea
              autoResize
              maxRows={8}
              showCount
              maxLength={280}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Type a few lines and watch it grow…"
            />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Select"
        note="The native select is right up to about a dozen options. Past that, scanning beats scrolling and the combobox below is the answer."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Service type">
            <Select defaultValue="deep">
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular clean</SelectItem>
                <SelectItem value="deep">Deep clean</SelectItem>
                <SelectItem value="end">End of lease</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Disabled">
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Not available on this plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Demo>

      <Demo
        title="Select with search"
        note="A select you can type into. Filtering is local until you pass onSearch, at which point the same component asks the server instead."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Primary region" description="Grouped, with a second line per option.">
            <Combobox options={REGIONS} value={region} onValueChange={setRegion} clearable />
          </Field>
          <Field label="Empty state" description="What a search with no matches looks like.">
            <Combobox
              options={[]}
              emptyMessage="No regions match that"
              placeholder="Search regions…"
            />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Multi select"
        note="Selections are chips, not a comma-joined string — removing one is the thing people actually want to do. The list keeps its search box and stays open while you pick."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Coverage" description="Picks several; shows +n past three.">
            <MultiCombobox options={REGIONS} value={regions} onValueChange={setRegions} />
          </Field>
          <Field label="Skills" description="Searchable and grouped; one option is disabled.">
            <MultiCombobox
              options={SKILLS}
              value={skills}
              onValueChange={setSkills}
              searchPlaceholder="Search skills…"
              maxChips={4}
            />
          </Field>
          <Field label="Loading" description="While the server is still thinking.">
            <MultiCombobox options={[]} loading placeholder="Fetching regions…" />
          </Field>
          <Field label="Free text" description="Tags, for values that are not on a list at all.">
            <TagsInput value={tags} onValueChange={setTags} max={6} />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Date and time"
        note="The kit's own calendar and clock. The native pickers are the two controls that cannot be themed — their layout, placeholder and popover belong to the browser — so a form built from tokens ends up with two controls ignoring every one of them."
        inline={false}
      >
        <div className="grid-3">
          <Field label="Service date">
            <DateField value={date} onChange={setDate} label="Service date" />
          </Field>
          <Field label="Start time" description="Pick the hour, the dial turns to minutes.">
            <TimeField value={time} onChange={setTime} label="Start time" minuteStep={15} />
          </Field>
          <Field label="Appointment" description="Both at once, so the field is never half-set.">
            <DateTimeField value={slot} onChange={setSlot} label="Appointment" />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Calendar and clock, inline"
        note="The same two components without a popover — for a booking page where the choice is the whole screen rather than one field on it."
      >
        <Calendar value={inlineDate} onChange={setInlineDate} label="Choose a day" />
        <Clock value={inlineTime} onChange={setInlineTime} minuteStep={5} label="Choose a time" />
      </Demo>

      <Demo
        title="Files"
        note="The styled area is a label for a real file input, so the keyboard, form resets and the OS picker all work. Validation happens here; complaining about it is left to you."
        inline={false}
      >
        <div className="grid-2">
          <Field label="Documents" description="Any file, up to 5 MB each.">
            <FileUpload multiple maxSize={5_000_000} value={files} onValueChange={setFiles} />
          </Field>
          <Field label="Signed contract" description="A single PDF.">
            <FileUpload accept=".pdf" maxSize={10_000_000} />
          </Field>
        </div>
      </Demo>

      <Demo
        title="Images"
        note="A filename tells nobody which screenshot it is, so images get the picture instead of a list. Previews are object URLs, revoked when the tile goes — a FileReader preview holds every image in memory as base64 for the life of the page."
        inline={false}
      >
        <div className="grid-2">
          <Field
            label="Job photos"
            description="Up to four, 5 MB each. Drop them anywhere on the grid."
          >
            <ImageUpload
              value={photos}
              onValueChange={setPhotos}
              maxFiles={4}
              maxSize={5_000_000}
            />
          </Field>
          <Field label="Profile picture" description="One image, round tiles.">
            <ImageUpload
              value={avatar}
              onValueChange={setAvatar}
              multiple={false}
              shape="circle"
              maxSize={2_000_000}
            >
              Upload
            </ImageUpload>
          </Field>
        </div>
      </Demo>

      <Demo
        title="One-time code"
        note="One box per character, because that is what makes an SMS autofill land correctly — but it behaves as one control: typing advances, Backspace retreats, and pasting the whole code fills every box."
        inline={false}
      >
        <div className="grid-2">
          <Field
            label="Verification code"
            description={code.length === 6 ? '✓ Complete' : 'Six digits, sent by SMS.'}
          >
            <OtpInput value={code} onValueChange={setCode} groupEvery={3} />
          </Field>
          <Field label="Recovery PIN" description="Four characters, masked.">
            <OtpInput length={4} masked type="alphanumeric" />
          </Field>
        </div>
      </Demo>

      <Demo title="Colour and rating" inline={false}>
        <div className="grid-2">
          <Field label="Brand colour" description={`Swatch, hex or a preset — ${colour}.`}>
            <ColorInput value={colour} onValueChange={setColour} />
          </Field>
          <Field label="How did we do?" description="Arrows and Home/End work too.">
            <RatingInput
              value={rating}
              onValueChange={setRating}
              caption={`${rating} of 5`}
              aria-label="Service rating"
            />
          </Field>
        </div>
      </Demo>

      <Demo title="Choice" inline={false}>
        <div className="grid-2">
          <Fieldset legend="Frequency">
            <RadioGroup defaultValue="fortnightly">
              {['Weekly', 'Fortnightly', 'Monthly'].map((option) => (
                <div key={option} className="choice">
                  <RadioGroupItem value={option.toLowerCase()} id={`freq-${option}`} />
                  <Label htmlFor={`freq-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </Fieldset>

          <div className="stack-sm">
            <div className="choice">
              <Switch id="notify" defaultChecked />
              <Label htmlFor="notify">Email me when a job is completed</Label>
            </div>
            <div className="choice">
              <Switch id="sms" />
              <Label htmlFor="sms">Send SMS reminders</Label>
            </div>
            <div className="choice">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I accept the service agreement</Label>
            </div>
            <div className="choice">
              <Checkbox id="disabled-check" disabled />
              <Label htmlFor="disabled-check">Unavailable in this plan</Label>
            </div>
          </div>
        </div>
      </Demo>

      <Demo title="Slider" inline={false}>
        <Field label={`Budget cap — $${budget[0]}k`}>
          <Slider value={budget} onValueChange={setBudget} max={100} step={5} />
        </Field>
      </Demo>

      <Demo
        title="A complete form"
        note="The save bar is sticky and unmounts when hidden, so a screen reader is never offered a Save button that is not there."
        inline={false}
      >
        <Card style={{ maxWidth: '32rem' }}>
          <CardHeader>
            <CardTitle>Book a service</CardTitle>
          </CardHeader>
          <CardContent className="stack-sm">
            <Field label="Property address" required>
              <Input placeholder="12 Rundle Street, Adelaide" />
            </Field>
            <div className="grid-2">
              <Field label="Bedrooms">
                <NumberInput defaultValue={3} min={1} max={10} />
              </Field>
              <Field label="Bathrooms">
                <NumberInput defaultValue={2} min={1} max={10} />
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Date">
                <DateField value={date} onChange={setDate} label="Service date" />
              </Field>
              <Field label="Arrival">
                <TimeField value={time} onChange={setTime} label="Arrival time" minuteStep={15} />
              </Field>
            </div>
            <Field label="Contact number">
              <PhoneInput defaultCountry="AU" />
            </Field>
            <Field label="Access notes" description="Gate codes, pets, parking.">
              <Textarea rows={3} />
            </Field>
          </CardContent>
          <CardFooter bordered>
            <Button variant="ghost" onClick={() => setDirty(false)}>
              Cancel
            </Button>
            <Button
              style={{ marginInlineStart: 'auto' }}
              onClick={() => setDirty((value) => !value)}
            >
              Request quote
            </Button>
          </CardFooter>
        </Card>

        <FloatingFormActions
          visible={dirty}
          position="sticky"
          message="3 unsaved changes"
          onCancel={() => setDirty(false)}
          onSubmit={() => setDirty(false)}
        />
      </Demo>
    </div>
  )
}

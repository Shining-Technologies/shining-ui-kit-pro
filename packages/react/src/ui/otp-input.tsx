import {
  forwardRef,
  useRef,
  useState,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl, useFieldLabelId } from '../lib/field-context'

export interface OtpInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** How many characters the code has. */
  length?: number
  /**
   * The code: the characters in the boxes, in order, with empty boxes left out.
   * Controlled when defined; `''` is the empty code. The code is complete when
   * its length equals `length` — see the component's notes on deletion.
   */
  value?: string
  /** Initial code while uncontrolled. */
  defaultValue?: string
  /** Submitted with a native `<form>` through a hidden input holding the whole code. */
  name?: string
  onValueChange?: (value: string) => void
  /** Fires once every box is filled — usually where the code is submitted. */
  onComplete?: (value: string) => void
  /** `'numeric'` puts a digit keypad on phones; `'alphanumeric'` accepts letters. */
  type?: 'numeric' | 'alphanumeric'
  /** Draw a gap after every n boxes — `3` gives `123 456`. */
  groupEvery?: number
  /** Show dots instead of the characters. */
  masked?: boolean
  disabled?: boolean
  autoFocus?: boolean
  'aria-label'?: string
}

/** A code laid out one character per box, `''` for an empty box. */
function toSlots(code: string, length: number): string[] {
  return Array.from({ length }, (_, index) => code[index] ?? '')
}

/**
 * A one-time code, one box per character.
 *
 * The boxes are separate inputs because that is what makes an SMS autofill and
 * a paste from a password manager land correctly on every platform — but they
 * behave as one control: typing advances, Backspace retreats, arrows move, and
 * pasting the whole code fills every box at once rather than putting six
 * characters in the first one.
 *
 * **Deletion keeps positions.** Clearing the third box of `1234` leaves
 * `1 2 _ 4` on screen — nothing slides left into the hole. The value stays a
 * plain string: the characters in the boxes, in order, with the empty ones left
 * out (`'124'`), so a code is complete exactly when `value.length === length`
 * and `onComplete` only fires then. The layout with its hole is kept inside the
 * component for as long as the value that comes back is the one it emitted; a
 * different value from the parent (a reset to `''`, a code filled in by the
 * app) is laid out from the first box again.
 */
export const OtpInput = forwardRef<HTMLDivElement, OtpInputProps>(function OtpInput(
  {
    className,
    length = 6,
    value,
    defaultValue,
    name,
    onValueChange,
    onComplete,
    type = 'numeric',
    groupEvery,
    masked = false,
    disabled,
    autoFocus,
    'aria-label': ariaLabelProp,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const pattern = type === 'numeric' ? /[^\d]/g : /[^a-zA-Z0-9]/g
  const clean = (raw: string) => raw.replace(pattern, '').slice(0, length)

  // The boxes as last laid out here, holes included. Uncontrolled, this is the
  // state; controlled, it is a layout cache that the value must agree with.
  // The value is compared with what the layout spells rather than tracked
  // with an effect, so a parent's reset shows on the same render.
  const [layout, setLayout] = useState(() => toSlots(clean(value ?? defaultValue ?? ''), length))
  const own = Array.from({ length }, (_, index) => layout[index] ?? '')
  const slots =
    value !== undefined && clean(value) !== own.join('') ? toSlots(clean(value), length) : own
  const code = slots.join('')
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const isDisabled = disabled ?? field.disabled

  function commit(next: string[]) {
    setLayout(next)
    const joined = next.join('')
    onValueChange?.(joined)
    if (joined.length === length) onComplete?.(joined)
  }

  function focusBox(index: number) {
    inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus()
  }

  /** Write characters from a box onwards, and move to the box after them. */
  function write(index: number, typed: string) {
    // Not past the last filled box: typing into an empty box at the end of
    // the row lands straight after the code, and the caret follows it there.
    // A hole left by a deletion is inside the code, so it is filled in place.
    const end = slots.reduce((last, char, position) => (char ? position + 1 : last), 0)
    const start = Math.min(index, end)
    const next = [...slots]
    typed.split('').forEach((char, offset) => {
      if (start + offset < length) next[start + offset] = char
    })
    commit(next)
    focusBox(start + typed.length)
  }

  function onBoxChange(index: number, raw: string) {
    let typed = raw.replace(pattern, '')
    if (!typed) return
    // A key pressed in a box that already holds a character (the caret beside
    // it rather than selecting it) arrives as both: keep only the new one.
    const previous = slots[index]
    if (previous && typed.length === 2 && typed.includes(previous)) {
      typed = typed[0] === previous ? typed.slice(1) : typed.slice(0, 1)
    }
    // More than one character means an autofill or a paste landed in this box.
    write(index, typed)
  }

  function clearBox(index: number) {
    const next = [...slots]
    next[index] = ''
    commit(next)
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      // The box is emptied where it stands; the characters after it stay put.
      if (slots[index]) {
        clearBox(index)
      } else if (index > 0) {
        clearBox(index - 1)
        focusBox(index - 1)
      }
      return
    }
    if (event.key === 'Delete') {
      event.preventDefault()
      if (slots[index]) clearBox(index)
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(pattern, '')
    if (!pasted) return
    // A whole code replaces what is there, whichever box has the caret — that
    // is what a paste from an SMS or a password manager means. Anything
    // shorter is typed in from the box it landed in, not over the whole code.
    if (pasted.length >= length) {
      commit(toSlots(pasted.slice(0, length), length))
      focusBox(length - 1)
    } else write(index, pasted)
  }

  return (
    <div
      ref={ref}
      data-slot="otp-input"
      role="group"
      // Inside a labelled `<Field>` the group takes the field's label; the
      // default name is only for a code input standing on its own.
      aria-label={ariaLabelProp ?? (labelId ? undefined : 'One-time code')}
      aria-labelledby={ariaLabelProp ? undefined : labelId}
      aria-describedby={field['aria-describedby']}
      className={cn('sui-otp', className)}
      {...props}
    >
      {slots.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node
          }}
          // The field's `<label for>` lands on the first box.
          id={index === 0 ? field.id : undefined}
          // `text` rather than `password`: masking is done in CSS so the caret,
          // the width and the font stay under the kit's control.
          type="text"
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={isDisabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Character ${index + 1} of ${length}`}
          aria-invalid={field['aria-invalid']}
          className={cn('sui-otp__box sui-focusable', masked && 'sui-otp__box--masked')}
          data-gap={groupEvery && index > 0 && index % groupEvery === 0 ? true : undefined}
          data-filled={char ? true : undefined}
          value={char}
          onChange={(event) => onBoxChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={(event) => onPaste(index, event)}
          onFocus={(event) => event.target.select()}
        />
      ))}
      {name ? <input type="hidden" name={name} value={code} disabled={isDisabled} /> : null}
    </div>
  )
})

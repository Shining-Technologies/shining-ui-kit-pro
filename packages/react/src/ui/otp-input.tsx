import {
  forwardRef,
  useRef,
  useState,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'

export interface OtpInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** How many characters the code has. */
  length?: number
  value?: string
  onValueChange?: (value: string) => void
  /** Fires once the last box is filled — usually where the code is submitted. */
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

/**
 * A one-time code, one box per character.
 *
 * The boxes are separate inputs because that is what makes an SMS autofill and
 * a paste from a password manager land correctly on every platform — but they
 * behave as one control: typing advances, Backspace retreats, arrows move, and
 * pasting the whole code fills every box at once rather than putting six
 * characters in the first one.
 */
export const OtpInput = forwardRef<HTMLDivElement, OtpInputProps>(function OtpInput(
  {
    className,
    length = 6,
    value,
    onValueChange,
    onComplete,
    type = 'numeric',
    groupEvery,
    masked = false,
    disabled,
    autoFocus,
    'aria-label': ariaLabel = 'One-time code',
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const [internal, setInternal] = useState('')
  const code = (value ?? internal).slice(0, length)
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const isDisabled = disabled ?? field.disabled

  const pattern = type === 'numeric' ? /[^\d]/g : /[^a-zA-Z0-9]/g

  function commit(next: string) {
    const clean = next.replace(pattern, '').slice(0, length)
    if (value === undefined) setInternal(clean)
    onValueChange?.(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }

  function focusBox(index: number) {
    inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus()
  }

  function onBoxChange(index: number, raw: string) {
    const typed = raw.replace(pattern, '')
    if (!typed) return
    const chars = code.padEnd(length, ' ').split('')
    // More than one character means an autofill or a paste landed in this box.
    typed.split('').forEach((char, offset) => {
      if (index + offset < length) chars[index + offset] = char
    })
    commit(chars.join('').trimEnd())
    focusBox(index + typed.length)
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (code[index]) {
        commit(code.slice(0, index) + code.slice(index + 1))
      } else if (index > 0) {
        commit(code.slice(0, index - 1) + code.slice(index))
        focusBox(index - 1)
      }
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

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = commit(event.clipboardData.getData('text'))
    focusBox(pasted.length)
  }

  return (
    <div
      ref={ref}
      data-slot="otp-input"
      role="group"
      aria-label={ariaLabel}
      aria-describedby={field['aria-describedby']}
      className={cn('sui-otp', className)}
      {...props}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node
          }}
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
          data-filled={code[index] ? true : undefined}
          value={code[index] ?? ''}
          onChange={(event) => onBoxChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  )
})

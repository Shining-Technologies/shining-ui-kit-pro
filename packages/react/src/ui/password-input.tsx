import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { EyeIcon, EyeOffIcon } from '../lib/icons'
import { PasswordStrengthIndicator, type PasswordRule } from './password-strength'

// React 18 warns for every `useLayoutEffect` rendered on the server; reading
// the DOM is meaningless there anyway, so the server gets a no-op.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Show the strength meter and checklist under the field. */
  strength?: boolean
  /** Rules the meter scores against. Ignored unless `strength` is set. */
  rules?: PasswordRule[]
  /** Meter only, without the per-rule checklist. */
  showRules?: boolean
  /** Hide the reveal button — for a confirmation field, where it adds nothing. */
  revealable?: boolean
  /** Warn when Caps Lock is on. On by default: it is the commonest typo there is. */
  capsLockWarning?: boolean
  hint?: ReactNode
  wrapperClassName?: string
}

/**
 * A password field that can be read back.
 *
 * Masking is a shoulder-surfing defence, not a security boundary, and enforcing
 * it costs far more in mistyped passwords than it saves — so the reveal button
 * is the default and turning it off is the deliberate act.
 *
 * The button is a real `<button type="button">` inside the control, which keeps
 * it in the tab order and out of the way of form submission.
 *
 * The strength meter reads the input itself, not only its own `onChange`: a
 * form library's `reset()` or `setValue()` writes the DOM value directly and
 * fires no event, and a meter that listened only to typing would go on scoring
 * the password that was just cleared. The hint and the strength verdict are
 * added to the input's `aria-describedby`, after the field's own description.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      className,
      wrapperClassName,
      strength = false,
      rules,
      showRules = true,
      revealable = true,
      capsLockWarning = true,
      hint,
      value,
      defaultValue,
      onChange,
      onKeyUp,
      onBlur,
      'aria-describedby': describedByProp,
      ...props
    },
    ref,
  ) {
    const field = useFieldControl()
    const hintId = useId()
    const strengthId = useId()
    const [visible, setVisible] = useState(false)
    const [capsLock, setCapsLock] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)
    // The meter needs the text even when the caller does not control it.
    const [internal, setInternal] = useState(String(defaultValue ?? ''))
    const text = value === undefined ? internal : String(value)

    // Re-read the DOM after every render. A form library that resets a
    // registered field writes `input.value` and then re-renders the form; this
    // is where the meter catches up. `setInternal` bails out when unchanged.
    useIsomorphicLayoutEffect(() => {
      if (value === undefined && inputRef.current) setInternal(inputRef.current.value)
    })

    // A native `form.reset()` — which React Hook Form also calls — restores the
    // default value after the `reset` event has been dispatched, so the value
    // is read on the next tick rather than inside the listener.
    useEffect(() => {
      const form = inputRef.current?.form
      if (!form || value !== undefined) return
      let timer: ReturnType<typeof setTimeout> | undefined
      const onReset = () => {
        timer = setTimeout(() => {
          if (inputRef.current) setInternal(inputRef.current.value)
        })
      }
      form.addEventListener('reset', onReset)
      return () => {
        form.removeEventListener('reset', onReset)
        clearTimeout(timer)
      }
    }, [value])

    function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
      if (capsLockWarning) setCapsLock(event.getModifierState?.('CapsLock') ?? false)
      onKeyUp?.(event)
    }

    const describedBy =
      [
        field['aria-describedby'],
        describedByProp,
        hint ? hintId : null,
        strength ? strengthId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined

    return (
      <div className="sui-password">
        <div
          className={cn('sui-input-group sui-password__control', wrapperClassName)}
          data-slot="password-input"
        >
          <input
            ref={(node) => {
              inputRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
            }}
            type={visible ? 'text' : 'password'}
            // A field that rates the password is choosing a new one, and
            // `new-password` is what makes a password manager offer to generate it.
            autoComplete={strength ? 'new-password' : 'current-password'}
            className={cn('sui-input-group__input', className)}
            {...field}
            {...props}
            aria-describedby={describedBy}
            value={value}
            defaultValue={defaultValue}
            onChange={(event) => {
              if (value === undefined) setInternal(event.target.value)
              onChange?.(event)
            }}
            onKeyUp={trackCapsLock}
            onBlur={(event) => {
              setCapsLock(false)
              onBlur?.(event)
            }}
          />
          {revealable ? (
            <button
              type="button"
              className="sui-password__reveal sui-focusable"
              // Announced as a state, so a screen reader hears what pressing it does.
              aria-pressed={visible}
              aria-label={visible ? 'Hide password' : 'Show password'}
              disabled={props.disabled ?? field.disabled}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          ) : null}
        </div>

        {capsLock ? (
          <p className="sui-password__caps" role="status">
            Caps Lock is on
          </p>
        ) : null}
        {hint ? (
          <p id={hintId} className="sui-password__hint">
            {hint}
          </p>
        ) : null}

        {strength ? (
          <PasswordStrengthIndicator
            id={strengthId}
            password={text}
            rules={rules}
            showRules={showRules}
          />
        ) : null}
      </div>
    )
  },
)

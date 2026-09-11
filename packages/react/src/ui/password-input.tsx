import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'
import { EyeIcon, EyeOffIcon } from '../lib/icons'
import { PasswordStrengthIndicator, type PasswordRule } from './password-strength'

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
      ...props
    },
    ref,
  ) {
    const field = useFieldControl()
    const [visible, setVisible] = useState(false)
    const [capsLock, setCapsLock] = useState(false)
    // The meter needs the text even when the caller does not control it.
    const [internal, setInternal] = useState(String(defaultValue ?? ''))
    const text = value === undefined ? internal : String(value)

    function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
      if (capsLockWarning) setCapsLock(event.getModifierState?.('CapsLock') ?? false)
      onKeyUp?.(event)
    }

    return (
      <div className="sui-password">
        <div
          className={cn('sui-input-group sui-password__control', wrapperClassName)}
          data-slot="password-input"
        >
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            className={cn('sui-input-group__input', className)}
            {...field}
            {...props}
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
        {hint ? <p className="sui-password__hint">{hint}</p> : null}

        {strength ? (
          <PasswordStrengthIndicator password={text} rules={rules} showRules={showRules} />
        ) : null}
      </div>
    )
  },
)

'use client'

import { forwardRef, useMemo, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { CheckIcon, CloseIcon } from '../icons/icons'
import {
  DEFAULT_PASSWORD_RULES,
  PASSWORD_SCORE_LABELS,
  scorePassword,
  type PasswordRule,
  type PasswordScore,
} from './password-rules'

const SCORE_TONES = ['destructive', 'destructive', 'warning', 'info', 'success'] as const

export interface PasswordStrengthIndicatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  password: string
  rules?: PasswordRule[]
  /** Hide the per-rule checklist and show only the meter. */
  showRules?: boolean
  /** Override the computed score, e.g. from zxcvbn on the server. */
  score?: PasswordScore
  /**
   * Announce a changed verdict politely (`aria-live`). On by default; turn it
   * off where something else already announces the strength.
   */
  announce?: boolean
}

/**
 * How strong the password is, and what would make it stronger.
 *
 * The checklist is the useful half: a bare meter tells someone they have failed
 * without telling them what to change, which is how people end up appending
 * `1!` to a weak password and calling it done.
 *
 * The meter itself is `aria-hidden` and the verdict is announced as text —
 * a screen reader gets the sentence, not four coloured bars. Only the verdict
 * is live, and a live region speaks only when its text changes: typing that
 * keeps the same verdict says nothing, and a field that lists the indicator in
 * its `aria-describedby` (as `PasswordInput` does) is described on focus, which
 * is not a change, so the verdict is not spoken twice.
 */
export const PasswordStrengthIndicator = forwardRef<HTMLDivElement, PasswordStrengthIndicatorProps>(
  function PasswordStrengthIndicator(
    {
      className,
      password,
      rules = DEFAULT_PASSWORD_RULES,
      showRules = true,
      score,
      announce = true,
      ...props
    },
    ref,
  ) {
    const result = useMemo(() => scorePassword(password, rules), [password, rules])
    const value = score ?? result.score
    const tone = SCORE_TONES[value]

    return (
      <div
        ref={ref}
        data-slot="password-strength"
        data-score={value}
        className={cn('sui-strength', className)}
        {...props}
      >
        <div className="sui-strength__meter" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn('sui-strength__bar', step <= value && `sui-strength__bar--${tone}`)}
            />
          ))}
        </div>

        <p
          className={cn('sui-strength__verdict', `sui-strength__verdict--${tone}`)}
          aria-live={announce ? 'polite' : undefined}
          aria-atomic={announce ? true : undefined}
        >
          <span className="sui-visually-hidden">Password strength: </span>
          {PASSWORD_SCORE_LABELS[value]}
        </p>

        {showRules ? (
          <ul className="sui-strength__rules">
            {rules.map((rule) => {
              const ok = result.passed.includes(rule.id)
              return (
                <li
                  key={rule.id}
                  className={cn('sui-strength__rule', ok && 'sui-strength__rule--met')}
                >
                  <span className="sui-strength__rule-icon" aria-hidden="true">
                    {ok ? <CheckIcon /> : <CloseIcon />}
                  </span>
                  {rule.label}
                  <span className="sui-visually-hidden">{ok ? ' — met' : ' — not met'}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    )
  },
)

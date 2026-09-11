import { forwardRef, useMemo, type HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon, CloseIcon } from '../lib/icons'

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

/**
 * The default rules.
 *
 * Length is listed first because it is the one that actually matters — a
 * fourteen-character passphrase beats `P@ssw0rd!` by orders of magnitude — and
 * `scorePassword` gives it the last word on top of the plain rule count.
 */
export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { id: 'case', label: 'Upper and lower case', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export type PasswordScore = 0 | 1 | 2 | 3 | 4

const SCORE_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const
const SCORE_TONES = ['destructive', 'destructive', 'warning', 'info', 'success'] as const

export interface PasswordStrengthResult {
  score: PasswordScore
  label: string
  passed: string[]
  failed: string[]
}

/**
 * Rules passed, with length as the axis that overrides the rest.
 *
 * Two corrections to a plain rule count, both of which exist because a naive
 * meter teaches the wrong lesson: a password under eight characters cannot
 * rate above "Weak" however many character classes it crams in, and a long
 * passphrase is credited for its length even when it uses none of them.
 */
export function scorePassword(
  password: string,
  rules: PasswordRule[] = DEFAULT_PASSWORD_RULES,
): PasswordStrengthResult {
  const passed: string[] = []
  const failed: string[] = []
  for (const rule of rules) (rule.test(password) ? passed : failed).push(rule.id)

  let score = passed.length
  if (password.length >= 16) score += 1
  if (password.length < 8) score = Math.min(score, 1)
  if (password.length === 0) score = 0

  const capped = Math.max(0, Math.min(4, score)) as PasswordScore
  return { score: capped, label: SCORE_LABELS[capped], passed, failed }
}

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
}

/**
 * How strong the password is, and what would make it stronger.
 *
 * The checklist is the useful half: a bare meter tells someone they have failed
 * without telling them what to change, which is how people end up appending
 * `1!` to a weak password and calling it done.
 *
 * The meter itself is `aria-hidden` and the verdict is announced as text —
 * a screen reader gets the sentence, not four coloured bars.
 */
export const PasswordStrengthIndicator = forwardRef<HTMLDivElement, PasswordStrengthIndicatorProps>(
  function PasswordStrengthIndicator(
    { className, password, rules = DEFAULT_PASSWORD_RULES, showRules = true, score, ...props },
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

        <p className={cn('sui-strength__verdict', `sui-strength__verdict--${tone}`)}>
          <span className="sui-visually-hidden">Password strength: </span>
          {SCORE_LABELS[value]}
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

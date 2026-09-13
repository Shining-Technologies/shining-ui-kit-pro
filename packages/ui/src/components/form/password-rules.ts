/**
 * Password scoring, with no React and no `'use client'`.
 *
 * Kept apart from `PasswordStrengthIndicator` so a Server Action can score the
 * password it receives with the same rules the form showed: an export of a
 * client module is only a client reference on the server, and cannot be called.
 */

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

/** The verdict for each score, in score order. */
export const PASSWORD_SCORE_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const

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
  return { score: capped, label: PASSWORD_SCORE_LABELS[capped], passed, failed }
}

'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button/button'
import { Spinner } from '../feedback/feedback'

export interface FloatingFormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Show the bar. Usually the form's dirty flag. */
  visible?: boolean
  /** The message on the left — "3 unsaved changes". */
  message?: ReactNode
  submitLabel?: ReactNode
  cancelLabel?: ReactNode
  onSubmit?: () => void
  onCancel?: () => void
  /** Disables both buttons and marks submit as busy. */
  submitting?: boolean
  disabled?: boolean
  /** Replace the buttons entirely. */
  children?: ReactNode
  /** `sticky` rides the page; `fixed` pins the bar to the viewport. */
  position?: 'sticky' | 'fixed'
}

/**
 * The save bar for a long form.
 *
 * A form taller than the viewport puts its actions somewhere the person filling
 * it in cannot see, and "did that save?" follows. This keeps the answer in
 * front of them without a floating button that covers the last field.
 *
 * It is unmounted when not visible rather than merely transparent, so a
 * screen reader is not offered a Save button that is not there yet. While
 * `submitting`, the submit button is `aria-busy` as well as disabled.
 */
export const FloatingFormActions = forwardRef<HTMLDivElement, FloatingFormActionsProps>(
  function FloatingFormActions(
    {
      className,
      visible = true,
      message,
      submitLabel = 'Save changes',
      cancelLabel = 'Discard',
      onSubmit,
      onCancel,
      submitting = false,
      disabled = false,
      position = 'sticky',
      children,
      ...props
    },
    ref,
  ) {
    if (!visible) return null

    return (
      <div
        ref={ref}
        data-slot="floating-form-actions"
        className={cn('sui-form-actions', `sui-form-actions--${position}`, className)}
        {...props}
      >
        {message ? <span className="sui-form-actions__message">{message}</span> : null}
        <div className="sui-form-actions__buttons">
          {children ?? (
            <>
              {onCancel ? (
                <Button variant="ghost" onClick={onCancel} disabled={submitting}>
                  {cancelLabel}
                </Button>
              ) : null}
              <Button
                onClick={onSubmit}
                disabled={disabled || submitting}
                aria-busy={submitting || undefined}
              >
                {submitting ? <Spinner size="sm" label={null} /> : null}
                {submitLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  },
)

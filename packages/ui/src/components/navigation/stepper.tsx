'use client'

import { forwardRef, type OlHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckIcon } from '../icons/icons'

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

export interface StepperStep {
  id: string
  label: ReactNode
  /** A line under the label: what the step asks for, or what was entered. */
  description?: ReactNode
  /**
   * Replaces the status worked out from `activeStep`. Use `'error'` for a step
   * that needs fixing. The others are rarely needed.
   */
  status?: StepStatus
  /** Adds "Optional" under the label. */
  optional?: boolean
  /** The step cannot be clicked, even when `onStepClick` is set. */
  disabled?: boolean
}

export interface StepperProps extends Omit<OlHTMLAttributes<HTMLOListElement>, 'onClick'> {
  steps: StepperStep[]
  /** The current step, **0-based**. Steps before it are complete; steps after it are upcoming. */
  activeStep: number
  orientation?: 'horizontal' | 'vertical'
  /**
   * Makes steps clickable, for going back to an earlier step. By default only
   * completed and errored steps can be clicked. With `linear={false}`, every
   * step can be clicked.
   */
  onStepClick?: (index: number, step: StepperStep) => void
  /** With `false`, any step can be clicked, not only the ones already reached. */
  linear?: boolean
  size?: 'sm' | 'default'
  /**
   * Text that screen readers hear with each step's label, and the visible
   * "Optional" text. Change these to translate them.
   */
  labels?: {
    complete?: string
    current?: string
    error?: string
    optional?: string
  }
}

const statusOf = (step: StepperStep, index: number, active: number): StepStatus =>
  step.status ?? (index < active ? 'complete' : index === active ? 'current' : 'upcoming')

/**
 * Progress through a task done in order: checkout, onboarding, a long form
 * split into steps.
 *
 * It is an ordered list. The current step has `aria-current="step"`, and each
 * status (Completed, Current or Error) is read with the step's label, so a
 * screen reader can tell the steps apart without seeing the colours.
 *
 * The stepper only shows where the user is. It does not own the step content.
 * Render the current step's form beside it, and move `activeStep` when the
 * user goes forward.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  {
    className,
    steps,
    activeStep,
    orientation = 'horizontal',
    onStepClick,
    linear = true,
    size = 'default',
    labels,
    ...props
  },
  ref,
) {
  const statusText: Record<StepStatus, string | undefined> = {
    complete: labels?.complete ?? 'Completed',
    current: labels?.current ?? 'Current',
    error: labels?.error ?? 'Error',
    upcoming: undefined,
  }

  return (
    <ol
      ref={ref}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        'sui-stepper',
        orientation === 'vertical' && 'sui-stepper--vertical',
        size === 'sm' && 'sui-stepper--sm',
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const status = statusOf(step, index, activeStep)
        const reachable = !linear || status === 'complete' || status === 'error'
        const clickable =
          Boolean(onStepClick) && reachable && !step.disabled && status !== 'current'
        const spoken = statusText[status]

        const body = (
          <>
            <span className="sui-stepper__indicator" aria-hidden="true">
              {status === 'complete' ? (
                <CheckIcon />
              ) : status === 'error' ? (
                <AlertIcon />
              ) : (
                index + 1
              )}
            </span>
            <span className="sui-stepper__text">
              <span className="sui-stepper__label">
                {step.label}
                {spoken ? <span className="sui-visually-hidden">{` (${spoken})`}</span> : null}
              </span>
              {step.optional ? (
                <span className="sui-stepper__optional">{labels?.optional ?? 'Optional'}</span>
              ) : null}
              {step.description ? (
                <span className="sui-stepper__description">{step.description}</span>
              ) : null}
            </span>
          </>
        )

        return (
          <li
            key={step.id}
            data-status={status}
            aria-current={status === 'current' ? 'step' : undefined}
            className="sui-stepper__step"
          >
            {clickable ? (
              <button
                type="button"
                className="sui-stepper__button sui-focusable"
                onClick={() => onStepClick?.(index, step)}
              >
                {body}
              </button>
            ) : (
              <span className="sui-stepper__button" aria-disabled={step.disabled || undefined}>
                {body}
              </span>
            )}
            {index < steps.length - 1 ? (
              <span className="sui-stepper__connector" aria-hidden="true" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
})

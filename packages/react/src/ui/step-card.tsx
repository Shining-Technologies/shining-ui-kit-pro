import { forwardRef, type ElementType, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { CheckIcon } from '../lib/icons'
import { Card, CardContent, CardDescription, CardFooter, type CardProps } from './card'

export type StepCardState = 'upcoming' | 'current' | 'done'

export interface StepCardProps extends Omit<CardProps, 'title' | 'asChild'> {
  /** The position in the sequence — usually a number. */
  step?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** What has to be true for the process to leave this step. */
  condition?: ReactNode
  /** The lead-in for `condition`. */
  conditionLabel?: ReactNode
  /**
   * Where a live record is. Omit for a card that documents a process rather
   * than tracking one; set it and the index becomes a marker for the state.
   */
  state?: StepCardState
  /** The title's element — a heading level that fits the page outline. */
  titleAs?: 'div' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * One stage of a multi-step process, with the rule that ends it.
 *
 * A grid of these explains a workflow — what happens at each stage and what
 * moves it on — in the shape people already read processes in. Put a
 * `StatusFlow` inside to show which states the stage covers.
 *
 * The condition footer is pushed to the bottom of the card, so a row of steps
 * with descriptions of different lengths still lines their rules up.
 */
export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(function StepCard(
  {
    className,
    step,
    title,
    description,
    condition,
    conditionLabel = 'Moves on when:',
    state,
    titleAs = 'div',
    children,
    ...props
  },
  ref,
) {
  const Title = titleAs as ElementType
  return (
    <Card
      ref={ref}
      data-slot="step-card"
      data-state={state}
      aria-current={state === 'current' ? 'step' : undefined}
      className={cn('sui-step-card', state && `sui-step-card--${state}`, className)}
      {...props}
    >
      <div className="sui-step-card__header">
        <Title className="sui-step-card__title">
          {step !== undefined ? (
            <span className="sui-step-card__index">
              {state === 'done' ? (
                <>
                  <CheckIcon />
                  <span className="sui-sr-only">Step {step}, done:</span>
                </>
              ) : state ? (
                step
              ) : (
                <>{step}.</>
              )}
            </span>
          ) : null}
          <span>{title}</span>
        </Title>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>

      {children ? <CardContent className="sui-step-card__body">{children}</CardContent> : null}

      {condition ? (
        <CardFooter bordered className="sui-step-card__condition">
          <p>
            <strong>{conditionLabel}</strong> {condition}
          </p>
        </CardFooter>
      ) : null}
    </Card>
  )
})

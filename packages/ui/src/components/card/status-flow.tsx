'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ArrowRightIcon, CheckIcon } from '../icons/icons'
import {
  resolveStatus,
  statusBadgeVariants,
  useStatusRegistry,
  type StatusTone,
  type StatusVocabulary,
} from '../badge/status-badge'

/** A raw status value, or one with its label and tone spelled out inline. */
export type StatusFlowStep = string | { status: string; label?: ReactNode; tone?: StatusTone }

export type StatusFlowStepState = 'done' | 'current' | 'upcoming'

export interface StatusFlowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The happy path, in order. */
  steps: StatusFlowStep[]
  /** States that sit off the main path — failures, detours, dead ends. */
  alternates?: StatusFlowStep[]
  /** The lead-in before the alternates. */
  alternatesLabel?: ReactNode
  /** Names the alternates list for assistive tech. */
  alternatesListLabel?: string
  /**
   * Where the record is now: an index into `steps`, or a status value. Steps
   * before it read as done, steps after it as still to come. Omit to show the
   * flow as a legend.
   *
   * A status may also name one of the `alternates` — a record that is sitting
   * in "rejected" right now. That chip becomes the current one, and the main
   * path reads as done up to `reached`.
   */
  current?: number | string
  /**
   * With `current` on an alternate: the last step of the main path the record
   * got to before it left it, as an index or a status. Defaults to the step
   * before the last — an alternate usually stands in for the final outcome,
   * as "rejected" does for "accepted".
   */
  reached?: number | string
  /** Which registry vocabulary to resolve the step values against. */
  type?: string
  /** A one-off vocabulary, as on `StatusBadge`. */
  statuses?: StatusVocabulary
  /** Names the list for assistive tech, e.g. `'Quote lifecycle'`. */
  label?: string
  size?: 'sm' | 'md' | 'lg'
  /**
   * The words read after a done or upcoming chip, in brackets — the state its
   * check mark, dashed outline and colour show. Defaults to `done` and `upcoming`.
   */
  stateLabels?: { done?: string; upcoming?: string }
}

const statusOf = (step: StatusFlowStep) => (typeof step === 'string' ? step : step.status)

/** The first step with this status — exact, then case-insensitive, as the registry resolves. */
function indexOfStatus(list: StatusFlowStep[] | undefined, status: string): number {
  if (!list) return -1
  const exact = list.findIndex((step) => statusOf(step) === status)
  if (exact !== -1) return exact
  const lower = status.toLowerCase()
  return list.findIndex((step) => statusOf(step).toLowerCase() === lower)
}

function toIndex(steps: StatusFlowStep[], at: number | string): number {
  return typeof at === 'number' ? at : indexOfStatus(steps, at)
}

/**
 * Where the record is: an index on the main path, or an alternate. A status
 * that names neither leaves the flow a legend rather than guessing.
 */
function resolveCurrent(
  steps: StatusFlowStep[],
  alternates: StatusFlowStep[] | undefined,
  current: number | string | undefined,
  reached: number | string | undefined,
): { main?: number; alternate?: number; reached?: number } {
  if (current === undefined) return {}
  if (typeof current === 'number') return { main: current }
  const main = indexOfStatus(steps, current)
  if (main !== -1) return { main }
  const alternate = indexOfStatus(alternates, current)
  if (alternate === -1) return {}
  return { alternate, reached: reached === undefined ? steps.length - 2 : toIndex(steps, reached) }
}

function stepStateAt(
  index: number,
  position: ReturnType<typeof resolveCurrent>,
): StatusFlowStepState | undefined {
  if (position.main !== undefined) {
    if (index < position.main) return 'done'
    return index === position.main ? 'current' : 'upcoming'
  }
  if (position.alternate !== undefined) {
    return index <= (position.reached ?? -1) ? 'done' : 'upcoming'
  }
  return undefined
}

/**
 * A lifecycle, drawn: the states a record moves through, left to right.
 *
 * Built on the status badge's vocabulary, so the same `'quote_sent'` that
 * renders as a badge in a table row renders as the same word and colour here —
 * the documentation of a workflow cannot drift from the workflow's own chips.
 *
 * With `current` set it doubles as a tracker. The arrow lives inside each item
 * so that a wrapped flow never starts a line with an orphaned arrow.
 */
export const StatusFlow = forwardRef<HTMLDivElement, StatusFlowProps>(function StatusFlow(
  {
    className,
    steps,
    alternates,
    alternatesLabel = 'Or:',
    alternatesListLabel = 'Other outcomes',
    current,
    reached,
    type,
    statuses,
    label,
    size,
    stateLabels,
    ...props
  },
  ref,
) {
  const registry = useStatusRegistry()

  const renderChip = (step: StatusFlowStep, state?: StatusFlowStepState) => {
    const spec = typeof step === 'string' ? { status: step } : step
    const resolved = resolveStatus(registry, spec.status, { type, statuses })
    // Only what is still to come is greyed out; done and current keep their meaning.
    const tone = state === 'upcoming' ? 'neutral' : (spec.tone ?? resolved.tone)
    // `current` is carried by `aria-current`; the other two need words, because
    // the check, the dashed outline and the grey are all visual.
    const spoken =
      state === 'done'
        ? (stateLabels?.done ?? 'done')
        : state === 'upcoming'
          ? (stateLabels?.upcoming ?? 'upcoming')
          : undefined

    return (
      <span
        className={cn(
          statusBadgeVariants({ tone, size, dot: false }),
          'sui-status-flow__chip',
          state && `sui-status-flow__chip--${state}`,
        )}
        data-status={spec.status}
      >
        {state === 'done' ? <CheckIcon className="sui-status-flow__check" /> : null}
        {spec.label ?? resolved.label}
        {spoken ? <span className="sui-sr-only"> ({spoken})</span> : null}
      </span>
    )
  }

  // Positional as well as by value: a flow may pass through the same status
  // twice (draft → review → draft), and duplicate keys would drop a chip.
  const keyOf = (step: StatusFlowStep, index: number) => `${index}:${statusOf(step)}`

  const position = resolveCurrent(steps, alternates, current, reached)

  return (
    <div ref={ref} data-slot="status-flow" className={cn('sui-status-flow', className)} {...props}>
      <ol className="sui-status-flow__steps" aria-label={label}>
        {steps.map((step, index) => {
          const state = stepStateAt(index, position)
          return (
            <li
              key={keyOf(step, index)}
              className="sui-status-flow__step"
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {renderChip(step, state)}
              {index < steps.length - 1 ? (
                <ArrowRightIcon className="sui-status-flow__arrow" />
              ) : null}
            </li>
          )
        })}
      </ol>

      {alternates && alternates.length > 0 ? (
        <div className="sui-status-flow__alternates">
          <span className="sui-status-flow__or">{alternatesLabel}</span>
          <ul className="sui-status-flow__steps" aria-label={alternatesListLabel}>
            {alternates.map((step, index) => {
              // The alternates stay a legend, except the one the record is in.
              const state = index === position.alternate ? 'current' : undefined
              return (
                <li
                  key={keyOf(step, index)}
                  className="sui-status-flow__step"
                  data-state={state}
                  aria-current={state ? 'step' : undefined}
                >
                  {renderChip(step, state)}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
})

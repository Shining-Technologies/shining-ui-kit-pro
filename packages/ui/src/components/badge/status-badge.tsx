'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** The tones a status can resolve to. Every one is a project token. */
export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'destructive' | 'info'

export interface StatusDefinition {
  /** Human label. Falls back to a prettified form of the raw value. */
  label?: ReactNode
  tone?: StatusTone
  icon?: ReactNode
}

/**
 * One vocabulary: the statuses a single domain concept can be in.
 *
 * `Record<string, …>` rather than a union, because the values come from a
 * server and a new one must render rather than crash.
 */
export type StatusVocabulary = Record<string, StatusDefinition>

/** Vocabularies by name — `{ order: { paid: … }, invoice: { … } }`. */
export type StatusRegistry = Record<string, StatusVocabulary>

const StatusRegistryContext = createContext<StatusRegistry>({})

export interface StatusRegistryProviderProps {
  registry: StatusRegistry
  children: ReactNode
}

/**
 * Supplies the status vocabularies for a subtree.
 *
 * Status words are *application* data, not library data — "quoted", "dispatched"
 * and "charged back" mean nothing to a component library. So the kit ships the
 * badge and the app ships the words, and an unknown value still renders.
 */
export function StatusRegistryProvider({ registry, children }: StatusRegistryProviderProps) {
  return (
    <StatusRegistryContext.Provider value={registry}>{children}</StatusRegistryContext.Provider>
  )
}

export function useStatusRegistry(): StatusRegistry {
  return useContext(StatusRegistryContext)
}

export const statusBadgeVariants = cva('sui-status-badge', {
  variants: {
    tone: {
      neutral: 'sui-status-badge--neutral',
      primary: 'sui-status-badge--primary',
      success: 'sui-status-badge--success',
      warning: 'sui-status-badge--warning',
      destructive: 'sui-status-badge--destructive',
      info: 'sui-status-badge--info',
    },
    size: { sm: 'sui-status-badge--sm', md: '', lg: 'sui-status-badge--lg' },
    /** A leading dot reads as "state"; without it the badge reads as a label. */
    dot: { true: '', false: 'sui-status-badge--no-dot' },
  },
  defaultVariants: { tone: 'neutral', size: 'md', dot: true },
})

export interface StatusBadgeProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof statusBadgeVariants> {
  /** The raw value, as the server sends it — `'in_progress'`, `'PAID'`. */
  status: string
  /** Which vocabulary to look `status` up in. Omit to use `statuses` directly. */
  type?: string
  /** A one-off vocabulary, for a badge that does not warrant a registry entry. */
  statuses?: StatusVocabulary
  /** Override the resolved label. */
  label?: ReactNode
}

/** `in_progress` → `In progress`. The last-resort label for an unknown value. */
function prettify(value: string): string {
  const words = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

/**
 * Resolves a raw status value to its definition, label and tone: the local
 * vocabulary (`statuses`) first, then `registry[type]`, then a neutral badge
 * with a prettified label. `StatusBadge` and `StatusFlow` use it, so anything
 * else that paints a raw status can call it and agree with them on the words
 * and the colour.
 */
export function resolveStatus(
  registry: StatusRegistry,
  status: string,
  { type, statuses }: { type?: string; statuses?: StatusVocabulary },
): { definition: StatusDefinition | undefined; label: ReactNode; tone: StatusTone } {
  const vocabulary = statuses ?? (type ? registry[type] : undefined)
  const definition = vocabulary?.[status] ?? vocabulary?.[status.toLowerCase()]
  return {
    definition,
    label: definition?.label ?? prettify(status),
    tone: definition?.tone ?? 'neutral',
  }
}

/**
 * A status word, painted by what it means.
 *
 * Resolution runs local → registry → fallback, so a page can override one
 * vocabulary without forking the rest, and a status nobody has defined still
 * renders as a neutral badge with a readable label instead of blowing up.
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { className, status, type, statuses, label, tone, size, dot, ...props },
  ref,
) {
  const registry = useStatusRegistry()
  const resolved = resolveStatus(registry, status, { type, statuses })
  const definition = resolved.definition

  const resolvedTone = tone ?? resolved.tone
  const resolvedLabel = label ?? resolved.label

  return (
    <span
      ref={ref}
      data-slot="status-badge"
      data-status={status}
      data-tone={resolvedTone}
      className={cn(statusBadgeVariants({ tone: resolvedTone, size, dot }), className)}
      {...props}
    >
      {definition?.icon ? (
        <span className="sui-status-badge__icon" aria-hidden="true">
          {definition.icon}
        </span>
      ) : dot === false ? null : (
        <span className="sui-status-badge__dot" aria-hidden="true" />
      )}
      {resolvedLabel}
    </span>
  )
})

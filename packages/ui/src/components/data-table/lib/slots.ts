import type { Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { SlotContent } from '../types/props'

/**
 * Resolve slot content.
 *
 * Returns `undefined` — not `null` — when nothing was supplied, so callers can
 * distinguish "no slot, use the default" from "a slot that renders nothing".
 */
export function renderSlot<TData>(
  content: SlotContent<TData> | undefined,
  table: Table<TData>,
): ReactNode | undefined {
  if (content === undefined) return undefined
  return typeof content === 'function'
    ? (content as (context: { table: Table<TData> }) => ReactNode)({ table })
    : content
}

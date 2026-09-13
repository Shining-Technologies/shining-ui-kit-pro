'use client'

import type { ReactNode } from 'react'
import { MoreIcon } from '../../icons/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../overlay/dropdown-menu'

export interface RowActionItem {
  label: string
  onSelect: () => void
  icon?: ReactNode
  /** Renders in the danger colour and is separated from the rest. */
  destructive?: boolean
  disabled?: boolean
  /** Draw a divider above this item. */
  separatorBefore?: boolean
}

export interface RowActionsProps {
  items: RowActionItem[]
  /** Accessible name for the trigger, e.g. `"Actions for Jane Doe"`. */
  label?: string
  /** Optional heading inside the menu. */
  heading?: string
}

/**
 * The `⋮` overflow menu at the end of a row.
 *
 * The fallback, not the default: a row's actions are icon buttons
 * ({@link RowAction}), because three glyphs are faster to read and to hit than
 * a menu that hides them. Reach for this when a row has more actions than fit
 * on one line, or when they need headings and separators.
 *
 * The library supplies the menu, never the actions — those belong to the
 * application (§45, §48).
 *
 * ```tsx
 * rowActions={(row) => (
 *   <RowActions
 *     label={`Actions for ${row.original.name}`}
 *     items={[
 *       { label: 'Edit', onSelect: () => edit(row.original) },
 *       { label: 'Delete', onSelect: () => remove(row.original), destructive: true },
 *     ]}
 *   />
 * )}
 * ```
 */
export function RowActions({ items, label = 'Row actions', heading }: RowActionsProps) {
  if (items.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="sui-icon-button" aria-label={label}>
          <MoreIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {heading ? (
          <>
            <DropdownMenuLabel>{heading}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            {item.separatorBefore ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              destructive={item.destructive}
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

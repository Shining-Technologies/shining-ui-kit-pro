'use client'

import type { Column } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, CloseIcon, MoreIcon, PinIcon } from '../../icons/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../overlay/dropdown-menu'

export interface ColumnMenuProps<TData> {
  column: Column<TData, unknown>
  label: string
}

/**
 * The `⋮` menu on a header cell.
 *
 * Only rendered when it would contain something, and it stops click propagation
 * so opening the menu never also toggles the sort (§12).
 */
export function ColumnMenu<TData>({ column, label }: ColumnMenuProps<TData>) {
  const canSort = column.getCanSort()
  const canPin = column.getCanPin()
  const canHide = column.getCanHide()
  if (!canSort && !canPin && !canHide) return null

  const sorted = column.getIsSorted()
  const pinned = column.getIsPinned()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="sui-th__menu"
          aria-label={`Options for ${label}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(event) => event.stopPropagation()}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>

        {canSort ? (
          <>
            <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
              <ChevronUpIcon /> Sort ascending
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
              <ChevronDownIcon /> Sort descending
            </DropdownMenuItem>
            {sorted ? (
              <DropdownMenuItem onSelect={() => column.clearSorting()}>
                <CloseIcon /> Clear sort
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {canPin ? (
          <>
            <DropdownMenuSeparator />
            {pinned !== 'left' ? (
              <DropdownMenuItem onSelect={() => column.pin('left')}>
                <PinIcon /> Pin to left
              </DropdownMenuItem>
            ) : null}
            {pinned !== 'right' ? (
              <DropdownMenuItem onSelect={() => column.pin('right')}>
                <PinIcon /> Pin to right
              </DropdownMenuItem>
            ) : null}
            {pinned ? (
              <DropdownMenuItem onSelect={() => column.pin(false)}>
                <CloseIcon /> Unpin
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {canHide ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <CloseIcon /> Hide column
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

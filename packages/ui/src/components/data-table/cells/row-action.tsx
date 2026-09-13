'use client'

import type { ComponentType, MouseEvent, ReactNode, SVGProps } from 'react'
import { cn } from '../../../lib/cn'
import { Tooltip } from '../../overlay/tooltip'

/**
 * One action, described rather than rendered.
 *
 * Hand a list of these to `rowActions` and the table builds the buttons, so
 * the common case — view, edit, delete — is a data structure instead of JSX.
 */
export interface RowActionSpec extends Omit<RowActionProps, 'className'> {
  /**
   * Leave this action out for this row. Prefer it over dropping the item from
   * the array: the icons stay in the same place from row to row, which is what
   * makes a column of actions scannable.
   */
  hidden?: boolean
}

export interface RowActionProps {
  /** Any icon component that takes SVG props — the kit's own, or lucide's. */
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** The accessible name, and the tooltip text. Always required. */
  label: string
  /** Renders an anchor instead of a button. */
  href?: string
  /** Open `href` in a new tab. */
  external?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** Red hover treatment, for anything that destroys something. */
  destructive?: boolean
  disabled?: boolean
  className?: string
}

/**
 * One icon action in a row.
 *
 * Icon-only on purpose: a row of three labelled buttons is wider than the data
 * it belongs to. The label is not optional — it is the button's accessible
 * name and its tooltip, so the icon never has to carry the meaning alone.
 *
 * Clicks are stopped from reaching the row, so a table with `onRowClick` does
 * not navigate when someone presses Delete.
 *
 * ```tsx
 * rowActions={(row) => (
 *   <RowActionGroup>
 *     <RowAction icon={EyeIcon} label="View" href={`/orders/${row.original.id}`} />
 *     <RowAction icon={PencilIcon} label="Edit" onClick={() => edit(row.original)} />
 *     <RowAction icon={TrashIcon} label="Delete" onClick={…} destructive />
 *   </RowActionGroup>
 * )}
 * ```
 */
export function RowAction({
  icon: Icon,
  label,
  href,
  external,
  onClick,
  destructive,
  disabled,
  className,
}: RowActionProps) {
  const classes = cn(
    'sui-row-action',
    destructive && 'sui-row-action--destructive',
    disabled && 'sui-row-action--disabled',
    className,
  )

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const control =
    href && !disabled ? (
      <a
        href={href}
        className={classes}
        aria-label={label}
        onClick={handleClick}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        <Icon aria-hidden="true" />
      </a>
    ) : (
      <button
        type="button"
        className={classes}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
      >
        <Icon aria-hidden="true" />
      </button>
    )

  return <Tooltip content={label}>{control}</Tooltip>
}

export interface RowActionGroupProps {
  children: ReactNode
  /**
   * Where the icons sit in the cell. `'start'` keeps the first icon at a fixed
   * x across every row even when later ones appear conditionally, which is what
   * makes a column of actions scannable; `'end'` hugs the table's edge.
   */
  align?: 'start' | 'end'
  className?: string
}

/** Lays out however many {@link RowAction}s a row needs, on one line. */
export function RowActionGroup({ children, align = 'start', className }: RowActionGroupProps) {
  return (
    <div className={cn('sui-row-actions', `sui-row-actions--${align}`, className)}>{children}</div>
  )
}

/**
 * Is this what `rowActions` returned a list of action descriptions?
 *
 * React elements always carry `$$typeof`, so an array of them — the other
 * legal return value — is never mistaken for one of these.
 */
export function isRowActionSpecs(value: unknown): value is RowActionSpec[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        !('$$typeof' in item) &&
        'label' in item &&
        'icon' in item,
    )
  )
}

/** Render a described list of actions. Hidden ones keep their place. */
export function renderRowActions(specs: RowActionSpec[]) {
  return (
    <RowActionGroup>
      {specs.map(({ hidden, ...spec }) =>
        hidden ? (
          <span key={spec.label} className="sui-row-action sui-row-action--placeholder" />
        ) : (
          <RowAction key={spec.label} {...spec} />
        ),
      )}
    </RowActionGroup>
  )
}

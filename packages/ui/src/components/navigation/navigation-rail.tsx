import { Slot, Slottable } from '@radix-ui/react-slot'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * The navigation rail is markup only, so it renders as a Server Component.
 * For a client-side router link, pass it as the child of `NavigationRailItem asChild`.
 */

export interface NavigationRailProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Above the items: a logo, or a primary action such as a "New" button. */
  header?: ReactNode
  /** Pinned to the bottom: settings, the user's avatar. */
  footer?: ReactNode
}

/**
 * A narrow column of three to seven top-level destinations, each an icon with
 * a short label under it. It suits tablet widths, and apps with few
 * destinations that do not need a full sidebar.
 *
 * This is different from the collapsed `Sidebar`. The sidebar's rail is a
 * sidebar made narrow, with icons only and tooltips. This rail always shows
 * its labels and has no tree. For phones, use `AppShellBottomNav`.
 */
export const NavigationRail = forwardRef<HTMLElement, NavigationRailProps>(function NavigationRail(
  { className, header, footer, children, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Primary"
      data-slot="navigation-rail"
      className={cn('sui-rail', className)}
      {...props}
    >
      {header ? <div className="sui-rail__header">{header}</div> : null}
      <ul className="sui-rail__list">{children}</ul>
      {footer ? <div className="sui-rail__footer">{footer}</div> : null}
    </nav>
  )
})

export interface NavigationRailItemProps extends HTMLAttributes<HTMLElement> {
  icon: ReactNode
  label: ReactNode
  /** Renders an `<a>`. Without it, and without `asChild`, the item is a `<button>`. */
  href?: string
  /** The current destination: `aria-current="page"`. */
  active?: boolean
  /** A count or a dot on the icon. */
  badge?: ReactNode
  /**
   * What screen readers hear for `badge`, after the label: `"Inbox (3)"`.
   * Defaults to the badge itself when it is a string or a number.
   */
  badgeLabel?: string
  disabled?: boolean
  /**
   * Render your own link element with the item's styles. Pass it with no
   * children (`<Link href="/inbox" />`): the icon and label come from these props.
   */
  asChild?: boolean
}

export const NavigationRailItem = forwardRef<HTMLElement, NavigationRailItemProps>(
  function NavigationRailItem(
    {
      className,
      icon,
      label,
      href,
      active,
      badge,
      badgeLabel,
      disabled,
      asChild,
      children,
      ...props
    },
    ref,
  ) {
    // The visible badge sits on the decorative icon, so its text is repeated,
    // hidden, after the label.
    const badgeText =
      badgeLabel ?? (typeof badge === 'string' || typeof badge === 'number' ? String(badge) : '')
    const hasBadge = badge !== undefined && badge !== null && badge !== false

    const content = (
      <>
        <span className="sui-rail__icon" aria-hidden="true">
          {icon}
          {hasBadge ? <span className="sui-rail__badge">{badge}</span> : null}
        </span>
        <span className="sui-rail__label">{label}</span>
        {hasBadge && badgeText ? <span className="sui-visually-hidden"> ({badgeText})</span> : null}
      </>
    )

    const shared = {
      'aria-current': active ? ('page' as const) : undefined,
      'data-slot': 'navigation-rail-item',
      className: cn('sui-rail__item sui-focusable', className),
      ...props,
    }

    let item: ReactNode
    if (asChild) {
      // The child supplies the element; the icon and label go inside it, ahead
      // of whatever children the child has of its own.
      item = (
        <Slot ref={ref as never} {...shared} aria-disabled={disabled || undefined}>
          {content}
          <Slottable>{children}</Slottable>
        </Slot>
      )
    } else if (href !== undefined) {
      item = (
        <a
          ref={ref as never}
          href={disabled ? undefined : href}
          aria-disabled={disabled || undefined}
          {...shared}
        >
          {content}
        </a>
      )
    } else {
      item = (
        <button ref={ref as never} type="button" disabled={disabled} {...shared}>
          {content}
        </button>
      )
    }

    return <li className="sui-rail__entry">{item}</li>
  },
)

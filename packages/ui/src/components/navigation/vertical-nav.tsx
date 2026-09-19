import { Slot, Slottable } from '@radix-ui/react-slot'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
 * Vertical navigation is markup only, so it renders as a Server Component.
 * For a client-side router link, pass it as the child of `VerticalNavItem asChild`.
 */

export interface VerticalNavProps extends HTMLAttributes<HTMLElement> {
  /**
   * `pills` fills the current item. `line` marks it with a rule on the start
   * edge, which is quieter beside dense content such as docs or settings.
   */
  appearance?: 'pills' | 'line'
}

/**
 * A vertical list of links inside a page: settings sections, a docs table of
 * contents, an account area.
 *
 * Not `Sidebar`: that is the application's navigation, with collapse, a mobile
 * drawer and a tree. Not vertical `Tabs`: those switch panels on the same page
 * without changing the URL. Use this when each item is its own page or anchor.
 * Give it an `aria-label`, because a page often has more than one `<nav>`.
 */
export const VerticalNav = forwardRef<HTMLElement, VerticalNavProps>(function VerticalNav(
  { className, appearance = 'pills', ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      data-slot="vertical-nav"
      className={cn('sui-vnav', appearance === 'line' && 'sui-vnav--line', className)}
      {...props}
    />
  )
})

export interface VerticalNavSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** A small heading over the group. Leave it out for an untitled group. */
  title?: ReactNode
}

/** A group of items, with an optional heading. The items must be inside a section. */
export const VerticalNavSection = forwardRef<HTMLDivElement, VerticalNavSectionProps>(
  function VerticalNavSection({ className, title, children, ...props }, ref) {
    return (
      <div ref={ref} className={cn('sui-vnav__section', className)} {...props}>
        {title ? (
          <p className="sui-vnav__title" aria-hidden="true">
            {title}
          </p>
        ) : null}
        <ul className="sui-vnav__list" aria-label={typeof title === 'string' ? title : undefined}>
          {children}
        </ul>
      </div>
    )
  },
)

export interface VerticalNavItemProps extends HTMLAttributes<HTMLElement> {
  /** Renders an `<a>`. Without it, and without `asChild`, the item is a `<button>`. */
  href?: string
  target?: string
  rel?: string
  /** The current page: `aria-current="page"`. */
  active?: boolean
  icon?: ReactNode
  /** A count or a `Badge` at the end of the row. */
  badge?: ReactNode
  disabled?: boolean
  /** Render your own link element (`next/link`, React Router) with the item's styles. */
  asChild?: boolean
}

export const VerticalNavItem = forwardRef<HTMLElement, VerticalNavItemProps>(
  function VerticalNavItem(
    { className, href, target, rel, active, icon, badge, disabled, asChild, children, ...props },
    ref,
  ) {
    const shared = {
      'aria-current': active ? ('page' as const) : undefined,
      'data-slot': 'vertical-nav-item',
      className: cn('sui-vnav__item sui-focusable', className),
      ...props,
    }
    const iconNode = icon ? (
      <span className="sui-vnav__icon" aria-hidden="true">
        {icon}
      </span>
    ) : null
    const badgeNode =
      badge !== undefined && badge !== null ? (
        <span className="sui-vnav__badge">{badge}</span>
      ) : null

    let item: ReactNode
    if (asChild) {
      item = (
        <Slot ref={ref as never} {...shared} aria-disabled={disabled || undefined}>
          {iconNode}
          <Slottable>{children}</Slottable>
          {badgeNode}
        </Slot>
      )
    } else if (href !== undefined) {
      item = (
        <a
          ref={ref as never}
          // A disabled link has no href, so it cannot be followed or focused.
          href={disabled ? undefined : href}
          target={target}
          rel={rel}
          aria-disabled={disabled || undefined}
          {...shared}
        >
          {iconNode}
          <span className="sui-vnav__label">{children}</span>
          {badgeNode}
        </a>
      )
    } else {
      item = (
        <button ref={ref as never} type="button" disabled={disabled} {...shared}>
          {iconNode}
          <span className="sui-vnav__label">{children}</span>
          {badgeNode}
        </button>
      )
    }

    return <li className="sui-vnav__entry">{item}</li>
  },
)

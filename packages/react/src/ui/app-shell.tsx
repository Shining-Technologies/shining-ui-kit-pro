import {
  forwardRef,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../lib/cn'
import { ArrowUpIcon } from '../lib/icons'
import { Button } from '../primitives/button'

/* ------------------------------------------------------------------- shell */

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Collapse the sidebar to an icon rail. */
  collapsed?: boolean
  /** Reserve room at the bottom for `AppShellBottomNav`. */
  hasBottomNav?: boolean
}

/**
 * The frame an application lives in: sidebar, header, content, bottom bar.
 *
 * Slots rather than props — `sidebar={...}` would mean this component decides
 * what a sidebar contains, and the four shells this replaces disagreed about
 * that. Composition lets a contractor app and an admin console share one
 * skeleton while filling it differently.
 *
 * The layout is CSS grid on `100dvh`, so the sidebar and the header stay put
 * while the content scrolls, and the mobile viewport's disappearing toolbar
 * does not leave a dead strip at the bottom.
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { className, collapsed = false, hasBottomNav = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="app-shell"
      data-collapsed={collapsed || undefined}
      className={cn('sui-shell', hasBottomNav && 'sui-shell--with-bottom-nav', className)}
      {...props}
    />
  )
})

export interface AppShellHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Logo, app switcher — anything pinned to the start. */
  start?: ReactNode
  /** Search, or whatever should take the free space. */
  center?: ReactNode
  /** Notifications, the user menu. */
  end?: ReactNode
}

export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(function AppShellHeader(
  { className, start, center, end, children, ...props },
  ref,
) {
  return (
    <header
      ref={ref}
      data-slot="app-shell-header"
      className={cn('sui-shell__header', className)}
      {...props}
    >
      {start ? <div className="sui-shell__header-start">{start}</div> : null}
      {center ? <div className="sui-shell__header-center">{center}</div> : null}
      {children}
      {end ? <div className="sui-shell__header-end">{end}</div> : null}
    </header>
  )
})

export interface AppShellSidebarProps extends HTMLAttributes<HTMLElement> {
  /** Pinned above the scrolling nav — brand, workspace switcher. */
  header?: ReactNode
  /** Pinned below it — the signed-in user, a version string. */
  footer?: ReactNode
  'aria-label'?: string
}

export const AppShellSidebar = forwardRef<HTMLElement, AppShellSidebarProps>(
  function AppShellSidebar(
    { className, header, footer, children, 'aria-label': ariaLabel = 'Main', ...props },
    ref,
  ) {
    return (
      <aside
        ref={ref}
        data-slot="app-shell-sidebar"
        className={cn('sui-shell__sidebar', className)}
        {...props}
      >
        {header ? <div className="sui-shell__sidebar-header">{header}</div> : null}
        <nav className="sui-shell__sidebar-nav" aria-label={ariaLabel}>
          {children}
        </nav>
        {footer ? <div className="sui-shell__sidebar-footer">{footer}</div> : null}
      </aside>
    )
  },
)

export const AppShellContent = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function AppShellContent({ className, id = 'main', ...props }, ref) {
    return (
      <main
        ref={ref}
        id={id}
        // Focusable so the skip link has somewhere to land, but not in the tab
        // order — `-1` is the difference between "reachable" and "in the way".
        tabIndex={-1}
        data-slot="app-shell-content"
        className={cn('sui-shell__content', className)}
        {...props}
      />
    )
  },
)

export const AppShellBottomNav = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function AppShellBottomNav({ className, ...props }, ref) {
    return (
      <nav
        ref={ref}
        data-slot="app-shell-bottom-nav"
        aria-label="Primary"
        className={cn('sui-bottom-nav', className)}
        {...props}
      />
    )
  },
)

/* --------------------------------------------------------------------- nav */

export interface SidebarGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode
}

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(function SidebarGroup(
  { className, label, children, ...props },
  ref,
) {
  return (
    <div ref={ref} data-slot="sidebar-group" className={cn('sui-nav-group', className)} {...props}>
      {label ? <p className="sui-nav-group__label">{label}</p> : null}
      <ul className="sui-nav-group__list">{children}</ul>
    </div>
  )
})

interface SidebarItemBase {
  icon?: ReactNode
  /** Marks the item as where you are — `aria-current="page"`. */
  active?: boolean
  /** A count on the right: unread, overdue, awaiting action. */
  badge?: ReactNode
  children: ReactNode
}

export type SidebarItemProps =
  | (SidebarItemBase & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>)
  | (SidebarItemBase & { href?: undefined } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        'children'
      >)

/**
 * One navigation destination.
 *
 * Renders an `<a>` when given an `href` and a `<button>` otherwise, so a
 * router-driven app and a state-driven one both get the correct element
 * instead of a `<div>` with a click handler.
 */
export const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(function SidebarItem(
  { className, icon, active, badge, children, ...props },
  ref,
) {
  const inner = (
    <>
      {icon ? (
        <span className="sui-nav-item__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="sui-nav-item__label">{children}</span>
      {badge !== undefined ? <span className="sui-nav-item__badge">{badge}</span> : null}
    </>
  )

  const shared = {
    'data-slot': 'sidebar-item',
    'aria-current': active ? ('page' as const) : undefined,
    className: cn('sui-nav-item sui-focusable', className),
  }

  if ('href' in props && props.href !== undefined) {
    const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <li>
        <a ref={ref as Ref<HTMLAnchorElement>} {...shared} {...anchorProps}>
          {inner}
        </a>
      </li>
    )
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <li>
      <button ref={ref as Ref<HTMLButtonElement>} type="button" {...shared} {...buttonProps}>
        {inner}
      </button>
    </li>
  )
})

export interface BottomNavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  active?: boolean
  badge?: ReactNode
  label: ReactNode
}

export const BottomNavItem = forwardRef<HTMLButtonElement, BottomNavItemProps>(
  function BottomNavItem({ className, icon, active, badge, label, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-current={active ? 'page' : undefined}
        className={cn('sui-bottom-nav__item sui-focusable', className)}
        {...props}
      >
        <span className="sui-bottom-nav__icon" aria-hidden="true">
          {icon}
          {badge !== undefined ? <span className="sui-bottom-nav__badge">{badge}</span> : null}
        </span>
        <span className="sui-bottom-nav__label">{label}</span>
      </button>
    )
  },
)

/* ------------------------------------------------------------- skip & scroll */

export interface SkipToContentProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The id of the element to jump to. */
  targetId?: string
}

/**
 * WCAG 2.4.1: a way past the navigation.
 *
 * Invisible until focused, and the first thing in the tab order — for someone
 * on a keyboard it is the difference between reaching the content immediately
 * and tabbing through forty nav links on every page.
 */
export const SkipToContent = forwardRef<HTMLAnchorElement, SkipToContentProps>(
  function SkipToContent(
    { className, targetId = 'main', children = 'Skip to content', ...props },
    ref,
  ) {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        data-slot="skip-to-content"
        className={cn('sui-skip-link', className)}
        {...props}
      >
        {children}
      </a>
    )
  },
)

export interface ScrollToTopProps {
  /** How far down the page it takes before the button appears, in px. */
  threshold?: number
  /** The scrolling element. Defaults to the window. */
  target?: HTMLElement | null
  label?: string
  className?: string
}

/**
 * Back to the top of a long page.
 *
 * Appears only past `threshold`, because a control that is always there on a
 * short page is chrome for nothing. Honours `prefers-reduced-motion` through
 * the stylesheet rather than deciding here, so the whole kit answers that
 * question in one place.
 */
export function ScrollToTop({
  threshold = 400,
  target,
  label = 'Back to top',
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const scroller: HTMLElement | Window = target ?? window
    const read = () =>
      target ? target.scrollTop : (window.scrollY ?? document.documentElement.scrollTop)

    const onScroll = () => setVisible(read() > threshold)
    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [target, threshold])

  if (!visible) return null

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={label}
      className={cn('sui-scroll-top', className)}
      onClick={() => (target ?? window).scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUpIcon />
    </Button>
  )
}

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'

/*
 * The application frame is markup and CSS only, so it renders as a Server
 * Component: a `layout.tsx` can use it directly. `ScrollToTop`, which watches
 * the scroll position, lives in `scroll-to-top.tsx`.
 */

/* ------------------------------------------------------------------- shell */

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * @deprecated Has no layout effect. Collapse the sidebar with `Sidebar` or
   * `SidebarProvider` (`collapsed`, `defaultCollapsed`, `SidebarTrigger`), which
   * also switch it to the icon rail. Still sets `data-collapsed` on the shell
   * for your own styles.
   */
  collapsed?: boolean
  /** Reserve room at the bottom for `AppShellBottomNav`. */
  hasBottomNav?: boolean
}

/**
 * The frame an application lives in: sidebar, header, content, bottom bar.
 *
 * Slots rather than props — `sidebar={...}` would mean this component decides
 * what a sidebar contains. Composition lets a contractor app and an admin
 * console share one skeleton while filling it differently.
 *
 * The layout is CSS grid on `100dvh`, so the sidebar and the header stay put
 * while the content scrolls, and the mobile viewport's disappearing toolbar
 * does not leave a dead strip at the bottom. A `Sidebar` placed directly inside
 * adds the sidebar column and sizes it; without one the shell is one column.
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

export interface BottomNavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  active?: boolean
  badge?: ReactNode
  /**
   * What screen readers hear for `badge`, after the label: `"Orders (3)"`.
   * Defaults to the badge itself when it is a string or a number.
   */
  badgeLabel?: string
  label: ReactNode
}

export const BottomNavItem = forwardRef<HTMLButtonElement, BottomNavItemProps>(
  function BottomNavItem({ className, icon, active, badge, badgeLabel, label, ...props }, ref) {
    // The visible badge sits on the decorative icon, so its text is repeated,
    // hidden, after the label.
    const badgeText =
      badgeLabel ?? (typeof badge === 'string' || typeof badge === 'number' ? String(badge) : '')
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
        {badge !== undefined && badgeText ? (
          <span className="sui-visually-hidden"> ({badgeText})</span>
        ) : null}
      </button>
    )
  },
)

/* ---------------------------------------------------------------------- skip */

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

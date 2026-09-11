import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../lib/cn'
import { PanelLeftIcon, SortIcon } from '../lib/icons'
import { initialOf } from '../lib/sidebar-tree'
import { useHydrated } from '../lib/use-hydrated'
import { Button, type ButtonProps } from '../primitives/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../primitives/dropdown-menu'
import { UIKitContext } from '../theme/context'
import {
  DEFAULT_BREAKPOINT,
  SidebarContext,
  SidebarProvider,
  useRail,
  useSidebar,
  type SidebarProviderProps,
} from './sidebar-context'
import { UserAvatar, type PresenceStatus } from './user-avatar'

/*
 * The dashboard sidebar.
 *
 * `AppShellSidebar` is a frame with a flat list in it. This is the navigation
 * an admin console actually has: sections with their own colour, destinations
 * nested as deep as the product's information architecture goes, an icon rail
 * that still reaches every page through flyouts, a filter for when there are
 * sixty destinations, and a drawer on a phone.
 *
 * Two ways in, one implementation. `SidebarNav items={…}` takes a tree and
 * does the bookkeeping — which branch holds the current page, what to open,
 * what matches a search. `SidebarSection` and `SidebarMenuItem` are the parts
 * it renders with, exported so a hand-written sidebar gets the same markup and
 * can drop anything it likes between two items.
 */

/* ------------------------------------------------------------------ sidebar */

export interface SidebarProps
  extends Omit<HTMLAttributes<HTMLElement>, 'id'>, Omit<SidebarProviderProps, 'children'> {
  /** Pinned above the scrolling area — `SidebarBrand`, a workspace switcher. */
  header?: ReactNode
  /** Pinned below it — `SidebarUser`, a version string, a help link. */
  footer?: ReactNode
  /** Full width. Any CSS length; defaults to `16rem`. */
  width?: string
  /** Icon-rail width. Defaults to `3.75rem`. */
  railWidth?: string
  /**
   * How the current page is marked: `subtle` is a neutral fill, `primary`
   * tints it with the project's primary colour.
   */
  appearance?: 'subtle' | 'primary'
  /**
   * The accessible name. As a column the sidebar is a landmark named
   * `"Sidebar"` by default; as the open phone drawer it is a modal dialog,
   * named by this, else by the `SidebarBrand` in it, else `"Navigation"`.
   */
  'aria-label'?: string
}

/** Lets a `SidebarBrand` name the drawer it sits in. */
const BrandLabelContext = createContext<((id: string | null) => void) | null>(null)

const PROVIDER_KEYS = [
  'collapsed',
  'defaultCollapsed',
  'onCollapsedChange',
  'mobileOpen',
  'onMobileOpenChange',
  'mobileBreakpoint',
  'storageKey',
  'shortcut',
] as const

/**
 * The sidebar panel: a pinned header, a scrolling body, a pinned footer.
 *
 * Inside `AppShell` it takes the sidebar column and sizes it itself, so the
 * rail animates rather than jumping. Below the breakpoint it leaves the grid
 * and becomes a modal drawer with a backdrop: the rest of the page is inert
 * and does not scroll while it is open, Escape and the backdrop close it, and
 * focus goes back to whatever opened it.
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(props, ref) {
  const outer = useContext(SidebarContext)
  if (outer) return <SidebarPanel ref={ref} {...stripProviderProps(props)} />

  const providerProps: SidebarProviderProps = {}
  for (const key of PROVIDER_KEYS) {
    if (props[key] !== undefined) (providerProps as Record<string, unknown>)[key] = props[key]
  }
  return (
    <SidebarProvider {...providerProps}>
      <SidebarPanel ref={ref} {...stripProviderProps(props)} />
    </SidebarProvider>
  )
})

function stripProviderProps(props: SidebarProps): SidebarPanelProps {
  const rest: Record<string, unknown> = { ...props }
  for (const key of PROVIDER_KEYS) delete rest[key]
  return rest as SidebarPanelProps
}

type SidebarPanelProps = Omit<SidebarProps, (typeof PROVIDER_KEYS)[number]>

const SidebarPanel = forwardRef<HTMLElement, SidebarPanelProps>(function SidebarPanel(
  {
    className,
    style,
    header,
    footer,
    width,
    railWidth,
    appearance = 'subtle',
    children,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const { rail, isMobile, mobileOpen, setMobileOpen, sidebarId, mobileBreakpoint } = useSidebar()
  const nonce = useContext(UIKitContext)?.nonce
  const panelRef = useRef<HTMLElement | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const drawerOpen = isMobile && mobileOpen
  // Server HTML cannot know the viewport, so it renders the desktop column and a
  // phone would show it until hydration. At the default breakpoint the
  // stylesheet does know: this marks the element for that media query. A
  // custom breakpoint gets the same rules in a `<style>` of its own.
  const hydrated = useHydrated()
  const breakpointPending = !hydrated && mobileBreakpoint === DEFAULT_BREAKPOINT
  const pendingSheet =
    !hydrated && mobileBreakpoint && mobileBreakpoint !== DEFAULT_BREAKPOINT
      ? breakpointSheet(sidebarId, mobileBreakpoint)
      : null

  const close = useRef(setMobileOpen)
  close.current = setMobileOpen

  // The open drawer is a modal: everything behind the backdrop is inert, the
  // page under it does not scroll, and focus stays inside until it closes.
  useEffect(() => {
    const panel = panelRef.current
    if (!drawerOpen || !panel) return
    const active = document.activeElement
    const returnTo = active instanceof HTMLElement && active !== document.body ? active : null
    const restoreInert = inertOutside(panel)
    const unlockScroll = lockScroll()
    panel.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') close.current(false)
      else if (event.key === 'Tab') trapTab(event, panel)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Before focusing: nothing inert can take focus.
      restoreInert()
      unlockScroll()
      // A click does not focus a button in every browser (Safari), so the
      // trigger is found by what it controls when nothing was focused.
      const trigger = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="sidebar-trigger"]'),
      ).find((element) => element.getAttribute('aria-controls') === sidebarId)
      ;(returnTo?.isConnected ? returnTo : trigger)?.focus()
    }
  }, [drawerOpen, sidebarId])

  const sizing = {
    ...(width ? { '--sui-sidebar-width': width } : null),
    ...(railWidth ? { '--sui-sidebar-rail-width': railWidth } : null),
  } as CSSProperties

  // A landmark as a column; as a drawer a dialog, which needs a name of its
  // own. A `<div>` with the role spelled out, because `dialog` is not a role an
  // `<aside>` may take, and swapping the element would remount the contents.
  const naming = drawerOpen
    ? {
        role: 'dialog',
        'aria-modal': true,
        'aria-label': ariaLabel ?? (brandId ? undefined : 'Navigation'),
        'aria-labelledby': ariaLabel || !brandId ? undefined : brandId,
      }
    : { role: 'complementary', 'aria-label': ariaLabel ?? 'Sidebar' }

  return (
    <>
      {pendingSheet ? (
        <style
          data-sui-breakpoint=""
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: pendingSheet }}
        />
      ) : null}
      {drawerOpen ? (
        <div
          className="sui-sidebar__backdrop"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div
        ref={(node) => {
          panelRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        id={sidebarId}
        data-slot="sidebar"
        data-collapsed={rail || undefined}
        data-mobile={isMobile || undefined}
        data-open={drawerOpen || undefined}
        data-breakpoint-pending={breakpointPending || undefined}
        data-breakpoint-scope={pendingSheet ? sidebarId : undefined}
        data-appearance={appearance}
        {...naming}
        tabIndex={drawerOpen ? -1 : undefined}
        className={cn('sui-sidebar', className)}
        style={{ ...sizing, ...style }}
        {...props}
      >
        <BrandLabelContext.Provider value={setBrandId}>
          {header ? <div className="sui-sidebar__header">{header}</div> : null}
          <div className="sui-sidebar__body">{children}</div>
          {footer ? <div className="sui-sidebar__footer">{footer}</div> : null}
        </BrandLabelContext.Provider>
      </div>
    </>
  )
})

/**
 * What `sidebar.css` does for the default breakpoint before hydration — the
 * closed drawer, and the shell's single column — for a custom one, scoped to
 * this sidebar. `null` for a value that is not a plain length or math
 * function: it is interpolated into a stylesheet, and must not end the rule
 * or the element.
 */
function breakpointSheet(id: string, breakpoint: string): string | null {
  if (!/^[\w\s.,+\-*/%()]+$/.test(breakpoint)) return null
  const panel = `.sui-sidebar[data-breakpoint-scope="${id.replace(/["\\]/g, '\\$&')}"]`
  return (
    `@media (max-width: ${breakpoint}){` +
    `${panel}{position:fixed;inset-block:0;inset-inline-start:0;z-index:70;` +
    `transform:translateX(-100%);visibility:hidden;transition:none}` +
    `.sui-shell:has(> ${panel}){grid-template-columns:minmax(0,1fr);` +
    `grid-template-areas:'header' 'content'}}`
  ).replace(/</g, '\\3c ')
}

/**
 * Make everything outside `panel` inert — its siblings, and its ancestors'
 * siblings up to `<body>` — so a screen reader cannot wander out of the
 * drawer either. Leaves alone the backdrop (it must take the click that
 * closes), live regions, and anything already inert. Returns the undo.
 */
function inertOutside(panel: HTMLElement): () => void {
  const changed: Element[] = []
  for (let node: Element = panel; node.parentElement && node !== document.body;) {
    const parent: HTMLElement = node.parentElement
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || sibling.hasAttribute('inert')) continue
      if (sibling.matches('.sui-sidebar__backdrop, script, style, template, [aria-live]')) continue
      sibling.setAttribute('inert', '')
      changed.push(sibling)
    }
    node = parent
  }
  return () => changed.forEach((element) => element.removeAttribute('inert'))
}

/** Stop the page scrolling under the drawer; the undo restores the exact inline value. */
function lockScroll(): () => void {
  const { style } = document.body
  const previous = style.getPropertyValue('overflow')
  const priority = style.getPropertyPriority('overflow')
  style.setProperty('overflow', 'hidden')
  return () => {
    if (previous) style.setProperty('overflow', previous, priority)
    else style.removeProperty('overflow')
  }
}

const TABBABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/**
 * The open drawer covers the page with a backdrop, so Tab must not wander off
 * behind it: from the last control it wraps to the first, and back.
 */
function trapTab(event: globalThis.KeyboardEvent, panel: HTMLElement) {
  const tabbable = Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE))
  const first = tabbable[0]
  const last = tabbable.at(-1)
  const active = document.activeElement
  let next: HTMLElement | undefined
  if (!first || !last) next = panel
  else if (!panel.contains(active)) next = event.shiftKey ? last : first
  else if (event.shiftKey && (active === first || active === panel)) next = last
  else if (!event.shiftKey && active === last) next = first
  if (!next) return
  event.preventDefault()
  next.focus()
}

export interface SidebarTriggerProps extends ButtonProps {
  /** Accessible names for the two directions. */
  labels?: { expand?: string; collapse?: string; open?: string; close?: string }
}

/**
 * The one button that means "sidebar": narrows it to the rail on a desktop,
 * opens the drawer on a phone. Works anywhere under a `SidebarProvider`, or
 * inside the `Sidebar` itself.
 */
export const SidebarTrigger = forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  function SidebarTrigger(
    { className, labels, onClick, children, variant = 'ghost', size = 'icon', ...props },
    ref,
  ) {
    const { toggle, isMobile, mobileOpen, collapsed, sidebarId } = useSidebar()
    const open = isMobile ? mobileOpen : !collapsed
    const label = isMobile
      ? open
        ? (labels?.close ?? 'Close navigation')
        : (labels?.open ?? 'Open navigation')
      : open
        ? (labels?.collapse ?? 'Collapse sidebar')
        : (labels?.expand ?? 'Expand sidebar')

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        data-slot="sidebar-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={sidebarId}
        className={cn('sui-sidebar-trigger', className)}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) toggle()
        }}
        {...props}
      >
        {children ?? <PanelLeftIcon />}
      </Button>
    )
  },
)

/* --------------------------------------------------------- brand & account */

interface IdentityProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  media: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  menu?: ReactNode
  href?: string
  side: 'top' | 'bottom'
  slot: string
  titleId?: string
}

const Identity = forwardRef<HTMLElement, IdentityProps>(function Identity(
  { className, media, title, subtitle, menu, href, side, slot, titleId, ...props },
  ref,
) {
  const rail = useRail()
  const inner = (
    <>
      <span className="sui-sidebar-identity__media">{media}</span>
      <span className="sui-sidebar-identity__text">
        <span id={titleId} className="sui-sidebar-identity__title">
          {title}
        </span>
        {subtitle ? <span className="sui-sidebar-identity__subtitle">{subtitle}</span> : null}
      </span>
      {menu ? <SortIcon className="sui-sidebar-identity__chevron" /> : null}
    </>
  )
  const shared = {
    'data-slot': slot,
    className: cn('sui-sidebar-identity', (menu || href) && 'sui-focusable', className),
  }

  if (menu) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button ref={ref as Ref<HTMLButtonElement>} type="button" {...shared} {...props}>
            {inner}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={rail ? 'right' : side}
          align={rail ? 'end' : 'start'}
          className="sui-sidebar-identity__menu"
        >
          {menu}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  if (href) {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} href={href} {...shared} {...props}>
        {inner}
      </a>
    )
  }
  return (
    <div ref={ref as Ref<HTMLDivElement>} {...shared} {...props}>
      {inner}
    </div>
  )
})

export interface SidebarBrandProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** A mark, an `<img>`, an svg. It is all the rail shows. */
  logo?: ReactNode
  name: ReactNode
  /** A second line: the workspace, the plan, the environment. */
  description?: ReactNode
  /** Link the brand home. Ignored when there is a `menu`. */
  href?: string
  /**
   * `DropdownMenuItem`s. Turns the brand into a switcher — workspaces,
   * tenants, projects.
   */
  menu?: ReactNode
}

export const SidebarBrand = forwardRef<HTMLElement, SidebarBrandProps>(function SidebarBrand(
  { logo, name, description, ...props },
  ref,
) {
  // The drawer is named after the brand, unless the sidebar has a label of its own.
  const titleId = useId()
  const register = useContext(BrandLabelContext)
  useEffect(() => {
    if (!register) return
    register(titleId)
    return () => register(null)
  }, [register, titleId])

  return (
    <Identity
      ref={ref}
      titleId={titleId}
      slot="sidebar-brand"
      side="bottom"
      media={logo ?? <span className="sui-sidebar-identity__mark">{initialOf(name)}</span>}
      title={name}
      subtitle={description}
      {...props}
    />
  )
})

export interface SidebarUserProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  name: string
  /** Second line — an email, a role. */
  description?: ReactNode
  avatarSrc?: string
  status?: PresenceStatus
  href?: string
  /** `DropdownMenuItem`s: profile, settings, sign out. */
  menu?: ReactNode
}

export const SidebarUser = forwardRef<HTMLElement, SidebarUserProps>(function SidebarUser(
  { name, description, avatarSrc, status, ...props },
  ref,
) {
  return (
    <Identity
      ref={ref}
      slot="sidebar-user"
      side="top"
      // The name is right beside it; announcing it twice is noise.
      media={<UserAvatar name={name} src={avatarSrc} status={status} size="sm" aria-hidden />}
      title={name}
      subtitle={description}
      {...props}
    />
  )
})

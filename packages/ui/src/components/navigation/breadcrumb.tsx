import {
  forwardRef,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'
import { ChevronRightIcon, MoreIcon } from '../icons/icons'

/*
 * Breadcrumbs are markup only, so they render as Server Components. For a
 * client-side router link, pass it as a child of `BreadcrumbItem`.
 */

export const Breadcrumb = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Breadcrumb(
  { className, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      data-slot="breadcrumb"
      className={className}
      {...props}
    />
  )
})

export const BreadcrumbList = forwardRef<HTMLOListElement, OlHTMLAttributes<HTMLOListElement>>(
  function BreadcrumbList({ className, ...props }, ref) {
    return <ol ref={ref} className={cn('sui-breadcrumb__list', className)} {...props} />
  },
)

export const BreadcrumbItem = forwardRef<HTMLLIElement, LiHTMLAttributes<HTMLLIElement>>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn('sui-breadcrumb__item', className)} {...props} />
  },
)

export const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement>
>(function BreadcrumbLink({ className, ...props }, ref) {
  return <a ref={ref} className={cn('sui-breadcrumb__link sui-focusable', className)} {...props} />
})

/** The current page. Not a link — it goes nowhere — but marked as current. */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={cn('sui-breadcrumb__page', className)}
        {...props}
      />
    )
  },
)

export const BreadcrumbSeparator = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  function BreadcrumbSeparator({ children, className, ...props }, ref) {
    return (
      <li
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn('sui-breadcrumb__separator', className)}
        {...props}
      >
        {children ?? <ChevronRightIcon />}
      </li>
    )
  },
)

export interface BreadcrumbEllipsisProps extends HTMLAttributes<HTMLSpanElement> {
  /** Text for screen readers in place of the icon. Defaults to `"More"`. */
  label?: string
}

/** Levels left out of a long trail. The icon is decorative; `label` is read instead. */
export const BreadcrumbEllipsis = forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(
  function BreadcrumbEllipsis({ className, label = 'More', ...props }, ref) {
    return (
      <span ref={ref} className={cn('sui-breadcrumb__separator', className)} {...props}>
        <MoreIcon />
        <span className="sui-visually-hidden">{label}</span>
      </span>
    )
  },
)

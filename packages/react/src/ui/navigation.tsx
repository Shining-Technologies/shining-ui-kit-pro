import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MoreIcon } from '../lib/icons'

/* ---------------------------------------------------------------------- tabs */

export interface TabsProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /**
   * `pills` is a control; `underline` is navigation. The distinction matters —
   * a pill track next to a page title reads as a filter, not as sections.
   */
  appearance?: 'pills' | 'underline'
}

export const Tabs = forwardRef<ElementRef<typeof TabsPrimitive.Root>, TabsProps>(function Tabs(
  { className, appearance = 'pills', orientation, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      orientation={orientation}
      className={cn(
        'sui-tabs',
        appearance === 'underline' && 'sui-tabs--underline',
        orientation === 'vertical' && 'sui-tabs--vertical',
        className,
      )}
      {...props}
    />
  )
})

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn('sui-tabs__list', className)}
      {...props}
    />
  )
})

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn('sui-tabs__trigger sui-focusable', className)}
      {...props}
    />
  )
})

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      className={cn('sui-tabs__content', className)}
      {...props}
    />
  )
})

/* ----------------------------------------------------------------- accordion */

export interface AccordionProps {
  /** `separated` gives each item its own card instead of a shared rule. */
  appearance?: 'bordered' | 'separated'
}

export const Accordion = forwardRef<
  ElementRef<typeof AccordionPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & AccordionProps
>(function Accordion({ className, appearance = 'bordered', ...props }, ref) {
  return (
    <AccordionPrimitive.Root
      ref={ref}
      data-slot="accordion"
      className={cn(
        'sui-accordion',
        appearance === 'separated' && 'sui-accordion--separated',
        className,
      )}
      {...props}
    />
  )
})

export const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn('sui-accordion__item', className)}
      {...props}
    />
  )
})

export const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    // Radix requires the trigger to be inside a Header for the heading
    // semantics; without it the panel has no accessible name in a landmark.
    <AccordionPrimitive.Header asChild>
      <h3 style={{ margin: 0, font: 'inherit' }}>
        <AccordionPrimitive.Trigger
          ref={ref}
          data-slot="accordion-trigger"
          className={cn('sui-accordion__trigger sui-focusable', className)}
          {...props}
        >
          {children}
          <ChevronDownIcon className="sui-accordion__chevron" />
        </AccordionPrimitive.Trigger>
      </h3>
    </AccordionPrimitive.Header>
  )
})

export const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className={cn('sui-accordion__content', className)}
      {...props}
    >
      <div className="sui-accordion__body">{children}</div>
    </AccordionPrimitive.Content>
  )
})

/* --------------------------------------------------------------- collapsible */

export const Collapsible = CollapsiblePrimitive.Root
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(function CollapsibleContent({ className, ...props }, ref) {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      data-slot="collapsible-content"
      className={cn('sui-collapsible__content', className)}
      {...props}
    />
  )
})

/* ---------------------------------------------------------------- breadcrumb */

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

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('sui-breadcrumb__separator', className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

export function BreadcrumbEllipsis({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('sui-breadcrumb__separator', className)}
      {...props}
    >
      <MoreIcon />
    </span>
  )
}

/* --------------------------------------------------------------------- pager */

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /** 1-based. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** How many numbered links to show around the current page. */
  siblings?: number
  labels?: { previous?: ReactNode; next?: ReactNode; label?: string }
}

/**
 * Which page numbers to render.
 *
 * Always the same number of slots, so the control does not change width as the
 * user pages through and move the button out from under their cursor.
 */
function pageItems(page: number, pageCount: number, siblings: number): (number | 'gap')[] {
  const total = siblings * 2 + 5
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1)

  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, pageCount)
  const showLeftGap = left > 2
  const showRightGap = right < pageCount - 1

  if (!showLeftGap && showRightGap) {
    const count = siblings * 2 + 3
    return [...Array.from({ length: count }, (_, i) => i + 1), 'gap', pageCount]
  }
  if (showLeftGap && !showRightGap) {
    const count = siblings * 2 + 3
    return [1, 'gap', ...Array.from({ length: count }, (_, i) => pageCount - count + 1 + i)]
  }
  return [
    1,
    'gap',
    ...Array.from({ length: right - left + 1 }, (_, i) => left + i),
    'gap',
    pageCount,
  ]
}

/** Standalone page navigation, for lists that are not tables. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { className, page, pageCount, onPageChange, siblings = 1, labels, ...props },
  ref,
) {
  const items = pageItems(page, Math.max(pageCount, 1), siblings)

  return (
    <nav
      ref={ref}
      aria-label={labels?.label ?? 'Pagination'}
      data-slot="pagination"
      className={cn('sui-pager', className)}
      {...props}
    >
      <button
        type="button"
        className="sui-pager__item sui-focusable"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        {labels?.previous ?? <ChevronLeftIcon />}
      </button>

      {items.map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="sui-pager__ellipsis" aria-hidden="true">
            <MoreIcon />
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="sui-pager__item sui-focusable"
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="sui-pager__item sui-focusable"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
      >
        {labels?.next ?? <ChevronRightIcon />}
      </button>
    </nav>
  )
})

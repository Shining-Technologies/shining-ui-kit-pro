'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { getPageNumbers } from '../../core'
import { cn } from '../../lib/cn'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MoreIcon } from '../icons/icons'

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

/** Radix Accordion `Root` props (`type`, `value`, `collapsible`, …) plus `appearance`. */
export type AccordionProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
  /** `separated` gives each item its own card instead of a shared rule. */
  appearance?: 'bordered' | 'separated'
}

export const Accordion = forwardRef<ElementRef<typeof AccordionPrimitive.Root>, AccordionProps>(function Accordion({ className, appearance = 'bordered', ...props }, ref) {
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

export type AccordionTriggerProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
  /** The level of the heading the trigger sits in. Match the page's outline. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(function AccordionTrigger({ className, children, headingLevel = 3, ...props }, ref) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  return (
    // Radix requires the trigger to be inside a Header for the heading
    // semantics; without it the panel has no accessible name in a landmark.
    <AccordionPrimitive.Header asChild>
      <Heading style={{ margin: 0, font: 'inherit' }}>
        <AccordionPrimitive.Trigger
          ref={ref}
          data-slot="accordion-trigger"
          className={cn('sui-accordion__trigger sui-focusable', className)}
          {...props}
        >
          {children}
          <ChevronDownIcon className="sui-accordion__chevron" />
        </AccordionPrimitive.Trigger>
      </Heading>
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

/* --------------------------------------------------------------------- pager */

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /** 1-based. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** How many numbered links to show around the current page. */
  siblings?: number
  /**
   * `previous` / `next` replace the visible arrows; `label` names the landmark;
   * `previousPage`, `nextPage` and `page` are the buttons' accessible names.
   */
  labels?: {
    previous?: ReactNode
    next?: ReactNode
    label?: string
    /** Defaults to `"Previous page"`. */
    previousPage?: string
    /** Defaults to `"Next page"`. */
    nextPage?: string
    /** The name of a numbered button, given its 1-based page. Defaults to `"Page 3"`. */
    page?: (page: number) => string
  }
}

/**
 * Standalone page navigation, for lists that are not tables.
 *
 * The page window comes from `getPageNumbers` in core — the same one the data
 * table uses — so the two never disagree about which pages to show. It always
 * has the same number of slots, so the control does not change width as the
 * user pages through and move a button out from under their cursor.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { className, page, pageCount, onPageChange, siblings = 1, labels, ...props },
  ref,
) {
  const items = getPageNumbers(page - 1, Math.max(pageCount, 1), siblings)

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
        aria-label={labels?.previousPage ?? 'Previous page'}
      >
        {labels?.previous ?? <ChevronLeftIcon />}
      </button>

      {items.map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className="sui-pager__item sui-focusable"
            aria-current={item + 1 === page ? 'page' : undefined}
            aria-label={labels?.page ? labels.page(item + 1) : `Page ${item + 1}`}
            onClick={() => onPageChange(item + 1)}
          >
            {item + 1}
          </button>
        ) : (
          <span key={item} className="sui-pager__ellipsis" aria-hidden="true">
            <MoreIcon />
          </span>
        ),
      )}

      <button
        type="button"
        className="sui-pager__item sui-focusable"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={labels?.nextPage ?? 'Next page'}
      >
        {labels?.next ?? <ChevronRightIcon />}
      </button>
    </nav>
  )
})

'use client'

import { forwardRef, useEffect, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ArrowLeftIcon } from '../icons/icons'
import { Button } from '../button/button'

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  /** Breadcrumbs, a status badge — anything that belongs above the title. */
  eyebrow?: ReactNode
  /** The page's primary actions, right-aligned on wide screens. */
  actions?: ReactNode
  /** Show a back control. The kit has no router, so the caller navigates. */
  onBack?: () => void
  backLabel?: string
  /**
   * Which heading level to render. A page has one `h1`; a header used inside a
   * section should say so rather than nesting a second one.
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  /**
   * Set `document.title` to this while the header is mounted. `true` uses the
   * title when it is a plain string. Restores the previous title on unmount, so
   * a modal route does not leave the tab renamed.
   */
  documentTitle?: string | boolean
  /** Tabs or a filter bar, rendered under the header and above the content. */
  children?: ReactNode
  /** Draw a rule under the whole block. */
  bordered?: boolean
}

/**
 * The top of a page: where you are, what it is, and what you can do here.
 *
 * Worth being a component rather than markup in every route because the three
 * things that drift otherwise — heading level, the back affordance, and where
 * the actions sit when the title wraps — are exactly the three things a reader
 * uses to orient themselves.
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  {
    className,
    title,
    description,
    eyebrow,
    actions,
    onBack,
    backLabel = 'Back',
    as = 'h1',
    documentTitle,
    bordered = false,
    children,
    ...props
  },
  ref,
) {
  const Heading = as as ElementType

  const wanted =
    documentTitle === true
      ? typeof title === 'string'
        ? title
        : undefined
      : typeof documentTitle === 'string'
        ? documentTitle
        : undefined

  useEffect(() => {
    if (!wanted || typeof document === 'undefined') return
    const previous = document.title
    document.title = wanted
    return () => {
      document.title = previous
    }
  }, [wanted])

  return (
    <div
      ref={ref}
      data-slot="page-header"
      className={cn('sui-page-header', bordered && 'sui-page-header--bordered', className)}
      {...props}
    >
      <div className="sui-page-header__bar">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="sui-page-header__back"
            onClick={onBack}
            aria-label={backLabel}
          >
            <ArrowLeftIcon />
          </Button>
        ) : null}

        <div className="sui-page-header__text">
          {eyebrow ? <div className="sui-page-header__eyebrow">{eyebrow}</div> : null}
          <Heading className="sui-page-header__title">{title}</Heading>
          {description ? <p className="sui-page-header__description">{description}</p> : null}
        </div>

        {actions ? <div className="sui-page-header__actions">{actions}</div> : null}
      </div>

      {children ? <div className="sui-page-header__extra">{children}</div> : null}
    </div>
  )
})

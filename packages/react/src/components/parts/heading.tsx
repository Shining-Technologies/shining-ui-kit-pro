import { cn } from '../../lib/cn'
import type { HeadingProps } from '../../types/components'

/**
 * The table's own title block.
 *
 * A table on a page rarely needs one; a table on a dashboard, in a tab, or
 * beside three others always does — "what is this list, and what is *not* in
 * it" is the question the description exists to answer, and putting it inside
 * the component keeps it attached to the data rather than to the page layout.
 *
 * The title is a `<p>`, not an `<h2>`: only the page knows what heading level
 * it is at. Pass `titleAs` when the table is a section of its own.
 */
export function DataTableHeading<TData>({
  title,
  description,
  icon,
  actions,
  titleId,
  titleAs: Title = 'p',
  headingProps,
}: HeadingProps<TData>) {
  if (!title && !description && !icon && !actions) return null

  return (
    <div {...headingProps} className={cn('sui-heading', headingProps?.className)}>
      <div className="sui-heading__text">
        {title ? (
          <Title id={titleId} className="sui-heading__title">
            {icon ? (
              <span className="sui-heading__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            {title}
          </Title>
        ) : null}
        {description ? <p className="sui-heading__description">{description}</p> : null}
      </div>
      {actions ? <div className="sui-heading__actions">{actions}</div> : null}
    </div>
  )
}

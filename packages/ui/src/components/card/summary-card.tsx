import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { AccentTone } from '../../lib/tone'
import { BreakdownList, type BreakdownListProps } from './breakdown-list'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
  type CardProps,
  type CardTitleProps,
} from './card'
import { MetricGrid, MetricTile, type MetricGridProps, type MetricTileData } from './metric-tile'

export interface SummaryMetric extends MetricTileData {
  key?: string
}

export interface SummaryCardProps extends Omit<CardProps, 'title' | 'asChild'> {
  title: ReactNode
  /** The title's element, as on `CardTitle` — a heading level that fits the page. */
  titleAs?: CardTitleProps['as']
  description?: ReactNode
  /** A glyph for the header's tinted tile. */
  icon?: ReactNode
  iconTone?: AccentTone
  /** Top right of the header — a menu, a link, a period badge. */
  action?: ReactNode
  /** The headline figures, as tiles. */
  metrics?: SummaryMetric[]
  metricColumns?: MetricGridProps['columns']
  /** The per-bucket counts under the figures. */
  breakdown?: BreakdownListProps['items']
  breakdownTitle?: ReactNode
  /** The rest of `BreakdownList`'s options — shares, percentages, the summary bar. */
  breakdownProps?: Omit<BreakdownListProps, 'items' | 'title' | 'loading'>
  /** Placeholders in every figure and row while the data is in flight. */
  loading?: boolean
  footer?: ReactNode
}

/**
 * The dashboard block every module ends up with: a titled card, a strip of
 * headline figures, and a count per status underneath.
 *
 * Assembled from `CardIcon`, `MetricTile` and `BreakdownList`, which are all
 * exported, so a card that outgrows these props is recomposed from the same
 * parts rather than rebuilt. `children` render after the breakdown.
 */
export const SummaryCard = forwardRef<HTMLDivElement, SummaryCardProps>(function SummaryCard(
  {
    className,
    title,
    titleAs,
    description,
    icon,
    iconTone = 'primary',
    action,
    metrics,
    metricColumns,
    breakdown,
    breakdownTitle = 'By status',
    breakdownProps,
    loading = false,
    footer,
    children,
    ...props
  },
  ref,
) {
  return (
    <Card
      ref={ref}
      data-slot="summary-card"
      className={cn('sui-summary-card', className)}
      {...props}
    >
      <CardHeader>
        {icon ? <CardIcon tone={iconTone}>{icon}</CardIcon> : null}
        <CardTitle as={titleAs}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>

      <CardContent className="sui-summary-card__body">
        {metrics && metrics.length > 0 ? (
          <MetricGrid columns={metricColumns}>
            {metrics.map(({ key, ...metric }, index) => (
              <MetricTile
                // Position, not label: two tiles may share a label.
                key={key ?? index}
                {...metric}
                loading={loading || metric.loading}
              />
            ))}
          </MetricGrid>
        ) : null}

        {breakdown ? (
          <BreakdownList
            title={breakdownTitle}
            items={breakdown}
            loading={loading}
            {...breakdownProps}
          />
        ) : null}

        {children}
      </CardContent>

      {footer ? <CardFooter bordered>{footer}</CardFooter> : null}
    </Card>
  )
})

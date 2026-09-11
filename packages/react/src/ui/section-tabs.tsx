import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useControllableState } from '../lib/use-controllable-state'

export interface SectionTab {
  id: string
  label: ReactNode
  /** A count beside the label — open items, unread, results. */
  count?: number
  icon?: ReactNode
  disabled?: boolean
}

export interface SectionTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: SectionTab[]
  /** Controlled selection. */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** `underline` reads as sections of a page; `pills` reads as a filter. */
  appearance?: 'underline' | 'pills'
  /** Stretch the tabs to fill the row — for a two- or three-way split. */
  fill?: boolean
  'aria-label'?: string
}

/**
 * A row of section links.
 *
 * Not `Tabs`: these usually change the *route*, and a tablist owns its panels —
 * claiming that relationship when the content is a separate page makes a screen
 * reader promise something the app does not deliver. So this is a plain group
 * of buttons with `aria-current`, and the arrow-key behaviour people expect
 * from real tabs is deliberately absent.
 */
export const SectionTabs = forwardRef<HTMLDivElement, SectionTabsProps>(function SectionTabs(
  {
    className,
    tabs,
    value,
    defaultValue,
    onValueChange,
    appearance = 'underline',
    fill = false,
    ...props
  },
  ref,
) {
  const [selected, setActive] = useControllableState<string | undefined>({
    value,
    defaultValue: defaultValue ?? tabs[0]?.id,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  })
  // Resolved at render, not only at mount: tabs that arrive after the first
  // render (loaded, or permission-filtered) still get a current one.
  const active = selected ?? tabs[0]?.id

  return (
    <div
      ref={ref}
      data-slot="section-tabs"
      className={cn(
        'sui-section-tabs',
        appearance === 'pills' && 'sui-section-tabs--pills',
        fill && 'sui-section-tabs--fill',
        className,
      )}
      {...props}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={tab.disabled}
          aria-current={tab.id === active ? 'page' : undefined}
          className="sui-section-tabs__tab sui-focusable"
          onClick={() => setActive(tab.id)}
        >
          {tab.icon ? (
            <span className="sui-section-tabs__icon" aria-hidden="true">
              {tab.icon}
            </span>
          ) : null}
          <span className="sui-section-tabs__label">{tab.label}</span>
          {tab.count !== undefined ? (
            <span className="sui-section-tabs__count">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
})

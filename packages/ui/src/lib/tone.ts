import type { StatusTone } from '../components/badge/status-badge'

/**
 * A colour that carries meaning: the six status tones, plus the five chart
 * tones for a categorical breakdown that has more buckets than there are
 * statuses. Every one resolves to a project token.
 */
export type AccentTone = StatusTone | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/**
 * The class that sets `--sui-tone` for an element.
 *
 * One custom property rather than a class per tone per component: a new
 * component that wants a tone reads `var(--sui-tone)` and is done, instead of
 * adding eleven more selectors to the stylesheet.
 */
export function toneClass(tone: AccentTone | null | undefined): string {
  return `sui-tone--${tone ?? 'neutral'}`
}

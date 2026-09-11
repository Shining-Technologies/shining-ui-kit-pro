import type { ColumnFiltersState, SortingState } from '@tanstack/table-core'
import type { FilteringFeature, SortingFeature } from '../types/state'

/**
 * `sorting` and `columnFilters` accept either controlled state or a feature
 * config object. A state value is *always* an array and a config is *always* a
 * plain object, so the two can never be confused.
 *
 * See ARCHITECTURE.md §3 for why this shortcut exists only on these two props.
 */
export interface Normalized<TState, TConfig> {
  state: TState | undefined
  config: TConfig | undefined
}

export function normalizeSortingProp(
  prop: SortingState | SortingFeature | undefined,
): Normalized<SortingState, SortingFeature> {
  if (Array.isArray(prop)) return { state: prop, config: undefined }
  return { state: undefined, config: prop }
}

export function normalizeFiltersProp(
  prop: ColumnFiltersState | FilteringFeature | undefined,
): Normalized<ColumnFiltersState, FilteringFeature> {
  if (Array.isArray(prop)) return { state: prop, config: undefined }
  return { state: undefined, config: prop }
}

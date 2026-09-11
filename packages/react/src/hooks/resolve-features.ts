import {
  normalizeFiltersProp,
  normalizeSortingProp,
  type DataMode,
  type DataTableFeatures,
  type PinnedSide,
} from '@shining-ui-kit/core'
import type { DataTableProps } from '../types/props'

/** Every feature flag with its defaults filled in. Nothing downstream sees `undefined`. */
export interface ResolvedFeatures<TData> {
  sorting: { enabled: boolean; mode: DataMode; multi: boolean | 'always'; removable: boolean }
  filtering: {
    enabled: boolean
    mode: DataMode
    globalSearch: boolean
    debounceMs: number
    searchPlaceholder: string
  }
  pagination: {
    enabled: boolean
    mode: DataMode
    pageSize: number
    pageSizeOptions: number[]
    rowCount: number | undefined
    showPageNumbers: boolean
    siblingCount: number
  }
  selection: {
    enabled: boolean
    mode: 'single' | 'multiple'
    enableRow: ((row: TData) => boolean) | undefined
  }
  columnVisibility: { enabled: boolean }
  resizing: { enabled: boolean; mode: 'onChange' | 'onEnd' }
  pinning: { enabled: boolean; actions: PinnedSide | false; selection: PinnedSide | false }
  expanding: { enabled: boolean; mode: 'single' | 'multiple' }
  virtualization: { enabled: boolean; estimateRowHeight: number; overscan: number }
}

/**
 * Hints derived from the column definitions themselves.
 *
 * Declaring `enableResizing` on a column is enough to turn resizing on — nobody
 * should have to say the same thing twice in two places.
 */
export interface ColumnCapabilityHints {
  anyResizable: boolean
  anyPinnable: boolean
  anyFooter: boolean
}

export function resolveFeatures<TData>(
  props: DataTableProps<TData>,
  hints: ColumnCapabilityHints,
): ResolvedFeatures<TData> {
  const features: DataTableFeatures<TData> = props.features ?? {}
  const defaultMode: DataMode = props.mode ?? 'client'

  // `sorting` / `columnFilters` may carry a config object instead of state.
  const sortingConfig = { ...features.sorting, ...normalizeSortingProp(props.sorting).config }
  const filteringConfig = {
    ...features.filtering,
    ...normalizeFiltersProp(props.columnFilters).config,
  }

  const pagination = features.pagination ?? {}
  const selection = features.selection ?? {}
  const resizing = features.resizing ?? {}
  const pinning = features.pinning ?? {}
  const expanding = features.expanding ?? {}
  const virtualization = features.virtualization ?? {}

  // Only meaningful when the table actually injects the column in question.
  const wantsActions = Boolean(props.rowActions ?? props.slots?.rowActions)
  const actionsSide: PinnedSide | false = wantsActions ? (pinning.actions ?? 'right') : false
  const selectionSide: PinnedSide | false = pinning.selection ?? false

  return {
    sorting: {
      enabled: sortingConfig.enabled ?? true,
      mode: sortingConfig.mode ?? defaultMode,
      multi: sortingConfig.multi ?? true,
      removable: sortingConfig.removable ?? true,
    },
    filtering: {
      enabled: filteringConfig.enabled ?? true,
      mode: filteringConfig.mode ?? defaultMode,
      globalSearch: filteringConfig.globalSearch ?? true,
      debounceMs: filteringConfig.debounceMs ?? 250,
      searchPlaceholder: filteringConfig.searchPlaceholder ?? 'Search…',
    },
    pagination: {
      enabled: pagination.enabled ?? true,
      mode: pagination.mode ?? defaultMode,
      pageSize: props.pageSize ?? pagination.pageSize ?? 10,
      pageSizeOptions: pagination.pageSizeOptions ?? [10, 25, 50, 100],
      rowCount: props.rowCount ?? pagination.rowCount,
      showPageNumbers: pagination.showPageNumbers ?? true,
      siblingCount: pagination.siblingCount ?? 1,
    },
    selection: {
      enabled: props.enableRowSelection ?? selection.enabled ?? false,
      mode: selection.mode ?? 'multiple',
      enableRow: selection.enableRow,
    },
    columnVisibility: {
      enabled: features.columnVisibility?.enabled ?? true,
    },
    resizing: {
      enabled: resizing.enabled ?? hints.anyResizable,
      mode: resizing.mode ?? 'onChange',
    },
    pinning: {
      // A pinned actions column is the reason most tables need pinning at all,
      // so asking for row actions — or for either injected column to be
      // frozen — is enough to turn the feature on.
      enabled:
        pinning.enabled ?? (hints.anyPinnable || actionsSide !== false || selectionSide !== false),
      actions: actionsSide,
      selection: selectionSide,
    },
    expanding: {
      enabled: expanding.enabled ?? Boolean(props.renderExpandedRow),
      mode: expanding.mode ?? 'multiple',
    },
    virtualization: {
      enabled: virtualization.enabled ?? false,
      estimateRowHeight: virtualization.estimateRowHeight ?? 48,
      overscan: virtualization.overscan ?? 8,
    },
  }
}

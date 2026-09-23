'use client'

import { useDataTable } from '../context'
import { BulkActionBar } from '../../data-view/bulk-action-bar'
import type { SelectionBarProps } from '../types/components'

/**
 * The "N selected" band.
 *
 * Selection made in a paginated table survives page changes, so without this
 * the count is invisible the moment the selected rows scroll or page away —
 * and "Clear" is the only affordance that reliably gets a user back to a known
 * state. Bulk actions from `slots.selectionActions` sit between the two.
 */
export function DefaultSelectionBar<TData>({
  selectedCount,
  clearSelection,
  actions,
}: SelectionBarProps<TData>) {
  const { table, numberFormat: nf } = useDataTable<TData>()

  return (
    <BulkActionBar
      count={selectedCount}
      total={table.getRowCount()}
      onClear={clearSelection}
      formatNumber={(value) => nf.format(value)}
    >
      {actions}
    </BulkActionBar>
  )
}

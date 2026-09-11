import { useDataTable } from '../../context/table-context'
import { CloseIcon } from '../../lib/icons'
import type { SelectionBarProps } from '../../types/components'

const nf = new Intl.NumberFormat()

/**
 * The "N selected" band.
 *
 * Selection made in a paginated table survives page changes, so without this
 * the count is invisible the moment the selected rows scroll or page away —
 * and "Clear" is the only affordance that reliably gets a user back to a known
 * state.
 */
export function DefaultSelectionBar<TData>({
  selectedCount,
  clearSelection,
}: SelectionBarProps<TData>) {
  const { table } = useDataTable<TData>()
  if (selectedCount === 0) return null

  const total = table.getRowCount()

  return (
    <div className="sui-selection-bar" role="status" aria-live="polite">
      <span className="sui-selection-bar__count">
        <strong>{nf.format(selectedCount)}</strong> of {nf.format(total)} selected
      </span>
      <button type="button" className="sui-selection-bar__clear" onClick={clearSelection}>
        <CloseIcon aria-hidden="true" />
        Clear selection
      </button>
    </div>
  )
}

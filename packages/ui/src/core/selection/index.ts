import type { RowSelectionState } from '../types/state'

/**
 * Pure row-selection helpers over the table's `RowSelectionState`
 * (`{ [rowId]: true }`). Useful in toolbars, Server Actions ("delete the
 * selected ids") and custom tables.
 */

export type SelectionMode = 'single' | 'multiple'

export type SelectionStatus = 'none' | 'some' | 'all'

/** The ids that are selected. */
export function getSelectedRowIds(selection: RowSelectionState): string[] {
  return Object.keys(selection).filter((id) => selection[id])
}

export function isRowSelected(selection: RowSelectionState, id: string): boolean {
  return selection[id] === true
}

/** Select or deselect one row. In `'single'` mode selecting a row deselects the rest. */
export function setRowSelected(
  selection: RowSelectionState,
  id: string,
  selected: boolean,
  mode: SelectionMode = 'multiple',
): RowSelectionState {
  if (selected) return mode === 'single' ? { [id]: true } : { ...selection, [id]: true }
  if (!selection[id]) return selection
  const next = { ...selection }
  delete next[id]
  return next
}

export function toggleRowSelected(
  selection: RowSelectionState,
  id: string,
  mode: SelectionMode = 'multiple',
): RowSelectionState {
  return setRowSelected(selection, id, !isRowSelected(selection, id), mode)
}

/** Select or deselect many rows at once — "select all on this page". */
export function setRowsSelected(
  selection: RowSelectionState,
  ids: readonly string[],
  selected: boolean,
): RowSelectionState {
  const next = { ...selection }
  for (const id of ids) {
    if (selected) next[id] = true
    else delete next[id]
  }
  return next
}

/** Whether none, some or all of `ids` are selected — the header checkbox's three states. */
export function getSelectionStatus(
  selection: RowSelectionState,
  ids: readonly string[],
): SelectionStatus {
  if (ids.length === 0) return 'none'
  const count = ids.filter((id) => selection[id]).length
  return count === 0 ? 'none' : count === ids.length ? 'all' : 'some'
}

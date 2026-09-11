import type { ColumnDef as EngineColumnDef, Row, Table } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import {
  isRowActionSpecs,
  renderRowActions,
  type RowActionSpec,
} from '../components/cells/row-action'
import { expandedRowId, useOptionalDataTable } from '../context/table-context'
import { ChevronRightIcon, ListIcon } from '../lib/icons'
import { Checkbox } from '../primitives/checkbox'

/**
 * Columns the table injects for itself.
 *
 * They are ordinary engine columns, so they sort, hide, pin and resize like any
 * other — and a user who wants them somewhere else can place them by hand using
 * the exported ids.
 */
export const SELECTION_COLUMN_ID = 'sui-select'
export const EXPANDER_COLUMN_ID = 'sui-expander'
export const ACTIONS_COLUMN_ID = 'sui-actions'

/**
 * A row's 1-based position among the rows currently on screen.
 *
 * `row.index` is the position in the source data, which stops matching what the
 * user sees as soon as they sort — and a checkbox labelled "Select row 2" must
 * mean the second row they can see. Memoised per row-model array, so this stays
 * O(1) per cell.
 */
const positionCache = new WeakMap<object, Map<string, number>>()

function displayPosition<TData>(table: Table<TData>, row: Row<TData>): number {
  const rows = table.getRowModel().rows
  let positions = positionCache.get(rows)
  if (!positions) {
    positions = new Map(rows.map((entry, index) => [entry.id, index + 1]))
    positionCache.set(rows, positions)
  }
  return positions.get(row.id) ?? row.index + 1
}

/*
 * What the injected columns are not.
 *
 * `enablePinning: false` is about the header menu, not about pinning: the menu
 * appears whenever a column can be sorted, hidden or pinned, and it is drawn
 * over the head's own content so that it does not displace a label. In a 44px
 * checkbox or expander column there is nothing but that content to cover, so
 * the checkbox vanished under a menu offering to pin a column of checkboxes.
 * These columns are still pinned through `columnPinning`, which is state, not
 * a per-column capability.
 */
const STRUCTURAL = {
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
  enablePinning: false,
  enableGlobalFilter: false,
  enableColumnFilter: false,
} as const

export function createSelectionColumn<TData>(
  mode: 'single' | 'multiple',
): EngineColumnDef<TData, unknown> {
  return {
    id: SELECTION_COLUMN_ID,
    ...STRUCTURAL,
    size: 44,
    minSize: 44,
    maxSize: 44,
    meta: { align: 'center', label: 'Selection', hideLabelInCards: true },
    // Every header needs text a screen reader can read, even when it looks empty.
    header: ({ table }) =>
      mode === 'single' ? (
        <span className="sui-sr-only">Selection</span>
      ) : (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label="Select all rows on this page"
        />
      ),
    cell: ({ row, table }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
        aria-label={`Select row ${displayPosition(table, row)}`}
        // The row already handles clicks; don't let it fire twice.
        onClick={(event) => event.stopPropagation()}
      />
    ),
  }
}

export function createExpanderColumn<TData>(): EngineColumnDef<TData, unknown> {
  return {
    id: EXPANDER_COLUMN_ID,
    ...STRUCTURAL,
    size: 44,
    minSize: 44,
    maxSize: 44,
    meta: { align: 'center', label: 'Expand', hideLabelInCards: true },
    // A glyph rather than a blank: an unnamed column reads as a rendering
    // accident, and "Details" is too wide for a 44px head.
    header: () => (
      <>
        <ListIcon className="sui-expander__head" aria-hidden="true" />
        <span className="sui-sr-only">Details</span>
      </>
    ),
    cell: ({ row }) => (row.getCanExpand() ? <ExpanderButton row={row} /> : null),
  }
}

function ExpanderButton<TData>({ row }: { row: Row<TData> }) {
  // Optional: the column also works in a bare engine table, outside <DataTable />.
  const tableId = useOptionalDataTable()?.tableId
  const expanded = row.getIsExpanded()
  return (
    <button
      type="button"
      className="sui-expander"
      data-expanded={expanded || undefined}
      aria-expanded={expanded}
      aria-controls={expandedRowId(tableId, row.id)}
      aria-label={expanded ? 'Collapse row details' : 'Expand row details'}
      onClick={(event) => {
        event.stopPropagation()
        row.toggleExpanded()
      }}
    >
      <ChevronRightIcon className="sui-expander__icon" />
    </button>
  )
}

export interface ActionsColumnOptions {
  /** Visible header text. `false` keeps the name for screen readers only. */
  header?: ReactNode | false
  /** Fixed width in pixels; widen it for rows with several icons. */
  width?: number
}

export function createActionsColumn<TData>(
  render: (row: Row<TData>) => ReactNode | RowActionSpec[],
  options: ActionsColumnOptions = {},
): EngineColumnDef<TData, unknown> {
  // Three icons — view, edit, delete — is the common case, and a column that
  // clips the third is worse than one with a little air in it.
  const { header = 'Actions', width = 120 } = options
  return {
    id: ACTIONS_COLUMN_ID,
    ...STRUCTURAL,
    size: width,
    minSize: 56,
    meta: { align: 'left', label: 'Actions', hideLabelInCards: true },
    // A visible header, because a column of icons under a blank head reads as
    // something that failed to render.
    header: () => (header === false ? <span className="sui-sr-only">Actions</span> : <>{header}</>),
    cell: ({ row }) => (
      // Menus and buttons in here must not also trigger the row's own click.
      // `display: contents`, so whatever the application renders is laid out
      // by the cell itself — this element exists only to catch the clicks.
      <div
        className="sui-actions-cell"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        {/* Described actions are built here; anything else is rendered as given. */}
        {(() => {
          const content = render(row)
          return isRowActionSpecs(content) ? renderRowActions(content) : content
        })()}
      </div>
    ),
  }
}

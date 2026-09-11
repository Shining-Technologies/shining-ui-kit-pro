import { useDataTable } from '../../context/table-context'
import { ChevronDownIcon, ChevronUpIcon } from '../../lib/icons'
import { Button } from '../../primitives/button'
import { Checkbox } from '../../primitives/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'

const UNSORTED = '__sui-unsorted'

/**
 * What the header row does, for the card layout.
 *
 * Cards have no header row, and the header row is where sorting and "select
 * all" live — so without this a phone could neither sort the list nor select
 * a page of it. Always rendered and shown only by the card rules in
 * table.css, the same way the cards themselves are: no resize listener, and
 * nothing that can disagree with the layout on screen.
 */
export function CardControls<TData>() {
  const { table, features, columnLabels } = useDataTable<TData>()

  const sortable = features.sorting.enabled
    ? table.getAllLeafColumns().filter((column) => column.getCanSort())
    : []
  const selectAll = features.selection.enabled && features.selection.mode === 'multiple'
  if (sortable.length === 0 && !selectAll) return null

  const current = table.getState().sorting[0]
  const allSelected = table.getIsAllPageRowsSelected()
  const someSelected = table.getIsSomePageRowsSelected()

  return (
    <div className="sui-card-controls" role="group" aria-label="Sort and select">
      {selectAll ? (
        <label className="sui-card-controls__select-all">
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            aria-label="Select all rows on this page"
          />
          <span>Select all</span>
        </label>
      ) : null}

      {sortable.length > 0 ? (
        <div className="sui-card-controls__sort">
          <Select
            value={current?.id ?? UNSORTED}
            onValueChange={(id) =>
              table.setSorting(id === UNSORTED ? [] : [{ id, desc: current?.desc ?? false }])
            }
          >
            <SelectTrigger className="sui-card-controls__sort-trigger" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSORTED}>Default order</SelectItem>
              {sortable.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {columnLabels.get(column.id) ?? column.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon-sm"
            disabled={!current}
            onClick={() => current && table.setSorting([{ id: current.id, desc: !current.desc }])}
            aria-label={current?.desc ? 'Sort ascending' : 'Sort descending'}
          >
            {current?.desc ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useDataTable } from '../../context/table-context'
import { FilterIcon } from '../../lib/icons'
import { Button } from '../../primitives/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover'
import { Separator } from '../../primitives/separator'
import type { FiltersProps } from '../../types/components'
import { filterableColumns } from '../filters/filterable'
import { FilterControl } from '../filters/filter-control'
import { InlineFilters } from './inline-filters'

/**
 * The filter UI, in whichever layout the table asked for.
 *
 * One component rather than two props' worth of wiring: `filterLayout` is an
 * appearance decision, and appearance decisions should not change what a
 * consumer has to render.
 */
export function DefaultFilters<TData>({ table }: FiltersProps<TData>) {
  const { filterLayout } = useDataTable<TData>()
  return filterLayout === 'inline' ? <InlineFilters table={table} /> : <FilterPanel table={table} />
}

/**
 * The "Filter" popover.
 *
 * Filters apply as you change them rather than behind an Apply button: the
 * engine is already incremental, and a staged form would need a second copy of
 * the filter state, which §43 rules out. "Clear all" is the undo.
 */
export function FilterPanel<TData>({ table }: FiltersProps<TData>) {
  const { filterConfigs, columnLabels, clearFilters, isFiltered } = useDataTable<TData>()
  const [open, setOpen] = useState(false)

  const filterable = useMemo(() => filterableColumns(table, filterConfigs), [filterConfigs, table])

  const activeCount = table.getState().columnFilters.length
  if (filterable.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="sui-toolbar__filter-trigger"
          data-active={activeCount > 0 || undefined}
          aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters, none active'}
        >
          <FilterIcon />
          Filter
          {activeCount > 0 ? <span className="sui-count">{activeCount}</span> : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="sui-filter-panel">
        <div className="sui-filter-panel__head">
          <p className="sui-filter-panel__title">Filters</p>
        </div>

        <div className="sui-filter-panel__body">
          {filterable.map(({ column, config }) => (
            <FilterControl
              key={column.id}
              column={column}
              config={config}
              label={columnLabels.get(column.id) ?? column.id}
            />
          ))}
        </div>

        <Separator />

        <div className="sui-filter-panel__foot">
          <Button variant="ghost" onClick={clearFilters} disabled={!isFiltered}>
            Clear all
          </Button>
          <Button variant="solid" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { useDataTable } from '../../context/table-context'
import { ColumnsIcon } from '../../lib/icons'
import { Button } from '../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu'
import type { ViewOptionsProps } from '../../types/components'

/**
 * The column picker.
 *
 * Visibility is ordinary table state, so it can be lifted with
 * `columnVisibility` / `onColumnVisibilityChange` and persisted per user (§19).
 */
export function DefaultViewOptions<TData>({ table }: ViewOptionsProps<TData>) {
  const { columnLabels } = useDataTable<TData>()
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide())
  if (hideable.length === 0) return null

  const hiddenCount = hideable.filter((column) => !column.getIsVisible()).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={hiddenCount > 0 ? `Columns, ${hiddenCount} hidden` : 'Columns, all visible'}
        >
          <ColumnsIcon />
          Columns
          {hiddenCount > 0 ? <span className="sui-count">{hiddenCount}</span> : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="sui-view-options">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            {columnLabels.get(column.id) ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
        {hiddenCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            {/* Explicitly on, not reset: a reset returns columns to their
                defaults, which include the ones hidden at this screen width. */}
            <DropdownMenuItem onSelect={() => table.toggleAllColumnsVisible(true)}>
              Show all columns
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

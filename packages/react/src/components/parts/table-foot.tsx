import { flexRender } from '@tanstack/react-table'
import { useDataTable } from '../../context/table-context'
import {
  cardOrderStyle,
  pinningClasses,
  pinningStyle,
  responsiveColumnClass,
  sizeStyle,
} from '../../lib/cell-style'
import { ALIGN_CLASS } from '../../lib/class-names'
import { cn } from '../../lib/cn'
import { CardLabel } from './card-label'

/** Renders `<tfoot>` when any column declares a `footer`. */
export function TableFoot<TData>() {
  const {
    table,
    components,
    classNames,
    columnLabels,
    hasFooter,
    stickyFooter,
    responsiveMode,
    rowIndex,
  } = useDataTable<TData>()
  const { Footer } = components
  if (!hasFooter) return null

  return (
    <Footer
      table={table}
      footerProps={{
        role: 'rowgroup',
        className: cn('sui-tfoot', stickyFooter && 'sui-tfoot--sticky', classNames.footer),
      }}
    >
      {table.getFooterGroups().map((footerGroup, groupIndex) => (
        <tr
          key={footerGroup.id}
          role="row"
          aria-rowindex={rowIndex?.footer(groupIndex)}
          className="sui-tr sui-tr--foot"
        >
          {footerGroup.headers.map((header) => {
            const column = header.column
            const meta = column.columnDef.meta
            // A total on a card needs to say what it totals.
            const label =
              !header.isPlaceholder && column.columnDef.footer !== undefined
                ? (columnLabels.get(column.id) ?? column.id)
                : undefined
            return (
              <td
                key={header.id}
                role="cell"
                colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                className={cn(
                  'sui-td',
                  'sui-tf',
                  ALIGN_CLASS[meta?.align ?? 'left'],
                  responsiveColumnClass(table, column),
                  pinningClasses(column),
                  // A column left off the cards leaves its total off them too.
                  meta?.hideInCards && 'sui-hide-in-cards',
                )}
                style={{
                  ...sizeStyle(column.id, 'cell'),
                  ...pinningStyle(column),
                  ...cardOrderStyle(meta?.responsive?.priority),
                }}
                data-column-id={column.id}
                data-label={label}
              >
                {label !== undefined && responsiveMode !== 'scroll' ? (
                  <CardLabel label={label} />
                ) : null}
                {header.isPlaceholder
                  ? null
                  : flexRender(column.columnDef.footer, header.getContext())}
              </td>
            )
          })}
        </tr>
      ))}
    </Footer>
  )
}

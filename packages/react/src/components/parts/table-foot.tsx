import { flexRender } from '@tanstack/react-table'
import { useDataTable } from '../../context/table-context'
import { pinningClasses, pinningStyle, sizeStyle } from '../../lib/cell-style'
import { ALIGN_CLASS, responsiveClass } from '../../lib/class-names'
import { cn } from '../../lib/cn'

/** Renders `<tfoot>` when any column declares a `footer`. */
export function TableFoot<TData>() {
  const { table, components, classNames, hasFooter, stickyFooter } = useDataTable<TData>()
  const { Footer } = components
  if (!hasFooter) return null

  return (
    <Footer
      table={table}
      footerProps={{
        className: cn('sui-tfoot', stickyFooter && 'sui-tfoot--sticky', classNames.footer),
      }}
    >
      {table.getFooterGroups().map((footerGroup) => (
        <tr key={footerGroup.id} className="sui-tr sui-tr--foot">
          {footerGroup.headers.map((header) => {
            const column = header.column
            const meta = column.columnDef.meta
            return (
              <td
                key={header.id}
                colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                className={cn(
                  'sui-td',
                  'sui-tf',
                  ALIGN_CLASS[meta?.align ?? 'left'],
                  responsiveClass(meta?.responsive),
                  pinningClasses(column),
                )}
                style={{ ...sizeStyle(column.id, 'cell'), ...pinningStyle(column) }}
                data-column-id={column.id}
              >
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

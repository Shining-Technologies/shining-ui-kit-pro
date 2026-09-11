import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef, useState } from 'react'
import { DataTable } from './components/data-table'
import { BodyRow } from './components/parts/body-row'
import { useDataTable } from './context/table-context'
import type { BodyProps } from './types/components'
import type { DataTableProps } from './types/props'

/**
 * `@shining-technologies/ui-kit-react/virtualized`
 *
 * Row virtualisation, kept in a separate entry point so that
 * `@tanstack/react-virtual` is only downloaded by apps that actually
 * virtualise. It is an *optional* peer dependency; importing this module is
 * what pulls it in (§41, §53).
 *
 * ```tsx
 * import { VirtualizedDataTable } from '@shining-technologies/ui-kit-react/virtualized'
 *
 * <VirtualizedDataTable
 *   data={hundredThousandRows}
 *   columns={columns}
 *   maxHeight="70vh"
 *   features={{ virtualization: { enabled: true }, pagination: { enabled: false } }}
 * />
 * ```
 *
 * The table must have a bounded height (`maxHeight`) — that is what creates the
 * scroll container virtualisation measures against.
 */

/**
 * A `Body` replacement that renders only the rows in view.
 *
 * Spacer rows above and below carry the scroll height, which keeps the table's
 * column grid intact — no absolute positioning, no second layout system.
 */
export function VirtualizedBody<TData>({ rows, bodyProps, children }: BodyProps<TData>) {
  const { features, navigation, isRowDisabled } = useDataTable<TData>()
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  // The scroll container is found through the DOM so that a custom `Container`
  // still works, as long as it spreads its prop bag.
  useEffect(() => {
    const found = bodyRef.current?.closest<HTMLElement>('[data-sui-scroll]')
    setScrollElement(found ?? null)
  }, [])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => features.virtualization.estimateRowHeight,
    overscan: features.virtualization.overscan,
  })

  // The body is also where the empty, loading and error states live. In those
  // cases the parent hands us the state element as `children` and there is
  // nothing to virtualize; when it wants rows it passes `null` instead.
  if (children) {
    return (
      <tbody {...bodyProps} ref={bodyRef}>
        {children}
      </tbody>
    )
  }

  const items = virtualizer.getVirtualItems()
  const first = items[0]
  const last = items[items.length - 1]
  const paddingTop = first ? first.start : 0
  const paddingBottom = last ? virtualizer.getTotalSize() - last.end : 0
  // The tab stop has to be on a row that is actually in the DOM: once the
  // focused row scrolls out of the window, the nearest rendered one takes it,
  // or tabbing would skip the rows altogether.
  const tabStop = navigation.resolveTabStop(
    (index) => !isRowDisabled?.(rows[index]!.original),
    first?.index ?? 0,
    last?.index ?? -1,
  )

  return (
    <tbody {...bodyProps} ref={bodyRef}>
      {paddingTop > 0 ? <tr aria-hidden="true" style={{ height: paddingTop }} /> : null}

      {items.map((item) => {
        const row = rows[item.index]
        if (!row) return null
        return (
          <BodyRow
            key={row.id}
            row={row}
            index={item.index}
            rowCount={rows.length}
            tabStop={tabStop}
            measureRef={virtualizer.measureElement}
          />
        )
      })}

      {paddingBottom > 0 ? <tr aria-hidden="true" style={{ height: paddingBottom }} /> : null}
    </tbody>
  )
}

/**
 * `<DataTable />` with virtualisation wired up.
 *
 * Identical props; it simply registers {@link VirtualizedBody} and turns the
 * feature on. Any `components.Body` you pass still wins.
 */
export function VirtualizedDataTable<TData>(props: DataTableProps<TData>) {
  return (
    <DataTable
      {...props}
      features={{
        pagination: { enabled: false },
        ...props.features,
        virtualization: { enabled: true, ...props.features?.virtualization },
      }}
      components={{
        Body: VirtualizedBody as never,
        ...props.components,
      }}
    />
  )
}

export { useVirtualizer }

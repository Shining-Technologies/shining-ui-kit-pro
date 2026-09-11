import { useId, useMemo, type CSSProperties } from 'react'
import { DataTableProvider, type DataTableContextValue } from '../context/table-context'
import { useRowNavigation } from '../hooks/use-row-navigation'
import { useScrollEdges } from '../hooks/use-scroll-edges'
import { useTableInstance } from '../hooks/use-table-instance'
import { buildColumnSizeVars } from '../lib/cell-style'
import { cn } from '../lib/cn'
import { renderSlot } from '../lib/slots'
import { useTableTheme } from '../lib/use-table-theme'
import type { DataTableProps } from '../types/props'
import { resolveComponents } from './default-components'
import { TableBody } from './parts/table-body'
import { TableFoot } from './parts/table-foot'
import { TableHead } from './parts/table-head'

const EMPTY_CLASSNAMES = {}

/**
 * The table.
 *
 * ```tsx
 * <DataTable data={users} columns={columns} />
 * ```
 *
 * Everything past that first line is opt-in. This component itself does almost
 * nothing: it resolves props into a render model, publishes it on context, and
 * lets the parts render themselves. That is why replacing any part is safe.
 */
export function DataTable<TData>(props: DataTableProps<TData>) {
  const instance = useTableInstance(props)
  const { table, features } = instance

  const generatedId = useId()
  const tableId = props.id ?? `sui-${generatedId.replace(/[^a-zA-Z0-9-]/g, '')}`

  const components = useMemo(() => resolveComponents(props.components), [props.components])

  // Top-level `emptyState` / `loadingState` / `errorState` are shorthands for
  // the matching slots; the explicit prop wins if both are given.
  const slots = useMemo(
    () => ({
      ...props.slots,
      ...(props.emptyState !== undefined ? { emptyState: props.emptyState } : {}),
      ...(props.loadingState !== undefined ? { loadingState: props.loadingState } : {}),
      ...(props.errorState !== undefined ? { errorState: props.errorState } : {}),
    }),
    [props.slots, props.emptyState, props.loadingState, props.errorState],
  )

  const interactive =
    Boolean(props.onRowClick) || features.selection.enabled || features.expanding.enabled
  const navigation = useRowNavigation(interactive)

  const { style: themeStyle, themeClassName } = useTableTheme(props.theme)
  const density = props.density ?? props.theme?.density ?? 'comfortable'
  const variant = props.variant ?? props.theme?.variant ?? 'default'
  const responsiveMode = props.responsiveMode ?? 'scroll'
  const surface = props.surface ?? 'card'
  const tableLayout = props.tableLayout ?? 'fixed'
  const filterLayout = props.filterLayout ?? 'panel'
  const stickyHeader = props.stickyHeader ?? true
  // A footer only needs pinning inside a scroll frame; free-flowing tables
  // already end with it on screen.
  const stickyFooter = props.stickyFooter ?? props.maxHeight !== undefined
  const showToolbarCount = props.showToolbarCount ?? filterLayout === 'inline'

  // Pinned shadows and the sticky-header lift are conditional on the container
  // actually being scrolled; this is what measures that.
  const scroll = useScrollEdges()

  const context: DataTableContextValue<TData> = {
    table,
    features,
    components,
    slots,
    filterConfigs: instance.filterConfigs,
    columnLabels: instance.columnLabels,
    isFiltered: instance.isFiltered,
    clearFilters: instance.clearFilters,

    loading: props.loading ?? false,
    error: props.error,
    retry: props.onRetry,
    loadingRowCount: props.loadingRowCount ?? Math.min(features.pagination.pageSize, 8),

    density,
    variant,
    responsiveMode,
    surface,
    tableLayout,
    filterLayout,
    stickyHeader,
    stickyFooter,
    showToolbarCount,
    hasFooter: instance.hasFooter,

    classNames: props.classNames ?? EMPTY_CLASSNAMES,
    tableClassName: props.tableClassName,
    headerClassName: props.headerClassName,
    bodyClassName: props.bodyClassName,
    rowClassName: props.rowClassName,
    cellClassName: props.cellClassName,

    onRowClick: props.onRowClick,
    onRowDoubleClick: props.onRowDoubleClick,
    isRowDisabled: props.isRowDisabled,
    renderExpandedRow: props.renderExpandedRow,

    navigation,
    tableId,
  }

  const { Root, Container, Table, Toolbar, Pagination, SelectionBar, Heading } = components

  const showToolbar = props.showToolbar ?? true
  const showPagination = (props.showPagination ?? true) && features.pagination.enabled
  const captionId = `${tableId}-caption`
  const titleId = `${tableId}-title`
  const hasHeading = Boolean(props.title || props.description || props.icon)

  const rootStyle: CSSProperties = {
    ...themeStyle,
    ...props.style,
  }

  // `maxHeight` is the whole of "fixed frame, scrolling rows": the container
  // clips, the header sticks to its top and the footer to its bottom.
  const containerStyle: CSSProperties = props.maxHeight
    ? { maxHeight: props.maxHeight, overflowY: 'auto' }
    : {}

  // Counted from the state, not from the row model: a row selected on page 1
  // is still selected on page 2, and in server mode it is not even loaded.
  const selectedCount = features.selection.enabled
    ? Object.values(table.getState().rowSelection).filter(Boolean).length
    : 0
  const showSelectionBar =
    (props.showSelectionBar ?? true) && features.selection.enabled && selectedCount > 0

  return (
    <DataTableProvider value={context}>
      <Root
        table={table}
        rootProps={{
          id: tableId,
          className: cn('sui-root', themeClassName, props.className),
          style: rootStyle,
          'data-density': density,
          'data-variant': variant,
          'data-responsive': responsiveMode,
          'data-surface': surface,
          'data-layout': tableLayout,
          'data-filter-layout': filterLayout,
          'data-loading': props.loading || undefined,
        }}
      >
        {hasHeading ? (
          <Heading
            table={table}
            title={props.title}
            description={props.description}
            icon={props.icon}
            actions={renderSlot(props.headingActions, table)}
            titleId={titleId}
            titleAs={props.titleAs}
            headingProps={{ className: cn(props.classNames?.heading) }}
          />
        ) : null}

        {renderSlot(props.slots?.beforeTable, table)}

        {showToolbar
          ? (renderSlot(props.slots?.toolbar, table) ?? <Toolbar table={table} />)
          : null}

        {showSelectionBar ? (
          <SelectionBar
            table={table}
            selectedCount={selectedCount}
            clearSelection={() => table.resetRowSelection()}
          />
        ) : null}

        <Container
          table={table}
          containerProps={{
            ref: scroll.ref,
            className: cn('sui-container', props.classNames?.container),
            style: containerStyle,
            // Marks the scroll parent for virtualization and sticky measurement.
            'data-sui-scroll': '',
            'data-framed': props.maxHeight !== undefined || undefined,
            ...scroll.attributes,
          }}
        >
          <Table
            table={table}
            tableProps={{
              className: cn('sui-table', props.tableClassName),
              // Column widths are published once here and read by every cell.
              style: buildColumnSizeVars(table),
              'aria-label':
                props['aria-label'] ??
                (props.caption || (props.title && !props.label) ? undefined : props.label),
              'aria-labelledby':
                props['aria-labelledby'] ??
                (props.caption ? captionId : props.title && !props.label ? titleId : undefined),
              'aria-describedby': props['aria-describedby'],
              'aria-rowcount': table.getRowCount() || undefined,
              'aria-busy': props.loading || undefined,
            }}
          >
            {props.caption ? (
              <caption id={captionId} className="sui-caption">
                {props.caption}
              </caption>
            ) : null}
            <TableHead<TData> />
            <TableBody<TData> />
            <TableFoot<TData> />
          </Table>
        </Container>

        {showPagination
          ? (renderSlot(props.slots?.pagination, table) ?? <Pagination table={table} />)
          : null}

        {renderSlot(props.slots?.afterTable, table)}
      </Root>
    </DataTableProvider>
  )
}

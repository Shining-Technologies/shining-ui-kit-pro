/**
 * `@shining-ui-kit/react`
 *
 * A component library whose entire appearance comes from the active project:
 * buttons, cards, forms, charts and a production-grade data table, all painted
 * from one generated token set.
 *
 * ```tsx
 * import { UIKitProvider, Button, Card, LineChart } from '@shining-ui-kit/react'
 * import '@shining-ui-kit/react/styles.css'
 *
 * <UIKitProvider defaultProject="shining" scope="global">
 *   <App />
 * </UIKitProvider>
 * ```
 */
import './types/module-augmentation'

// -------------------------------------------------------------------- theming
export {
  ColorModeToggle,
  PalettePreview,
  ProjectEditor,
  ProjectSwitcher,
  TokenSwatchGrid,
  UIKitContext,
  UIKitProvider,
  useColorMode,
  useProject,
  useUIKit,
} from './theme'
export type {
  ColorModePreference,
  ColorModeToggleProps,
  PalettePreviewProps,
  ProjectEditorProps,
  ProjectSwitcherProps,
  TokenSwatchGridProps,
  UIKitContextValue,
  UIKitProviderProps,
} from './theme'

// ----------------------------------------------------------------- components
export * from './ui'

// --------------------------------------------------------------------- charts
export * from './charts'

// ------------------------------------------------------------------- the table
export { DataTable } from './components/data-table'
export { DataTableProvider, useDataTable, useTableComponents } from './context/table-context'
export type { DataTableContextValue } from './context/table-context'

// ------------------------------------------------------- composable toolbar API
export {
  DataTableActions,
  DataTableFilters,
  DataTablePagination,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
} from './components/connected'

// ---------------------------------------------------------- replaceable parts
export { DEFAULT_COMPONENTS, resolveComponents } from './components/default-components'
export {
  DataTableBody,
  DataTableContainer,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderRow,
  DataTableRoot,
  DataTableTable,
} from './components/parts/structure'
export { DataTableHeaderCell } from './components/parts/header-cell'
export { DataTableHeading } from './components/parts/heading'
export { DataTableCell, DataTableExpandedRow, DataTableRow } from './components/parts/row'
export { SortIndicator } from './components/parts/sort-indicator'
export { ColumnMenu } from './components/parts/column-menu'
export {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableLoadingState,
} from './components/states'
export { DefaultToolbar } from './components/toolbar/toolbar'
export { DefaultFilters, FilterPanel } from './components/toolbar/filter-panel'
export { InlineFilters } from './components/toolbar/inline-filters'
export { DefaultSelectionBar } from './components/toolbar/selection-bar'
export { DefaultClearFilters } from './components/toolbar/clear-filters'
export { ActiveFilters } from './components/toolbar/active-filters'
export { filterableColumns } from './components/filters/filterable'
export type { FilterableColumn } from './components/filters/filterable'

// -------------------------------------------------------------------- columns
export { createColumnHelper } from './columns/helpers'
export type { ColumnHelper } from './columns/helpers'
export {
  ACTIONS_COLUMN_ID,
  EXPANDER_COLUMN_ID,
  SELECTION_COLUMN_ID,
  createActionsColumn,
  createExpanderColumn,
  createSelectionColumn,
} from './columns/built-in'

// --------------------------------------------------------------- cell toolkit
export {
  CellBadge,
  CellDate,
  CellLink,
  CellNumber,
  CellPerson,
  CellProgress,
  CellText,
} from './components/cells'
export { CellEmpty, CellStack } from './components/cells'
export { RowActions } from './components/cells/row-actions'
export type { RowActionItem, RowActionsProps } from './components/cells/row-actions'
export {
  RowAction,
  RowActionGroup,
  isRowActionSpecs,
  renderRowActions,
} from './components/cells/row-action'
export type {
  RowActionGroupProps,
  RowActionProps,
  RowActionSpec,
} from './components/cells/row-action'

/*
 * The glyphs a row's actions are built from.
 *
 * Icon-only actions need icons, and asking every application to hand-roll an
 * eye, a pencil and a bin — or to add an icon library for three of them — is
 * how a table ends up with three different pencils. `RowAction` takes any
 * component that accepts SVG props, so these are a default, not a fence.
 */
export {
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from './lib/icons'

// ----------------------------------------------------------------- primitives
export { Calendar, DATE_RANGE_PRESETS, fromIso, toIso } from './primitives/calendar'
export type { CalendarProps, DateRangePreset, IsoDate } from './primitives/calendar'
export { DateField } from './primitives/date-field'
export type { DateFieldProps } from './primitives/date-field'
export { Clock, formatTime, fromTime, toTime } from './primitives/clock'
export type { ClockProps, IsoTime } from './primitives/clock'
export { TimeField } from './primitives/time-field'
export type { TimeFieldProps } from './primitives/time-field'
export { DateTimeField, joinDateTime, splitDateTime } from './primitives/datetime-field'
export type { DateTimeFieldProps, IsoDateTime } from './primitives/datetime-field'
export {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Tooltip,
  TooltipProvider,
  VisuallyHidden,
  badgeVariants,
  buttonVariants,
} from './primitives'

// ---------------------------------------------------------------------- hooks
export { useTableInstance } from './hooks/use-table-instance'
export type { TableInstanceResult } from './hooks/use-table-instance'
export { resolveFeatures } from './hooks/resolve-features'
export type { ResolvedFeatures } from './hooks/resolve-features'
export { useControllableState } from './lib/use-controllable-state'
export { useDebouncedValue } from './lib/use-debounced-value'
export { useEventCallback } from './lib/use-event-callback'
export { useTableTheme } from './lib/use-table-theme'
export { useColumnFilter } from './components/filters/use-column-filter'

// ------------------------------------------------------------------ utilities
export { cn } from './lib/cn'
/* The country list behind `<PhoneInput>`, exported for callers who need the
 * same names and dialling codes elsewhere in their own forms. */
export { COUNTRIES, countryByCode, countryByDial, flagFor } from './lib/countries'
export type { Country } from './lib/countries'
export { adaptColumns } from './lib/column-adapter'
export { renderSlot } from './lib/slots'

// ---------------------------------------------------------------------- types
export type {
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
  CellContext,
  ColumnDef,
  DataTableColumn,
  DisplayColumnDef,
  GroupColumnDef,
  HeaderRenderContext,
  HeaderTemplate,
  PathAccessorColumnDef,
} from './types/column'
export type {
  BodyProps,
  CellProps,
  ContainerProps,
  DataTableComponents,
  EmptyStateProps,
  ErrorStateProps,
  ExpandedRowProps,
  FooterProps,
  HeaderCellProps,
  HeaderProps,
  HeaderRowProps,
  LoadingStateProps,
  PaginationProps,
  ResolvedComponents,
  ClearFiltersProps,
  HeadingProps,
  RootProps,
  RowProps,
  SelectionBarProps,
  ToolbarProps,
} from './types/components'
/**
 * The `<table>` slot of the data table. Exported under a qualified name because
 * `TableProps` now belongs to the standalone `<Table>` component in `ui/`.
 */
export type { TableProps as DataTableTableProps } from './types/components'
export type {
  CellClassName,
  DataTableClassNames,
  DataTableProps,
  DataTableSlots,
  RowActivationEvent,
  RowClassName,
  SlotContent,
} from './types/props'

// ------------------------------------------------------- re-exported from core
export {
  BUILT_IN_PALETTES,
  ProjectRegistry,
  contrastRatio,
  createProject,
  createTableTheme,
  createTheme,
  defaultPalette,
  forkProject,
  generateColors,
  generateScale,
  globalProjectRegistry,
  mix,
  paletteById,
  readableForeground,
  resolveProject,
  updateProject,
  themeToCssVars,
  mergeThemes,
  FILTER_OPERATORS,
  getOperators,
  getPageNumbers,
  getPageRange,
  isFilterActive,
  normalizeFilterValue,
} from '@shining-ui-kit/core'
export type {
  Breakpoint,
  CellAlign,
  ColorMode,
  ColorScale,
  NeutralTint,
  ProjectDefinition,
  ProjectInput,
  ProjectSeed,
  ProjectShape,
  ProjectTypography,
  ResolvedProject,
  UIKitTheme,
  UIKitTokens,
  ColumnFilterConfig,
  ColumnFiltersState,
  ColumnMeta,
  ColumnPinningState,
  ColumnSizingState,
  DataMode,
  DataTableFeatures,
  DataTableQuery,
  DataTableState,
  Density,
  ExpandedState,
  FilterLayout,
  FilterOperator,
  FilterType,
  FilterValue,
  PaginationState,
  PinnedSide,
  ResponsiveMode,
  RowSelectionState,
  SelectOption,
  SortingState,
  TableLayout,
  TableSurface,
  TableTheme,
  TableThemeTokens,
  TableVariant,
  VisibilityState,
} from '@shining-ui-kit/core'

// The engine's row/table types appear in every callback signature.
// `Table` is re-exported as `TableInstance`: the bare name belongs to the
// standalone `<Table>` component, and "the instance" is what this type is.
export type { Cell, Column, Header, Row, Table as TableInstance } from '@tanstack/react-table'

/**
 * Primitive vocabulary shared by every layer of the library.
 *
 * Nothing in `core/` knows about React, the DOM or any third-party package, so
 * all of it can run in a Server Component, a route handler or a worker.
 */

/** Any object shape that can be used as a table row. */
export type RowData = Record<string, unknown>

/**
 * `keyof T` while still allowing arbitrary dotted paths (`"user.name"`).
 * Keeps editor autocompletion for known keys without rejecting deep accessors.
 */
export type LooseKeyOf<T> = (keyof T & string) | (string & Record<never, never>)

/** Horizontal alignment of a column's content. */
export type CellAlign = 'left' | 'center' | 'right'

/** Vertical rhythm preset. Drives row height, cell padding and header height. */
export type Density = 'compact' | 'comfortable' | 'spacious'

/** Built-in visual variants. All are token/class driven — never separate components. */
export type TableVariant =
  'default' | 'minimal' | 'compact' | 'borderless' | 'striped' | 'dashboard'

/** Where the work happens: in the browser, or on your server. */
export type DataMode = 'client' | 'server'

/**
 * How a table behaves when it no longer fits the space it is given.
 *
 * `'scroll'` keeps the grid and scrolls it sideways; `'cards'` turns every row
 * into a stacked card on small screens; `'auto'` measures the table's own
 * container rather than the viewport.
 */
export type ResponsiveMode = 'scroll' | 'cards' | 'auto'

/** Whether the table's chrome is one bordered surface (`'card'`) or separate blocks. */
export type TableSurface = 'card' | 'plain'

/** `'fixed'` honours each column's declared size; `'auto'` lets content decide. */
export type TableLayout = 'fixed' | 'auto'

/** Filters behind one button (`'panel'`) or laid out flat in the toolbar (`'inline'`). */
export type FilterLayout = 'panel' | 'inline'

/** Breakpoints used by responsive column visibility. Mirrors Tailwind's scale. */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/** Side a column can be frozen to. */
export type PinnedSide = 'left' | 'right'

/** A generic label/value pair used by select-style filters and page-size pickers. */
export interface SelectOption<TValue = string> {
  label: string
  value: TValue
  /**
   * Optional grouping label. The DataTable's select and multi-select filter
   * controls render each group under a labelled section heading, collected
   * where the group first appears.
   */
  group?: string
  disabled?: boolean
}

/** A value that may be provided directly or derived from an argument. */
export type Derivable<TValue, TArg> = TValue | ((arg: TArg) => TValue)

/** Resolve a {@link Derivable}. */
export function derive<TValue, TArg>(value: Derivable<TValue, TArg>, arg: TArg): TValue {
  return typeof value === 'function' ? (value as (arg: TArg) => TValue)(arg) : value
}

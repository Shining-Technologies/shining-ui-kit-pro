/**
 * Primitive vocabulary shared by every layer of the library.
 *
 * Nothing in this file knows about React or about the DOM.
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
 * container rather than the viewport, so a table in a narrow panel becomes
 * cards even on a wide monitor.
 */
export type ResponsiveMode = 'scroll' | 'cards' | 'auto'

/**
 * Whether the table's chrome is one surface or several.
 *
 * `'card'` puts the heading, the toolbar, the rows and the pagination inside a
 * single bordered card with hairlines between them — they are one control, and
 * a filter bar floating above an unrelated box does not read that way.
 * `'plain'` keeps them as separate blocks for layouts that supply their own.
 */
export type TableSurface = 'card' | 'plain'

/**
 * How column widths are decided.
 *
 * `'fixed'` honours the declared `size` of every column, which is what makes
 * resizing and pinned offsets exact. `'auto'` lets the browser size columns
 * from their content, for tables whose data you cannot measure in advance.
 */
export type TableLayout = 'fixed' | 'auto'

/**
 * Where the filter controls live.
 *
 * `'panel'` collects them behind one "Filter" button; `'inline'` lays every
 * filter out flat in the toolbar, so the current query is readable without
 * opening anything.
 */
export type FilterLayout = 'panel' | 'inline'

/** Breakpoints used by responsive column visibility. Mirrors Tailwind's scale. */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/** Side a column can be frozen to. */
export type PinnedSide = 'left' | 'right'

/** A generic label/value pair used by select-style filters and page-size pickers. */
export interface SelectOption<TValue = string> {
  label: string
  value: TValue
  /** Optional grouping label, rendered as a section heading. */
  group?: string
  disabled?: boolean
}

/** Deeply optional version of `T`, used for partial theme overrides. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/** A value that may be provided directly or derived from an argument. */
export type Derivable<TValue, TArg> = TValue | ((arg: TArg) => TValue)

/** Resolve a {@link Derivable}. */
export function derive<TValue, TArg>(value: Derivable<TValue, TArg>, arg: TArg): TValue {
  return typeof value === 'function' ? (value as (arg: TArg) => TValue)(arg) : value
}

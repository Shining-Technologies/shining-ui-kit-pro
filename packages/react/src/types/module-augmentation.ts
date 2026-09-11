import type { ColumnMeta as ShiningColumnMeta } from '@shining-ui-kit/core'

/**
 * Teach the engine about our `meta` shape so `column.columnDef.meta.align` is
 * typed everywhere, including inside user-supplied renderers.
 */
declare module '@tanstack/react-table' {
  // The generics must match the engine's declaration exactly, even though we
  // use neither of them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface ColumnMeta<TData, TValue> extends ShiningColumnMeta {}
}

export {}

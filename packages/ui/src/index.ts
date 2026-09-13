/**
 * `@shining-technologies/ui` — Shining UI V2.
 *
 * ```tsx
 * import { Button, Card, DataTable } from '@shining-technologies/ui'
 * import '@shining-technologies/ui/styles.css'
 * ```
 *
 * This barrel has no `'use client'` directive, and neither does any module that
 * does not need one: pure components (Button, Badge, Card, icons) and every
 * function from `core` work in Server Components. Interactive components carry
 * their own directive, file by file.
 *
 * Other entry points:
 *   @shining-technologies/ui/core         filtering, sorting, pagination, URL query (no React)
 *   @shining-technologies/ui/theme        theme generation, createThemeCss (no React)
 *   @shining-technologies/ui/charts       Recharts charts (optional peer: recharts)
 *   @shining-technologies/ui/virtualized  virtualized table body (optional peer: @tanstack/react-virtual)
 *   @shining-technologies/ui/csv          CSV and TSV export
 *   @shining-technologies/ui/<family>     one component family, e.g. /data-table or /sidebar
 */
export * from './core'

export * from './components/avatar'
export * from './components/badge'
export * from './components/button'
export * from './components/card'
export * from './components/color-mode'
export * from './components/data-table'
export * from './components/date-time'
export * from './components/feedback'
export * from './components/form'
export * from './components/icons'
export * from './components/layout'
export * from './components/navigation'
export * from './components/overlay'
export * from './components/separator'
export * from './components/sidebar'
export * from './components/table'
export * from './components/visually-hidden'

export { cn } from './lib/cn'
export type { ClassValue } from './lib/cn'
export type { AccentTone } from './lib/tone'
export { useControllableState } from './hooks/use-controllable-state'
export type { ControllableStateOptions, Updater } from './hooks/use-controllable-state'
export { useDebouncedValue } from './hooks/use-debounced-value'
export { useEventCallback } from './hooks/use-event-callback'

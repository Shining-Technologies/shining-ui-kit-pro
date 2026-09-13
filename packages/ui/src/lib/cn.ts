import { clsx, type ClassValue } from 'clsx'

/**
 * Join class names, dropping falsy values.
 *
 * V1 ran this through `tailwind-merge`, which only resolves conflicts between
 * Tailwind utilities and so never touched the kit's own `sui-*` classes. What
 * lets an application's `className` win is the cascade: every kit rule lives
 * in `@layer components`, below application utilities. See `styles/layers.css`.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export type { ClassValue }

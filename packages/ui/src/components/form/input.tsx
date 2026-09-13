'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl } from './field-context'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

/**
 * A text field.
 *
 * Joins the surrounding `<Field>` automatically — that is where its `id`,
 * `aria-describedby` and `aria-invalid` come from — while an explicit prop
 * still wins, so a form library that manages its own ids is not fought.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  const field = useFieldControl()
  return <input ref={ref} className={cn('sui-input', className)} {...field} {...props} />
})

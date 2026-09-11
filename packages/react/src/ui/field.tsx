import * as LabelPrimitive from '@radix-ui/react-label'
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn'
import { FieldContext, useFieldControl, type FieldContextValue } from '../lib/field-context'

export { useFieldControl }
export type { FieldContextValue }

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode
  description?: ReactNode
  /** Any truthy value marks the field invalid and is rendered as the message. */
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  /** Put the label after the control — for a checkbox or switch. */
  orientation?: 'vertical' | 'horizontal'
  /** Override the generated id, e.g. to match a form library's field name. */
  htmlFor?: string
  children: ReactNode
}

/**
 * Label, control, help text and error in one consistent layout.
 *
 * Writing this once is most of what makes every form across an application
 * feel like the same product rather than several.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    className,
    label,
    description,
    error,
    required = false,
    disabled = false,
    orientation = 'vertical',
    htmlFor,
    children,
    ...props
  },
  ref,
) {
  const generated = useId()
  const id = htmlFor ?? generated

  const value: FieldContextValue = {
    id,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
    hasDescription: Boolean(description),
    hasError: Boolean(error),
    disabled,
    required,
    labelId: label ? `${id}-label` : undefined,
  }

  return (
    <FieldContext.Provider value={value}>
      <div
        ref={ref}
        data-slot="field"
        data-disabled={disabled || undefined}
        className={cn(
          'sui-field',
          orientation === 'horizontal' && 'sui-field--horizontal',
          className,
        )}
        {...props}
      >
        {label ? (
          <Label id={value.labelId} htmlFor={id} data-disabled={disabled || undefined}>
            {label}
            {required ? (
              <span className="sui-field__required" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        {children}
        {description ? (
          <p id={value.descriptionId} className="sui-field__description">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={value.errorId} className="sui-field__error">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  )
})

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn('sui-field__label', className)}
      {...props}
    />
  )
})

export interface FieldsetProps extends HTMLAttributes<HTMLFieldSetElement> {
  legend?: ReactNode
}

/** A group of related fields. `<fieldset>`/`<legend>` carry the grouping for free. */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { className, legend, children, ...props },
  ref,
) {
  return (
    <fieldset ref={ref} data-slot="fieldset" className={cn('sui-fieldset', className)} {...props}>
      {legend ? <legend className="sui-fieldset__legend">{legend}</legend> : null}
      {children}
    </fieldset>
  )
})

import { createContext, useContext } from 'react'

/**
 * The wiring between a `<Field>` and whatever control it wraps.
 *
 * It lives in `lib/` rather than beside `<Field>` because the controls that
 * need it are spread across the primitives and the component layer, and the
 * dependency has to point one way: a control may read this, but nothing here
 * may know which controls exist.
 */
export interface FieldContextValue {
  id: string
  descriptionId: string
  errorId: string
  hasDescription: boolean
  hasError: boolean
  disabled: boolean
  required: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

export interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  disabled?: boolean
  required?: boolean
}

/**
 * Props a control should spread to join the surrounding field.
 *
 * The point is that the control is never told the ids: it spreads this and
 * comes out with `id`, `aria-describedby` and `aria-invalid` already pointing
 * at whatever the field actually rendered. Outside a field it returns nothing,
 * so every control still works standalone.
 */
export function useFieldControl(): FieldControlProps {
  const field = useContext(FieldContext)
  if (!field) return {}

  const describedBy =
    [field.hasDescription && field.descriptionId, field.hasError && field.errorId]
      .filter(Boolean)
      .join(' ') || undefined

  return {
    id: field.id,
    'aria-describedby': describedBy,
    'aria-invalid': field.hasError || undefined,
    disabled: field.disabled || undefined,
    required: field.required || undefined,
  }
}

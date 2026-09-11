import { createContext, useContext, useId } from 'react'

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
  /**
   * The label's id, when the field rendered one. `<label for>` only reaches
   * native form elements; a control that is a `div` with a role (a radio group,
   * a slider, a group of boxes) names itself with `aria-labelledby` instead.
   */
  labelId?: string
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

/** The surrounding field's label id, for controls that cannot be `<label for>`-ed. */
export function useFieldLabelId(): string | undefined {
  return useContext(FieldContext)?.labelId
}

/**
 * The accessible name of a button that stands in for an input — the date and
 * time fields — which has to say both what it is and what it holds.
 *
 * An explicit `label` wins. Without one, inside a `<Field>`, the field's own
 * label is used together with the displayed value (`aria-labelledby`), so the
 * visible label is the name a screen reader hears instead of being overridden
 * by a second one. `text` is the word for the popover and the clear button.
 */
export function useTriggerName(
  label: string | undefined,
  formatted: string | null | undefined,
  fallback: string,
) {
  const labelId = useFieldLabelId()
  const valueId = useId()
  const text = label ?? fallback
  const props: { 'aria-label'?: string; 'aria-labelledby'?: string } =
    !label && labelId
      ? { 'aria-labelledby': formatted ? `${labelId} ${valueId}` : labelId }
      : { 'aria-label': formatted ? `${text}: ${formatted}` : text }
  return { props, valueId, text }
}

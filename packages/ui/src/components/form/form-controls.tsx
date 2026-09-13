'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'
import { useFieldControl, useFieldLabelId } from './field-context'

// React 18 warns for every `useLayoutEffect` rendered on the server; the
// sizing it does is meaningless there anyway, so the server gets a no-op.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/* ------------------------------------------------------------------ textarea */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with the text instead of scrolling. */
  autoResize?: boolean
  /** Show `120 / 500` under the box. Needs `maxLength` to show the limit. */
  showCount?: boolean
  /** Upper bound on the growth, in rows. Ignored without `autoResize`. */
  maxRows?: number
}

/**
 * A multi-line field — a description, a note, an address.
 *
 * `autoResize` is not the default: a box that changes height on every keystroke
 * moves everything under it, which is the wrong trade in a dense form and the
 * right one in a composer. The counter is opt-in for the same reason — it is
 * only useful where the limit is real.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, autoResize = false, showCount = false, maxRows, onChange, ...props },
  ref,
) {
  const field = useFieldControl()
  const inner = useRef<HTMLTextAreaElement | null>(null)
  const [length, setLength] = useState(String(props.defaultValue ?? props.value ?? '').length)

  const resize = useCallback(() => {
    const node = inner.current
    if (!node || !autoResize) return
    // Collapse first: the scroll height of a box that is already tall enough
    // never shrinks, so a deleted line would leave the extra height behind.
    node.style.height = 'auto'
    const line = parseFloat(getComputedStyle(node).lineHeight) || 20
    const cap = maxRows ? maxRows * line : Infinity
    node.style.height = `${Math.min(node.scrollHeight, cap)}px`
    node.style.overflowY = node.scrollHeight > cap ? 'auto' : 'hidden'
  }, [autoResize, maxRows])

  // Content set from outside — a loaded draft — has to size the box too.
  useIsomorphicLayoutEffect(resize, [resize, props.value])

  const control = (
    <textarea
      ref={(node) => {
        inner.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      data-slot="textarea"
      className={cn('sui-textarea', autoResize && 'sui-textarea--auto', className)}
      {...field}
      {...props}
      onChange={(event) => {
        if (showCount) setLength(event.target.value.length)
        resize()
        onChange?.(event)
      }}
    />
  )

  if (!showCount) return control

  const value = props.value === undefined ? length : String(props.value).length
  const over = props.maxLength !== undefined && value > props.maxLength

  return (
    <div className="sui-textarea-wrap">
      {control}
      <span className="sui-textarea__count" data-over={over || undefined} aria-hidden="true">
        {value}
        {props.maxLength !== undefined ? ` / ${props.maxLength}` : ''}
      </span>
    </div>
  )
})

/* --------------------------------------------------------------- input group */

export interface InputGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Rendered inside the control, before the text. */
  prefix?: ReactNode
  /** Rendered inside the control, after the text. */
  suffix?: ReactNode
  /** Class applied to the wrapper that draws the border. */
  wrapperClassName?: string
}

/**
 * An input with something inside its box — an icon, a unit, a clear button.
 *
 * The wrapper owns the border and the focus ring, so focusing the field rings
 * the whole control rather than just the bare text area inside it.
 */
export const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
  { className, wrapperClassName, prefix, suffix, ...props },
  ref,
) {
  const field = useFieldControl()
  return (
    <div className={cn('sui-input-group', wrapperClassName)} data-slot="input-group">
      {prefix ? (
        <span className="sui-input-group__addon" aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <input ref={ref} className={cn('sui-input-group__input', className)} {...field} {...props} />
      {suffix ? <span className="sui-input-group__addon">{suffix}</span> : null}
    </div>
  )
})

/* -------------------------------------------------------------------- switch */

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  // The whole field wiring: a required switch ("I accept the terms") is
  // announced as required, and as invalid when the field has an error.
  const field = useFieldControl()
  return (
    <SwitchPrimitive.Root
      ref={ref}
      id={field.id}
      aria-describedby={field['aria-describedby']}
      aria-invalid={field['aria-invalid']}
      disabled={field.disabled}
      required={field.required}
      data-slot="switch"
      className={cn('sui-switch sui-focusable', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="sui-switch__thumb" />
    </SwitchPrimitive.Root>
  )
})

/* ---------------------------------------------------------------- radio group */

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  orientation?: 'vertical' | 'horizontal'
}

export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  function RadioGroup({ className, orientation = 'vertical', ...props }, ref) {
    const field = useFieldControl()
    // A `<label for>` cannot name a `radiogroup` div, so a surrounding field's
    // label is attached by id instead; the rest of the wiring is the usual.
    const labelId = useFieldLabelId()
    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        // The field's id, so the label's `for` points at the group; `Field`
        // moves focus to the group's tab stop when the label is clicked.
        id={field.id}
        // Announced, but not handed to Radix's roving focus as `orientation`:
        // that would ignore the arrow keys across it, and a radio group answers
        // all four whichever way it is laid out.
        aria-orientation={orientation}
        aria-labelledby={props['aria-label'] ? undefined : labelId}
        aria-describedby={field['aria-describedby']}
        aria-invalid={field['aria-invalid']}
        disabled={field.disabled}
        required={field.required}
        data-slot="radio-group"
        className={cn(
          'sui-radio-group',
          orientation === 'horizontal' && 'sui-radio-group--horizontal',
          className,
        )}
        {...props}
      />
    )
  },
)

export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn('sui-radio sui-focusable', className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="sui-radio__indicator" />
    </RadioGroupPrimitive.Item>
  )
})

/* -------------------------------------------------------------------- slider */

/** The word for one thumb of a range — the same words Radix gives them. */
const thumbPart = (index: number, count: number) =>
  count === 2 ? (index === 0 ? 'Minimum' : 'Maximum') : `Value ${index + 1} of ${count}`

/**
 * A value on a track, or a range with one thumb per value.
 *
 * The thumbs are what take focus, so they are what joins a surrounding
 * `<Field>`: each is named by the field's label through `aria-labelledby` (a
 * `<label for>` cannot reach a `span`), described by its help text and marked
 * invalid with it. A range's thumbs add their own part — "Price Minimum",
 * "Price Maximum" — by listing themselves after the label. `aria-label` and
 * `aria-labelledby` on the slider are forwarded to the thumbs, which is where
 * a name is needed for use outside a field.
 *
 * `required` is taken from the field but not announced: a slider always holds
 * a value, so it is satisfied by construction, and `aria-required` is not a
 * valid attribute on `role="slider"`. It is exposed as `data-required` for
 * styling only.
 */
export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider(
  {
    className,
    value,
    defaultValue,
    disabled,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const field = useFieldControl()
  const labelId = useFieldLabelId()
  const thumbId = useId()
  // One thumb per value. Reading it from the props is what lets the same
  // component serve a single value and a range without a `range` flag.
  const thumbCount = (value ?? defaultValue ?? [0]).length
  // An explicit name wins over the field's label, as it does everywhere else.
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : labelId)
  const describedBy =
    [field['aria-describedby'], ariaDescribedBy].filter(Boolean).join(' ') || undefined

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      data-required={field.required || undefined}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled ?? field.disabled}
      className={cn('sui-slider', className)}
      {...props}
    >
      <SliderPrimitive.Track className="sui-slider__track">
        <SliderPrimitive.Range className="sui-slider__range" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => {
        const id = i === 0 && field.id ? field.id : `${thumbId}-${i}`
        return (
          <SliderPrimitive.Thumb
            key={i}
            // The field's id lands on the first thumb, the focusable part.
            id={id}
            className="sui-slider__thumb sui-focusable"
            // A lone thumb is named by the label; a range's thumbs append their
            // own `aria-label` ("Minimum", "Maximum") by referencing themselves.
            aria-labelledby={
              labelledBy ? (thumbCount > 1 ? `${labelledBy} ${id}` : labelledBy) : undefined
            }
            // Set here rather than left to Radix: an `undefined` passed through
            // would overwrite the word it gives each thumb of a range.
            aria-label={
              thumbCount > 1
                ? [ariaLabel, thumbPart(i, thumbCount)].filter(Boolean).join(' ')
                : ariaLabel
            }
            aria-describedby={describedBy}
            aria-invalid={field['aria-invalid']}
          />
        )
      })}
    </SliderPrimitive.Root>
  )
})

/* -------------------------------------------------------------------- toggle */

export const toggleVariants = cva('sui-toggle sui-focusable', {
  variants: {
    variant: { default: '', outline: 'sui-toggle--outline' },
    size: { default: '', sm: 'sui-toggle--sm' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export interface ToggleProps
  extends
    ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

export const Toggle = forwardRef<ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  function Toggle({ className, variant, size, ...props }, ref) {
    return (
      <TogglePrimitive.Root
        ref={ref}
        data-slot="toggle"
        className={cn(toggleVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)

/**
 * Radix types the group as a union on `type`, so the variant props are
 * intersected in rather than extended from — an interface cannot extend a union.
 */
export type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>

export const ToggleGroup = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(function ToggleGroup({ className, variant, size, children, ...props }, ref) {
  const style = useMemo(() => ({ variant, size }), [variant, size])
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn('sui-toggle-group', className)}
      {...(props as ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>)}
    >
      <ToggleGroupStyle.Provider value={style}>{children}</ToggleGroupStyle.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

/** The group's `variant` and `size`, which every item takes unless it sets its own. */
const ToggleGroupStyle = createContext<VariantProps<typeof toggleVariants>>({})

export interface ToggleGroupItemProps
  extends
    ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleVariants> {}

export const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(function ToggleGroupItem({ className, variant, size, ...props }, ref) {
  const group = useContext(ToggleGroupStyle)
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants({ variant: variant ?? group.variant, size: size ?? group.size }),
        className,
      )}
      {...props}
    />
  )
})

/* --------------------------------------------------------------------- misc */

/** A horizontal band of controls, e.g. above a list. */
export const Toolbar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Toolbar(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('sui-cluster', className)} {...props} />
})

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  useCallback,
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
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'

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
  useLayoutEffect(resize, [resize, props.value])

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
  const { id, 'aria-describedby': describedBy, disabled } = useFieldControl()
  return (
    <SwitchPrimitive.Root
      ref={ref}
      id={id}
      aria-describedby={describedBy}
      disabled={disabled}
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
    return (
      <RadioGroupPrimitive.Root
        ref={ref}
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

export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, value, defaultValue, ...props }, ref) {
  // One thumb per value. Reading it from the props is what lets the same
  // component serve a single value and a range without a `range` flag.
  const thumbCount = (value ?? defaultValue ?? [0]).length

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn('sui-slider', className)}
      {...props}
    >
      <SliderPrimitive.Track className="sui-slider__track">
        <SliderPrimitive.Range className="sui-slider__range" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb key={i} className="sui-slider__thumb sui-focusable" />
      ))}
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
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn('sui-toggle-group', className)}
      {...(props as ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>)}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  )
})

export interface ToggleGroupItemProps
  extends
    ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleVariants> {}

export const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(function ToggleGroupItem({ className, variant, size, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant, size }), className)}
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

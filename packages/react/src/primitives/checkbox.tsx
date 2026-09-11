import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, MinusIcon } from '../lib/icons'
import { cn } from '../lib/cn'
import { useFieldControl } from '../lib/field-context'

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

/**
 * Radix handles the tri-state semantics: `checked="indeterminate"` produces
 * `aria-checked="mixed"`, which is exactly what "some rows selected" means (§18).
 */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    // `aria-invalid` is not meaningful on a checkbox, so only the identity and
    // description half of the field wiring is taken.
    const { id, 'aria-describedby': describedBy, disabled, required } = useFieldControl()
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        id={id}
        aria-describedby={describedBy}
        disabled={disabled}
        required={required}
        className={cn('sui-checkbox', className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="sui-checkbox__indicator">
          {props.checked === 'indeterminate' ? <MinusIcon /> : <CheckIcon />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  },
)

'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, MinusIcon } from '../icons/icons'
import { cn } from '../../lib/cn'
import { useFieldControl } from './field-context'

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

/**
 * Radix handles the tri-state semantics: `checked="indeterminate"` produces
 * `aria-checked="mixed"`, which is exactly what "some rows selected" means (§18).
 *
 * Both glyphs are rendered and the stylesheet shows the one the indicator's
 * `data-state` calls for. Reading the state from the props would only see a
 * controlled checkbox: `defaultChecked="indeterminate"`, or a form reset back
 * to it, would show a tick.
 */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    // The whole field wiring, `aria-invalid` included: it is a supported state
    // of `role="checkbox"`, and an unticked "I accept the terms" is exactly
    // the checkbox a screen reader needs to hear is invalid.
    const {
      id,
      'aria-describedby': describedBy,
      'aria-invalid': invalid,
      disabled,
      required,
    } = useFieldControl()
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        disabled={disabled}
        required={required}
        className={cn('sui-checkbox', className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="sui-checkbox__indicator">
          <CheckIcon className="sui-checkbox__check" />
          <MinusIcon className="sui-checkbox__minus" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  },
)

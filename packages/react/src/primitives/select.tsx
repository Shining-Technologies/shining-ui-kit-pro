import * as Primitive from '@radix-ui/react-select'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, ChevronDownIcon } from '../lib/icons'
import { cn } from '../lib/cn'

export const Select = Primitive.Root
export const SelectValue = Primitive.Value
export const SelectGroup = Primitive.Group

export const SelectTrigger = forwardRef<
  ElementRef<typeof Primitive.Trigger>,
  ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <Primitive.Trigger ref={ref} className={cn('sui-select__trigger', className)} {...props}>
      {children}
      <Primitive.Icon asChild>
        <ChevronDownIcon className="sui-select__chevron" />
      </Primitive.Icon>
    </Primitive.Trigger>
  )
})

export const SelectContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={ref}
        position={position}
        className={cn('sui-surface sui-select__content', className)}
        {...props}
      >
        <Primitive.Viewport className="sui-select__viewport">{children}</Primitive.Viewport>
      </Primitive.Content>
    </Primitive.Portal>
  )
})

export const SelectItem = forwardRef<
  ElementRef<typeof Primitive.Item>,
  ComponentPropsWithoutRef<typeof Primitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      className={cn('sui-menu__item sui-select__item', className)}
      {...props}
    >
      <span className="sui-menu__indicator">
        <Primitive.ItemIndicator>
          <CheckIcon />
        </Primitive.ItemIndicator>
      </span>
      <Primitive.ItemText>{children}</Primitive.ItemText>
    </Primitive.Item>
  )
})

export const SelectLabel = forwardRef<
  ElementRef<typeof Primitive.Label>,
  ComponentPropsWithoutRef<typeof Primitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return <Primitive.Label ref={ref} className={cn('sui-menu__label', className)} {...props} />
})

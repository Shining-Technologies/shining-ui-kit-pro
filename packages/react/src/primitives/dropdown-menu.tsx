import * as Primitive from '@radix-ui/react-dropdown-menu'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, ChevronRightIcon } from '../lib/icons'
import { cn } from '../lib/cn'
import { trackMenuContent } from '../lib/dialog-focus'
import { useEventCallback } from '../lib/use-event-callback'
import { usePortalContainer } from '../theme/context'

export const DropdownMenu = Primitive.Root
export const DropdownMenuTrigger = Primitive.Trigger
export const DropdownMenuGroup = Primitive.Group
export const DropdownMenuSub = Primitive.Sub
export const DropdownMenuRadioGroup = Primitive.RadioGroup

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(function DropdownMenuContent({ className, align = 'end', sideOffset = 6, ...props }, ref) {
  const container = usePortalContainer()
  // Remembers this menu's trigger, so a dialog opened from one of its items can
  // hand focus back to it after the item itself has unmounted.
  const setContent = useEventCallback((node: HTMLDivElement | null) => {
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
    trackMenuContent(node)
  })
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        ref={setContent}
        align={align}
        sideOffset={sideOffset}
        className={cn('sui-surface sui-menu', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof Primitive.Item>,
  ComponentPropsWithoutRef<typeof Primitive.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      className={cn('sui-menu__item', destructive && 'sui-menu__item--danger', className)}
      {...props}
    />
  )
})

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof Primitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof Primitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <Primitive.CheckboxItem
      ref={ref}
      className={cn('sui-menu__item sui-menu__item--check', className)}
      {...props}
    >
      <span className="sui-menu__indicator">
        <Primitive.ItemIndicator>
          <CheckIcon />
        </Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.CheckboxItem>
  )
})

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof Primitive.RadioItem>,
  ComponentPropsWithoutRef<typeof Primitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <Primitive.RadioItem
      ref={ref}
      className={cn('sui-menu__item sui-menu__item--check', className)}
      {...props}
    >
      <span className="sui-menu__indicator">
        <Primitive.ItemIndicator>
          <span className="sui-menu__dot" />
        </Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.RadioItem>
  )
})

/** The item that opens a `DropdownMenuSub`. Draws its own trailing chevron. */
export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof Primitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof Primitive.SubTrigger>
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <Primitive.SubTrigger ref={ref} className={cn('sui-menu__item', className)} {...props}>
      {children}
      <ChevronRightIcon className="sui-menu__chevron" aria-hidden="true" />
    </Primitive.SubTrigger>
  )
})

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof Primitive.SubContent>,
  ComponentPropsWithoutRef<typeof Primitive.SubContent>
>(function DropdownMenuSubContent({ className, sideOffset = 4, ...props }, ref) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        className={cn('sui-surface sui-menu', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof Primitive.Label>,
  ComponentPropsWithoutRef<typeof Primitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return <Primitive.Label ref={ref} className={cn('sui-menu__label', className)} {...props} />
})

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof Primitive.Separator>,
  ComponentPropsWithoutRef<typeof Primitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <Primitive.Separator ref={ref} className={cn('sui-menu__separator', className)} {...props} />
  )
})

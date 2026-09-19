'use client'

import * as Primitive from '@radix-ui/react-menubar'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, ChevronRightIcon } from '../icons/icons'
import { cn } from '../../lib/cn'
import { usePortalContainer } from '../overlay/portal-container'

/*
 * A desktop-application menu bar: File, Edit, View. Radix Menubar gives the
 * `menubar` role, ←/→ between menus, and moving the pointer across the bar
 * switches the open menu. The menus share `DropdownMenu`'s item row.
 */

// Annotated: the inferred type names a Radix-internal package, which declaration output cannot reference.
export const MenubarMenu: typeof Primitive.Menu = Primitive.Menu
export const MenubarGroup = Primitive.Group
export const MenubarSub = Primitive.Sub
export const MenubarRadioGroup = Primitive.RadioGroup

export const Menubar = forwardRef<
  ElementRef<typeof Primitive.Root>,
  ComponentPropsWithoutRef<typeof Primitive.Root>
>(function Menubar({ className, ...props }, ref) {
  return (
    <Primitive.Root
      ref={ref}
      data-slot="menubar"
      className={cn('sui-menubar', className)}
      {...props}
    />
  )
})

export const MenubarTrigger = forwardRef<
  ElementRef<typeof Primitive.Trigger>,
  ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function MenubarTrigger({ className, ...props }, ref) {
  return (
    <Primitive.Trigger
      ref={ref}
      data-slot="menubar-trigger"
      className={cn('sui-menubar__trigger sui-focusable', className)}
      {...props}
    />
  )
})

export const MenubarContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(function MenubarContent(
  { className, align = 'start', alignOffset = -4, sideOffset = 6, ...props },
  ref,
) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        data-slot="menubar-content"
        className={cn('sui-surface sui-menu sui-menu--menubar', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const MenubarItem = forwardRef<
  ElementRef<typeof Primitive.Item>,
  ComponentPropsWithoutRef<typeof Primitive.Item> & { destructive?: boolean }
>(function MenubarItem({ className, destructive, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      className={cn('sui-menu__item', destructive && 'sui-menu__item--danger', className)}
      {...props}
    />
  )
})

export const MenubarCheckboxItem = forwardRef<
  ElementRef<typeof Primitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof Primitive.CheckboxItem>
>(function MenubarCheckboxItem({ className, children, ...props }, ref) {
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

export const MenubarRadioItem = forwardRef<
  ElementRef<typeof Primitive.RadioItem>,
  ComponentPropsWithoutRef<typeof Primitive.RadioItem>
>(function MenubarRadioItem({ className, children, ...props }, ref) {
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

/** The item that opens a `MenubarSub`. Draws its own trailing chevron. */
export const MenubarSubTrigger = forwardRef<
  ElementRef<typeof Primitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof Primitive.SubTrigger>
>(function MenubarSubTrigger({ className, children, ...props }, ref) {
  return (
    <Primitive.SubTrigger ref={ref} className={cn('sui-menu__item', className)} {...props}>
      {children}
      <ChevronRightIcon className="sui-menu__chevron" aria-hidden="true" />
    </Primitive.SubTrigger>
  )
})

export const MenubarSubContent = forwardRef<
  ElementRef<typeof Primitive.SubContent>,
  ComponentPropsWithoutRef<typeof Primitive.SubContent>
>(function MenubarSubContent({ className, sideOffset = 4, ...props }, ref) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        className={cn('sui-surface sui-menu sui-menu--menubar', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const MenubarLabel = forwardRef<
  ElementRef<typeof Primitive.Label>,
  ComponentPropsWithoutRef<typeof Primitive.Label>
>(function MenubarLabel({ className, ...props }, ref) {
  return <Primitive.Label ref={ref} className={cn('sui-menu__label', className)} {...props} />
})

export const MenubarSeparator = forwardRef<
  ElementRef<typeof Primitive.Separator>,
  ComponentPropsWithoutRef<typeof Primitive.Separator>
>(function MenubarSeparator({ className, ...props }, ref) {
  return (
    <Primitive.Separator ref={ref} className={cn('sui-menu__separator', className)} {...props} />
  )
})

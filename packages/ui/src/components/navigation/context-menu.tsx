'use client'

import * as Primitive from '@radix-ui/react-context-menu'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { CheckIcon, ChevronRightIcon } from '../icons/icons'
import { cn } from '../../lib/cn'
import { usePortalContainer } from '../overlay/portal-container'

/*
 * A menu opened by right-click, or by long-press on touch. It uses the same
 * item row (`.sui-menu__item`) as `DropdownMenu`, so the two look the same.
 * A context menu is a shortcut: every action in it should also be reachable
 * some other way, because nothing on screen tells people it is there.
 */

export const ContextMenu = Primitive.Root
export const ContextMenuGroup = Primitive.Group
export const ContextMenuSub = Primitive.Sub
export const ContextMenuRadioGroup = Primitive.RadioGroup

export const ContextMenuTrigger = forwardRef<
  ElementRef<typeof Primitive.Trigger>,
  ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function ContextMenuTrigger({ className, ...props }, ref) {
  return (
    <Primitive.Trigger
      ref={ref}
      data-slot="context-menu-trigger"
      className={cn('sui-context-menu__trigger', className)}
      {...props}
    />
  )
})

export const ContextMenuContent = forwardRef<
  ElementRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(function ContextMenuContent({ className, ...props }, ref) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        ref={ref}
        data-slot="context-menu-content"
        className={cn('sui-surface sui-menu sui-menu--context', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const ContextMenuItem = forwardRef<
  ElementRef<typeof Primitive.Item>,
  ComponentPropsWithoutRef<typeof Primitive.Item> & { destructive?: boolean }
>(function ContextMenuItem({ className, destructive, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      className={cn('sui-menu__item', destructive && 'sui-menu__item--danger', className)}
      {...props}
    />
  )
})

export const ContextMenuCheckboxItem = forwardRef<
  ElementRef<typeof Primitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof Primitive.CheckboxItem>
>(function ContextMenuCheckboxItem({ className, children, ...props }, ref) {
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

export const ContextMenuRadioItem = forwardRef<
  ElementRef<typeof Primitive.RadioItem>,
  ComponentPropsWithoutRef<typeof Primitive.RadioItem>
>(function ContextMenuRadioItem({ className, children, ...props }, ref) {
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

/** The item that opens a `ContextMenuSub`. Draws its own trailing chevron. */
export const ContextMenuSubTrigger = forwardRef<
  ElementRef<typeof Primitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof Primitive.SubTrigger>
>(function ContextMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <Primitive.SubTrigger ref={ref} className={cn('sui-menu__item', className)} {...props}>
      {children}
      <ChevronRightIcon className="sui-menu__chevron" aria-hidden="true" />
    </Primitive.SubTrigger>
  )
})

export const ContextMenuSubContent = forwardRef<
  ElementRef<typeof Primitive.SubContent>,
  ComponentPropsWithoutRef<typeof Primitive.SubContent>
>(function ContextMenuSubContent({ className, sideOffset = 4, ...props }, ref) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        className={cn('sui-surface sui-menu sui-menu--context', className)}
        {...props}
      />
    </Primitive.Portal>
  )
})

export const ContextMenuLabel = forwardRef<
  ElementRef<typeof Primitive.Label>,
  ComponentPropsWithoutRef<typeof Primitive.Label>
>(function ContextMenuLabel({ className, ...props }, ref) {
  return <Primitive.Label ref={ref} className={cn('sui-menu__label', className)} {...props} />
})

export const ContextMenuSeparator = forwardRef<
  ElementRef<typeof Primitive.Separator>,
  ComponentPropsWithoutRef<typeof Primitive.Separator>
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return (
    <Primitive.Separator ref={ref} className={cn('sui-menu__separator', className)} {...props} />
  )
})

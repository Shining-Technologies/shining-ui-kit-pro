import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react'
import { cn } from '../lib/cn'
import { CloseIcon } from '../lib/icons'

/* -------------------------------------------------------------------- dialog */

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogPortal = DialogPrimitive.Portal

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn('sui-overlay', className)}
      {...props}
    />
  )
})

export const dialogVariants = cva('sui-dialog', {
  variants: {
    size: { sm: 'sui-dialog--sm', default: '', lg: 'sui-dialog--lg', xl: 'sui-dialog--xl' },
  },
  defaultVariants: { size: 'default' },
})

export interface DialogContentProps
  extends
    ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogVariants> {
  /** Hide the corner close button — for a dialog that must be answered. */
  hideClose?: boolean
}

/**
 * The dialog panel.
 *
 * Portalled, so the theme variables have to reach it another way: they are
 * inherited from `<html>` when the provider runs in `global` scope, which is
 * why an app that uses dialogs should prefer that scope.
 */
export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, size, hideClose, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(dialogVariants({ size }), className)}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="sui-dialog__close sui-focusable" aria-label="Close">
            <CloseIcon />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dialog-header" className={cn('sui-dialog__header', className)} {...props} />
  )
}

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-body" className={cn('sui-dialog__body', className)} {...props} />
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dialog-footer" className={cn('sui-dialog__footer', className)} {...props} />
  )
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn('sui-dialog__title', className)}
      {...props}
    />
  )
})

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn('sui-dialog__description', className)}
      {...props}
    />
  )
})

/* -------------------------------------------------------------------- sheet */

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export interface SheetContentProps extends ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  hideClose?: boolean
}

/**
 * A panel anchored to one edge of the viewport.
 *
 * Built on the dialog primitive rather than being its own thing: a sheet has
 * exactly a dialog's semantics — modal, focus-trapped, escape-dismissable —
 * and differs only in where it comes from.
 */
export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent({ className, children, side = 'right', hideClose, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        className={cn('sui-sheet', `sui-sheet--${side}`, className)}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="sui-dialog__close sui-focusable" aria-label="Close">
            <CloseIcon />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export const SheetHeader = DialogHeader
export const SheetFooter = DialogFooter
export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription

/* -------------------------------------------------------------- alert dialog */

export type AlertDialogProps = DialogContentProps

/**
 * A dialog that must be answered.
 *
 * The close button and outside-click dismissal are both removed, because the
 * whole point of a confirmation is that "clicked somewhere else" is not an
 * answer to "delete this permanently?".
 */
export const AlertDialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  AlertDialogProps
>(function AlertDialogContent({ className, size = 'sm', ...props }, ref) {
  return (
    <DialogContent
      ref={ref}
      role="alertdialog"
      size={size}
      hideClose
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      className={className}
      {...props}
    />
  )
})

export const AlertDialog = DialogPrimitive.Root
export const AlertDialogTrigger = DialogPrimitive.Trigger
export const AlertDialogCancel = DialogPrimitive.Close
export const AlertDialogAction = DialogPrimitive.Close
export const AlertDialogHeader = DialogHeader
export const AlertDialogFooter = DialogFooter
export const AlertDialogTitle = DialogTitle
export const AlertDialogDescription = DialogDescription

/* ---------------------------------------------------------------- hover card */

export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger

export const HoverCardContent = forwardRef<
  ElementRef<typeof HoverCardPrimitive.Content>,
  ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(function HoverCardContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        data-slot="hover-card"
        className={cn('sui-surface sui-hover-card', className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
})

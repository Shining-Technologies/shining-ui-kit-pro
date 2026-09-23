'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  forwardRef,
  type AriaRole,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'
import { useDialogPanel } from './dialog-focus'
import { CloseIcon } from '../icons/icons'
import { usePortalContainer } from './portal-container'

/* -------------------------------------------------------------------- dialog */

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
/**
 * Portals into the element of the nearest `PortalContainerProvider`, or into
 * `<body>` without one, so a dialog opened inside a separately themed subtree
 * keeps that theme. A `container` passed directly wins over the provider.
 */
export function DialogPortal(props: ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>) {
  const container = usePortalContainer()
  return <DialogPrimitive.Portal container={container} {...props} />
}

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
    size: {
      sm: 'sui-dialog--sm',
      default: '',
      lg: 'sui-dialog--lg',
      xl: 'sui-dialog--xl',
      /** The whole viewport, for an editor or a long form that needs the room. */
      full: 'sui-dialog--full',
    },
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
 * Portalled through `DialogPortal`: into the element of the nearest
 * `PortalContainerProvider`, or `<body>` without one, so it is themed like the
 * subtree that opened it.
 *
 * On close, focus goes back to whatever had it when the dialog opened — or to
 * the menu's trigger when that was a `DropdownMenuItem` that has since
 * unmounted — rather than to `<body>`. In development it warns when the panel
 * has no accessible name (no `DialogTitle`, no `aria-label`).
 */
export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, size, hideClose, onCloseAutoFocus, ...props },
  ref,
) {
  const panel = useDialogPanel(
    props.role === 'alertdialog' ? 'AlertDialogContent' : 'DialogContent',
    ref,
    onCloseAutoFocus,
  )
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={panel.ref}
        data-slot="dialog-content"
        className={cn(dialogVariants({ size }), className)}
        onCloseAutoFocus={panel.onCloseAutoFocus}
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

export const DialogHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DialogHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-header"
        className={cn('sui-dialog__header', className)}
        {...props}
      />
    )
  },
)

export const DialogBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DialogBody({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-body"
        className={cn('sui-dialog__body', className)}
        {...props}
      />
    )
  },
)

export const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DialogFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-footer"
        className={cn('sui-dialog__footer', className)}
        {...props}
      />
    )
  },
)

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
>(function SheetContent(
  { className, children, side = 'right', hideClose, onCloseAutoFocus, ...props },
  ref,
) {
  const panel = useDialogPanel('SheetContent', ref, onCloseAutoFocus)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={panel.ref}
        data-slot="sheet-content"
        className={cn('sui-sheet', `sui-sheet--${side}`, className)}
        onCloseAutoFocus={panel.onCloseAutoFocus}
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

/** Props for `AlertDialogContent`. */
export interface AlertDialogContentProps extends Omit<DialogContentProps, 'hideClose' | 'role'> {
  /**
   * Ignored: an alert dialog never shows the corner close button.
   * @deprecated Has no effect. Accepted so existing code still type-checks.
   */
  hideClose?: boolean
  /**
   * Ignored: the panel is always `role="alertdialog"`.
   * @deprecated Has no effect. Accepted so existing code still type-checks.
   */
  role?: AriaRole
}

/**
 * The props of `AlertDialogContent` (not of `AlertDialog`, which is the Radix root).
 * @deprecated Use `AlertDialogContentProps`, the same type under a clearer name.
 */
export type AlertDialogProps = AlertDialogContentProps

/**
 * A dialog that must be answered.
 *
 * The close button and outside-click dismissal are both removed, because the
 * whole point of a confirmation is that "clicked somewhere else" is not an
 * answer to "delete this permanently?".
 */
export const AlertDialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  AlertDialogContentProps
>(function AlertDialogContent(
  { className, size = 'sm', onPointerDownOutside, onInteractOutside, ...props },
  ref,
) {
  return (
    <DialogContent
      ref={ref}
      size={size}
      className={className}
      {...props}
      // Everything below is applied after the caller's props, so none of it can
      // be undone: a `hideClose={false}` or `role` would otherwise turn the alert
      // dialog back into an ordinary dismissable one, and a caller's outside
      // handler (for logging, say) used to replace these and bring back
      // dismiss-by-outside-click.
      role="alertdialog"
      hideClose
      onPointerDownOutside={(event) => {
        onPointerDownOutside?.(event)
        event.preventDefault()
      }}
      onInteractOutside={(event) => {
        onInteractOutside?.(event)
        event.preventDefault()
      }}
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
  const container = usePortalContainer()
  return (
    <HoverCardPrimitive.Portal container={container}>
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
